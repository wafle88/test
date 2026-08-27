const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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
// macOS 는 CUPS 이름(공백→언더스코어), Windows 는 드라이버 표시명(공백/하이픈 포함)이라
// OS 마다 이름이 달라진다. 그래서 하드코딩 대신 이름 패턴으로 자동 감지한다.
const CARD_PRINTER_PATTERN = /idp.*smart.*51/i;
// 자동 감지 실패 시의 백업. 개발기(macOS) 에 실제로 잡혀 있는 이름.
const CARD_PRINTER_FALLBACK = 'IDP_SMART_51_Printer_2';
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
// webContents.print(Windows 경로) 는 pageSize 를 마이크론 단위로 받는다.
const CARD_PAGE_MICRONS = { width: 54000, height: 86000 };
const PRINT_RENDER_TIMEOUT = 15000;

// getPrintersAsync 로 잡힌 프린터 목록에서 이름 패턴과 매칭되는 항목을 찾는다.
// name / displayName / description 을 모두 검사하는 이유는 OS·드라이버에 따라
// 사람이 보는 이름과 CUPS/Windows 내부 이름이 다르기 때문.
async function resolveCardPrinter(webContents) {
  try {
    const printers = await webContents.getPrintersAsync();
    const match = printers.find((p) =>
      [p.name, p.displayName, p.description].some(
        (n) => typeof n === 'string' && CARD_PRINTER_PATTERN.test(n),
      ),
    );
    if (match) return match.name;
    console.warn(
      '[print] IDP SMART-51 프린터를 목록에서 찾지 못해 백업 이름으로 진행:',
      CARD_PRINTER_FALLBACK,
      '(감지된 프린터:',
      printers.map((p) => p.name).join(', ') || '없음',
      ')',
    );
  } catch (err) {
    console.warn('[print] 프린터 목록 조회 실패, 백업 이름 사용:', err.message);
  }
  return CARD_PRINTER_FALLBACK;
}

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
function runLp(pdfBuffer, printerName) {
  return new Promise((resolve, reject) => {
    const args = [
      '-d', printerName,
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

// macOS: PDF 로 렌더 → lp 로 CUPS ICC 색보정 걸어 전송 (색 튐 방지)
// Windows: CUPS/lp 가 없어서 webContents.print(silent) 로 직접 인쇄.
//          색보정은 Windows 프린터 드라이버 프리셋에 위임 (앱에서 제어 불가).
async function printCardToPrinter(payload) {
  return withPrintCardWindow(payload, async (win) => {
    const printerName = await resolveCardPrinter(win.webContents);
    console.log(`[print] 사용 프린터: ${printerName} (platform=${process.platform})`);

    if (process.platform === 'win32') {
      await new Promise((resolve, reject) => {
        win.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: printerName,
            pageSize: CARD_PAGE_MICRONS,
            margins: { marginType: 'none' },
          },
          (ok, failureReason) => {
            if (ok) resolve();
            else reject(new Error(`Windows 인쇄 실패: ${failureReason || 'unknown'}`));
          },
        );
      });
      return { success: true, printer: printerName };
    }

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: CARD_PAGE_INCH,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    console.log(`[print] PDF ready, ${pdf.length} bytes → ${printerName} (${CARD_COLOR_MODEL})`);
    await runLp(pdf, printerName);
    return { success: true, printer: printerName, colorModel: CARD_COLOR_MODEL };
  });
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

// 발급에 사용된 코드 번호 기록. cards/ 와 같은 규칙을 따른다.
// 개발 중에는 프로젝트 루트의 data/ 에 둬서 바로 열어볼 수 있게 하고,
// 패키징된 앱은 코드가 asar(읽기 전용 + 무결성 검증) 안에 들어가 있어 그 안에 쓸 수 없으므로
// userData 로 보낸다. 경로는 앱 시작 시 콘솔에 찍는다 — 운영 중 초기화할 때 쓴다.
function usedCodesPath() {
  return app.isPackaged
    ? path.join(app.getPath('userData'), 'used-codes.json')
    : path.join(__dirname, '../../data/used-codes.json');
}

let usedCodesCache = null;

async function readUsedCodes() {
  if (usedCodesCache) return usedCodesCache;
  try {
    const parsed = JSON.parse(await fs.readFile(usedCodesPath(), 'utf8'));
    usedCodesCache = Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string') : [];
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[codes] 사용 기록을 읽지 못해 빈 목록으로 시작합니다:', err.message);
    }
    usedCodesCache = [];
  }
  return usedCodesCache;
}

// 인쇄 직후 전원이 꺼져도 파일이 깨지지 않도록 임시 파일에 쓴 뒤 교체한다.
async function writeUsedCodes(list) {
  const file = usedCodesPath();
  const tmp = `${file}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(list, null, 2));
  await fs.rename(tmp, file);
}

// 기록이 하나도 없으면 파일이 아예 안 생겨서 "동작하는지" 확인할 수가 없다.
// 앱 시작 시 빈 목록으로라도 만들어 둔다.
async function ensureUsedCodesFile() {
  const list = await readUsedCodes();
  try {
    await fs.access(usedCodesPath());
  } catch {
    await writeUsedCodes(list).catch((err) => {
      console.error('[codes] 사용 기록 파일 생성 실패:', err.message);
    });
  }
}

ipcMain.handle('app:is-dev', () => !app.isPackaged);

// 운영자가 userData 경로를 몰라도 파일을 찾을 수 있게 OS 파일 탐색기로 열어준다.
ipcMain.handle('codes:reveal-file', async () => {
  await ensureUsedCodesFile();
  shell.showItemInFolder(usedCodesPath());
  return { ok: true, path: usedCodesPath() };
});

ipcMain.handle('codes:list-used', () => readUsedCodes());

// 개발 중 반복 테스트용. 패키징된 앱에서는 실수로라도 지워지면 안 되므로 막는다.
ipcMain.handle('codes:clear-used', async () => {
  if (app.isPackaged) return { ok: false, error: '패키징된 앱에서는 초기화할 수 없습니다.' };
  usedCodesCache = [];
  try {
    await writeUsedCodes([]);
  } catch (err) {
    console.error('[codes] 사용 기록 초기화 실패:', err.message);
    return { ok: false, error: err.message };
  }
  return { ok: true };
});

ipcMain.handle('codes:mark-used', async (event, code) => {
  const digits = String(code ?? '').replace(/[^0-9]/g, '');
  if (digits.length !== 8) return { ok: false, error: '코드 번호 형식이 아닙니다.' };

  const list = await readUsedCodes();
  if (list.includes(digits)) return { ok: true, used: list.length };

  list.push(digits);
  try {
    await writeUsedCodes(list);
    console.log(`[codes] 사용 처리: ${digits} (누적 ${list.length}개) → ${usedCodesPath()}`);
  } catch (err) {
    // 캐시에는 남아 있어서 이번 세션 동안은 막히지만, 재시작하면 풀린다.
    console.error('[codes] 사용 기록 저장 실패:', err.message);
    return { ok: false, error: err.message, used: list.length };
  }
  return { ok: true, used: list.length };
});

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
    // 무인 운영 중에는 조용히 실패하면 안 되지만, 개발 중에는 모달이 뜨면
    // 프린터 없이 흐름을 테스트할 수가 없어서 로그로만 남긴다.
    if (app.isPackaged) {
      dialog.showErrorBox('카드 인쇄 실패', err.message);
    } else {
      console.error('[print] 실패:', err.message);
    }
    throw err;
  }
});

app.whenReady().then(async () => {
  console.log('[codes] 사용 기록 파일:', usedCodesPath());
  await ensureUsedCodesFile();
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
