//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region node_modules/electron-squirrel-startup/node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isNaN(val) === false) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		if (ms >= d) return Math.round(ms / d) + "d";
		if (ms >= h) return Math.round(ms / h) + "h";
		if (ms >= m) return Math.round(ms / m) + "m";
		if (ms >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		return plural(ms, d, "day") || plural(ms, h, "hour") || plural(ms, m, "minute") || plural(ms, s, "second") || ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, n, name) {
		if (ms < n) return;
		if (ms < n * 1.5) return Math.floor(ms / n) + " " + name;
		return Math.ceil(ms / n) + " " + name + "s";
	}
}));
//#endregion
//#region node_modules/electron-squirrel-startup/node_modules/debug/src/debug.js
var require_debug = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*
	* Expose `debug()` as the module.
	*/
	exports = module.exports = createDebug.debug = createDebug["default"] = createDebug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = require_ms();
	/**
	* The currently active debug mode names, and names to skip.
	*/
	exports.names = [];
	exports.skips = [];
	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	exports.formatters = {};
	/**
	* Previous log timestamp.
	*/
	var prevTime;
	/**
	* Select a color.
	* @param {String} namespace
	* @return {Number}
	* @api private
	*/
	function selectColor(namespace) {
		var hash = 0, i;
		for (i in namespace) {
			hash = (hash << 5) - hash + namespace.charCodeAt(i);
			hash |= 0;
		}
		return exports.colors[Math.abs(hash) % exports.colors.length];
	}
	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		function debug() {
			if (!debug.enabled) return;
			var self = debug;
			var curr = +/* @__PURE__ */ new Date();
			self.diff = curr - (prevTime || curr);
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;
			var args = new Array(arguments.length);
			for (var i = 0; i < args.length; i++) args[i] = arguments[i];
			args[0] = exports.coerce(args[0]);
			if ("string" !== typeof args[0]) args.unshift("%O");
			var index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
				if (match === "%%") return match;
				index++;
				var formatter = exports.formatters[format];
				if ("function" === typeof formatter) {
					var val = args[index];
					match = formatter.call(self, val);
					args.splice(index, 1);
					index--;
				}
				return match;
			});
			exports.formatArgs.call(self, args);
			(debug.log || exports.log || console.log.bind(console)).apply(self, args);
		}
		debug.namespace = namespace;
		debug.enabled = exports.enabled(namespace);
		debug.useColors = exports.useColors();
		debug.color = selectColor(namespace);
		if ("function" === typeof exports.init) exports.init(debug);
		return debug;
	}
	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		exports.save(namespaces);
		exports.names = [];
		exports.skips = [];
		var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
		var len = split.length;
		for (var i = 0; i < len; i++) {
			if (!split[i]) continue;
			namespaces = split[i].replace(/\*/g, ".*?");
			if (namespaces[0] === "-") exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
			else exports.names.push(new RegExp("^" + namespaces + "$"));
		}
	}
	/**
	* Disable debug output.
	*
	* @api public
	*/
	function disable() {
		exports.enable("");
	}
	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		var i, len;
		for (i = 0, len = exports.skips.length; i < len; i++) if (exports.skips[i].test(name)) return false;
		for (i = 0, len = exports.names.length; i < len; i++) if (exports.names[i].test(name)) return true;
		return false;
	}
	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) return val.stack || val.message;
		return val;
	}
}));
//#endregion
//#region node_modules/electron-squirrel-startup/node_modules/debug/src/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*
	* Expose `debug()` as the module.
	*/
	exports = module.exports = require_debug();
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();
	/**
	* Colors.
	*/
	exports.colors = [
		"lightseagreen",
		"forestgreen",
		"goldenrod",
		"dodgerblue",
		"darkorchid",
		"crimson"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && window.process.type === "renderer") return true;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	exports.formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (err) {
			return "[UnexpectedJSONParseError]: " + err.message;
		}
	};
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		var useColors = this.useColors;
		args[0] = (useColors ? "%c" : "") + this.namespace + (useColors ? " %c" : " ") + args[0] + (useColors ? "%c " : " ") + "+" + exports.humanize(this.diff);
		if (!useColors) return;
		var c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		var index = 0;
		var lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, function(match) {
			if ("%%" === match) return;
			index++;
			if ("%c" === match) lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.log()` when available.
	* No-op when `console.log` is not a "function".
	*
	* @api public
	*/
	function log() {
		return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (null == namespaces) exports.storage.removeItem("debug");
			else exports.storage.debug = namespaces;
		} catch (e) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		var r;
		try {
			r = exports.storage.debug;
		} catch (e) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Enable namespaces listed in `localStorage.debug` initially.
	*/
	exports.enable(load());
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return window.localStorage;
		} catch (e) {}
	}
}));
//#endregion
//#region node_modules/electron-squirrel-startup/node_modules/debug/src/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	var tty = require("tty");
	var util = require("util");
	/**
	* This is the Node.js implementation of `debug()`.
	*
	* Expose `debug()` as the module.
	*/
	exports = module.exports = require_debug();
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	/**
	* Colors.
	*/
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	/**
	* Build up the default `inspectOpts` object from the environment variables.
	*
	*   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	*/
	exports.inspectOpts = Object.keys(process.env).filter(function(key) {
		return /^debug_/i.test(key);
	}).reduce(function(obj, key) {
		var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_, k) {
			return k.toUpperCase();
		});
		var val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	/**
	* The file descriptor to write the `debug()` calls to.
	* Set the `DEBUG_FD` env variable to override with another value. i.e.:
	*
	*   $ DEBUG_FD=3 node script.js 3>debug.log
	*/
	var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
	if (1 !== fd && 2 !== fd) util.deprecate(function() {}, "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
	var stream = 1 === fd ? process.stdout : 2 === fd ? process.stderr : createWritableStdioStream(fd);
	/**
	* Is stdout a TTY? Colored output is enabled when `true`.
	*/
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(fd);
	}
	/**
	* Map %o to `util.inspect()`, all on a single line.
	*/
	exports.formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts).split("\n").map(function(str) {
			return str.trim();
		}).join(" ");
	};
	/**
	* Map %o to `util.inspect()`, allowing multiple lines if needed.
	*/
	exports.formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts);
	};
	/**
	* Adds ANSI color escape codes if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		var name = this.namespace;
		if (this.useColors) {
			var c = this.color;
			var prefix = "  \x1B[3" + c + ";1m" + name + " \x1B[0m";
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push("\x1B[3" + c + "m+" + exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = (/* @__PURE__ */ new Date()).toUTCString() + " " + name + " " + args[0];
	}
	/**
	* Invokes `util.format()` with the specified arguments and writes to `stream`.
	*/
	function log() {
		return stream.write(util.format.apply(util, arguments) + "\n");
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		if (null == namespaces) delete process.env.DEBUG;
		else process.env.DEBUG = namespaces;
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		return process.env.DEBUG;
	}
	/**
	* Copied from `node/src/node.js`.
	*
	* XXX: It's lame that node doesn't expose this API out-of-the-box. It also
	* relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
	*/
	function createWritableStdioStream(fd) {
		var stream;
		switch (process.binding("tty_wrap").guessHandleType(fd)) {
			case "TTY":
				stream = new tty.WriteStream(fd);
				stream._type = "tty";
				if (stream._handle && stream._handle.unref) stream._handle.unref();
				break;
			case "FILE":
				stream = new (require("fs")).SyncWriteStream(fd, { autoClose: false });
				stream._type = "fs";
				break;
			case "PIPE":
			case "TCP":
				stream = new (require("net")).Socket({
					fd,
					readable: false,
					writable: true
				});
				stream.readable = false;
				stream.read = null;
				stream._type = "pipe";
				if (stream._handle && stream._handle.unref) stream._handle.unref();
				break;
			default: throw new Error("Implement me. Unknown stream file type!");
		}
		stream.fd = fd;
		stream._isStdio = true;
		return stream;
	}
	/**
	* Init logic for `debug` instances.
	*
	* Create a new `inspectOpts` object in case `useColors` is set
	* differently for a particular `debug` instance.
	*/
	function init(debug) {
		debug.inspectOpts = {};
		var keys = Object.keys(exports.inspectOpts);
		for (var i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	/**
	* Enable namespaces listed in `process.env.DEBUG` initially.
	*/
	exports.enable(load());
}));
//#endregion
//#region node_modules/electron-squirrel-startup/node_modules/debug/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Detect Electron renderer process, which is node, but we should
	* treat as a browser.
	*/
	if (typeof process !== "undefined" && process.type === "renderer") module.exports = require_browser();
	else module.exports = require_node();
}));
//#endregion
//#region node_modules/electron-squirrel-startup/index.js
var require_electron_squirrel_startup = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var path$1 = require("path");
	var spawn$1 = require("child_process").spawn;
	var debug = require_src()("electron-squirrel-startup");
	var app$1 = require("electron").app;
	var run = function(args, done) {
		var updateExe = path$1.resolve(path$1.dirname(process.execPath), "..", "Update.exe");
		debug("Spawning `%s` with args `%s`", updateExe, args);
		spawn$1(updateExe, args, { detached: true }).on("close", done);
	};
	var check = function() {
		if (process.platform === "win32") {
			var cmd = process.argv[1];
			debug("processing squirrel command `%s`", cmd);
			var target = path$1.basename(process.execPath);
			if (cmd === "--squirrel-install" || cmd === "--squirrel-updated") {
				run(["--createShortcut=" + target], app$1.quit);
				return true;
			}
			if (cmd === "--squirrel-uninstall") {
				run(["--removeShortcut=" + target], app$1.quit);
				return true;
			}
			if (cmd === "--squirrel-obsolete") {
				app$1.quit();
				return true;
			}
		}
		return false;
	};
	module.exports = check();
}));
//#endregion
//#region src/main.js
var { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");
var path = require("node:path");
var fs = require("node:fs/promises");
var { spawn } = require("node:child_process");
require("node:os");
if (require_electron_squirrel_startup()) app.quit();
app.commandLine.appendSwitch("force-color-profile", "srgb");
var CARD_PRINTER_PATTERN = /idp.*smart.*51/i;
var CARD_PRINTER_FALLBACK = "IDP_SMART_51_Printer_2";
var CARD_COLOR_MODEL = "Premium";
var CARD_RESIN_EXTRACTION = "NotUse";
var CARD_SMART_MODE = "Standard";
var CARD_DITHERING = "Halftone";
var devIconPath = path.join(__dirname, "../../src/assets/icon.png");
var createWindow = () => {
	const mainWindow = new BrowserWindow({
		width: 1920,
		height: 1080,
		icon: devIconPath,
		autoHideMenuBar: true,
		webPreferences: { preload: path.join(__dirname, "preload.js") }
	});
	mainWindow.loadURL("http://localhost:5173");
	if (!app.isPackaged) mainWindow.webContents.openDevTools();
};
var CARD_PAGE_INCH = {
	width: 54 / 25.4,
	height: 86 / 25.4
};
var CARD_PAGE_MICRONS = {
	width: 54e3,
	height: 86e3
};
var PRINT_RENDER_TIMEOUT = 15e3;
async function resolveCardPrinter(webContents) {
	try {
		const printers = await webContents.getPrintersAsync();
		const match = printers.find((p) => [
			p.name,
			p.displayName,
			p.description
		].some((n) => typeof n === "string" && CARD_PRINTER_PATTERN.test(n)));
		if (match) return match.name;
		console.warn("[print] IDP SMART-51 프린터를 목록에서 찾지 못해 백업 이름으로 진행:", CARD_PRINTER_FALLBACK, "(감지된 프린터:", printers.map((p) => p.name).join(", ") || "없음", ")");
	} catch (err) {
		console.warn("[print] 프린터 목록 조회 실패, 백업 이름 사용:", err.message);
	}
	return CARD_PRINTER_FALLBACK;
}
async function withPrintCardWindow(payload, action) {
	const win = new BrowserWindow({
		show: false,
		width: 420,
		height: 660,
		webPreferences: { preload: path.join(__dirname, "preload.js") }
	});
	try {
		win.webContents.ipc.handle("card:print-payload", () => payload);
		const rendered = new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("인쇄용 카드 렌더링이 시간 내에 끝나지 않았습니다.")), PRINT_RENDER_TIMEOUT);
			win.webContents.ipc.once("card:print-ready", () => {
				clearTimeout(timer);
				resolve();
			});
		});
		await win.loadURL(`http://localhost:5173?mode=print`);
		await rendered;
		return await action(win);
	} finally {
		win.destroy();
	}
}
function renderCardPdf(payload) {
	return withPrintCardWindow(payload, (win) => win.webContents.printToPDF({
		printBackground: true,
		preferCSSPageSize: true,
		pageSize: CARD_PAGE_INCH,
		margins: {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0
		}
	}));
}
function runLp(pdfBuffer, printerName) {
	return new Promise((resolve, reject) => {
		const child = spawn("/usr/bin/lp", [
			"-d",
			printerName,
			"-o",
			`ColorModel=${CARD_COLOR_MODEL}`,
			"-o",
			`SmartResinExtraction=${CARD_RESIN_EXTRACTION}`,
			"-o",
			`SmartMode=${CARD_SMART_MODE}`,
			"-o",
			`SmartDithering=${CARD_DITHERING}`,
			"-t",
			"dejavu-card"
		]);
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (d) => {
			stdout += d.toString();
		});
		child.stderr.on("data", (d) => {
			stderr += d.toString();
		});
		child.on("error", (err) => reject(/* @__PURE__ */ new Error(`lp 실행 실패: ${err.message}`)));
		child.on("close", (code) => {
			if (code === 0) {
				console.log("[print] lp OK:", stdout.trim());
				resolve();
			} else reject(/* @__PURE__ */ new Error(`lp 종료 코드 ${code}${stderr.trim() ? `: ${stderr.trim()}` : ""}`));
		});
		child.stdin.on("error", (err) => reject(/* @__PURE__ */ new Error(`lp stdin 오류: ${err.message}`)));
		child.stdin.end(pdfBuffer);
	});
}
async function printCardToPrinter(payload) {
	return withPrintCardWindow(payload, async (win) => {
		const printerName = await resolveCardPrinter(win.webContents);
		console.log(`[print] 사용 프린터: ${printerName} (platform=${process.platform})`);
		if (process.platform === "win32") {
			await new Promise((resolve, reject) => {
				win.webContents.print({
					silent: true,
					printBackground: true,
					deviceName: printerName,
					pageSize: CARD_PAGE_MICRONS,
					margins: { marginType: "none" }
				}, (ok, failureReason) => {
					if (ok) resolve();
					else reject(/* @__PURE__ */ new Error(`Windows 인쇄 실패: ${failureReason || "unknown"}`));
				});
			});
			return {
				success: true,
				printer: printerName
			};
		}
		const pdf = await win.webContents.printToPDF({
			printBackground: true,
			preferCSSPageSize: true,
			pageSize: CARD_PAGE_INCH,
			margins: {
				top: 0,
				bottom: 0,
				left: 0,
				right: 0
			}
		});
		console.log(`[print] PDF ready, ${pdf.length} bytes → ${printerName} (${CARD_COLOR_MODEL})`);
		await runLp(pdf, printerName);
		return {
			success: true,
			printer: printerName,
			colorModel: CARD_COLOR_MODEL
		};
	});
}
function cardOutputDir() {
	return app.isPackaged ? path.join(app.getPath("documents"), "dejavu_cards") : path.join(__dirname, "../../cards");
}
function pdfFileName(name) {
	const safeName = String(name || "").replace(/[\\/:*?"<>|]/g, "").trim();
	const d = /* @__PURE__ */ new Date();
	const pad = (n) => String(n).padStart(2, "0");
	const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
	return `dejavu_card_${safeName ? `${safeName}_` : ""}${stamp}.pdf`;
}
function usedCodesPath() {
	return app.isPackaged ? path.join(app.getPath("userData"), "used-codes.json") : path.join(__dirname, "../../data/used-codes.json");
}
var usedCodesCache = null;
async function readUsedCodes() {
	if (usedCodesCache) return usedCodesCache;
	try {
		const parsed = JSON.parse(await fs.readFile(usedCodesPath(), "utf8"));
		usedCodesCache = Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string") : [];
	} catch (err) {
		if (err.code !== "ENOENT") console.warn("[codes] 사용 기록을 읽지 못해 빈 목록으로 시작합니다:", err.message);
		usedCodesCache = [];
	}
	return usedCodesCache;
}
async function writeUsedCodes(list) {
	const file = usedCodesPath();
	const tmp = `${file}.tmp`;
	await fs.mkdir(path.dirname(file), { recursive: true });
	await fs.writeFile(tmp, JSON.stringify(list, null, 2));
	await fs.rename(tmp, file);
}
async function ensureUsedCodesFile() {
	const list = await readUsedCodes();
	try {
		await fs.access(usedCodesPath());
	} catch {
		await writeUsedCodes(list).catch((err) => {
			console.error("[codes] 사용 기록 파일 생성 실패:", err.message);
		});
	}
}
ipcMain.handle("app:is-dev", () => !app.isPackaged);
ipcMain.handle("codes:reveal-file", async () => {
	await ensureUsedCodesFile();
	shell.showItemInFolder(usedCodesPath());
	return {
		ok: true,
		path: usedCodesPath()
	};
});
ipcMain.handle("codes:list-used", () => readUsedCodes());
ipcMain.handle("codes:clear-used", async () => {
	if (app.isPackaged) return {
		ok: false,
		error: "패키징된 앱에서는 초기화할 수 없습니다."
	};
	usedCodesCache = [];
	try {
		await writeUsedCodes([]);
	} catch (err) {
		console.error("[codes] 사용 기록 초기화 실패:", err.message);
		return {
			ok: false,
			error: err.message
		};
	}
	return { ok: true };
});
ipcMain.handle("codes:mark-used", async (event, code) => {
	const digits = String(code ?? "").replace(/[^0-9]/g, "");
	if (digits.length !== 8) return {
		ok: false,
		error: "코드 번호 형식이 아닙니다."
	};
	if (digits === "42424242") return {
		ok: true,
		master: true
	};
	const list = await readUsedCodes();
	if (list.includes(digits)) return {
		ok: true,
		used: list.length
	};
	list.push(digits);
	try {
		await writeUsedCodes(list);
		console.log(`[codes] 사용 처리: ${digits} (누적 ${list.length}개) → ${usedCodesPath()}`);
	} catch (err) {
		console.error("[codes] 사용 기록 저장 실패:", err.message);
		return {
			ok: false,
			error: err.message,
			used: list.length
		};
	}
	return {
		ok: true,
		used: list.length
	};
});
ipcMain.handle("card:export-pdf", async (event, payload) => {
	const filePath = path.join(cardOutputDir(), pdfFileName(payload?.name));
	try {
		const pdf = await renderCardPdf(payload ?? {});
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, pdf);
		return {
			canceled: false,
			filePath
		};
	} catch (err) {
		dialog.showErrorBox("카드 PDF 저장 실패", `${filePath}\n\n${err.message}`);
		throw err;
	}
});
ipcMain.handle("card:print", async (event, payload) => {
	try {
		return await printCardToPrinter(payload ?? {});
	} catch (err) {
		if (app.isPackaged) dialog.showErrorBox("카드 인쇄 실패", err.message);
		else console.error("[print] 실패:", err.message);
		throw err;
	}
});
app.whenReady().then(async () => {
	console.log("[codes] 사용 기록 파일:", usedCodesPath());
	await ensureUsedCodesFile();
	Menu.setApplicationMenu(null);
	if (process.platform === "darwin" && app.dock) app.dock.setIcon(devIconPath);
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
