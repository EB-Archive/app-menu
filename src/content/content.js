/*
 * Copyright (C) 2017 ExE Boss
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/* global browser */

/**
 * @typedef {Object} PlatformInfo
 * @property {String} os
 * @property {String} arch
 */
/**
 * @typedef {Object} BrowserInfo
 * @property {String} name
 * @property {String} vendor
 * @property {String} version
 * @property {String} buildID
 */

/**
 * @type Boolean
 */
var amLoaded = amLoaded || false;

if (!amLoaded) {
	amLoaded = true;
	browser.runtime.onMessage.addListener(async (message, sender) => {
		let method = String(message.method);
		let platformInfo = {
			os:	String(message.platformInfo.os),
			arch:	String(message.platformInfo.arch)
		};
		let browserInfo = {
			name:	String(message.browserInfo.name),
			vendor:	String(message.browserInfo.vendor),
			version:	String(message.browserInfo.version),
			buildID:	String(message.browserInfo.buildID)
		};
		switch (method) {
			case "init": {
				let result = {
					disable: [],
					enable: [
						"print",
						"saveAs"
					]
				}
				if (document.querySelector(":focus")) {
					result.enable.push("edit*");
				}
				return result;
			} case "editCut": {
				return {result: document.execCommand("cut")};
			} case "editCopy": {
				return {result: document.execCommand("copy")};
			} case "editPaste": {
				return {result: document.execCommand("paste")};
			} case "editUndo": {
				return {result: document.execCommand("undo")};
			} case "editRedo": {
				return {result: document.execCommand("redo")};
			} case "editSelectAll": {
				return {result: document.execCommand("selectAll")};
			} case "editDelete": {
				return {result: document.execCommand("delete")};
			} case "print": {
				return {result: window.print()};
			} default: {
				throw new Error(`Unsupported Function '${method}'`);
			}
		}
	});
}
