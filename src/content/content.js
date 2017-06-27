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

var amLoaded = amLoaded || false;

if (!amLoaded) {
	amLoaded = true;
	browser.runtime.onMessage.addListener(async (message, sender) => {
		let method = String(message.method);
		switch (method) {
			case "init": {
				let result = {
					disable: [],
					enable: []
				}
				if (document.documentElement.requestFullScreen || document.documentElement.mozRequestFullScreen) {
					//result.enable.push("fullscreen");
				}
				if (document.querySelector(":focus")) {
					result.enable.push("edit*");
				}
				return result;
			} case "fullscreen": {
				if (window.fullScreen) {
					if (document.exitFullscreen) {
						document.exitFullscreen();
					} else {
						document.mozCancelFullScreen();
					}
				} else {
					if (document.documentElement.requestFullScreen) {
						document.documentElement.requestFullScreen();
					} else {
						document.documentElement.mozRequestFullScreen();
					}
				}
				return;
			} case "editCut": {
				document.execCommand("cut");
			} case "editCopy": {
				document.execCommand("copy");
			} case "editPaste": {
				document.execCommand("paste");
			} case "editUndo": {
				document.execCommand("undo");
			} case "editRedo": {
				document.execCommand("redo");
			} case "editSelectAll": {
				document.execCommand("selectAll");
			} case "editDelete": {
				document.execCommand("delete");
			}
		}
	});
}
