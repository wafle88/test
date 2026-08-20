const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

if (require('electron-squirrel-startup')) {
  app.quit();
}

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
// 숨김 창에 카드만 mm 로 그린 뒤 그 창을 PDF 로 뽑는다.
async function renderCardPdf(payload) {
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

    return await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: CARD_PAGE_INCH,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  } finally {
    win.destroy();
  }
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
