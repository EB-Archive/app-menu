/* eslint-env node */
const {
	transformPackage,
} = require("../gulpfile.js");

// TODO: use an actual JavaScript test suite for this.

console.log(transformPackage.internal("hyperhtml/esm"));
console.log(transformPackage.internal("sequency"));

console.log("\"hyperhtml/esm\"	=>", `"${transformPackage("hyperhtml/esm")}"`);
console.log("\"sequency\"	=>",  	`"${transformPackage("sequency")}"`);

const source = `
/*
 * Stuff
 */
import * as Sequency from "sequency"; // comment
import hyperHTML from "hyperhtml/esm";

Sequency.asSequence([1, 2]).map(i => hyperHTML\`<li>\${i}</li>\`);
`;
const expected = `
/*
 * Stuff
 */
import * as Sequency from "/vendor/sequency/sequency.js"; // comment
import hyperHTML from "/vendor/hyperhtml/index.js";

Sequency.asSequence([1, 2]).map(i => hyperHTML\`<li>\${i}</li>\`);
`;
/**
 * @param	{string}	source	The source.
 * @return	{string}	The result.
 */
const process = (source) => {
	return transformPackage.regexp[Symbol.replace](source, transformPackage.callback);
};

const result = process(source);

console.log("Passing:",	result === expected);
console.log("Result:	\n-------	",result);
console.log("Expected:	\n---------	",expected);
