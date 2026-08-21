const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const os = require('node:os');

if (require('electron-squirrel-startup')) {
  app.quit();
}

// M4 맥 화면(Display P3) 에서 Chromium 이 넓은 색영역으로 렌더링하면,
// IDP ICC 프로파일(sRGB 입력 가정) 과 색공간이 어긋나서 인쇄 색이 튄다.
// sRGB 로 강제해서 소스 색공간을 프로파일 기준에 맞춘다.
app.commandLine.appendSwitch('force-color-profile', 'srgb');

// IDP SMART-51 카드 프린터. PPD 의 *cupsICCProfile 매핑에 따라
//   ColorModel=Premium  → /Library/Printers/IDP/cardprinter51_p.icm (Premium 리본)
//   ColorModel=Standard → /Library/Printers/IDP/cardprinter51_s.icm (Standard 리본)
// 이 값을 lp 옵션으로 넘겨야 CUPS 가 자동으로 해당 ICC 로 색보정을 걸어 프린터에 보낸다.
const CARD_PRINTER_NAME = 'IDP_SMART_51_Printer_2';
// SS-IDDC-P-YMCKO 리본. Premium/Standard 프로파일 차이가 거의 없어서 Premium 유지.
const CARD_COLOR_MODEL = 'Premium';
// 사진 카드는 YMC 합성 블랙으로만 표현. K resin 패널을 쓰면 사진의 어두운 부분에
// K 가 무차별 오버프린트돼서 시커멓게 튄다 (맥 CUPS 드라이버 기본 임계값이 너무 낮음).
const CARD_RESIN_EXTRACTION = 'NotUse';
// Partial(기본) 대신 Standard 처리 파이프라인 사용 — 다른 .prn 블롭이 로드되어
// 렌더링 방식이 근본적으로 달라짐.
const CARD_SMART_MODE = 'Standard';
// 픽셀 배치 알고리즘. Diffusion(기본, 오차확산) 은 매끈, Halftone 은 점 패턴이라 시각적으로 뚜렷하게 다름.
const CARD_DITHERING = 'Halftone';

// 개발 중에는 소스 트리의 아이콘을 직접 참조 (빌드된 main.js 기준 두 단계 상위 = 프로젝트 루트)
const devIconPath = path.join(__dirname, '../../src/assets/icon.png');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: devIconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.openDevTools();
};

// 디자인팀 지정 카드 규격(54 x 86mm)을 인치로 환산.
// PrintCard.vue 의 @page 규칙이 우선이고, 이 값은 규칙이 먹지 않았을 때의 안전망이다.
const CARD_PAGE_INCH = { width: 54 / 25.4, height: 86 / 25.4 };
const PRINT_RENDER_TIMEOUT = 15000;

// 화면용 창은 vw 기반 rem 위에 올라가 있어 그대로 인쇄하면 크기가 어긋난다.
// 숨김 창에 카드만 mm 로 그린 뒤 그 창을 대상으로 원하는 작업(PDF 저장 or 실제 인쇄)을 시킨다.
async function withPrintCardWindow(payload, action) {
  const win = new BrowserWindow({
    show: false,
    width: 420,
    height: 660,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  try {
    // 창 단위 IPC 라 메인 창이나 다른 인쇄 작업과 섞이지 않는다.
    win.webContents.ipc.handle('card:print-payload', () => payload);

    const rendered = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('인쇄용 카드 렌더링이 시간 내에 끝나지 않았습니다.')),
        PRINT_RENDER_TIMEOUT,
      );
      win.webContents.ipc.once('card:print-ready', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      await win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}?mode=print`);
    } else {
      await win.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { query: { mode: 'print' } },
      );
    }

    await rendered;
    return await action(win);
  } finally {
    win.destroy();
  }
}

function renderCardPdf(payload) {
  return withPrintCardWindow(payload, (win) =>
    win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: CARD_PAGE_INCH,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    }),
  );
}

// lp 커맨드로 PDF 를 지정 프린터에 보내면서 ColorModel(=ICC 프로파일) 옵션을 얹는다.
// webContents.print 는 CUPS 옵션을 못 넘겨 ICC 를 걸 수 없어서 이 경로를 쓴다.
// 파일 인자 대신 stdin 으로 PDF 를 흘려보내서 tmp 경로 접근 문제를 아예 우회한다.
function runLp(pdfBuffer) {
  return new Promise((resolve, reject) => {
    const args = [
      '-d', CARD_PRINTER_NAME,
      '-o', `ColorModel=${CARD_COLOR_MODEL}`,
      '-o', `SmartResinExtraction=${CARD_RESIN_EXTRACTION}`,
      '-o', `SmartMode=${CARD_SMART_MODE}`,
      '-o', `SmartDithering=${CARD_DITHERING}`,
      '-t', 'dejavu-card',
    ];
    // GUI 앱은 PATH 가 제한적일 수 있어 절대경로 사용.
    const child = spawn('/usr/bin/lp', args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => reject(new Error(`lp 실행 실패: ${err.message}`)));
    child.on('close', (code) => {
      if (code === 0) {
        console.log('[print] lp OK:', stdout.trim());
        resolve();
      } else {
        reject(new Error(`lp 종료 코드 ${code}${stderr.trim() ? `: ${stderr.trim()}` : ''}`));
      }
    });
    child.stdin.on('error', (err) => reject(new Error(`lp stdin 오류: ${err.message}`)));
    child.stdin.end(pdfBuffer);
  });
}

async function printCardToPrinter(payload) {
  const pdf = await renderCardPdf(payload);
  console.log(`[print] PDF ready, ${pdf.length} bytes → ${CARD_PRINTER_NAME} (${CARD_COLOR_MODEL})`);
  await runLp(pdf);
  return { success: true, printer: CARD_PRINTER_NAME, colorModel: CARD_COLOR_MODEL };
}

// 발급된 카드 PDF가 쌓이는 폴더.
// 개발 중에는 프로젝트 루트의 cards/ (빌드된 main.js 기준 두 단계 상위 = 프로젝트 루트),
// 패키징된 앱에서는 asar 안에 쓸 수 없으므로 사용자 문서 폴더로 보낸다.
function cardOutputDir() {
  return app.isPackaged
    ? path.join(app.getPath('documents'), 'dejavu_cards')
    : path.join(__dirname, '../../cards');
}

function pdfFileName(name) {
  const safeName = String(name || '').replace(/[\\/:*?"<>|]/g, '').trim();
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `dejavu_card_${safeName ? `${safeName}_` : ''}${stamp}.pdf`;
}

ipcMain.handle('card:export-pdf', async (event, payload) => {
  const filePath = path.join(cardOutputDir(), pdfFileName(payload?.name));

  try {
    const pdf = await renderCardPdf(payload ?? {});
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, pdf);
    return { canceled: false, filePath };
  } catch (err) {
    // 무인 운영이라 조용히 실패하면 안 된다
    dialog.showErrorBox('카드 PDF 저장 실패', `${filePath}\n\n${err.message}`);
    throw err;
  }
});

ipcMain.handle('card:print', async (event, payload) => {
  try {
    return await printCardToPrinter(payload ?? {});
  } catch (err) {
    dialog.showErrorBox('카드 인쇄 실패', err.message);
    throw err;
  }
});

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(devIconPath);
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
