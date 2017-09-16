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
"use strict";
/* global browser */

/**
 * @typedef ButtonStatus
 * @property {String[]} enable
 * @property {String[]} disable
 */

/**
 * @type HTMLElement
 */
var defaultSubMenu;

document.addEventListener("DOMContentLoaded", () => {
	defaultSubMenu = document.querySelector("#sub-menu > .active");
	return Promise.all([
		loadIcons(),
		i18nInit(),
		setupMouseEvents(),
		setupIPCEvents(),
		initPopup()
	]);
});

async function loadSpecialIcons() {
	// TODO: Handle dynamic icons (ex. fullscreen)
}

async function loadIcons() {
	let themeDir = (await browser.storage.sync.get({
		theme: await getDefaultTheme()
	})).theme;

	let theme = await fetch(`/themes/${themeDir}/theme.json`).then(r => r.json());
	let themeCSS = `/themes/${themeDir}/theme.css`;

	fetch(themeCSS).then(r => {
		if (r.ok) {
			let style = document.querySelector("#theme-css");
			if (!style) {
				style = document.createElement("link");
				style.setAttribute("id", "#theme-css");
				style.setAttribute("rel", "stylesheet");
				style.setAttribute("type", "text/css");
			}
			style.setAttribute("href", themeCSS);
			document.head.appendChild(style);
		}
	});

	let os = (await browser.runtime.getPlatformInfo()).os;

	document.querySelectorAll(".eb-icon-placeholder").forEach(async i => {
		let icon = document.createElement("img");
		icon.classList.add("icon", "eb-icon");
		if (i.dataset.icon) {
			if (/^system-/.test(i.dataset.icon)) {
				icon = document.createElement("i");
				icon.classList.add("icon", "eb-icon");
				icon.dataset.icon = i.dataset.icon;
			} else {
				let extension = theme.default_extension || "svg";
				let srcOS = `/themes/${themeDir}/${i.dataset.icon}$${os}.${extension}`;
				let src = `/themes/${themeDir}/${i.dataset.icon}.${extension}`;

				let hasSrcOS = false;
				try {
					hasSrcOS = (await fetch(srcOS)).ok; // Doesn’t work in 57
				} catch (err) {}

				icon.addEventListener("error", err => {
					let i2 = document.createElement("img");
					i2.classList.add("icon", "eb-icon");
					// Fix for Firefox 57:
					if (hasSrcOS) {
						i2.setAttribute("src", src);
						i2.addEventListener("error", err => {
							let i3 = document.createElement("img");
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
}

async function setupMouseEvents() {
	document.querySelectorAll("#main-menu [data-sub-menu]").forEach(sm => {
		sm.addEventListener("mouseenter", evt => {
			document.querySelectorAll("#sub-menu > .active").forEach(s => s.classList.remove("active"));
			document.querySelector(`#sm-${sm.dataset.subMenu}`).classList.add("active");
		});
	});

	let activateDefaultSubMenuListener = evt => {
		document.querySelectorAll("#sub-menu > .active").forEach(s => s.classList.remove("active"));
		defaultSubMenu.classList.add("active");
	}

	let activateDefaultSubMenu = sm => {
		sm.addEventListener("mouseenter", activateDefaultSubMenuListener);
	};

	document.querySelectorAll("#main-menu .panel-list-item:not([data-sub-menu])").forEach(activateDefaultSubMenu);
	document.querySelectorAll("#main-menu .panel-section-separator:not([data-sub-menu])").forEach(activateDefaultSubMenu);
	activateDefaultSubMenu(document.querySelector("#main-menu"));
	document.querySelector("#sub-menu > div").addEventListener("mouseleave", activateDefaultSubMenuListener);
}

async function i18nInit() {
	document.querySelectorAll("[data-i18n]").forEach(translatable => {
		let text = browser.i18n.getMessage(translatable.dataset.i18n);
		if (text.length > 0) {
			translatable.textContent = text;
		}
	});

	document.querySelectorAll("[data-i18n-label]").forEach(translatable => {
		let text = browser.i18n.getMessage(translatable.dataset.i18nLabel);
		if (text.length > 0) {
			translatable.setAttribute("label", text);
		}
	});
}

async function setupIPCEvents() {
	document.querySelectorAll("[data-ipc-message]").forEach(sender => {
		sender.addEventListener("click", async evt => {
			if (evt.currentTarget.dataset.disabled) return;

			let remainOpen = Boolean(evt.currentTarget.dataset.remainOpen);
			let promise = browser.runtime.sendMessage({
				method: sender.dataset.ipcMessage
			});

			if (!remainOpen) {
				window.close();
				return promise;
			} else {
				let response = await promise;

				if (response.updateButtonStatus) {
					updateButtonStatus(response.updateButtonStatus);
				}

				return response;
			}
		});
	});
}

async function initPopup() {
	return updateButtonStatus(await browser.runtime.sendMessage({method: "init"}));
}

/**
 * @param {ButtonStatus} buttonStatus
 * @returns {undefined}
 */
async function updateButtonStatus(buttonStatus) {
	let parseQuery = query => {
		if (query === '*') {
			return "[data-ipc-message]";
		} if (query.startsWith('*') && query.endsWith('*')) {
			return `[data-ipc-message*="${query.substring(1, query.length - 1)}"]`;
		} else if (query.startsWith('*')) {
			return `[data-ipc-message$="${query.substring(1, query.length)}"]`;
		} else if (query.endsWith('*')) {
			return `[data-ipc-message^="${query.substring(0, query.length - 1)}"]`;
		} else {
			return `[data-ipc-message="${query}"]`;
		}
	}

	let disable = node => {
		node.dataset.disabled = true;
		if (node instanceof HTMLMenuItemElement) {
			node.setAttribute("disabled", true);
		} else {
			if (!node.dataset.subMenu) {
				node.classList.add("disabled");
			}
		}
	};

	let enable = node => {
		delete node.dataset.disabled;
		if (node instanceof HTMLMenuItemElement) {
			node.removeAttribute("disabled");
		} else {
			node.classList.remove("disabled");
		}
	}

	if (buttonStatus.disable) {
		buttonStatus.disable.forEach(disabled => {
			if (!disabled.includes('*')) return;
			let query = parseQuery(disabled);
			document.querySelectorAll(query).forEach(disable);
		});
	}

	if (buttonStatus.enable) {
		buttonStatus.enable.forEach(enabled => {
			let query = parseQuery(enabled);
			document.querySelectorAll(query).forEach(enable);
		});
	}

	if (buttonStatus.disable) {
		buttonStatus.disable.forEach(disabled => {
			if (disabled.includes('*')) return;
			let query = parseQuery(disabled);
			document.querySelectorAll(query).forEach(disable);
		});
	}
}
