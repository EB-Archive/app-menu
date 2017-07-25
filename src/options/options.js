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

document.addEventListener("DOMContentLoaded", async () => {
	i18nInit();
	initOptions();
});

async function initOptions() {
	let themes = ["photon", "australis", "classic", "pastel-svg", "aero"];
	let currentTheme = (await browser.storage.sync.get({
		theme: await getDefaultTheme()
	})).theme;
	let themeSelector = document.querySelector("#theme");

	for (let t of themes) {
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
			o.setAttribute("value", t);

			if (typeof icon === "string") {
				let img = document.createElement("img");
				let imgSrc = `/themes/${t}/${icon}`;
				img.setAttribute("src", imgSrc);
				img.classList.add("eb-icon");

				o.appendChild(img);
				o.dataset.icon = imgSrc;
			}
			o.appendChild(document.createTextNode(config.name));
			if (t === currentTheme) {
				o.setAttribute("selected", true);
				if (o.dataset.icon)
					themeSelector.style.cssText = `
	background-image:	url("${o.dataset.icon}"), url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICA8cGF0aCBkPSJNOCwxMkwzLDcsNCw2bDQsNCw0LTQsMSwxWiIgZmlsbD0iIzZBNkE2QSIgLz4KPC9zdmc+Cg==) !important;
	background-position:	8px, calc(100% - 4px) center;
	padding-inline-start:	24px;
	background-size:	16px 16px;
`;
			}
			themeSelector.appendChild(o);
		} catch (err) {}
	}

	document.querySelectorAll("select[data-save]").forEach(select => {
		select.addEventListener("change", evt => {
			if (select.selectedIndex >= 0) {
				let selectedOption = select.item(select.selectedIndex);
				let themeDir = select.item(select.selectedIndex).value;
				browser.storage.sync.set({
					theme: themeDir
				});
				if (selectedOption.dataset.icon) {
					select.style.cssText = `
	background-image:	url("${selectedOption.dataset.icon}"), url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICA8cGF0aCBkPSJNOCwxMkwzLDcsNCw2bDQsNCw0LTQsMSwxWiIgZmlsbD0iIzZBNkE2QSIgLz4KPC9zdmc+Cg==) !important;
	background-position:	8px, calc(100% - 4px) center;
	padding-inline-start:	24px;
	background-size:	16px 16px;
`;
				} else {
					select.removeAttribute("style");
				}

				fetch(`/themes/${themeDir}/theme.json`).then(r => r.json()).then(config => {
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
				});
			}
		});
	});
}

async function i18nInit() {
	document.querySelectorAll("label[for]").forEach(translatable => {
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
