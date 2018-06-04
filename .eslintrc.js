"use strict";
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
		"no-empty": "off",
		"no-octal": "warn",
		"no-unused-vars": "warn",
		"operator-linebreak": [
			"error",
			"after",
		],
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
