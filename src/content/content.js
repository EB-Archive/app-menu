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
"use strict"; // eslint-disable-line
/// <reference path="../types.d.ts"/>

/** @type {boolean} */
let amLoaded = amLoaded || false;
if (!amLoaded) {
	amLoaded = true;
	browser.runtime.onMessage.addListener(async (/** @type {Message} */ message) => {
		const method = String(message.method);
		switch (method) {
			case "init": {
				/** @type {ButtonStatus} */
				const result = {
					disable: [],
					enable: [
						"print",
						"saveAs",
					],
				};
				if (document.querySelector(":focus")) {
					result.enable.push("edit*");
				}
				return result;
			} case "editCut": {
				return document.execCommand("cut");
			} case "editCopy": {
				return document.execCommand("copy");
			} case "editPaste": {
				return document.execCommand("paste");
			} case "editUndo": {
				return document.execCommand("undo");
			} case "editRedo": {
				return document.execCommand("redo");
			} case "editSelectAll": {
				return document.execCommand("selectAll");
			} case "editDelete": {
				return document.execCommand("delete");
			} default: {
				throw new Error(`Unsupported Function '${method}'`);
			}
		}
	});
}
