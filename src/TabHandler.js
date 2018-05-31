/*
 * Copyright (C) 2018 ExE Boss
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

export default class TabHandler {
	constructor() {
		/** @type Map<number, Set<Function>> */
		this.listeners = new Map();
		this.isRegistered = false;

		/**
		 * @param {number} tabId The tab ID
		 * @param {*} changeInfo The change
		 * @param {*} tab The tab data
		 * @returns {undefined}
		 */
		this.tabListener = (tabId, changeInfo, tab) => {
			if (this.listeners.has(tabId)) {
				this.listeners.get(tabId).forEach(cb => cb(tabId, changeInfo, tab));
			}
		};
	}

	removeListener(tabId, callback) {
		if (this.listeners.has(tabId)) {
			/** @type Set<Function> */
			const callbacks = this.listeners.get(tabId);
			callbacks.remove(callback);
			if (callbacks.size === 0) {
				this.listeners.remove(tabId);
			}
		}
		if (this.listeners.size === 0 && this.isRegistered) {
			browser.tabs.onUpdated.removeListener(this.tabListener);
			this.isRegistered = false;
		}
	}

	addListener(tabId, callback, options = {}) {
		if (!this.isRegistered) {
			browser.tabs.onUpdated.addListener(this.tabListener);
			this.isRegistered = true;
		}

		if (options.removeOnComplete) {
			const origCB = callback;
			const newCallback = (tabId, changeInfo, tab) => {
				origCB(tabId, changeInfo, tab);
				if (changeInfo.status === "complete") {
					this.removeListener(tabId, newCallback);
				}
			};
			callback = newCallback;
		}

		if (this.listeners.has(tabId)) {
			this.listeners.get(tabId).add(callback);
		} else {
			const set = new Set();
			set.add(callback);
			this.listeners.set(tabId, set);
		}
	}

	hasListener(tabId, callback) {
		return this.listeners.has(tabId) &&
			this.listeners.get(tabId).has(callback);
	}

	hasListeners(tabId) {
		return this.listeners.has(tabId);
	}
}
