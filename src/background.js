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

(async function() {
	let themeDir = (await browser.storage.sync.get({
		theme: "australis"
	})).theme;

	let theme = await fetch(`/themes/${themeDir}/theme.json`).then(r => r.json());

	if (theme.browser_action) {
		let path = {};
		for (let k in theme.browser_action) {
			path[k] = `/themes/${themeDir}/${theme.browser_action[k].includes('.') ?
			theme.browser_action[k] : theme.browser_action[k] + '.' + extension}`
		}
		browser.browserAction.setIcon({path: path});
	} else {
		browser.browserAction.setIcon({path: `/themes/${themeDir}/firefox.${theme.default_extension || "svg"}`});
	}
})();

browser.runtime.onMessage.addListener((message, sender, resolve) => {
	if (/\/popup\/popup\.html$/.test(sender.url)) {
		return handlePopupMessage(message);
	}
});

/**
 * @param {String} message
 * @returns {undefined}
 */
async function handlePopupMessage(message) {
	let method = String(message.method);
	let tab = (await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT }))[0];
	switch (method) {
		case "init": {
			let response;
			try {
				await browser.tabs.executeScript(tab.id, { file: "/content/content.js", runAt: "document_end" });
				response = await browser.tabs.sendMessage(tab.id, {method: "init"});
			} catch (e) {
				if (e.message !== "Missing host permission for the tab")
					console.warn(e);
			}
			if (!response) response = {disable: [], enable: []};
			let result = {
				disable: [
					"*",
					"edit*",
					"dev*",
					"workOffline"
				],
				enable: [
					"new*",
					"emailLink",
					"devGetTools"
				]
			};
			response.disable.forEach(	str => result.disable.push(	str));
			response.enable.forEach(	str => result.enable.push(	str));
			return result;
		} case "newTab": {
			return browser.tabs.create({url: null});
		} case "newWindow": {
			return browser.windows.create();
		} case "newPrivateWindow": {
			return browser.windows.create({incognito: true});
		} case "emailLink": {
			return browser.tabs.create({
				active: false,
				url: `mailto:?subject=${encodeURIComponent(tab.title)}&body=${encodeURIComponent(tab.url)}`
			});
		} case "openAddons": {
			return browser.runtime.openOptionsPage();
		} case "fullscreen": case "editCut": case "editCopy": case "editPaste":
		case "editUndo": case "editRedo": case "editSelectAll": case "editDelete": {
			return browser.tabs.sendMessage(tab.id, message);
		} case "devGetTools": {
			return browser.tabs.create({url: "https://addons.mozilla.org/firefox/collections/mozilla/webdeveloper/"});
		} default: {
			throw new Error(`Unsupported Function '${method}'`)
		}
	}
}
