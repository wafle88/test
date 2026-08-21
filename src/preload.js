const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dejavuCard', {
  // 메인 창: 카드를 인쇄용 PDF 로 저장한다. { canceled, filePath } 를 돌려준다.
  exportPdf: (payload) => ipcRenderer.invoke('card:export-pdf', payload),
  // 메인 창: 기본 프린터로 카드를 즉시 인쇄한다 (silent).
  print: (payload) => ipcRenderer.invoke('card:print', payload),

  // 코드 번호 재사용 차단: 이미 발급에 쓴 코드 목록 조회 / 사용 처리.
  listUsedCodes: () => ipcRenderer.invoke('codes:list-used'),
  markCodeUsed: (code) => ipcRenderer.invoke('codes:mark-used', code),
  // 사용 기록 파일이 있는 폴더를 파일 탐색기로 연다.
  revealUsedCodes: () => ipcRenderer.invoke('codes:reveal-file'),
  // 개발용: 사용 기록 초기화 / 개발 실행 여부
  clearUsedCodes: () => ipcRenderer.invoke('codes:clear-used'),
  isDev: () => ipcRenderer.invoke('app:is-dev'),

  // 인쇄용 숨김 창(?mode=print): 찍을 데이터를 받아오고, 렌더가 끝나면 알린다.
  getPayload: () => ipcRenderer.invoke('card:print-payload'),
  signalReady: () => ipcRenderer.send('card:print-ready'),
});
