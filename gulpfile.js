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
"use strict"; // eslint-disable-line
/* eslint-env node */
const fse	= require("fs-extra");
const path	= require("path");

const gulp	= require("gulp");
const mergeStream	= require("merge-stream");
const {default: webExt}	= require("web-ext");

const eslint	= require("gulp-eslint");
const jsonEdit	= require("gulp-json-editor");
const pkgJson	= require("./package.json");
const replace	= require("gulp-replace");

const args = require("yargs")
	.option("firefox", {
		alias: "f",
		description: "The path to the Firefox executable",
		requiresArg: true,
		type: "string",
	})
	.alias("help", ["h", "?"])
	.alias("version", "v")
	.argv;
const testPrefs	= require("./.extprefrc.js");

/* Building */

const ARCHIVES_DIR	= "./dist/";
const BUILD_DIR 	= "./build/";
const SOURCE_DIR	= "./src/";

const VENDOR_BUILD_DIR 	= `${BUILD_DIR}vendor/`;
const VENDOR_SOURCE_DIR	= "./node_modules/";

gulp.task("clean", () => {
	try {
		fse.emptyDirSync(BUILD_DIR);
	} catch (e) {
		console.error(e);
	}
});

{
	/** @typedef	{object}	Vendor
	 * @property	{string}	[src]
	 * @property	{string}	[file]
	 */
	/** @type {{[name: string]: Vendor}} */
	const vendorData = {
		hyperhtml: {
			file: "esm.js",
			srcFiles:	[
				"esm.js",
				"index.d.ts",
			],
		},
	};

	/**
	 * @param {string} name
	 * @return {{dest:string,file:string,src:string}}
	 */
	const transformPackageInternal = (name) => {
		const	path	= name.split("/");
		const	isFile	= path[path.length-1].indexOf(".") >= 0;
		const	vendor	= path[0].toLowerCase();

		let src 	= `${VENDOR_SOURCE_DIR}${vendor}/`;
		let dest	= name;
		let file	= "index.js";
		if (typeof vendorData[vendor] === "object") {
			const data = vendorData[vendor];
			if ("src" in data) {
				[dest] = path;
				src += `${data.src}/`;
			}
			if ("srcFiles" in data) {
				[dest] = path;
				src = data.srcFiles.map(v =>`${src}${v}`);
			} else {
				src += "**";
			}
			if ("file" in data) {
				({file} = data);
			}
		}
		return {
			dest:	`${VENDOR_BUILD_DIR}${path[0]}/`,
			file:	isFile ? dest : `/vendor/${dest}/${file}`,
			src:	src,
		};
	};

	/**
	 * @param	{string}	name	The package name.
	 * @return	{string}	The transformed path as a JS file.
	 */
	const transformPackage = (name) => {
		name = name.replace(/\\/g,"/");
		// Test if the path is a relative or absolute URI module specifier
		if (name.startsWith(".") || name.startsWith("/") ||
			/^[a-zA-Z0-9.+-]:/.test(name)) {
			return name;
		}
		const {file} = transformPackageInternal(name);
		return file;
	};

	const transformPackageRegexp = /^(import[ \t]+(?:(?:\{[^}]+\} |.*[ \t]+)?from[ \t]+)?")((?:[^./"][^"]*)?)(";?(?:[ \t]*\/\/.*)?)$/mg;
	/**
	 * @param	{string}	match	The matched substring
	 * @param	{string}	prefix	The import statement (eg. `import {…} from "`)
	 * @param	{string}	name	The name of the package
	 * @param	{string}	suffix	The end of the import statement (eg. `";` and optionally a comment)
	 * @return	{string}
	 */
	const transformPackageCallback = (match, prefix, name, suffix) =>
		`${prefix}${transformPackage(name)}${suffix}`;
	module.exports.transformPackage = Object.assign((name) => transformPackage(name), {
		internal: transformPackageInternal,
		regexp: transformPackageRegexp,
		callback: transformPackageCallback,
	});

	const VENDOR_HEADER = "| Folder\t| Version\t| License\t| NPM ID\t|\n| ------\t| -------\t| -------\t| ------\t|";

	const vendorToLine = (vendor) => {
		try {
			const pkg = require(`${vendor}/package.json`);
			return `\n| ${vendor}\t| ${pkg.version}\t| ${pkg.license}\t| [\`${pkg.name}\`](https://https://www.npmjs.com/package/${pkg.name})\t|`;
		} catch (_) {
			return "";
		}
	};

	/**
	 * @param	{string[]}	vendors	The vendors
	 * @return	{IMergedStream}	The stream
	 */
	const copyVendors = (...vendors) => {
		return mergeStream([
			...(vendors.map(vendor => {
				const {dest, src} = transformPackageInternal(vendor);
				return gulp.src(src)
					.pipe(gulp.dest(dest));
			})),
			gulp.src([
				`${SOURCE_DIR}vendor/README.md`,
			], {dot: true})
				.pipe(replace(
					/^{#vendorfiles}$/mg,
					() => {
						return VENDOR_HEADER + vendors.map(vendorToLine).join("");
					}
				))
				.pipe(gulp.dest(`${BUILD_DIR}vendor`)),
		]);
	};
	const build = () => {
		return mergeStream(
			gulp.src([
				`${SOURCE_DIR}**`,
				`!${SOURCE_DIR}**/*.js`,
				`!${SOURCE_DIR}manifest.json`,
				`!${SOURCE_DIR}vendor/README.md`,
			], {dot: true})
				.pipe(gulp.dest(BUILD_DIR)),
			gulp.src([`${SOURCE_DIR}**/*.js`])
				.pipe(replace(
					transformPackageRegexp,
					transformPackageCallback,
				))
				.pipe(gulp.dest(BUILD_DIR)),
			gulp.src(`${SOURCE_DIR}manifest.json`)
				.pipe(jsonEdit({
					version: pkgJson.version,
				}))
				.pipe(gulp.dest(BUILD_DIR)),
			copyVendors(
				"hyperhtml",
			),
		);
	};
	gulp.task("build-unclean", build);
	gulp.task("build", ["clean"], build);
}

gulp.task("lint", ["build"], () => {
	webExt.cmd.lint({
		sourceDir:	BUILD_DIR,
		ignoreFiles: [
			"vendor/*",
		],
	}, {shouldExitProgram: false});
	return gulp.src([
		"*.js",
		".*.js",
		`${BUILD_DIR}**/*.js`,
		`!${BUILD_DIR}vendor/*`,
	])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task("dist", ["build"], () => {
	webExt.cmd.build({
		sourceDir:	BUILD_DIR,
		artifactsDir:	ARCHIVES_DIR,
		overwriteDest:	true,
	}, {shouldExitProgram: false});
});

const parsePrefs = () => {
	const webExtPrefs = {};
	if (testPrefs && testPrefs.firefox_prefs) {
		for (const pref in testPrefs.firefox_prefs) {
			webExtPrefs[pref] = testPrefs.firefox_prefs[pref];
		}
	}
	return webExtPrefs;
};

gulp.task("run", ["build"], () => {
	let firefox = args.firefox || process.env.WEB_EXT_FIREFOX;
	if (typeof firefox === "undefined" || firefox === "aurora") {
		firefox = "firefoxdeveloperedition";
	}
	const watcher = gulp.watch([SOURCE_DIR, `${SOURCE_DIR}**`], ["build-unclean"]);
	return webExt.cmd.run({
		pref:	parsePrefs(),
		firefox:	firefox,
		sourceDir:	path.resolve(BUILD_DIR),
		browserConsole: true,
	}, {shouldExitProgram: true}).then(({extensionRunners: [extRunner]}) => {
		extRunner.registerCleanup(() => watcher.end());
	});
});
