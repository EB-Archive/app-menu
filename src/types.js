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

/** @typedef	Message
 * @property	{string}	method The method
 * @property	{*}	[data]	The payload
 */
/** @typedef	ButtonStatus
 * @property	{String[]}	enable
 * @property	{String[]}	disable
 */
/** @typedef	ContextualIdentity
 * @property	{string}	cookieStoreId	The cookie store ID for the identity.
 *			Since contextual identities don't share cookie stores,
 *			this serves as a unique identifier.
 * @property	{string}	color	The color for the identity.
 * @property	{string}	icon	The name of an icon for the identity.
 * @property	{string}	name	Name of the identity.
 */
/** @typedef	Theme
 * @property	{string}	actualTheme	The actual theme selected in the options.
 * @property	{string}	themeDir	The theme directory.
 * @property	{string}	themeCSS	The path to the theme’s stylesheet, which may not exist.
 * @property	{ThemeConf}	[themeJSON]	The theme’s configuration file.
 */
/** @typedef	ThemeConf
 * @property	{string}	name	The theme’s name
 * @property	{string}	default_extension	The default file extension for images.
 * @property	{string|ThemeIcon[]|SizedThemeIcon}	browser_action	The path to the browser action icon.
 */
/** @typedef	ThemeIcon
 * @property	{string}	id	The icon’s ID as part of this theme
 * @property	{string|SizedThemeIcon}	icon	The icon definition
 * @property	{string}	[name]	The icon’s display name
 */
/** @typedef	{Object<number,string>}	SizedThemeIcon */
