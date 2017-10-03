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

document.addEventListener("DOMContentLoaded", async () => {
	i18nInit();
	initOptions();
});

async function initOptions() {
	let themes = ["default", "photon", "australis", "classic", "pastel-svg", "aero"];
	let data = (await browser.storage.sync.get({
		theme: "default",
		preferredWindowState:	"maximized"
	}));
	let currentTheme = data.theme;
	let themeSelector = document.querySelector("#theme");

	let preferredWindowStateSelector = document.querySelector("#fullscreenExitState");
	for (let i = 0; i < preferredWindowStateSelector.length; i++) {
		let option = preferredWindowStateSelector.item(i);
		if (option.value === data.preferredWindowState) {
			preferredWindowStateSelector.selectedIndex = i;
			option.setAttribute("selected", true);
		} else {
			option.selected = false;
		}
	}

	for (let theme of themes) {
		let t = theme;
		if (theme === "default") {
			t = await getDefaultTheme();
		}

		try {
			let response = await fetch(`/themes/${t}/theme.json`);
			if (!response.ok) {
				return;
			}
			let config = await response.json();
			let extension = config.default_extension || "svg";
			let icon = config.browser_action || null;
			if (icon !== null && typeof icon === "object") {
				let obj = icon;
				let keyNum = 0;
				for (let k in obj) {
					let num = Number(k);
					if (num > keyNum) {
						keyNum = num;
					}
				}
				icon = obj[keyNum] || null;
			}
			if (!icon) {
				icon = `firefox.${extension}`;
			}
			if (!icon.includes('.')) {
				icon += ('.' + extension);
			}

			let o = document.createElement("option");
			o.setAttribute("value", theme);

			if (typeof icon === "string") {
				let img = document.createElement("img");
				let imgSrc = `/themes/${t}/${icon}`;
				img.setAttribute("src", imgSrc);
				img.classList.add("eb-icon");

				o.appendChild(img);
				o.dataset.icon = imgSrc;
			}
			if (theme === "default") {
				o.appendChild(document.createTextNode(browser.i18n.getMessage("options_theme_default")));
				o.setAttribute("title", browser.i18n.getMessage("options_theme_default_title"));
			} else {
				o.appendChild(document.createTextNode(config.name));
			}
			if (theme === currentTheme) {
				o.setAttribute("selected", true);
			}
			themeSelector.appendChild(o);
		} catch (err) {}
	}

	document.querySelectorAll("select[data-save]").forEach(select => {
		select.addEventListener("change", async evt => {
			if (select.selectedIndex >= 0) {
				let selectedOption = select.item(select.selectedIndex);
				let value = select.item(select.selectedIndex).value;
				let data = {};
				data[select.dataset.save] = value;
				browser.storage.sync.set(data);

				if (select.dataset.save === "theme") {
					let themeDir = value;
					if (value === "default") {
						themeDir = await getDefaultTheme();
					}
					let config = await fetch(`/themes/${themeDir}/theme.json`).then(r => r.json());
					let extension = config.default_extension || "svg";
					if (config.browser_action) {
						let path = {};
						for (let k in config.browser_action) {
							path[k] = `/themes/${themeDir}/${config.browser_action[k].includes('.') ?
							config.browser_action[k] : config.browser_action[k] + '.' + extension}`
						}
						browser.browserAction.setIcon({path: path});
					} else {
						browser.browserAction.setIcon({path: `/themes/${themeDir}/firefox.${extension}`});
					}
				}
			}
		});
	});
}

async function i18nInit() {
	document.querySelectorAll("label[for]:not([data-i18n])").forEach(translatable => {
		let text = browser.i18n.getMessage(`options_${translatable.getAttribute("for")}`);
		if (text.length > 0)
			translatable.textContent = text;
	});

	document.querySelectorAll("[data-i18n]").forEach(translatable => {
		let text = browser.i18n.getMessage(translatable.dataset.i18n);
		if (text.length > 0)
			translatable.textContent = text;
	});
}
