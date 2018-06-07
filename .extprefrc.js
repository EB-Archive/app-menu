"use strict"; // eslint-disable-line
/* eslint-env node */
/* eslint sort-keys: ["error", "asc"] */

module.exports = {
	firefox_prefs: {
		"browser.link.open_newwindow": 3,
		"browser.search.defaultenginename": "DuckDuckGo",
		"browser.search.order.1": "DuckDuckGo",
		"browser.search.suggest.enabled": false,
		"browser.search.update": false,

		"font.name-list.monospace.x-unicode":	"Input Mono, Consolas, Courier New",
		"font.name-list.monospace.x-western":	"Input Mono, Consolas, Courier New",
		"font.size.fixed.x-unicode":	16,
		"font.size.fixed.x-western":	16,
		"general.warnOnAboutConfig": false,

		// This is required because some of the icons use `context-fill`
		// and `context-fill-opacity` to have the same colour as Firefox UI.
		"svg.context-properties.content.enabled": true,
	},
};
