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

var defaultSubMenu;

document.addEventListener("DOMContentLoaded", () => {
	defaultSubMenu = document.querySelector("#sub-menu > .active");
	loadIcons();
	i18nInit();
	setupMouseEvents();
	setupIPCEvents();
	initPopup();
});

async function loadIcons() {
	let themeDir = (await browser.storage.sync.get({
		theme: "australis"
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
		let extension = theme.default_extension || "svg";
		let srcOS = `/themes/${themeDir}/${i.dataset.icon}$${os}.${extension}`;
		let src = `/themes/${themeDir}/${i.dataset.icon}.${extension}`;

		let hasSrcOS;
		try {
			hasSrcOS = (await fetch(srcOS)).ok;
		} catch (err) {
			hasSrcOS = false;
		}

		let icon = document.createElement("img");
		icon.classList.add("icon", "eb-icon");
		if (i.dataset.icon) {
			if (/^system-/.test(i.dataset.icon)) {
				switch (i.dataset.icon) {
					case "system-arrow-expand": {
						icon.setAttribute("src", "data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgeG1sbnM6eGh0bWw9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIGNsYXNzPSJuaWNlcm1lZGlhcGFnZXMtU1ZHIj48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHg9IjAiIHk9IjAiPjx4aHRtbDpib2R5Lz48L2ZvcmVpZ25PYmplY3Q+PHBhdGggZmlsbD0iIzZhNmE2YSIgZD0iTTEyIDhsLTUgNS0xLTEgNC00LTQtNCAxLTF6Ii8+PC9zdmc+");
					}
				}
			} else {
				icon.addEventListener("error", err => {
					let i2 = document.createElement("img");
					i2.classList.add("icon", "eb-icon");
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
		if (text.length > 0)
			translatable.textContent = text;
	});
}

async function setupIPCEvents() {
	document.querySelectorAll("[data-ipc-message]").forEach(sender => {
		sender.addEventListener("click", evt => {
			if (evt.currentTarget.dataset.disabled) return;
			browser.runtime.sendMessage({
				method: sender.dataset.ipcMessage
			});
		});
	});
}

async function initPopup() {
	let parseQuery = query => {
		if (query === '*') {
			return "[data-ipc-message]";
		} if (query.startsWith('*') && query.endsWith('*')) {
			return `[data-ipc-message^="${query.substring(1, query.length - 1)}"]`;
		} else if (query.startsWith('*')) {
			return`[data-ipc-message$="${query.substring(1, query.length)}"]`;
		} else if (query.endsWith('*')) {
			return `[data-ipc-message^="${query.substring(0, query.length - 1)}"]`;
		} else {
			return `[data-ipc-message="${query}"]`;
		}
	}

	browser.runtime.sendMessage({method: "init"}).then(response => {
		response.disable.forEach(disabled => {
			let query = parseQuery(disabled);
			document.querySelectorAll(query).forEach(node => {
				node.dataset.disabled = true;
				if (!node.dataset.subMenu)
					node.classList.add("disabled");
			});
		});

		response.enable.forEach(enabled => {
			let query = parseQuery(enabled);
			document.querySelectorAll(query).forEach(node => {
				delete node.dataset.disabled;
				node.classList.remove("disabled");
			});
		});
	});
}
