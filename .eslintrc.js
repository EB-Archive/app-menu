"use strict";
/* eslint comma-dangle: ["error", "always"] */
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
			{
				"functions": "never",
			},
		],
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1,
			},
		],
		"linebreak-style": [
			"error",
			"unix",
		],
		"no-console": "off",
		"no-empty": "off",
		"no-octal": "warn",
		"no-unused-vars": "warn",
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
		"semi": [
			"error",
			"always",
		],
	},
};
