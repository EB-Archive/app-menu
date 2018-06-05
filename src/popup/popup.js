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
import {ButtonStatus} from "../types"; // eslint-disable-line no-unused-vars
import {getCurrentTheme} from "../shared.js";
import hyperHTML from "hyperhtml/esm";

/** @type {HTMLElement} */
const defaultSubMenu = document.getElementById("sm-default");
document.addEventListener("DOMContentLoaded", () => {
	return Promise.all([
		setupTheme(),
		i18nInit(),
		setupMouseEvents(),
		setupIPCEvents(),
		initPopup(),
	]);
});

async function setupTheme() {
	const theme = await getCurrentTheme();

	let style = document.getElementById("theme-css");
	if (!style) {
		style = document.head.appendChild(hyperHTML`
			<link id="theme-css" rel="stylesheet" type="text/css"/>`);
	}
	style.setAttribute("href", theme.themeCSS);

	return Promise.all([
		loadIcons(theme),
		loadSpecialIcons(theme),
	]);
}

async function loadSpecialIcons() {
	// TODO: Handle dynamic icons (ex. fullscreen)
}

const loadIcons = async ({themeDir, themeJSON}) => {
	const {os} = (await browser.runtime.getPlatformInfo());

	document.querySelectorAll(".eb-icon-placeholder").forEach(async i => {
		let icon = document.createElement("img");
		icon.classList.add("icon", "eb-icon");
		if (i.dataset.icon) {
			if (/^system-/.test(i.dataset.icon)) {
				icon = document.createElement("i");
				icon.classList.add("icon", "eb-icon");
				icon.dataset.icon = i.dataset.icon;
			} else {
				const extension = themeJSON.default_extension || "svg";
				const srcOS = `/themes/${themeDir}/${i.dataset.icon}$${os}.${extension}`;
				const src = `/themes/${themeDir}/${i.dataset.icon}.${extension}`;

				let hasSrcOS = false;
				try {
					hasSrcOS = (await fetch(srcOS)).ok; // Doesn’t work when loaded from file:// URLs
				} catch (err) {}

				icon.addEventListener("error", () => {
					const i2 = document.createElement("img");
					i2.classList.add("icon", "eb-icon");
					// Fix for file:// URLs:
					if (hasSrcOS) {
						i2.setAttribute("src", src);
						i2.addEventListener("error", () => {
							const i3 = document.createElement("img");
							i3.classList.add("icon", "eb-icon");
							i2.parentNode.replaceChild(i3, i2);
						});
					}
					icon.parentNode.replaceChild(i2, icon);
				});
				icon.setAttribute("src", hasSrcOS ? srcOS : src);
			}
		}
		i.parentNode.replaceChild(icon, i);
	});
};

async function setupMouseEvents() {
	document.querySelectorAll("#main-menu [data-sub-menu]").forEach(sm => {
		sm.addEventListener("mouseenter", () => {
			document.querySelectorAll("#sub-menu > .active").forEach(s => s.classList.remove("active"));
			document.querySelector(`#sm-${sm.dataset.subMenu}`).classList.add("active");
		});
	});

	const activateDefaultSubMenuListener = () => {
		document.querySelectorAll("#sub-menu > .active").forEach(s => s.classList.remove("active"));
		defaultSubMenu.classList.add("active");
	};

	const activateDefaultSubMenu = sm => {
		sm.addEventListener("mouseenter", activateDefaultSubMenuListener);
	};

	document.querySelectorAll("#main-menu .panel-list-item:not([data-sub-menu])").forEach(activateDefaultSubMenu);
	document.querySelectorAll("#main-menu .panel-section-separator:not([data-sub-menu])").forEach(activateDefaultSubMenu);
	activateDefaultSubMenu(document.querySelector("#main-menu"));
	document.querySelector("#sub-menu > div").addEventListener("mouseleave", activateDefaultSubMenuListener);
}

async function i18nInit() {
	document.querySelectorAll("[data-i18n]").forEach(translatable => {
		const text = browser.i18n.getMessage(translatable.dataset.i18n);
		if (text.length > 0) {
			translatable.textContent = text;
		}
	});

	document.querySelectorAll("[data-i18n-label]").forEach(translatable => {
		const text = browser.i18n.getMessage(translatable.dataset.i18nLabel);
		if (text.length > 0) {
			translatable.setAttribute("label", text);
		}
	});
}

async function setupIPCEvents() {
	document.querySelectorAll("[data-ipc-message]").forEach(sender => {
		sender.addEventListener("click", async evt => {
			if (evt.currentTarget.dataset.disabled) return undefined;

			const remainOpen = Boolean(evt.currentTarget.dataset.remainOpen);
			const promise = browser.runtime.sendMessage({
				method: sender.dataset.ipcMessage,
			});

			if (!remainOpen) {
				window.close();
				return promise;
			} else {
				const response = await promise;

				if (response.updateButtonStatus) {
					updateButtonStatus(response.updateButtonStatus);
				}

				return response;
			}
		});
	});
}

async function initPopup() {
	return Promise.all([
		updateButtonStatus(await browser.runtime.sendMessage({method: "init"})),
		initContextualIdentities(),
	]);
}

async function initContextualIdentities() {
	let lastElement	= document.querySelector('#sub-menu > #sm-new-tab > .panel-section-separator + .panel-list-item[data-ipc-message="openFile"]');
	const smNewTab	= lastElement.parentElement;
	const contextualIdentities = await browser.contextualIdentities.query({});
	if (!contextualIdentities || contextualIdentities.length === 0) return;
	{
		lastElement = smNewTab.insertBefore(hyperHTML`
			<div class="panel-section-separator"/>`, lastElement);
	}
	contextualIdentities.forEach(identity => {
		const onclick = async evt => {
			if (evt.currentTarget.dataset.disabled) return undefined;

			const promise = browser.runtime.sendMessage({
				method: button.dataset.ipcMessage,
				data: {
					cookieStoreId:	identity.cookieStoreId,
				},
			});

			window.close();
			return promise;
		};

		/** @type {HTMLElement} */
		const button = hyperHTML`
			<div class="panel-list-item" data-ipc-message="newTab" onclick=${onclick}>
				<img class="icon eb-icon context-properties-fill"
					style="${{fill: identity.colorCode}}"
					src="${identity.iconUrl}"/>
				<div class="text">${identity.name}</div>
			</div>`;

		smNewTab.insertBefore(button, lastElement);
	});
}

/**
 * @param	{ButtonStatus}	buttonStatus	The button status
 */
const updateButtonStatus = async (buttonStatus) => {
	/**
	 * @param	{string}	query	The IPC message query
	 * @return	{string}	The query converted to a CSS selector
	 */
	const parseQuery = query => {
		if (query === "*") {
			return "[data-ipc-message]";
		} if (query.startsWith("*") && query.endsWith("*")) {
			return `[data-ipc-message*="${CSS.escape(query.substring(1, query.length - 1))}"]`;
		} else if (query.startsWith("*")) {
			return `[data-ipc-message$="${CSS.escape(query.substring(1, query.length))}"]`;
		} else if (query.endsWith("*")) {
			return `[data-ipc-message^="${CSS.escape(query.substring(0, query.length - 1))}"]`;
		} else {
			return `[data-ipc-message="${CSS.escape(query)}"]`;
		}
	};

	/**
	 * @param	{HTMLElement}	element	The element.
	 */
	const disable = element => {
		element.dataset.disabled = true;
		if (element.tagName.toLowerCase() === "menuitem") {
			element.setAttribute("disabled", true);
		} else {
			if (!element.dataset.subMenu) {
				element.classList.add("disabled");
			}
		}
	};

	/**
	 * @param	{HTMLElement}	element	The element.
	 */
	const enable = element => {
		delete element.dataset.disabled;
		if (element.tagName.toLowerCase() === "menuitem") {
			element.removeAttribute("disabled");
		} else {
			element.classList.remove("disabled");
		}
	};

	if (buttonStatus.disable) {
		buttonStatus.disable.forEach(disabled => {
			if (!disabled.includes("*")) return;
			const query = parseQuery(disabled);
			document.querySelectorAll(query).forEach(disable);
		});
	}

	if (buttonStatus.enable) {
		buttonStatus.enable.forEach(enabled => {
			const query = parseQuery(enabled);
			document.querySelectorAll(query).forEach(enable);
		});
	}

	if (buttonStatus.disable) {
		buttonStatus.disable.forEach(disabled => {
			if (disabled.includes("*")) return;
			const query = parseQuery(disabled);
			document.querySelectorAll(query).forEach(disable);
		});
	}
};
