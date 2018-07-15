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
/// <reference path="./types.d.ts"/>

import {getCurrentTheme} from "./shared.js";

/** @type {Map<number,browser.windows.WindowState>} */
const prevStates = new Map();

(async () => {
	browser.browserAction.setIcon({
		path: (await getCurrentTheme()).browser_action,
	});
})();

browser.runtime.onMessage.addListener(async (message, sender) => {
	if (/\/popup\/popup\.xhtml$/.test(sender.url)) {
		return handlePopupMessage(message);
	}
	return null;
});

/**
 * @param {Message} message The message
 * @return {Promise<*>} The result
 */
const handlePopupMessage = async (message) => {
	const method = String(message.method);
	const data = message.data || {};

	const [
		window,
		tab,
	] = await Promise.all([
		browser.windows.getCurrent(),
		browser.tabs.query({active: true, currentWindow: true}).then(tabs => tabs[0]),
	]);
	switch (method) {
		case "init": {
			/** @type {ButtonStatus} */
			let response;
			try {
				await browser.tabs.executeScript(tab.id, {file: "/content/content.js", runAt: "document_end"});
				response = await browser.tabs.sendMessage(tab.id, {method: "init"});
			} catch (e) {
				if (e.message !== "Missing host permission for the tab")
					console.warn(e);
			}
			/** @type {ButtonStatus} */
			const result = {
				disable: [
					"*",
					"edit*",
					"dev*",
					"workOffline",
					"openHelpHealthReport",
					"openHelpTroubleshooting",
					"openHelpAboutFirefox",
					"printPageSetup",
				],
				enable: [
					"new*",
					"emailLink",
					"devGetTools",
					"openAddons",
					"fullscreen",
					"openHelp*",
					"exit",
					"print*",
				],
			};
			if (response) {
				if (response.disable instanceof Array)
					for (const str of response.disable)
						result.disable.push(str);
				if (response.enable instanceof Array)
					for (const str of response.enable)
						result.enable.push(str);
			}
			return result;
		} case "newTab": {
			const newTabData = {url: null};
			if ("cookieStoreId" in data) {
				newTabData.cookieStoreId = String(data.cookieStoreId);
			}
			return browser.tabs.create(newTabData);
		} case "newWindow": {
			return browser.windows.create();
		} case "newPrivateWindow": {
			return browser.windows.create({incognito: true});
		} case "saveAs": {
			return browser.downloads.download({url: tab.url, filename: `${tab.title}.html`, saveAs: true});
		} case "emailLink": {
			return browser.tabs.create({
				active: false,
				url: `mailto:?subject=${encodeURIComponent(tab.title)}&body=${encodeURIComponent(tab.url)}`,
			}).then(tab => browser.tabs.remove(tab.id));
		} case "openAddons": {
			return browser.runtime.openOptionsPage();
		} case "openOptions": {
			return browser.tabs.create({url: "about:preferences"});
		} case "openOptionsCustomizing": {
			return browser.tabs.create({url: "about:customizing"});
		} case "devGetTools": {
			return browser.tabs.create({url: "https://addons.mozilla.org/firefox/collections/mozilla/webdeveloper/"});
		} case "fullscreen": {
			const {
				state: currentState,
			} = window;
			let newState = prevStates.get(window.id);
			if (!newState || newState === "fullscreen") {
				newState = (await browser.storage.sync.get({
					preferredWindowState: "maximized",
				})).preferredWindowState;
			}
			const result = await browser.windows.update(window.id, {
				state: window.state === "fullscreen" ? newState : "fullscreen",
			});
			prevStates.set(window.id, currentState);
			return result;
		} case "exit": {
			return Promise.all((await browser.windows.getAll())
				.map(({id}) => browser.windows.remove(id)));
		} case "printPreview": {
			return browser.tabs.printPreview();
		} case "print": {
			return browser.tabs.print();
		} default: {
			if (method.startsWith("openHelp")) {
				const [
					browserInfo,
					platformInfo,
				] = await Promise.all([
					browser.runtime.getBrowserInfo(),
					browser.runtime.getPlatformInfo(),
				]);
				const lang = browser.i18n.getUILanguage().replace(/_/g, "-");
				/** @type {string} */
				let os;
				switch (platformInfo.os) {
					case "win": default: {
						os = "WINNT";
						break;
					} case "mac": {
						os = "MACOS"; // TODO: Needs verification
						break;
					} case "linux": {
						os = "LINUX"; // TODO: Needs verification
						break;
					} case "android": {
						os = "ANDROID"; // TODO: Needs verification
						break;
					} case "openbsd": {
						os = "OPENBSD"; // TODO: Needs verification
						break;
					}
				}

				switch (method) {
					case "openHelp": {
						return browser.tabs.create({url: `https://support.mozilla.org/1/firefox/${browserInfo.version}/${os}/${lang}/firefox-help`});
					} case "openHelpGettingStarted": {
						return browser.tabs.create({url: "https://www.mozilla.org/firefox/central/"});
					} case "openHelpTour": {
						return browser.tabs.create({url: `https://www.mozilla.org/${lang}/firefox/${browserInfo.version}/tour/`});
					} case "openHelpShortcuts": {
						return browser.tabs.create({url: `https://support.mozilla.org/1/firefox/${browserInfo.version}/${os}/${lang}/keyboard-shortcuts`});
					} case "openHelpHealthReport": {
						return browser.tabs.create({url: "about:healthreport"});
					} case "openHelpTroubleshooting": {
						return browser.tabs.create({url: "about:support"});
					} case "openHelpFeedback": {
						return browser.tabs.create({url: `https://input.mozilla.org/${lang}/feedback/firefox/${browserInfo.version}/`});
					}
				}
			}
			return browser.tabs.sendMessage(tab.id, message);
		}
	}
};
