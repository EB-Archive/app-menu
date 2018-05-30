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
import {getCurrentTheme} from "./shared.js";

const prevStates = new Map();

(async () => {
	const {
		themeDir,
		themeJSON
	} = await getCurrentTheme();

	if (typeof themeJSON.browser_action === "object" &&
		!(themeJSON.browser_action instanceof Array)) {
		const path = {};
		const extension = themeJSON.default_extension || "svg";
		for (const k in themeJSON.browser_action) {
			path[k] = `/themes/${themeDir}/${themeJSON.browser_action[k].includes(".")
				? themeJSON.browser_action[k] : `${themeJSON.browser_action[k]}.${extension}`}`;
		}
		browser.browserAction.setIcon({path});
	} else {
		browser.browserAction.setIcon({path: `/themes/${themeDir}/firefox.${themeJSON.default_extension || "svg"}`});
	}
})();

browser.runtime.onMessage.addListener((message, sender) => {
	if (/\/popup\/popup\.xhtml$/.test(sender.url)) {
		return handlePopupMessage(message);
	}
	return null;
});

const tabHandler = (() => {
	/**
	 * @type Map<Set>
	 */
	const listeners = new Map();

	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (listeners.has(tabId)) {
			listeners.get(tabId).forEach(cb => cb(tabId, changeInfo, tab));
		}
	});

	const removeListener = (tabId, callback) => {
		if (listeners.has(tabId)) {
			listeners.get(tabId).remove(callback);
		}
	};

	return {
		removeListener, addListener: (tabId, callback, options = {}) => {
			if (options.removeOnComplete) {
				const origCB = callback;
				const newCallback = (tabId, changeInfo, tab) => {
					origCB(tabId, changeInfo, tab);
					if (changeInfo.status === "complete") {
						removeListener(tabId, newCallback);
					}
				};
				callback = newCallback;
			}

			if (listeners.has(tabId)) {
				listeners.get(tabId).add(callback);
			} else {
				const set = new Set();
				set.add(callback);
				listeners.set(tabId, set);
			}
		},

		hasListener: (tabId, callback) => {
			if (listeners.has(tabId)) {
				return listeners.get(tabId).has(callback);
			}
		},

		hasListeners: tabId => {
			return listeners.has(tabId);
		}
	};
})();

/**
 * @param {String} message The message
 * @returns {undefined}
 */
async function handlePopupMessage(message) {
	const method = String(message.method);
	let data;
	if ("data" in message) {
		if (message.data instanceof String) {
			try {
				data = JSON.parse(message.data);
			} catch (e) {
				data = {};
			}
		} else if (message.data instanceof Object) {
			({data} = message);
		}
	} else {
		data = {};
	}
	const [window, tab] = await Promise.all([
		browser.windows.getCurrent(),
		browser.tabs.query({active: true, currentWindow: true}).then(tabs => tabs[0])
	]);
	switch (method) {
		case "init": {
			let response;
			try {
				await browser.tabs.executeScript(tab.id, {file: "/content/content.js", runAt: "document_end"});
				response = await browser.tabs.sendMessage(tab.id, {method: "init"});
			} catch (e) {
				if (e.message !== "Missing host permission for the tab")
					console.warn(e);
			}
			if (!response) response = {disable: [], enable: []};
			const result = {
				disable: [
					"*",
					"edit*",
					"dev*",
					"workOffline",
					"openHelpHealthReport",
					"openHelpTroubleshooting",
					"openHelpAboutFirefox",
					"printPageSetup"
				],
				enable: [
					"new*",
					"emailLink",
					"devGetTools",
					"openAddons",
					"fullscreen",
					"openHelp*",
					"exit",
					"print*"
				]
			};
			if (browser.tabs.printPreview) {
				result.enable.push("printPreview");
			}
			if (browser.tabs.print) {
				result.enable.push("print");
			}
			response.disable.forEach(	str => result.disable.push(	str));
			response.enable.forEach(	str => result.enable.push(	str));
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
				url: `mailto:?subject=${encodeURIComponent(tab.title)}&body=${encodeURIComponent(tab.url)}`
			}).then(tab => {
				if (tab.status === "complete") {
					browser.tabs.remove(tab.id);
				} else {
					tabHandler.addListener(tab.id, (tabId, changeInfo) => {
						if (changeInfo.status === "complete") {
							browser.tabs.remove(tabId);
						}
					}, {removeOnComplete: true});
				}
				return tab;
			});
		} case "openAddons": {
			return browser.runtime.openOptionsPage();
		} case "openOptions": {
			return browser.tabs.create({url: "about:preferences"});
		} case "openOptionsCustomizing": {
			return browser.tabs.create({url: "about:customizing"});
		} case "devGetTools": {
			return browser.tabs.create({url: "https://addons.mozilla.org/firefox/collections/mozilla/webdeveloper/"});
		} case "fullscreen": {
			const prevState	= window.state;
			let newState	= prevStates.get(window.id);
			newState	= (newState && newState !== "fullscreen" ? newState : browser.storage.sync.get({preferredWindowState: "maximized"}));
			if (newState instanceof Promise) {
				newState = (await newState).preferredWindowState;
			}
			const result = await browser.windows.update(window.id, {
				state: window.state === "fullscreen" ? newState : "fullscreen"
			});
			prevStates.set(window.id, prevState);
			return result;
		} case "exit": {
			const windows = await browser.windows.getAll();
			windows.forEach(({id}) => browser.windows.remove(id));
			return;
		} case "printPreview": {
			return browser.tabs.printPreview();
		} case "print": {
			return browser.tabs.print();
		} default: {
			if (method.startsWith("openHelp")) {
				const [
					browserInfo,
					platformInfo
				] = await Promise.all([
					browser.runtime.getBrowserInfo(),
					browser.runtime.getPlatformInfo()
				]);
				const lang = browser.i18n.getUILanguage().replace(/_/g, "-");
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
}
