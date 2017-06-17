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

browser.runtime.onMessage.addListener((message, sender, resolve) => {
	console.log(message, sender);
	if (/\/popup\/popup\.html$/.test(sender.url)) {
		return handlePopupMessage(message);
	}
});

/**
 * @param {String} message
 * @returns {undefined}
 */
async function handlePopupMessage(message) {
	let method = String(message.method)
	switch (method) {
		case "init": {
			return {
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
		} case "newTab": {
			return browser.tabs.create({url: null});
		} case "newWindow": {
			return browser.windows.create();
		} case "newPrivateWindow": {
			return browser.windows.create({incognito: true});
		} case "emailLink": {
			let tab = (await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT }))[0];
			console.log(tab);
			return browser.tabs.create({url: `mailto:?subject=${encodeURIComponent(tab.title)}&body=${encodeURIComponent(tab.url)}`});
		} case "openAddons": {
			return browser.runtime.openOptionsPage();
		} case "devGetTools": {
			return browser.tabs.create({url: "https://addons.mozilla.org/firefox/collections/mozilla/webdeveloper/"});
		} default: {
			throw new Error(`Unsupported Function '${method}'`)
		}
	}
}
