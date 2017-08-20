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
		let focusedElement = document.activeElement;
		let isFocusable = focusedElement && focusedElement !== document.body;
		let method = String(message.method);
		let execCommand = (command) => {
			window.focus();
			if (isFocusable) {
				focusedElement.focus();
			}
			document.execCommand(command);
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

				if (isFocusable && focusedElement.isContentEditable) {
					result.enable.push("edit*");
				} else if (isFocusable) {
					result.enable.push("editCut", "editCopy", "editSelectAll");
				} else {
					result.enable.push("editCopy", "editSelectAll");
				}
				return result;
			} case "editCut": {
				return execCommand("cut");
			} case "editCopy": {
				return execCommand("copy");
			} case "editPaste": {
				return execCommand("paste");
			} case "editUndo": {
				return execCommand("undo");
			} case "editRedo": {
				return execCommand("redo");
			} case "editSelectAll": {
				// Select all doesn't work reliably on inputs yet
				if (isFocusable) {
					window.focus();
					focusedElement.focus();
					return focusedElement.select();
				}

				// ...so we select everything on the page
				let selection = window.getSelection();
				let range = document.createRange();
				range.selectNodeContents(document.documentElement);
				selection.removeAllRanges();
				return selection.addRange(range);
			} case "editDelete": {
				return execCommand("delete");
			} case "print": {
				return window.print();
			} default: {
				throw new Error(`Unsupported Function '${method}'`);
			}
		}
	});
}
