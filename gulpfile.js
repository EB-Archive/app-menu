/* eslint-env node */
const fse	= require("fs-extra");
const path	= require("path");

const gulp	= require("gulp");
const webExt	= require("web-ext").default;
const mergeStream	= require("merge-stream");

const deleteLines	= require("gulp-delete-lines");
const eslint	= require("gulp-eslint");
const jsonEdit	= require("gulp-json-editor");
const pkgJson	= require("./package.json");

const testPrefs	= require("./.extprefrc.js");
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

/* Building */

const BUILD_DIR 	= "./build/";
const SOURCE_DIR	= "./src/";
const ARCHIVES_DIR	= "./dist/";

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
	const vendorData = {
		hyperhtml: {
			src: "esm",
		},
	};
	/**
	 * @param	{string[]}	vendors	The vendors
	 * @return	{IMergedStream}	The stream
	 */
	const copyVendors = (...vendors) => {
		return mergeStream(vendors.map(vendor => {
			let src = `${VENDOR_SOURCE_DIR}${vendor}/`;
			if (vendor in vendorData) {
				if ("src" in vendorData[vendor]) {
					src += `${vendorData[vendor].src}/`;
				}
			}
			return gulp.src(`${src}**`)
				.pipe(gulp.dest(`${VENDOR_BUILD_DIR}${vendor}/`));
		}));
	};
	const build = () => {
		return mergeStream(
			gulp.src([
				`${SOURCE_DIR}**`,
				`!${SOURCE_DIR}**/*.js`,
				`!${SOURCE_DIR}**/*.d.ts`,
				`!${SOURCE_DIR}manifest.json`,
			], {dot: true})
				.pipe(gulp.dest(BUILD_DIR)),
			gulp.src([`${SOURCE_DIR}**/*.js`])
				.pipe(deleteLines({
					filters: [
						/^import (?:(?:\{[^}]+\} |.* )?from )?"(?:\.\/)?(?:\.\.\/)*types(?:\.d\.ts)?";?(?: *\/\/.*)?$/,
					],
				}))
				.pipe(gulp.dest(BUILD_DIR)),
			gulp.src(`${SOURCE_DIR}manifest.json`)
				.pipe(jsonEdit({
					version: pkgJson.version,
				}))
				.pipe(gulp.dest(BUILD_DIR)),
			copyVendors("hyperhtml"),
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
	gulp.watch([SOURCE_DIR, `${SOURCE_DIR}**`], ["build-unclean"]);
	return webExt.cmd.run({
		pref:	parsePrefs(),
		firefox:	firefox,
		sourceDir:	path.resolve(BUILD_DIR),
		browserConsole: true,
	}, {shouldExitProgram: true});
});
