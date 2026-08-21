const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dejavuCard', {
  // 메인 창: 카드를 인쇄용 PDF 로 저장한다. { canceled, filePath } 를 돌려준다.
  exportPdf: (payload) => ipcRenderer.invoke('card:export-pdf', payload),
  // 메인 창: 기본 프린터로 카드를 즉시 인쇄한다 (silent).
  print: (payload) => ipcRenderer.invoke('card:print', payload),

  // 인쇄용 숨김 창(?mode=print): 찍을 데이터를 받아오고, 렌더가 끝나면 알린다.
  getPayload: () => ipcRenderer.invoke('card:print-payload'),
  signalReady: () => ipcRenderer.send('card:print-ready'),
});
