(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("FullTextSearch", [], factory);
	else if(typeof exports === 'object')
		exports["FullTextSearch"] = factory();
	else
		root["Loki"] = root["Loki"] || {}, root["Loki"]["FullTextSearch"] = factory();
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
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_js__ = __webpack_require__(1);


/**
 * Splits a string at non-alphanumeric characters into lower case tokens.
 * @param {string} str - the string
 * @returns {string[]} - the tokens
 * @private
 */
function defaultSplitter(str) {
	let trimmedTokens = [];
	let tokens = str.split(/[^\w]/);
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
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* isFunction */](func)) {
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
	 * The function must take an array of tokens as argument and return an array of tokens.
	 *
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	add(label, func) {
		this._addFunction(label, func, this._queue.length);
	}

	/**
	 * Adds a function with defined label before an existing function to the queue.
	 * The function must take an array of tokens as argument and return an array of tokens.
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
	 * The function must take an array of tokens as argument and return an array of tokens.
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
			tokens = this._queue[i](tokens);
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
		if (__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* isFunction */](labelFunc)) {
			return this._queue.indexOf(labelFunc);
		} else if (__WEBPACK_IMPORTED_MODULE_0__utils_js__["f" /* isConvertibleToString */](labelFunc)) {
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
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["e" /* isFunction */](func)) {
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
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["e"] = isFunction;
/* unused harmony export isObject */
/* harmony export (immutable) */ __webpack_exports__["b"] = isNumber;
/* unused harmony export isBoolean */
/* unused harmony export isString */
/* harmony export (immutable) */ __webpack_exports__["f"] = isConvertibleToString;
/* harmony export (immutable) */ __webpack_exports__["d"] = asBoolean;
/* harmony export (immutable) */ __webpack_exports__["a"] = asString;
/* harmony export (immutable) */ __webpack_exports__["c"] = asArrayOfString;
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


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_js__ = __webpack_require__(1);
/**
 * Query builder
 * todo: Document scoring.
 * todo: Align description.
 */


/**
 * The base query class to enable boost to a query type.
 *
 * @param {string} type - the type name of the query
 */
class BaseQuery {
	constructor(type, data = {}) {
		this._data = data;
		this._data.type = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](type);
	}

	/**
	 * Boosts the query result.
	 *
	 * See also [Lucene#BoostQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/BoostQuery.html}
	 * and [Elasticsearch#boost]{@link https://www.elastic.co/guide/en/elasticsearch/reference/5.2/mapping-boost.html}.
	 *
	 * @param {number} value - the positive boost
	 * @return {BaseQuery} object itself for cascading
	 */
	boost(value) {
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](value) || value < 0) {
			throw TypeError("Boost must be a positive number.");
		}
		this._data.boost = value;
		return this;
	}

	/**
	 * Build the final query.
	 * @return {Object} - the final query
	 */
	build() {
		return this._data;
	}
}
/* unused harmony export BaseQuery */


/**
 * A query which finds documents where a document field contains a term.
 *
 * See also [Lucene#TermQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/TermQuery.html}
 * and [Elasticsearch#TermQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-term-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .term("name", "infinity"])
 * .build();
 * // The resulting documents:
 * // contains the term infinity
 *
 * @param {string} field - the field name of the document
 * @param {string} term - the term
 * @extends BaseQuery
 */
class TermQuery extends BaseQuery {
	constructor(field, term, data = {}) {
		super("term", data);
		this._data.field = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](field);
		this._data.value = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](term);
	}
}
/* unused harmony export TermQuery */


/**
 * A query which finds documents where a document field contains any of the terms.
 *
 * See also [Lucene#TermRangeQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/TermRangeQuery.html}
 * and [Elasticsearch#TermsQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-terms-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .terms("quotes", ["infinity", "atom", "energy"])
 * .build();
 * // The resulting documents:
 * // contains the terms infinity, atom or energy
 *
 * @param {string} field - the field name of the document
 * @param {string[]} terms - the terms
 * @extends BaseQuery
 */
class TermsQuery extends BaseQuery {
	constructor(field, terms, data = {}) {
		super("terms", data);
		this._data.field = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](field);
		this._data.value = __WEBPACK_IMPORTED_MODULE_0__utils_js__["c" /* asArrayOfString */](terms);
	}
}
/* unused harmony export TermsQuery */


/**
 * A query which finds documents where the wildcard term can be applied at an existing document field term.
 *
 * Wildcard | Description
 * -------- | ------------
 * ? (question mark) | Skips a single character.
 *
 * To escape a wildcard character, use _\_ (backslash), e.g. \?.
 *
 * See also [Lucene#WildcardQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/WildcardQuery.html}
 * and [Elasticsearch#WildcardQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-wildcard-query.html}.
 *
 * _TODO: Implement wildcard * (asterisk) to skip zero or more characters._
 * @todo Implement wildcard * (asterisk) to skip zero or more characters.
 *
 * @example
 * new QueryBuilder()
 *   .wildcard("question", "e?nste?n\?")
 * .build();
 * // The resulting documents:
 * // contains the wildcard surname e?nste?n\? (like Einstein? or Eynsteyn? but not Einsteine or Ensten?)
 *
 * @param {string} field - the field name of the document
 * @param {string} wildcard - the wildcard term
 * @extends BaseQuery
 */
class WildcardQuery extends BaseQuery {
	constructor(field, wildcard, data = {}) {
		super("wildcard", data);
		this._data.field = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](field);
		this._data.value = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](wildcard);
	}
}
/* unused harmony export WildcardQuery */


/**
 * A query which finds documents where the fuzzy term can be transformed into an existing document field term within a
 * given edit distance
 * ([Damerau–Levenshtein distance]{@link https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance}).
 *
 * The edit distance is the minimum number of an insertion, deletion or substitution of a single character
 * or a transposition of two adjacent characters.
 *
 * * To set the maximal allowed edit distance, use {@link FuzzyQuery#fuzziness} (default is 2).
 * * To set the initial word length, which should ignored for fuzziness, use {@link FuzzyQuery#prefixLength}.
 *
 * See also [Lucene#FuzzyQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/FuzzyQuery.html}
 * and [Elasticsearch#FuzzyQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-fuzzy-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .fuzzy("surname", "einsten")
 *     .fuzziness(3)
 *     .prefixLength(3)
 * .build();
 * // The resulting documents:
 * // contains the fuzzy surname einstn (like Einstein or Einst but not Eisstein or Insten)
 *
 * @param {string} field - the field name of the document
 * @param {string} fuzzy - the fuzzy term
 * @extends BaseQuery
 */
class FuzzyQuery extends BaseQuery {
	constructor(field, fuzzy, data = {}) {
		super("fuzzy", data);
		this._data.field = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](field);
		this._data.value = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](fuzzy);
	}

	/**
	 * Sets the maximal allowed fuzziness.
	 * @param {number} fuzziness - the fuzziness
	 * @return {FuzzyQuery} - object itself for cascading
	 */
	fuzziness(fuzziness) {
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](fuzziness) || fuzziness < 0) {
			throw TypeError("Fuzziness must be a positive number.");
		}
		this._data.fuzziness = fuzziness;
		return this;
	}

	/**
	 * Sets the initial word length.
	 * @param {number} prefixLength - the positive prefix length
	 * @return {FuzzyQuery}  object itself for cascading
	 */
	prefixLength(prefixLength) {
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](prefixLength) || prefixLength < 0) {
			throw TypeError("Prefix length must be a positive number.");
		}
		this._data.prefix_length = prefixLength;
		return this;
	}
}
/* unused harmony export FuzzyQuery */


/**
 * A query which matches documents containing the prefix of a term inside a field.
 *
 * See also [Lucene#PrefixQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/PrefixQuery.html}
 * and [Elasticsearch#MatchQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-prefix-query.html}
 *
 * @example
 * new QueryBuilder()
 *   .prefix("surname", "alb")
 * .build()
 * // The resulting documents:
 * // contains the term prefix alb as surname
 *
 * @param {string} field - the field name of the document
 * @param {string} prefix - the prefix of a term
 * @extends BaseQuery
 */
class PrefixQuery extends BaseQuery {
	constructor(field, prefix, data = {}) {
		super("prefix", data);
		this._data.field = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](field);
		this._data.value = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](prefix);
	}
}
/* unused harmony export PrefixQuery */


/**
 * A query which matches all documents with a given field.
 *
 * See also [Elasticsearch#ExistsQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-exists-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .exists("name")
 * .build()
 * // The resulting documents:
 * // has the field "name"
 *
 * @param {string} field - the field name of the document
 * @extends BaseQuery
 */
class ExistsQuery extends BaseQuery {
	constructor(field, data = {}) {
		super("exists", data);
		this._data.field = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](field);
	}
}
/* unused harmony export ExistsQuery */


/**
 * A query which tokenizes the given query text, performs a query foreach token and combines the results using a boolean
 * operator.
 *
 * Operator      | Description
 * ------------- | -------------
 * or (default) | Finds documents which matches some tokens. The minimum amount of matches can be controlled with [minimumShouldMatch]{@link MatchQuery#minimumShouldMatch} (default is 1).
 * and | Finds documents which matches all tokens.
 *
 * To enable a [fuzzy query]{@link FuzzyQuery} for the tokens, use {@link MatchQuery#fuzziness} and {@link MatchQuery#prefixLength}.
 *
 * See also [Lucene#?]{@link ?}
 * and [Elasticsearch#MatchQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .match("name", "albrt einsten")
 *     .boost(2.5)
 *     .operator("and")
 *     .fuzziness(2)
 *     .prefixLength(3)
 * .build();
 * // The resulting documents:
 * // contains the fuzzy name albrt einsten (like Albert Einstein) with a boost of 2.5
 *
 * @param {string} field - the field name of the document
 * @param {string} query - the query text
 * @extends BaseQuery
 */
class MatchQuery extends BaseQuery {
	constructor(field, query, data = {}) {
		super("match", data);
		this._data.field = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](field);
		this._data.value = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](query);
	}

	/**
	 * Controls the amount of minimum matching token queries before a document will be considered.
	 * @param {number} minShouldMatch - number of minimum matching sub queries
	 * @return {MatchQuery} object itself for cascading
	 */
	minimumShouldMatch(minShouldMatch) {
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](minShouldMatch) || minShouldMatch < 0) {
			throw TypeError("Value for minimum should match must be a positive number.");
		}
		if (this._data.hasOwnProperty("operator") && this._data.operator == "and") {
			throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
		}
		this._data.minimum_should_match = minShouldMatch;
		return this;
	}

	/**
	 * Sets the boolean operator.
	 * @param {string} op - the operator (_or_/_and_)
	 * @return {MatchQuery} object itself for cascading
	 */
	operator(op) {
		op = __WEBPACK_IMPORTED_MODULE_0__utils_js__["a" /* asString */](op);
		if (op != 'and' && op != 'or') {
			throw SyntaxError("Unknown operator.");
		}
		this._data.operator = op;
		if (this._data.hasOwnProperty("minimum_should_match") && this._data.operator == "and") {
			throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
		}
		return this;
	}

	/**
	 * Sets the maximal allowed fuzziness.
	 * @param {number} fuzziness - the fuzziness
	 * @return {MatchQuery} object itself for cascading
	 */
	fuzziness(fuzziness) {
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](fuzziness) || fuzziness < 0) {
			throw TypeError("Fuzziness must be a positive number.");
		}
		this._data.fuzziness = fuzziness;
		return this;
	}

	/**
	 * Sets the starting word length which should not be considered for fuzziness.
	 * @param {number} prefixLength - the positive prefix length
	 * @return {MatchQuery} - object itself for cascading
	 */
	prefixLength(prefixLength) {
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](prefixLength) || prefixLength < 0) {
			throw TypeError("Prefix length must be a positive number.");
		}
		this._data.prefix_length = prefixLength;
		return this;
	}
}
/* unused harmony export MatchQuery */


/**
 * A query that matches all documents and giving them a constant score equal to the query boost.
 *
 * Typically used inside a must clause of a {@link BoolQuery} to subsequently reject non matching documents with the not
 * clause.
 *
 * See also [Lucene#MatchAllDocsQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/MatchAllDocsQuery.html}
 * and [Elasticsearch#MatchAllQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-all-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .matchAll()
 *     .boost(2.5)
 * .build()
 * // The resulting documents:
 * // all documents and giving a score of 2.5
 *
 * @extends BaseQuery
 */
class MatchAllQuery extends BaseQuery {
	constructor(data = {}) {
		super("match_all", data);
	}
}
/* unused harmony export MatchAllQuery */


/**
 * A query which holds all sub queries like an array.
 * @private
 */
class ArrayQuery extends BaseQuery {
	constructor(callbackName, callback, data = {}) {
		super("array", data);
		this._data.values = [];
		this._callbackName = callbackName;
		this[callbackName] = callback;

		this._prepare = (queryType, ...args) => {
			let data = {};
			let query = new queryType(...args, data);
			this._data.values.push(data);
			query.bool = this.bool;
			query.constantScore = this.constantScore;
			query.term = this.term;
			query.terms = this.terms;
			query.wildcard = this.wildcard;
			query.fuzzy = this.fuzzy;
			query.match = this.match;
			query.matchAll = this.matchAll;
			query.prefix = this.prefix;
			query.exists = this.exists;
			query._prepare = this._prepare;
			query[this._callbackName] = this[this._callbackName];
			return query;
		};
	}

	bool() {
		return this._prepare(BoolQuery);
	}

	constantScore() {
		return this._prepare(ConstantScoreQuery);
	}

	term(field, term) {
		return this._prepare(TermQuery, field, term);
	}

	terms(field, terms) {
		return this._prepare(TermsQuery, field, terms);
	}

	wildcard(field, wildcard) {
		return this._prepare(WildcardQuery, field, wildcard);
	}

	fuzzy(field, fuzzy) {
		return this._prepare(FuzzyQuery, field, fuzzy);
	}

	match(field, query) {
		return this._prepare(MatchQuery, field, query);
	}

	matchAll() {
		return this._prepare(MatchAllQuery);
	}

	prefix(field, prefix) {
		return this._prepare(PrefixQuery, field, prefix);
	}

	exists(field) {
		return this._prepare(ExistsQuery, field);
	}
}

/**
 * A query that wraps sub queries and returns a constant score equal to the query boost for every document in the filter.
 *
 * See also [Lucene#BooleanQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/ConstantScoreQuery.html}
 * and [Elasticsearch#ConstantScoreQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-constant-score-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .constantScore()
 *     .boost(1.5)
 *     .startFilter()
 *       .term("first_name", "albert")
 *       .term("surname", "einstein")
 *     .endFilter()
 * .build()
 * // The resulting documents:
 * // * contains albert as first name, einstein as surname and the document score is 42.
 *
 * @extends BaseQuery
 */
class ConstantScoreQuery extends BaseQuery {
	constructor(data = {}) {
		super("constant_score", data);
	}

	/**
	 * Starts an array of queries. Use endFilter() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startFilter() {
		this._data.filter = {};
		return new ArrayQuery("endFilter", () => {
			return this;
		}, this._data.filter);
	}
}
/* unused harmony export ConstantScoreQuery */


/**
 * A query that matches documents matching boolean combinations of sub queries.
 *
 * This query consists of one or more boolean clauses with different behavior but interrelated to each other.
 *
 * Occur         | Description
 * ------------- | -------------
 * must  | Finds documents which matches all sub queries.
 * filter  | Finds documents which matches all sub queries but these documents do not contribute to the score.
 * should  | Finds documents which matches some sub queries. The minimum amount of matches can be controlled with [minimumShouldMatch]{@link BoolQuery#minimumShouldMatch} (default is 1).
 * not  | Documents which match any sub query will be ignored.
 *
 * A sub query can be any other query type and also the bool query itself.
 *
 * See also [Lucene#BooleanQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/BooleanQuery.html}
 * and [Elasticsearch#BoolQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .bool()
 *     .startMust().boost(2)
 *       .term("first_name", "albert")
 *     .endMust()
 *     .startFilter()
 *       .term("birthplace", "ulm")
 *     .endFilter()
 *     .startShould().minimumShouldMatch(2)
 *       .fuzzy("surname", "einstin")
 *       .wildcard("name", "geni?s")
 *       .term("quotes", "infinity")
 *     .endShould()
 *     .startNot()
 *       .terms("research_field", ["biology", "geography"])
 *     .endNot()
 * .build();
 * // The resulting documents:
 * // contains the name albert (must: contribute to the score with a boost of 2)
 * // contains the birthplace ulm (filter: not contribute to the score)
 * // contains a minimum of two matches from the fuzzy, wildcard and/or term query (should: contribute to the score)
 * // do not contains biology or geography as research field (not: not contribute to the score)
 *
 * @extends BaseQuery
 */
class BoolQuery extends BaseQuery {
	constructor(data = {}) {
		super("bool", data);
	}

	/**
	 * Starts an array of queries for must clause. Use endMust() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startMust() {
		this._data.must = {};
		return new ArrayQuery("endMust", () => {
			return this;
		}, this._data.must);
	}

	/**
	 * Starts an array of queries for filter clause. Use endFilter() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startFilter() {
		this._data.filter = {};
		return new ArrayQuery("endFilter", () => {
			return this;
		}, this._data.filter);
	}

	/**
	 * Starts an array of queries for should clause. Use endShould() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startShould() {
		this._data.should = {};
		return new ArrayQuery("endShould", () => {
			return this;
		}, this._data.should);
	}

	/**
	 * Starts an array of queries for not clause. Use endNot() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startNot() {
		this._data.not = {};
		return new ArrayQuery("endNot", () => {
			return this;
		}, this._data.not);
	}

	/**
	 * Controls the amount of minimum matching sub queries before a document will be considered.
	 * @param {number} minShouldMatch - number of minimum matching sub queries
	 * @return {BoolQuery} object itself for cascading
	 */
	minimumShouldMatch(minShouldMatch) {
		if (typeof(minShouldMatch) !== "number" || minShouldMatch < 0) {
			throw TypeError("Minimum should match must be a number greater than zero.");
		}
		this._data.minimum_should_match = minShouldMatch;
		return this;
	}
}
/* unused harmony export BoolQuery */


/**
 * This query builder is the root of each query search.
 * The query contains a sub query and parameters for setup scoring and search options.
 *
 * Possible sub query types are:
 * {@link TermQuery}, {@link TermsQuery}, {@link FuzzyQuery}, {@link WildcardQuery},
 * {@link MatchQuery}, {@link MatchAllQuery}, {@link PrefixQuery},  {@link BoolQuery},
 * {@link ConstantScoreQuery}, {@link ExistsQuery}
 *
 * @example
 * new QueryBuilder()
 *   .finalScoring(true)
 *   .useBM25(1.5, 0.5)
 *   .term("first_name", "albert")
 * .build();
 * // The resulting documents:
 * // contains the first name albert
 * // are scored and ranked using BM25 with k1=1.5 and b=0.5
 */
class QueryBuilder {
	constructor() {
		this._data = {query: {}};
		this.useBM25();
	}

	/**
	 * The query performs a final scoring over all scored sub queries and rank documents by there relevant.
	 * @param {boolean} enabled - flag to enable or disable final scoring
	 * @return {QueryBuilder}
	 */
	enableFinalScoring(enabled) {
		this._data.final_scoring = __WEBPACK_IMPORTED_MODULE_0__utils_js__["d" /* asBoolean */](enabled);
		return this;
	}

	/**
	 * Use [Okapi BM25]{@link https://en.wikipedia.org/wiki/Okapi_BM25} as scoring model (default).
	 *
	 * See also [Lucene#MatchAllDocsQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/similarities/BM25Similarity.html}
	 * and [Elasticsearch#BM25]{@link https://www.elastic.co/guide/en/elasticsearch/guide/current/pluggable-similarites.html#bm25}.
	 *
	 * @param {number} [k1=1.2] - controls how quickly an increase in term frequency results in term-frequency saturation.
	 * 														Lower values result in quicker saturation, and higher values in slower saturation.
	 * @param {number} [b=0.75] - controls how much effect field-length normalization should have.
	 * 														A value of 0.0 disables normalization completely, and a value of 1.0 normalizes fully.
	 * @return {QueryBuilder}
	 */
	useBM25(k1 = 1.2, b = 0.75) {
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](k1) || k1 < 0) {
			throw TypeError("BM25s k1 must be a positive number.");
		}
		if (!__WEBPACK_IMPORTED_MODULE_0__utils_js__["b" /* isNumber */](b) || b < 0 || b > 1) {
			throw TypeError("BM25s b must be a number between 0 and 1 inclusive.");
		}

		this._data.scoring = {
			type: "BM25",
			k1: k1,
			b: b
		};
		return this;
	}

	bool() {
		return this._prepare(BoolQuery);
	}

	constantScore() {
		return this._prepare(ConstantScoreQuery);
	}

	term(field, term) {
		return this._prepare(TermQuery, field, term);
	}

	terms(field, terms) {
		return this._prepare(TermsQuery, field, terms);
	}

	wildcard(field, wildcard) {
		return this._prepare(WildcardQuery, field, wildcard);
	}

	fuzzy(field, fuzzy) {
		return this._prepare(FuzzyQuery, field, fuzzy);
	}

	match(field, query) {
		return this._prepare(MatchQuery, field, query);
	}

	matchAll() {
		return this._prepare(MatchAllQuery);
	}

	prefix(field, prefix) {
		return this._prepare(PrefixQuery, field, prefix);
	}

	exists(field) {
		return this._prepare(ExistsQuery, field);
	}

	_prepare(queryType, ...args) {
		this._child = new queryType(...args, this._data.query);
		this._child.build = () => {
			return this._data;
		};
		return this._child;
	}
}
/* harmony export (immutable) */ __webpack_exports__["a"] = QueryBuilder;



/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__tokenizer__ = __webpack_require__(0);


/**
 * Inverted index class handles featured text search for specific document fields.
 * @constructor InvertedIndex
 * @param {boolean} [options.store=true] - inverted index will be stored at serialization rather than rebuilt on load.
 */
class InvertedIndex {
	/**
	 * @param {boolean} store
	 * @param {Tokenizer} tokenizer
	 */
	constructor(store = true, tokenizer = new __WEBPACK_IMPORTED_MODULE_0__tokenizer__["a" /* Tokenizer */]) {
		this._store = store;
		this._tokenizer = tokenizer;
		this._docCount = 0;
		this._docStore = {};
		this._totalFieldLength = 0;
		this._root = {};
	}

	get store() {
		return this._store;
	}

	get tokenizer() {
		return this._tokenizer;
	}

	get documentCount() {
		return this._docCount;
	}

	get documentStore() {
		return this._docStore;
	}

	get totalFieldLength() {
		return this._totalFieldLength;
	}

	get root() {
		return this._root;
	}

	/**
	 * Adds defined fields of a document to the inverted index.
	 * @param {object} field - the field to add
	 * @param {number} docId - the doc id of the field
	 * @param {number} [boost=1] - object with field (key) specific boost (value)
	 */
	insert(field, docId, boost = 1) {
		if (this._docStore.hasOwnProperty(docId)) {
			throw Error('Field already added.');
		}

		this._docCount += 1;
		this._docStore[docId] = {};

		// Tokenize document field.
		let fieldTokens = this._tokenizer.tokenize(field);
		this._totalFieldLength += fieldTokens.length;

		let termRefs = [];
		this._docStore[docId] = {fieldLength: fieldTokens.length, boost: boost};
		Object.defineProperties(this._docStore[docId], {
			termRefs: {enumerable: false, configurable: true, writable: true, value: termRefs}
		});

		// Iterate over all unique field terms.
		for (let term of new Set(fieldTokens)) {
			if (term === '') {
				continue;
			}
			// Calculate term frequency.
			let tf = 0;
			for (let j = 0; j < fieldTokens.length; j++) {
				if (fieldTokens[j] === term) {
					tf++;
				}
			}

			// Add term to index tree.
			let branch = this._root;
			for (let i = 0; i < term.length; i++) {
				let c = term[i];
				if (!branch.hasOwnProperty(c)) {
					let child = {};
					Object.defineProperties(child, {
						parent: {enumerable: false, configurable: true, writable: true, value: branch}
					});
					branch[c] = child;
				}
				branch = branch[c];
			}
			// Add term info to index leaf.
			if (!branch.hasOwnProperty('docs')) {
				branch.docs = {};
				branch.df = 0;
			}
			branch.docs[docId] = tf;
			branch.df += 1;

			// Store index leaf for deletion.
			termRefs.push(branch);
		}
	}

	/**
	 * Removes all relevant terms of a document from the inverted index.
	 * @param {number} docId - the document.
	 */
	remove(docId) {
		if (!this._docStore.hasOwnProperty(String(docId))) {
			return;
		}
		let docStore = this._docStore[docId];
		// Remove document.
		delete this._docStore[docId];
		this._docCount -= 1;

		// Reduce total field length.
		this._totalFieldLength -= docStore.fieldLength;

		// Iterate over all term references.
		// Remove docId from docs and decrement document frequency.
		let termRefs = docStore.termRefs;
		for (let j = 0; j < termRefs.length; j++) {
			let index = termRefs[j];
			index.df -= 1;
			delete index.docs[docId];

			// Delete term branch if not used anymore.
			if (index.df === 0) {
				let keys = [];
				do {
					// Go tree upwards.
					let parent = index.parent;
					// Delete parent reference for preventing memory leak (cycle reference)
					delete index.parent;

					// Iterate over all children.
					keys = Object.keys(parent);
					for (let k = 0; k < keys.length; k++) {
						let key = keys[k];
						if (key === 'df' || key === 'docs') {
							continue;
						}
						// Remove previous child form parent.
						if (parent[key] === index) {
							delete parent[key];
							break;
						}
					}
					index = parent;
				} while (index.hasOwnProperty('parent') && keys.length === 1);
			}
		}
	}

	/**
	 * Gets the term index of a term.
	 * @param {string} term - the term.
	 * @param {object} root - the term index to start from
	 * @param {number} start - the position of the term string to start from
	 * @return {object} - The term index or null if the term is not in the term tree.
	 */
	static getTermIndex(term, root, start = 0) {
		if (start >= term.length) {
			return null;
		}
		for (let i = start; i < term.length; i++) {
			if (!root.hasOwnProperty(term[i])) {
				return null;
			}
			root = root[term[i]];
		}
		return root;
	}

	/**
	 * Extends a term index for the one branch.
	 * @param {object} root - the term index to start from
	 * @return {Array} - array with term indices and extension
	 */
	static getNextTermIndex(root) {
		let termIndices = [];
		let keys = Object.keys(root);
		for (let i = 0; i < keys.length; i++) {
			if (keys[i] !== 'docs' && keys[i] !== 'df') {
				termIndices.push({index: root[keys[i]], term: keys[i]});
			}
		}
		return termIndices;
	}

	/**
	 * Extends a term index to all available term leafs.
	 * @param {object} root - the term index to start from
	 * @returns {Array} - Array with term indices and extension
	 */
	static extendTermIndex(root) {
		let termIndices = [];
		let stack = [root];
		let treeStack = [''];
		do {
			let root = stack.pop();
			let treeTermn = treeStack.pop();

			if (root.hasOwnProperty('df')) {
				termIndices.push({index: root, term: treeTermn});
			}

			let keys = Object.keys(root);
			for (let i = 0; i < keys.length; i++) {
				if (keys[i] !== 'docs' && keys[i] !== 'df') {
					stack.push(root[keys[i]]);
					treeStack.push(treeTermn + keys[i]);
				}
			}
		} while (stack.length !== 0);

		return termIndices;
	}

	/**
	 * Serialize the inverted index.
	 * @returns {{docStore: *, _fields: *, index: *}}
	 */
	toJSON() {
		if (this._store) {
			return this;
		} else {
			return {
				_tokenizer: this._tokenizer,
			};
		}
	}

	/**
	 * Deserialize the inverted index.
	 * @param {{docStore: *, _fields: *, index: *}} serialized - The serialized inverted index.
	 * @param {Object.<string, function>|Tokenizer} funcTok[undefined] - the depending functions with labels
	 * 	or an equivalent tokenizer
	 */
	loadJSON(serialized, funcTok = undefined) {
		let dbObject = serialized;

		this._tokenizer = __WEBPACK_IMPORTED_MODULE_0__tokenizer__["a" /* Tokenizer */].fromJSON(dbObject._tokenizer, funcTok);
		this._docCount = dbObject._docCount;
		this._docStore = dbObject._docStore;
		this._totalFieldLength = dbObject._totalFieldLength;
		this._root = dbObject._root;

		let self = this;

		function regenerate(index, parent) {
			// Set parent.
			if (parent !== null) {
				Object.defineProperties(index, {
					parent: {enumerable: false, configurable: true, writable: false, value: parent}
				});
			}

			// Iterate over all keys.
			let keys = Object.keys(index);
			for (let i = 0; i < keys.length; i++) {
				// Found term, save in document store.
				if (keys[i] === 'docs') {
					// Get documents of term.
					let docIds = Object.keys(index.docs);
					for (let j = 0; j < docIds.length; j++) {
						// Get document store at specific document/field.
						let ref = self._docStore[docIds[j]];
						if (!ref.hasOwnProperty('termRefs')) {
							Object.defineProperties(ref, {
								termRefs: {enumerable: false, configurable: true, writable: true, value: []}
							});
						}
						// Set reference to term index.
						ref.termRefs.push(index);
					}
				} else if (keys[i] !== 'df') {
					// Iterate over subtree.
					regenerate(index[keys[i]], index);
				}
			}
		}

		regenerate(this._root, null);
	}
}
/* harmony export (immutable) */ __webpack_exports__["a"] = InvertedIndex;



/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__inverted_index__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__index_searcher__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__tokenizer__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils_js__ = __webpack_require__(1);





class FullTextSearch {
	/**
	 *
	 * @param options
	 */
	constructor(fields) {
		if (fields === undefined) {
			throw new SyntaxError('Fields needs to be defined!');
		}

		this._invIdxs = {};
		// Get field names and tokenizers.
		if (Array.isArray(fields)) {
			for (let i = 0; i < fields.length; i++) {
				let field = fields[i];
				let name = __WEBPACK_IMPORTED_MODULE_3__utils_js__["a" /* asString */](field.name, TypeError('Field name needs to be a string.'));

				let store = field.hasOwnProperty("store") ?
					__WEBPACK_IMPORTED_MODULE_3__utils_js__["d" /* asBoolean */](field.store, TypeError("Field store flag needs to be a boolean")) : true;

				let tokenizer = null;
				if (field.hasOwnProperty("tokenizer")) {
					if (!(field.tokenizer instanceof __WEBPACK_IMPORTED_MODULE_2__tokenizer__["a" /* Tokenizer */])) {
						throw new TypeError("Field tokenizer needs to be a instance of tokenizer.");
					}
					tokenizer = field.tokenizer;
				} else {
					tokenizer = new __WEBPACK_IMPORTED_MODULE_2__tokenizer__["a" /* Tokenizer */]();
				}
				this._invIdxs[name] = new __WEBPACK_IMPORTED_MODULE_0__inverted_index__["a" /* InvertedIndex */](store, tokenizer);
			}
		} else {
			throw new TypeError('fields needs to be an array with field name and a tokenizer (optional).');
		}

		this._docs = new Set();
		this._idxSearcher = new __WEBPACK_IMPORTED_MODULE_1__index_searcher__["a" /* IndexSearcher */](this._invIdxs, this._docs);
	}

	addDocument(doc, boosts = {}) {
		if (!doc.hasOwnProperty('$loki')) {
			throw new Error('Document is not stored in the collection.');
		}

		let fieldNames = Object.keys(doc);
		for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
			if (this._invIdxs.hasOwnProperty(fieldName)) {
				let boost = boosts.hasOwnProperty(fieldName) ? boosts[fieldName] : 1;
				this._invIdxs[fieldName].insert(doc[fieldName], doc.$loki, boost);
			}
		}

		this._docs.add(doc.$loki);
		this.setDirty();
	}

	removeDocument(doc) {
		if (!doc.hasOwnProperty('$loki')) {
			throw new Error('Document is not stored in the collection.');
		}

		let fieldNames = Object.keys(this._invIdxs);
		for (let i = 0; i < fieldNames.length; i++) {
			this._invIdxs[fieldNames[i]].remove(doc.$loki);
		}

		this._docs.delete(doc.$loki);
		this.setDirty();
	}

	updateDocument(doc, boosts = {}) {
		this.removeDocument(doc);
		this.addDocument(doc, boosts);
	}

	search(query) {
		return this._idxSearcher.search(query);
	}

	toJSON() {
		let serialized = {};
		let fieldNames = Object.keys(this._invIdxs);
		for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
			serialized[fieldName] = this._invIdxs[fieldName].toJSON();
		}
		return serialized;
	}

	loadJSON(serialized, tokenizers) {
		let db = JSON.parse(serialized);
		let fieldNames = Object.keys(db);
		for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
			this._invIdxs[fieldName] = new __WEBPACK_IMPORTED_MODULE_0__inverted_index__["a" /* InvertedIndex */]();
			this._invIdxs[fieldName].loadJSON(db[fieldName], tokenizers[fieldName]);
		}
	}

	setDirty() {
		this._idxSearcher.setDirty();
	}
}
/* harmony export (immutable) */ __webpack_exports__["a"] = FullTextSearch;



/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__full_text_search__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__tokenizer__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__queries__ = __webpack_require__(2);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "FullTextSearch", function() { return __WEBPACK_IMPORTED_MODULE_0__full_text_search__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Tokenizer", function() { return __WEBPACK_IMPORTED_MODULE_1__tokenizer__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "QueryBuilder", function() { return __WEBPACK_IMPORTED_MODULE_2__queries__["a"]; });





//
//
//
// Loki.Tokenizer = Tokenizer;
// Loki.QueryBuilder = QueryBuilder;
// Loki.Plugins.FullTextSearch = FullTextSearch;
//


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scorer__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__inverted_index__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__queries__ = __webpack_require__(2);




class IndexSearcher {
	/**
	 *
	 * @param {object} invIdxs
	 */
	constructor(invIdxs, docs) {
		this._invIdxs = invIdxs;
		this._docs = docs;
		this._scorer = new __WEBPACK_IMPORTED_MODULE_0__scorer__["a" /* Scorer */](this._invIdxs);
	}

	search(query) {
		let docResults = this._recursive(query.query, true);

		// Final scoring.
		let finalScoring = query.hasOwnProperty("final_scoring") ? query.final_scoring : true;
		if (finalScoring) {
			return this._scorer.finalScore(query, docResults);
		}
		return docResults;
	}

	setDirty() {
		this._scorer.setDirty();
	}

	_recursive(query, doScoring) {
		let docResults = {};
		let boost = query.hasOwnProperty('boost') ? query.boost : 1;
		let fieldName = query.hasOwnProperty("field") ? query.field : null;

		let root = null;
		let tokenizer = null;
		if (this._invIdxs.hasOwnProperty(fieldName)) {
			root = this._invIdxs[fieldName].root;
			tokenizer = this._invIdxs[fieldName].tokenizer;
		}

		switch (query.type) {
			case "bool": {
				docResults = null;
				if (query.hasOwnProperty("must")) {
					docResults = this._getUnique(query.must.values, doScoring, docResults);
				}
				if (query.hasOwnProperty("filter")) {
					docResults = this._getUnique(query.filter.values, false, docResults);
				}

				if (query.hasOwnProperty("should")) {
					let shouldDocs = this._getAll(query.should.values, doScoring);

					let empty = false;
					if (docResults === null) {
						docResults = {};
						empty = true;
					}

					let msm = query.hasOwnProperty("minimum_should_match") ? query.minimum_should_match : 1;
					// Remove all docs with fewer matches.
					// TODO: Enable percent, negative values and ranges.
					let docs = Object.keys(shouldDocs);
					for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
						if (shouldDocs[docId].length >= msm) {
							if (docResults.hasOwnProperty(docId)) {
								docResults[docId].push(...shouldDocs[docId]);
							} else if (empty) {
								docResults[docId] = shouldDocs[docId];
							} else {
								delete docResults[docId];
							}
						}
					}
				}
				if (query.hasOwnProperty("not")) {
					let notDocs = this._getAll(query.not.values, false);
					// Remove all docs.
					let docs = Object.keys(notDocs);
					for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
						if (docResults.hasOwnProperty(docId)) {
							delete docResults[docId];
						}
					}
				}
				break;
			}
			case "term": {
				let termIdx = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(query.value, root);
				this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, query.value);
				break;
			}
			case "terms": {
				for (let i = 0; i < query.value.length; i++) {
					let termIdx = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(query.value[i], root);
					this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, query.value[i]);
				}
				break;
			}
			case "fuzzy": {
				let f = new FuzzySearch(query);
				let b = f.search(root);
				for (let i = 0; i < b.length; i++) {
					this._scorer.prepare(fieldName, boost * b[i].boost, b[i].index, doScoring, docResults, b[i].term);
				}
				break;
			}
			case "wildcard": {
				let w = new WildcardSearch(query);
				let a = w.search(root);
				for (let i = 0; i < a.length; i++) {
					this._scorer.prepare(fieldName, boost, a[i].index, doScoring, docResults, a[i].term);
				}
				break;
			}
			case "match_all": {
				for (let docId of this._docs) {
					this._scorer.scoreConstant(boost, docId, docResults);
				}
				break;
			}
			case "constant_score": {
				docResults = this._getAll(query.filter.values, false);
				let docs = Object.keys(docResults);
				// Add to each document a constant score.
				for (let i = 0; i < docs.length; i++) {
					this._scorer.scoreConstant(boost, docs[i], docResults);
				}
				break;
			}
			case "prefix": {
				let termIdx = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(query.value, root);
				if (termIdx != null) {
					termIdx = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].extendTermIndex(termIdx);
				}
				for (let i = 0; i < termIdx.length; i++) {
					this._scorer.prepare(fieldName, boost, termIdx[i].index, doScoring, docResults, query.value + termIdx[i].term);
				}
				break;
			}
			case "exists": {
				if (root != null) {
					let docs = Object.keys(this._invIdxs[fieldName].documentStore);
					for (let i = 0; i < docs.length; i++) {
						this._scorer.scoreConstant(boost, docs[i], docResults);
					}
				}
				break;
			}
			case "match": {
				let terms = tokenizer.tokenize(query.value);
				let operator = query.hasOwnProperty("operator") ? query.operator : "or";

				let tmpQuery = new __WEBPACK_IMPORTED_MODULE_2__queries__["a" /* QueryBuilder */]().bool();
				if (operator === "or") {
					if (query.hasOwnProperty("minimum_should_match")) {
						tmpQuery = tmpQuery.minimumShouldMatch(query.minimum_should_match);
					}
					// Build a should query.
					tmpQuery = tmpQuery.startShould();
				} else {
					// Build a must query.
					tmpQuery = tmpQuery.startMust();
				}
				tmpQuery = tmpQuery.boost(boost);

				if (query.hasOwnProperty("fuzziness")) {
					let prefixLength = query.hasOwnProperty("prefix_length") ? query.prefix_length : 2;
					// Add each fuzzy.
					for (let i = 0; i < terms.length; i++) {
						tmpQuery = tmpQuery.fuzzy(fieldName, terms[i]).fuzziness(query.fuzziness).prefixLength(prefixLength);
					}
				} else {
					// Add each term.
					for (let i = 0; i < terms.length; i++) {
						tmpQuery = tmpQuery.term(fieldName, terms[i]);
					}
				}
				if (operator === "or") {
					tmpQuery = tmpQuery.endShould();
				} else {
					tmpQuery = tmpQuery.endMust();
				}

				docResults = this._recursive(tmpQuery.build(), doScoring);
				break;
			}
			default:
				break;
		}
		return docResults;
	}

	_getUnique(values, doScoring, docResults) {
		if (values.length === 0) {
			return docResults;
		}

		for (let i = 0; i < values.length; i++) {
			let currDocs = this._recursive(values[i], doScoring);
			if (docResults === null) {
				docResults = this._recursive(values[0], doScoring);
				continue;
			}

			let docs = Object.keys(docResults);
			for (let j = 0, docId; j < docs.length, docId = docs[j]; j++) {
				if (!currDocs.hasOwnProperty(docId)) {
					delete docResults[docId];
				} else {
					docResults[docId].push(...currDocs[docId]);
				}
			}
		}
		return docResults;
	}

	_getAll(values, doScoring) {
		let docResults = {};
		for (let i = 0; i < values.length; i++) {
			let currDocs = this._recursive(values[i], doScoring);
			let docs = Object.keys(currDocs);
			for (let j = 0, docId; j < docs.length, docId = docs[j]; j++) {
				if (!docResults.hasOwnProperty(docId)) {
					docResults[docId] = currDocs[docId];
				} else {
					docResults[docId].push(...currDocs[docId]);
				}
			}
		}
		return docResults;
	}
}
/* harmony export (immutable) */ __webpack_exports__["a"] = IndexSearcher;



class FuzzySearch {
	constructor(query) {
		this._fuzzy = query.value;
		this._fuzziness = query.hasOwnProperty('fuzziness') ? query.fuzziness : 2;
		this._prefixLength = query.hasOwnProperty('prefix_length') ? query.prefix_length : 2;
	}

	/**
	 * Copyright Kigiri: https://github.com/kigiri
	 *                     Milot Mirdita: https://github.com/milot-mirdita
	 *                     Toni Neubert:  https://github.com/Viatorus/
	 */
	levenshtein_distance(a, b) {
		if (a.length === 0) return b.length;
		if (b.length === 0) return a.length;
		let tmp, i, j, prev, val;
		// swap to save some memory O(min(a,b)) instead of O(a)
		if (a.length > b.length) {
			tmp = a;
			a = b;
			b = tmp;
		}

		var row = Array(a.length + 1);
		// init the row
		for (i = 0; i <= a.length; i++) {
			row[i] = i;
		}

		// fill in the rest
		for (i = 1; i <= b.length; i++) {
			prev = i;
			for (j = 1; j <= a.length; j++) {
				if (b[i - 1] === a[j - 1]) {	// match
					val = row[j - 1];
				} else {
					val = Math.min(row[j - 1] + 1, // substitution
						Math.min(prev + 1,         // insertion
							row[j] + 1));          // deletion

					// transposition.
					if (i > 1 && j > 1 && b[i - 2] === a[j - 1] && a[j - 2] === b[i - 1]) {
						val = Math.min(val, row[j - 1] - (a[j - 1] === b[i - 1] ? 1 : 0));
					}
				}
				row[j - 1] = prev;
				prev = val;
			}
			row[a.length] = prev;
		}
		return row[a.length];
	}

	/**
	 * Performs a fuzzy search for a given term.
	 * @param {string} query - a fuzzy term to match.
	 * @param {number} [maxDistance=2] - maximal edit distance between terms
	 * @returns {Array} - array with all matching term indices.
	 */
	search(root) {
		// Todo: Include levenshtein to reduce similar iterations.
		// Tree tokens at same depth share same row until depth (should works if recursive).
		// Pregenerate tree token ?
		//var treeToken = Array(token.length + maxDistance);

		let start = root;
		let pre = this._fuzzy.slice(0, this._prefixLength);
		let fuzzy = this._fuzzy;
		if (this._prefixLength != 0) {
			start = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(pre, start);
			fuzzy = fuzzy.slice(this._prefixLength);
		}
		if (start === null) {
			return [];
		}

		let similarTokens = [];

		let stack = [start];
		let treeStack = [''];
		do {
			let root = stack.pop();
			let treeTerms = treeStack.pop();

			// Compare tokens if they are in near distance.
			if (root.hasOwnProperty('df') && Math.abs(fuzzy.length - treeTerms.length) <= this._fuzziness) {
				const distance = this.levenshtein_distance(fuzzy, treeTerms);
				if (distance <= this._fuzziness) {
					// Calculate boost.
					let boost = 1 - distance / (pre.length + treeTerms.length);
					similarTokens.push({term: pre + treeTerms, index: root, boost: boost});
				}
			}

			// Iterate over all subtrees.
			// If token from tree is not longer than maximal distance.
			if (treeTerms.length - fuzzy.length <= this._fuzziness) {
				// Iterate over all subtrees.
				let keys = Object.keys(root);
				for (let i = 0; i < keys.length; i++) {
					if (keys[i] !== 'docs' && keys[i] !== 'df') {
						stack.push(root[keys[i]]);
						treeStack.push(treeTerms + keys[i]);
					}
				}
			}
		} while (stack.length !== 0);

		return similarTokens;
	}
}

class WildcardSearch {

	constructor(query) {
		this._wildcard = query.value;
		this._result = [];
	}

	/**
	 * Performs a wild card search for a given query term.
	 * @param {string} query - a wild card query to match.
	 * @returns {Array} - array with all matching term indices.
	 */
	search(root) {
		// Todo: Need an implementation for star operator in the middle.
		this._result = [];
		this._recursive(root);
		return this._result;
	}

	/**
	 *
	 * @param root
	 * @param idx
	 * @param term
	 * @param escaped
	 * @private
	 */
	_recursive(root, idx = 0, term = '', escaped = false) {
		if (root === null) {
			return;
		}

		if (idx === this._wildcard.length) {
			if (root.hasOwnProperty('df')) {
				this._result.push({index: root, term: term});
			}
			return;
		}

		if (!escaped && this._wildcard[idx] === '\\') {
			this._recursive(root, idx + 1, term, true);
		} else if (!escaped && this._wildcard[idx] === '?') {
			let others = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getNextTermIndex(root);
			for (let i = 0; i < others.length; i++) {
				this._recursive(others[i].index, idx + 1, term + others[i].term);
			}
		} else if (!escaped && this._wildcard[idx] === '*') {
			let all = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].extendTermIndex(root);
			for (let i = 0; i < all.length; i++) {
				this._recursive(all[i].index, idx + 1, term + all[i].term);
			}
		} else {
			this._recursive(__WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(this._wildcard[idx], root), idx + 1, term + this._wildcard[idx]);
		}
	}
}


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class Scorer {
	constructor(invIdxs) {
		this._invIdxs = invIdxs;
		this._cache = {};
	}

	setDirty() {
		this._cache = {};
	}

	prepare(fieldName, boost, termIdx, doScoring, docResults = {}, term = null) {
		if (termIdx == null || !termIdx.hasOwnProperty('docs')) {
			return null;
		}

		let idf = this._idf(fieldName, termIdx.df);
		let docIds = Object.keys(termIdx.docs);
		for (let j = 0; j < docIds.length; j++) {
			let docId = docIds[j];
			if (!docResults.hasOwnProperty(docId)) {
				docResults[docId] = [];
			}

			if (doScoring) {
				let tf = termIdx.docs[docId];
				docResults[docId].push({
					type: 'BM25',
					tf: tf,
					idf: idf,
					boost: boost,
					fieldName: fieldName,
					term: term
				});
			} else {
				// TODO: Maybe only 1 constant store per document
				docResults[docId].push({
					type: "constant", value: 1, boost: boost, fieldName: fieldName,
					term: term
				});
			}
		}

		return docResults;
	}

	scoreConstant(boost, docId, docResults = {}) {
		if (!docResults.hasOwnProperty(docId)) {
			docResults[docId] = [];
		}
		docResults[docId].push({type: "constant", value: 1, boost: boost});
		return docResults;
	}

	finalScore(query, docResults = {}) {

		let result = {};
		let k1 = query.scoring.k1;
		let b = query.scoring.b;

		let docs = Object.keys(docResults);
		for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
			let docScore = 0;
			for (let j = 0; j < docResults[docId].length; j++) {
				let docResult = docResults[docId][j];

				let res = 0;
				switch (docResult.type) {
					case 'BM25': {
						let fieldLength = this._invIdxs[docResult.fieldName].documentStore[docId].fieldLength /
							Math.pow(this._invIdxs[docResult.fieldName].documentStore[docId].boost, 2);
						let avgFieldLength = this._avgFieldLength(docResult.fieldName);
						let tfNorm = ((k1 + 1) * docResult.tf) / (k1 * ((1 - b)
							+ b * (fieldLength / avgFieldLength)) + docResult.tf);
						res = docResult.idf * tfNorm * docResult.boost;
						/*console.log(
							docId + ":" + docResult.fieldName + ":" + docResult.term + " = " + res,
							"\n\ttype: BM25",
							"\n\tboost: " + docResult.boost,
							"\n\tidf : " + docResult.idf,
							"\n\ttfNorm : " + tfNorm,
							"\n\ttf : " + docResult.tf,
							"\n\tavg : " + avgFieldLength,
							"\n\tfl : " + fieldLength);*/
						break;
					}
					case 'constant':
						res = docResult.value * docResult.boost;
						/*console.log(
							"Constant: " + res,
							"\n\tboost: " + docResult.boost,
							"\n\tvalue : " + docResult.value);*/
						break;
				}
				docScore += res;
			}
			//console.log(docId, " === ", docScore);
			result[docId] = docScore;
		}
		return result;
	}

	_getCache(fieldName) {
		if (!this._cache.hasOwnProperty(fieldName)) {
			let avgFieldLength = this._invIdxs[fieldName].totalFieldLength / this._invIdxs[fieldName].documentCount;
			this._cache[fieldName] = {idfs: {}, avgFieldLength: avgFieldLength};
		}
		return this._cache[fieldName];
	}

	/**
	 * Returns the idf by either calculate it or use a cached one.
	 * @param {number} docFreq - the doc frequency of the term
	 * @returns {number} the idf
	 * @private
	 */
	_idf(fieldName, docFreq) {
		let cache = this._getCache(fieldName);
		if (cache.idfs.hasOwnProperty(String(docFreq))) {
			return cache.idfs[docFreq];
		}
		return cache.idfs[docFreq] = Math.log(1 + (this._invIdxs[fieldName].documentCount - docFreq + 0.5) / (docFreq + 0.5));
	}

	_avgFieldLength(fieldName) {
		return this._getCache(fieldName).avgFieldLength;
	}
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Scorer;



/***/ })
/******/ ]);
});
//# sourceMappingURL=loki.FullTextSearch.js.map