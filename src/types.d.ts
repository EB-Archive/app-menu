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
/// <reference types="@types/firefox-webext-browser"/>

declare interface Message {
	/** The method */
	method:	string;
	/** The payload */
	data?:	any;
}

declare interface ButtonStatus {
	/** Enabled buttons */
	enable: 	string[];
	/** Disabled buttons */
	disable:	string[];
}

declare interface Theme {
	/** The actual theme selected in the options. */
	actualTheme:	string;
	/** The theme directory. */
	themeDir:	string;
	/** The path to the theme’s stylesheet, which may not exist. */
	themeCSS:	string;
	/** The theme’s configuration file. */
	themeJSON?:	ThemeConf;
	/** The parsed browser action icon definition. */
	browser_action?:	string|SizedThemeIcon;
}

declare interface ThemeConf {
	/** The theme’s name */
	name:	string;
	/** The default file extension for images. */
	default_extension:	string;
	/** The browser action icon definition. */
	browser_action:	string|SizedThemeIcon|ThemeIcon[]
}

declare interface ThemeIcon {
	/** The icon’s ID as part of this theme */
	id:	string;
	/** The icon’s display name */
	name?:	string;
	/** The icon definition */
	icon:	string|SizedThemeIcon;
}

declare interface SizedThemeIcon extends Record<number, string> {}
