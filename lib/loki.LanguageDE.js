(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("LanguageDE", [], factory);
	else if(typeof exports === 'object')
		exports["LanguageDE"] = factory();
	else
		root["Loki"] = root["Loki"] || {}, root["Loki"]["LanguageDE"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = generateTrimmer;
/* harmony export (immutable) */ __webpack_exports__["d"] = generateStopWordFilter;
/*
 * From MihaiValentin/lunr-languages.
 * Last update from 04/16/2017 - 19af41fb9bd644d9081ad274f96f700b21464290
 */
function generateTrimmer(wordCharacters) {
	const regex = new RegExp("^[^" + wordCharacters + "]+|[^" + wordCharacters + "]+$", "g");
	return (token) => token.replace(regex, '');
}

function generateStopWordFilter(stopWords) {
	const words = new Set(stopWords);
	return (token) => words.has(token) ? "" : token;
}

class Among {
	constructor(s, substring_i, result, method) {
		this.toCharArray = function (s) {
			let sLength = s.length, charArr = new Array(sLength);
			for (let i = 0; i < sLength; i++)
				charArr[i] = s.charCodeAt(i);
			return charArr;
		};

		if ((!s && s !== "") || (!substring_i && (substring_i !== 0)) || !result)
			throw ("Bad Among initialisation: s:" + s + ", substring_i: "
			+ substring_i + ", result: " + result);
		this.s_size = s.length;
		this.s = this.toCharArray(s);
		this.substring_i = substring_i;
		this.result = result;
		this.method = method;
	}
}
/* harmony export (immutable) */ __webpack_exports__["b"] = Among;


class SnowballProgram {

	constructor() {
		this.current = null;
		this.bra = 0;
		this.ket = 0;
		this.limit = 0;
		this.cursor = 0;
		this.limit_backward = 0;
	}

	setCurrent(word) {
		this.current = word;
		this.cursor = 0;
		this.limit = word.length;
		this.limit_backward = 0;
		this.bra = this.cursor;
		this.ket = this.limit;
	}

	getCurrent() {
		let result = this.current;
		this.current = null;
		return result;
	}

	in_grouping(s, min, max) {
		if (this.cursor < this.limit) {
			let ch = this.current.charCodeAt(this.cursor);
			if (ch <= max && ch >= min) {
				ch -= min;
				if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
					this.cursor++;
					return true;
				}
			}
		}
		return false;
	}

	in_grouping_b(s, min, max) {
		if (this.cursor > this.limit_backward) {
			let ch = this.current.charCodeAt(this.cursor - 1);
			if (ch <= max && ch >= min) {
				ch -= min;
				if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
					this.cursor--;
					return true;
				}
			}
		}
		return false;
	}

	out_grouping(s, min, max) {
		if (this.cursor < this.limit) {
			let ch = this.current.charCodeAt(this.cursor);
			if (ch > max || ch < min) {
				this.cursor++;
				return true;
			}
			ch -= min;
			if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
				this.cursor++;
				return true;
			}
		}
		return false;
	}

	out_grouping_b(s, min, max) {
		if (this.cursor > this.limit_backward) {
			let ch = this.current.charCodeAt(this.cursor - 1);
			if (ch > max || ch < min) {
				this.cursor--;
				return true;
			}
			ch -= min;
			if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
				this.cursor--;
				return true;
			}
		}
		return false;
	}

	eq_s(s_size, s) {
		if (this.limit - this.cursor < s_size)
			return false;
		for (let i = 0; i < s_size; i++)
			if (this.current.charCodeAt(this.cursor + i) !== s.charCodeAt(i))
				return false;
		this.cursor += s_size;
		return true;
	}

	eq_s_b(s_size, s) {
		if (this.cursor - this.limit_backward < s_size)
			return false;
		for (let i = 0; i < s_size; i++)
			if (this.current.charCodeAt(this.cursor - s_size + i) !== s.charCodeAt(i))
				return false;
		this.cursor -= s_size;
		return true;
	}

	find_among(v, v_size) {
		let i = 0, j = v_size, c = this.cursor, l = this.limit, common_i = 0, common_j = 0, first_key_inspected = false;
		while (true) {
			let k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
				? common_i
				: common_j, w = v[k];
			for (let i2 = common; i2 < w.s_size; i2++) {
				if (c + common === l) {
					diff = -1;
					break;
				}
				diff = this.current.charCodeAt(c + common) - w.s[i2];
				if (diff)
					break;
				common++;
			}
			if (diff < 0) {
				j = k;
				common_j = common;
			} else {
				i = k;
				common_i = common;
			}
			if (j - i <= 1) {
				if (i > 0 || j === i || first_key_inspected)
					break;
				first_key_inspected = true;
			}
		}
		while (true) {
			let w = v[i];
			if (common_i >= w.s_size) {
				this.cursor = c + w.s_size;
				if (!w.method)
					return w.result;
				let res = w.method();
				this.cursor = c + w.s_size;
				if (res)
					return w.result;
			}
			i = w.substring_i;
			if (i < 0)
				return 0;
		}
	}

	find_among_b(v, v_size) {
		let i = 0, j = v_size, c = this.cursor, lb = this.limit_backward, common_i = 0, common_j = 0,
			first_key_inspected = false;
		while (true) {
			let k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
				? common_i
				: common_j, w = v[k];
			for (let i2 = w.s_size - 1 - common; i2 >= 0; i2--) {
				if (c - common === lb) {
					diff = -1;
					break;
				}
				diff = this.current.charCodeAt(c - 1 - common) - w.s[i2];
				if (diff)
					break;
				common++;
			}
			if (diff < 0) {
				j = k;
				common_j = common;
			} else {
				i = k;
				common_i = common;
			}
			if (j - i <= 1) {
				if (i > 0 || j === i || first_key_inspected)
					break;
				first_key_inspected = true;
			}
		}
		while (true) {
			let w = v[i];
			if (common_i >= w.s_size) {
				this.cursor = c - w.s_size;
				if (!w.method)
					return w.result;
				let res = w.method();
				this.cursor = c - w.s_size;
				if (res)
					return w.result;
			}
			i = w.substring_i;
			if (i < 0)
				return 0;
		}
	}

	replace_s(c_bra, c_ket, s) {
		let adjustment = s.length - (c_ket - c_bra), left = this.current
			.substring(0, c_bra), right = this.current.substring(c_ket);
		this.current = left + s + right;
		this.limit += adjustment;
		if (this.cursor >= c_ket)
			this.cursor += adjustment;
		else if (this.cursor > c_bra)
			this.cursor = c_bra;
		return adjustment;
	}

	slice_check() {
		if (this.bra < 0 || this.bra > this.ket || this.ket > this.limit
			|| this.limit > this.current.length)
			throw ("faulty slice operation");
	}

	slice_from(s) {
		this.slice_check();
		this.replace_s(this.bra, this.ket, s);
	}

	slice_del() {
		this.slice_from("");
	}

	insert(c_bra, c_ket, s) {
		let adjustment = this.replace_s(c_bra, c_ket, s);
		if (c_bra <= this.bra)
			this.bra += adjustment;
		if (c_bra <= this.ket)
			this.ket += adjustment;
	}

	slice_to() {
		this.slice_check();
		return this.current.substring(this.bra, this.ket);
	}

	eq_v_b(s) {
		return this.eq_s_b(s.length, s);
	}
}
/* harmony export (immutable) */ __webpack_exports__["c"] = SnowballProgram;



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_js__ = __webpack_require__(3);


/**
 * Splits a string at non-alphanumeric characters into lower case tokens.
 * @param {string} str - the string
 * @returns {string[]} - the tokens
 * @private
 */
function defaultSplitter(str) {
	let trimmedTokens = [];
	let tokens = str.split(/[\s\-]+/);
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i] !== '') {
			trimmedTokens.push(tokens[i].toLowerCase());
		}
	}
	return trimmedTokens;
}

/**
 * The tokenizer is used to prepare the string content of a document field for the inverted index.
 * Firstly the string gets split into tokens.
 * After that the tokens will be trimmed/stemmed with defined functions from the queue.
 *
 * * To change the splitter function, use {@link Tokenizer#setSplitter}.
 * * To add functions to the queue, use {@link Tokenizer#add}, {@link Tokenizer#addBefore} and
 *   {@link Tokenizer#addAfter}.
 * * To remove a function from the queue, use {@link Tokenizer#remove}.
 * * To reset the tokenizer, use {@link Tokenizer#reset}.
 */
class Tokenizer {
	/**
	 * Initializes the tokenizer with a splitter, which splits a string at non-alphanumeric characters.
	 * The queue is empty.
	 */
	constructor() {
		this._splitter = null;
		this._queue = [];
		this._symbol = Symbol('label');
		this.reset();
	}

	/**
	 * Sets a function with defined label as the splitter function.
	 * The function must take a string as argument and return an array of tokens.
	 *
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	setSplitter(label, func) {
		label = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](label);
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isFunction */](func)) {
			throw TypeError("Splitter must be a function.");
		}
		if (label === "") {
			throw Error("Label cannot be empty.");
		}
		func[this._symbol] = label;
		this._splitter = func;
	}

	/**
	 * Gets the splitter.
	 * @return {Array.<string, function>} - tuple with label and function
	 */
	getSplitter() {
		return [this._splitter[this._symbol], this._splitter];
	}

	/**
	 * Resets the splitter to default.
	 */
	resetSplitter() {
		this._splitter = defaultSplitter;
	}

	/**
	 * Checks if a function is inside the queue.
	 * @param {string|function} labelFunc - an existing label or function
	 * @returns {boolean} true if exists, otherwise false
	 */
	has(labelFunc) {
		return this._getPosition(labelFunc) !== -1;
	}

	/**
	 * Gets a function from the queue.
	 * Only the first found function gets returned if a label or a function is multiple used.
	 *
	 * @param {string|function} labelFunc - an existing label or function
	 * @return {Array.<string, function>} - tuple with label and function
	 */
	get(labelFunc) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		return [this._queue[pos][this._symbol], this._queue[pos]];
	}

	/**
	 * Adds a function with defined label to the end of the queue.
	 * The function must take a token string as argument and return a token.
	 *
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	add(label, func) {
		this._addFunction(label, func, this._queue.length);
	}

	/**
	 * Adds a function with defined label before an existing function to the queue.
	 * The function must take a token string as argument and return a token.
	 *
	 * @param {string|function} labelFunc - an existing label or function
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	addBefore(labelFunc, label, func) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		this._addFunction(label, func, pos);
	}

	/**
	 * Adds a function with defined label after an existing function to the queue.
	 * The function must take a token string as argument and return a token.
	 *
	 * @param {string|function} labelFunc - an existing label or function
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	addAfter(labelFunc, label, func) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		this._addFunction(label, func, pos + 1);
	}

	/**
	 * Removes a function from the queue.
	 * @param {string|function} labelFunc - an existing label or function
	 */
	remove(labelFunc) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		this._queue.splice(pos, 1);
	}

	/**
	 * Resets the splitter and tokenize queue to default.
	 */
	reset() {
		this._splitter = defaultSplitter;
		this._queue = [];
	}

	/**
	 * Tokenizes a string into tokens.
	 * @param {string} str - the string
	 * @return {string[]} the tokens
	 * @protected
	 */
	tokenize(str) {
		let tokens = this._splitter(str);
		for (let i = 0; i < this._queue.length; i++) {
			let newTokens = [];
			for (let j = 0; j < tokens.length; j++) {
				let token = this._queue[i](tokens[j]);
				if (token) {
					newTokens.push(token);
				}
			}
			tokens = newTokens;
		}
		return tokens;
	}

	/**
	 * Serializes the tokenizer by returning the labels of the used functions.
	 * @returns {{splitter: string?, tokenizers: string[]}} - the serialization
	 * @protected
	 */
	toJSON() {
		let serialized = {tokenizers: []};
		if (this._splitter !== defaultSplitter) {
			serialized.splitter = this._splitter[this._symbol];
		}
		for (let i = 0; i < this._queue.length; i++) {
			serialized.tokenizers.push(this._queue[i][this._symbol]);
		}
		return serialized;
	}

	/**
	 * Deserializes the tokenizer by reassign the correct function to each label.
	 * @param {{splitter: string, tokenizers: string[]}} serialized - the serialized labels
	 * @param {Object.<string, function>|Tokenizer} funcTok - the depending functions with labels
	 * 	or an equivalent tokenizer
	 */
	static fromJSON(serialized, funcTok) {
		let tokenizer = new Tokenizer();

		if (funcTok !== undefined && funcTok instanceof Tokenizer) {
			if (serialized.hasOwnProperty("splitter")) {
				let splitter = funcTok.getSplitter();
				if (serialized.splitter !== splitter[0]) {
					throw Error("Splitter function not found.");
				}
				tokenizer.setSplitter(splitter[0], splitter[1]);
			}

			for (let i = 0; i < serialized.tokenizers.length; i++) {
				if (!funcTok.has(serialized.tokenizers[i])) {
					throw Error("Tokenizer function not found.");
				}
				let labelFunc = funcTok.get(serialized.tokenizers[i]);
				tokenizer.add(labelFunc[0], labelFunc[1]);
			}
		} else {
			if (serialized.hasOwnProperty("splitter")) {
				if (!funcTok.splitters.hasOwnProperty(serialized.splitter)) {
					throw Error("Splitter function not found.");
				}
				tokenizer.setSplitter(serialized.splitter, funcTok.splitters[serialized.splitter]);
			}
			for (let i = 0; i < serialized.tokenizers.length; i++) {
				if (!funcTok.tokenizers.hasOwnProperty(serialized.tokenizers[i])) {
					throw Error("Tokenizer function not found.");
				}
				tokenizer.add(serialized.tokenizers[i], funcTok.tokenizers[serialized.tokenizers[i]]);
			}
		}
		return tokenizer;
	}

	/**
	 * Returns the position of a function inside the queue.
	 * @param {string|function} labelFunc - an existing label or function
	 * @return {number} the position
	 * @private
	 */
	_getPosition(labelFunc) {
		if (__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isFunction */](labelFunc)) {
			return this._queue.indexOf(labelFunc);
		} else if (__WEBPACK_IMPORTED_MODULE_0__utils_js__["c" /* isConvertibleToString */](labelFunc)) {
			labelFunc = String(labelFunc);
			for (let i = 0; i < this._queue.length; i++) {
				if (this._queue[i][this._symbol] === labelFunc) {
					return i;
				}
			}
		} else {
			throw TypeError("Type of labelFunc must be string or function.");
		}
		return -1;
	}

	/**
	 * Adds a function with defined label at a specific position to the queue.
	 * @param {string} label - the label
	 * @param {function} func - the function
	 * @param {number} pos - the position
	 * @private
	 */
	_addFunction(label, func, pos) {
		label = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](label);
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isFunction */](func)) {
			throw TypeError("Type of func must be function.");
		}
		if (label === "") {
			throw Error("Label cannot be empty.");
		}
		func[this._symbol] = label;
		this._queue.splice(pos, 0, func);
	}
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Tokenizer;



/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__support_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__tokenizer__ = __webpack_require__(1);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DE", function() { return tkz; });
/*
 * From MihaiValentin/lunr-languages.
 * Last update from 04/16/2017 - 19af41fb9bd644d9081ad274f96f700b21464290
 */



let wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
let trimmer = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__support_js__["a" /* generateTrimmer */])(wordCharacters);

let tkz = new __WEBPACK_IMPORTED_MODULE_1__tokenizer__["a" /* Tokenizer */]();

tkz.add('trimmer-de', trimmer);

let stemmer = (function () {
	/* create the wrapped stemmer object */
	let st = new function GermanStemmer() {
		let a_0 = [new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("", -1, 6), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("U", 0, 2),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("Y", 0, 1), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("\u00E4", 0, 3),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("\u00F6", 0, 4), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("\u00FC", 0, 5)
			],
			a_1 = [
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("e", -1, 2), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("em", -1, 1),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("en", -1, 2), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("ern", -1, 1),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("er", -1, 1), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("s", -1, 3),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("es", 5, 2)
			],
			a_2 = [new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("en", -1, 1),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("er", -1, 1), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("st", -1, 2),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("est", 2, 1)
			],
			a_3 = [new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("ig", -1, 1),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("lich", -1, 1)
			],
			a_4 = [new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("end", -1, 1),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("ig", -1, 2), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("ung", -1, 1),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("lich", -1, 3), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("isch", -1, 2),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("ik", -1, 2), new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("heit", -1, 3),
				new __WEBPACK_IMPORTED_MODULE_0__support_js__["b" /* Among */]("keit", -1, 4)
			],
			g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 8, 0, 32, 8
			],
			g_s_ending = [117, 30, 5],
			g_st_ending = [
				117, 30, 4
			],
			I_x, I_p2, I_p1, sbp = new __WEBPACK_IMPORTED_MODULE_0__support_js__["c" /* SnowballProgram */]();
		this.setCurrent = function (word) {
			sbp.setCurrent(word);
		};
		this.getCurrent = function () {
			return sbp.getCurrent();
		};

		function habr1(c1, c2, v_1) {
			if (sbp.eq_s(1, c1)) {
				sbp.ket = sbp.cursor;
				if (sbp.in_grouping(g_v, 97, 252)) {
					sbp.slice_from(c2);
					sbp.cursor = v_1;
					return true;
				}
			}
			return false;
		}

		function r_prelude() {
			let v_1 = sbp.cursor,
				v_2, v_3, v_4, v_5;
			while (true) {
				v_2 = sbp.cursor;
				sbp.bra = v_2;
				if (sbp.eq_s(1, "\u00DF")) {
					sbp.ket = sbp.cursor;
					sbp.slice_from("ss");
				} else {
					if (v_2 >= sbp.limit)
						break;
					sbp.cursor = v_2 + 1;
				}
			}
			sbp.cursor = v_1;
			while (true) {
				v_3 = sbp.cursor;
				while (true) {
					v_4 = sbp.cursor;
					if (sbp.in_grouping(g_v, 97, 252)) {
						v_5 = sbp.cursor;
						sbp.bra = v_5;
						if (habr1("u", "U", v_4))
							break;
						sbp.cursor = v_5;
						if (habr1("y", "Y", v_4))
							break;
					}
					if (v_4 >= sbp.limit) {
						sbp.cursor = v_3;
						return;
					}
					sbp.cursor = v_4 + 1;
				}
			}
		}

		function habr2() {
			while (!sbp.in_grouping(g_v, 97, 252)) {
				if (sbp.cursor >= sbp.limit)
					return true;
				sbp.cursor++;
			}
			while (!sbp.out_grouping(g_v, 97, 252)) {
				if (sbp.cursor >= sbp.limit)
					return true;
				sbp.cursor++;
			}
			return false;
		}

		function r_mark_regions() {
			I_p1 = sbp.limit;
			I_p2 = I_p1;
			let c = sbp.cursor + 3;
			if (0 <= c && c <= sbp.limit) {
				I_x = c;
				if (!habr2()) {
					I_p1 = sbp.cursor;
					if (I_p1 < I_x)
						I_p1 = I_x;
					if (!habr2())
						I_p2 = sbp.cursor;
				}
			}
		}

		function r_postlude() {
			let among_var, v_1;
			while (true) {
				v_1 = sbp.cursor;
				sbp.bra = v_1;
				among_var = sbp.find_among(a_0, 6);
				if (!among_var)
					return;
				sbp.ket = sbp.cursor;
				switch (among_var) {
					case 1:
						sbp.slice_from("y");
						break;
					case 2:
					case 5:
						sbp.slice_from("u");
						break;
					case 3:
						sbp.slice_from("a");
						break;
					case 4:
						sbp.slice_from("o");
						break;
					case 6:
						if (sbp.cursor >= sbp.limit)
							return;
						sbp.cursor++;
						break;
				}
			}
		}

		function r_R1() {
			return I_p1 <= sbp.cursor;
		}

		function r_R2() {
			return I_p2 <= sbp.cursor;
		}

		function r_standard_suffix() {
			let among_var, v_1 = sbp.limit - sbp.cursor,
				v_2, v_3, v_4;
			sbp.ket = sbp.cursor;
			among_var = sbp.find_among_b(a_1, 7);
			if (among_var) {
				sbp.bra = sbp.cursor;
				if (r_R1()) {
					switch (among_var) {
						case 1:
							sbp.slice_del();
							break;
						case 2:
							sbp.slice_del();
							sbp.ket = sbp.cursor;
							if (sbp.eq_s_b(1, "s")) {
								sbp.bra = sbp.cursor;
								if (sbp.eq_s_b(3, "nis"))
									sbp.slice_del();
							}
							break;
						case 3:
							if (sbp.in_grouping_b(g_s_ending, 98, 116))
								sbp.slice_del();
							break;
					}
				}
			}
			sbp.cursor = sbp.limit - v_1;
			sbp.ket = sbp.cursor;
			among_var = sbp.find_among_b(a_2, 4);
			if (among_var) {
				sbp.bra = sbp.cursor;
				if (r_R1()) {
					switch (among_var) {
						case 1:
							sbp.slice_del();
							break;
						case 2:
							if (sbp.in_grouping_b(g_st_ending, 98, 116)) {
								let c = sbp.cursor - 3;
								if (sbp.limit_backward <= c && c <= sbp.limit) {
									sbp.cursor = c;
									sbp.slice_del();
								}
							}
							break;
					}
				}
			}
			sbp.cursor = sbp.limit - v_1;
			sbp.ket = sbp.cursor;
			among_var = sbp.find_among_b(a_4, 8);
			if (among_var) {
				sbp.bra = sbp.cursor;
				if (r_R2()) {
					switch (among_var) {
						case 1:
							sbp.slice_del();
							sbp.ket = sbp.cursor;
							if (sbp.eq_s_b(2, "ig")) {
								sbp.bra = sbp.cursor;
								v_2 = sbp.limit - sbp.cursor;
								if (!sbp.eq_s_b(1, "e")) {
									sbp.cursor = sbp.limit - v_2;
									if (r_R2())
										sbp.slice_del();
								}
							}
							break;
						case 2:
							v_3 = sbp.limit - sbp.cursor;
							if (!sbp.eq_s_b(1, "e")) {
								sbp.cursor = sbp.limit - v_3;
								sbp.slice_del();
							}
							break;
						case 3:
							sbp.slice_del();
							sbp.ket = sbp.cursor;
							v_4 = sbp.limit - sbp.cursor;
							if (!sbp.eq_s_b(2, "er")) {
								sbp.cursor = sbp.limit - v_4;
								if (!sbp.eq_s_b(2, "en"))
									break;
							}
							sbp.bra = sbp.cursor;
							if (r_R1())
								sbp.slice_del();
							break;
						case 4:
							sbp.slice_del();
							sbp.ket = sbp.cursor;
							among_var = sbp.find_among_b(a_3, 2);
							if (among_var) {
								sbp.bra = sbp.cursor;
								if (r_R2() && among_var === 1)
									sbp.slice_del();
							}
							break;
					}
				}
			}
		}

		this.stem = function () {
			let v_1 = sbp.cursor;
			r_prelude();
			sbp.cursor = v_1;
			r_mark_regions();
			sbp.limit_backward = v_1;
			sbp.cursor = sbp.limit;
			r_standard_suffix();
			sbp.cursor = sbp.limit_backward;
			r_postlude();
			return true;
		}
	};

	/* and return a function that stems a word for the current locale */
	return function (token) {
		st.setCurrent(token);
		st.stem();return st.getCurrent();
	}
})();

tkz.add('stemmer-de', stemmer);

let stopWordFilter = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__support_js__["d" /* generateStopWordFilter */])(["aber", "alle", "allem", "allen", "aller", "alles", "als", "also", "am", "an", "ander", "andere", "anderem", "anderen", "anderer", "anderes", "anderm", "andern", "anderr", "anders", "auch", "auf", "aus", "bei", "bin", "bis", "bist", "da", "damit", "dann", "das", "dasselbe", "dazu", "daß", "dein", "deine", "deinem", "deinen", "deiner", "deines", "dem", "demselben", "den", "denn", "denselben", "der", "derer", "derselbe", "derselben", "des", "desselben", "dessen", "dich", "die", "dies", "diese", "dieselbe", "dieselben", "diesem", "diesen", "dieser", "dieses", "dir", "doch", "dort", "du", "durch", "ein", "eine", "einem", "einen", "einer", "eines", "einig", "einige", "einigem", "einigen", "einiger", "einiges", "einmal", "er", "es", "etwas", "euch", "euer", "eure", "eurem", "euren", "eurer", "eures", "für", "gegen", "gewesen", "hab", "habe", "haben", "hat", "hatte", "hatten", "hier", "hin", "hinter", "ich", "ihm", "ihn", "ihnen", "ihr", "ihre", "ihrem", "ihren", "ihrer", "ihres", "im", "in", "indem", "ins", "ist", "jede", "jedem", "jeden", "jeder", "jedes", "jene", "jenem", "jenen", "jener", "jenes", "jetzt", "kann", "kein", "keine", "keinem", "keinen", "keiner", "keines", "können", "könnte", "machen", "man", "manche", "manchem", "manchen", "mancher", "manches", "mein", "meine", "meinem", "meinen", "meiner", "meines", "mich", "mir", "mit", "muss", "musste", "nach", "nicht", "nichts", "noch", "nun", "nur", "ob", "oder", "ohne", "sehr", "sein", "seine", "seinem", "seinen", "seiner", "seines", "selbst", "sich", "sie", "sind", "so", "solche", "solchem", "solchen", "solcher", "solches", "soll", "sollte", "sondern", "sonst", "um", "und", "uns", "unse", "unsem", "unsen", "unser", "unses", "unter", "viel", "vom", "von", "vor", "war", "waren", "warst", "was", "weg", "weil", "weiter", "welche", "welchem", "welchen", "welcher", "welches", "wenn", "werde", "werden", "wie", "wieder", "will", "wir", "wird", "wirst", "wo", "wollen", "wollte", "während", "würde", "würden", "zu", "zum", "zur", "zwar", "zwischen", "über"]);
tkz.add('stopWordFilter-de', stopWordFilter);




/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["b"] = isFunction;
/* unused harmony export isObject */
/* unused harmony export isNumber */
/* unused harmony export isBoolean */
/* unused harmony export isString */
/* harmony export (immutable) */ __webpack_exports__["c"] = isConvertibleToString;
/* unused harmony export asBoolean */
/* harmony export (immutable) */ __webpack_exports__["a"] = asString;
/* unused harmony export asArrayOfString */
/**
 * Checks if the variable is a function.
 * @param {*} x - the variable
 * @return {boolean} true if function, otherwise false
 * @protected
 */
function isFunction(x) {
	return Object.prototype.toString.call(x) === "[object Function]";
}

/**
 * Checks if the variable is an object.
 * @param {*} x - the variable
 * @return {boolean} true if object, otherwise false
 * @protected
 */
function isObject(x) {
	return Object.prototype.toString.call(x) === "[object Object]";
}

/**
 * Checks if the variable is a number.
 * @param {*} x - the variable
 * @return {boolean} true if number, otherwise false
 * @protected
 */
function isNumber(x) {
	return Object.prototype.toString.call(x) === "[object Number]";
}

/**
 * Checks if the variable is a boolean.
 * @param {*} x - the variable
 * @return {boolean} true if boolean, otherwise false
 * @protected
 */
function isBoolean(x) {
	return Object.prototype.toString.call(x) === "[object Boolean]";
}

/**
 * Checks if the variable is a string.
 * @param {*} x - the variable
 * @return {boolean} true if string, otherwise false
 * @protected
 */
function isString(x) {
	return Object.prototype.toString.call(x) === "[object String]";
}

/**
 * Checks if the variable is convertible to a string.
 * @param {*} x - the variable
 * @return {boolean} true if convertible, otherwise false
 */
function isConvertibleToString(x) {
	return isString(x) || isNumber(x) || isObject(x) && Object.prototype.toString !== x.toString && isString(x.toString());
}

/**
 * Converts a variable to a boolean (from boolean or number).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {error} [error=TypeError] - the error to throw
 * @return {boolean} the converted boolean
 * @protected
 */
function asBoolean(x, error = TypeError("Value is not convertible to boolean")) {
	if (isBoolean(x) || isNumber(x)) {
		return Boolean(x);
	}
	throw error;
}

/**
 * Converts a variable to a string (from string, number or obj.toString).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {error} [error=TypeError] - the error to throw
 * @return {string} the converted string
 * @protected
 */
function asString(x, error = TypeError("Value is not convertible to string.")) {
	if (isConvertibleToString(x)) {
		return String(x);
	}
	throw error;
}

/**
 * Converts a variable to a array of string (from an array of string, number or obj.toString).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {error} [error=TypeError] - the error to throw
 * @return {string[]} the converted array of string
 * @protected
 */
function asArrayOfString(x, error = TypeError("Value is not convertible to an array of strings.")) {
	if (!Array.isArray(x)) {
		throw error;
	}
	let array = [];
	for (let i = 0; i < x.length; i++) {
		if (!isConvertibleToString(x[i])) {
			throw error;
		}
		array.push(String(x[i]));
	}
	return array;
}


/***/ })
/******/ ]);
});
//# sourceMappingURL=loki.LanguageDE.js.map