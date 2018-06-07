"use strict"; // eslint-disable-line
/* eslint-env node */
/* eslint sort-keys: ["error", "asc"] */

module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"webextensions": true,
	},
	"extends": "eslint:recommended",
	"parserOptions": {
		"ecmaVersion": 9,
		"sourceType": "module",
	},
	"root": true,
	"rules": {
		"block-scoped-var": "error",
		"comma-dangle": [
			"error",
			"always-multiline",
		],
		"consistent-return": "error",
		"consistent-this": "error",
		"dot-location": [
			"error",
			"property",
		],
		"dot-notation": "error",
		"eol-last": "error",
		"eqeqeq": "error",
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1,
				"ignoreComments": true,
			},
		],
		"linebreak-style": [
			"error",
			"unix",
		],
		"no-await-in-loop": "warn",
		"no-console": "off",
		"no-constant-condition": "warn",
		"no-empty": "off",
		"no-fallthrough": "warn",
		"no-new-wrappers": "error",
		"no-octal": "warn",
		"no-regex-spaces": "warn",
		"no-return-await": "error",
		"no-unused-vars": "warn",
		"operator-linebreak": "error",
		"prefer-arrow-callback": "error",
		"prefer-const": "warn",
		"prefer-destructuring": "warn",
		"quotes": [
			"error",
			"double",
			{
				"allowTemplateLiterals": true,
				"avoidEscape": true,
			},
		],
		"require-jsdoc": "off",
		"semi": [
			"error",
			"always",
		],
		"sort-imports": "error",
		"strict": [
			"error",
			"global",
		],
		"valid-jsdoc": [
			"warn",
			{
				"prefer": {
					"arg":	"param",
					"argument":	"param",
					"returns":	"return",
				},
				"preferType": {
					"Boolean":	"boolean",
					"Number":	"number",
					"Object":	"object",
					"String":	"string",
					"function":	"Function",
				},
				"requireParamDescription": false,
				"requireReturn": false,
				"requireReturnDescription": false,
				"requireReturnType": true,
			},
		],
	},
};
