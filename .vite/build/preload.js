//#region src/preload.js
var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("dejavuCard", {
	exportPdf: (payload) => ipcRenderer.invoke("card:export-pdf", payload),
	getPayload: () => ipcRenderer.invoke("card:print-payload"),
	signalReady: () => ipcRenderer.send("card:print-ready")
});
//#endregion
