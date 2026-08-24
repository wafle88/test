//#region src/preload.js
var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("dejavuCard", {
	exportPdf: (payload) => ipcRenderer.invoke("card:export-pdf", payload),
	print: (payload) => ipcRenderer.invoke("card:print", payload),
	listUsedCodes: () => ipcRenderer.invoke("codes:list-used"),
	markCodeUsed: (code) => ipcRenderer.invoke("codes:mark-used", code),
	revealUsedCodes: () => ipcRenderer.invoke("codes:reveal-file"),
	clearUsedCodes: () => ipcRenderer.invoke("codes:clear-used"),
	isDev: () => ipcRenderer.invoke("app:is-dev"),
	getPayload: () => ipcRenderer.invoke("card:print-payload"),
	signalReady: () => ipcRenderer.send("card:print-ready")
});
//#endregion
