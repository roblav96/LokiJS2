(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["@lokijs/full-text-search"] = factory();
	else
{		root["@lokijs/full-text-search"] = factory(); root["LokiFullTextSearch"] = root["@lokijs/full-text-search"].default;}
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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["b"] = toCodePoints;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__tokenizer__ = __webpack_require__(1);

/**
 * Converts a string into an array of code points.
 * @param str - the string
 * @returns {number[]} to code points
 */
function toCodePoints(str) {
    const r = [];
    for (let i = 0; i < str.length;) {
        const chr = str.charCodeAt(i++);
        if (chr >= 0xD800 && chr <= 0xDBFF) {
            // surrogate pair
            const low = str.charCodeAt(i++);
            r.push(0x10000 + ((chr - 0xD800) << 10) | (low - 0xDC00));
        }
        else {
            // ordinary character
            r.push(chr);
        }
    }
    return r;
}
/**
 * Inverted index class handles featured text search for specific document fields.
 * @constructor InvertedIndex
 * @param {boolean} [options.store=true] - inverted index will be stored at serialization rather than rebuilt on load.
 */
class InvertedIndex {
    /**
     * @param {boolean} store
     * @param {boolean} optimizeChanges
     * @param {Tokenizer} tokenizer
     */
    constructor(options = {}) {
        this._docCount = 0;
        this._docStore = {};
        this._totalFieldLength = 0;
        this._root = new Map();
        ({
            store: this._store = true,
            optimizeChanges: this._optimizeChanges = true,
            tokenizer: this._tokenizer = new __WEBPACK_IMPORTED_MODULE_0__tokenizer__["a" /* Tokenizer */]()
        } = options);
    }
    get store() {
        return this._store;
    }
    set store(val) {
        this._store = val;
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
     * @param {string} field - the field to add
     * @param {number} docId - the doc id of the field
     */
    insert(field, docId) {
        if (this._docStore[docId] !== undefined) {
            throw Error("Field already added.");
        }
        this._docCount += 1;
        this._docStore[docId] = {};
        // Tokenize document field.
        const fieldTokens = this._tokenizer.tokenize(field);
        this._totalFieldLength += fieldTokens.length;
        const termRefs = [];
        this._docStore[docId] = { fieldLength: fieldTokens.length };
        if (this._optimizeChanges) {
            Object.defineProperties(this._docStore[docId], {
                termRefs: { enumerable: false, configurable: true, writable: true, value: termRefs }
            });
        }
        // Iterate over all unique field terms.
        for (const token of new Set(fieldTokens)) {
            if (token === "") {
                continue;
            }
            // Calculate term frequency.
            let tf = 0;
            for (let j = 0; j < fieldTokens.length; j++) {
                if (fieldTokens[j] === token) {
                    ++tf;
                }
            }
            // Add term to index tree.
            let branch = this._root;
            for (const c of toCodePoints(token)) {
                let child = branch.get(c);
                if (child === undefined) {
                    child = new Map();
                    if (this._optimizeChanges) {
                        Object.defineProperties(child, {
                            pa: { enumerable: false, configurable: true, writable: true, value: branch }
                        });
                    }
                    branch.set(c, child);
                }
                branch = child;
            }
            // Add term info to index leaf.
            if (branch.dc === undefined) {
                branch.dc = {};
                branch.df = 0;
            }
            branch.dc[docId] = tf;
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
        if (this._docStore[docId] === undefined) {
            return;
        }
        const docStore = this._docStore[docId];
        // Remove document.
        delete this._docStore[docId];
        this._docCount -= 1;
        // Reduce total field length.
        this._totalFieldLength -= docStore.fieldLength;
        if (this._optimizeChanges) {
            // Iterate over all term references.
            // Remove docId from docs and decrement document frequency.
            const termRefs = docStore.termRefs;
            for (let j = 0; j < termRefs.length; j++) {
                let index = termRefs[j];
                index.df -= 1;
                delete index.dc[docId];
                // Check if no document is left for current tree.
                if (index.df === 0) {
                    // Delete unused meta data of branch.
                    delete index.df;
                    delete index.dc;
                    // Check for sub branches.
                    if (index.size !== 0) {
                        continue;
                    }
                    // Delete term branch if not used anymore.
                    do {
                        // Go tree upwards.
                        const parent = index.pa;
                        // Delete parent reference for preventing memory leak (cycle reference).
                        delete index.pa;
                        // Iterate over all children.
                        for (const key of parent.keys()) {
                            // Remove previous child form parent.
                            if (parent.get(key) === index) {
                                parent.delete(key);
                                break;
                            }
                        }
                        index = parent;
                    } while (index.pa !== undefined && index.size === 0 && index.df === undefined);
                }
            }
        }
        else {
            // Iterate over the whole inverted index and remove the document.
            // Delete branch if not needed anymore.
            const recursive = (root) => {
                for (const child of root) {
                    // Checkout branch.
                    if (recursive(child[1])) {
                        root.delete(child[0]);
                    }
                }
                // Remove docId from docs and decrement document frequency.
                if (root.df !== undefined) {
                    if (root.dc[docId] !== undefined) {
                        root.df -= 1;
                        delete root.dc[docId];
                        // Delete unused meta data of branch.
                        if (root.df === 0) {
                            delete root.df;
                            delete root.dc;
                        }
                    }
                }
                return root.size === 0 && root.dc === undefined;
            };
            recursive(this._root);
        }
    }
    /**
     * Gets the term index of a term.
     * @param {string} term - the term
     * @param {object} root - the term index to start from
     * @param {number} start - the position of the term string to start from
     * @return {object} - The term index or null if the term is not in the term tree.
     */
    static getTermIndex(term, root, start = 0) {
        if (start >= term.length) {
            return null;
        }
        for (let i = start; i < term.length; i++) {
            let child = root.get(term[i]);
            if (child === undefined) {
                return null;
            }
            root = child;
        }
        return root;
    }
    /**
     * Extends a term index to all available term leafs.
     * @param {object} root - the term index to start from
     * @returns {Array} - Array with term indices and extension
     */
    static extendTermIndex(root) {
        const termIndices = [];
        const rec = (idx, r) => {
            if (idx.df !== undefined) {
                termIndices.push({ index: idx, term: r.slice() });
            }
            r.push(0);
            for (const child of idx) {
                r[r.length - 1] = child[0];
                rec(child[1], r);
            }
            r.pop();
        };
        rec(root, []);
        return termIndices;
    }
    static serializeIndex(index) {
        const rec = (idx) => {
            let k = [];
            let v = [];
            let r = { df: idx.df, dc: idx.dc };
            if (idx.size === 0) {
                return [k, v, r];
            }
            for (const child of idx) {
                k.push(child[0]);
                v.push(rec(child[1]));
            }
            return [k, v, r];
        };
        return rec(index);
    }
    static deserializeIndex(ar) {
        const rec = (arr) => {
            let idx = new Map();
            for (let i = 0; i < arr[0].length; i++) {
                idx.set(arr[0][i], rec(arr[1][i]));
            }
            if (arr[2].df !== undefined) {
                idx.df = arr[2].df;
                idx.dc = arr[2].dc;
            }
            return idx;
        };
        return rec(ar);
    }
    /**
     * Serialize the inverted index.
     * @returns {{docStore: *, _fields: *, index: *}}
     */
    toJSON() {
        if (this._store) {
            return {
                _store: true,
                _optimizeChanges: this._optimizeChanges,
                _tokenizer: this._tokenizer,
                _docCount: this._docCount,
                _docStore: this._docStore,
                _totalFieldLength: this._totalFieldLength,
                _root: InvertedIndex.serializeIndex(this._root)
            };
        }
        return {
            _store: false,
            _optimizeChanges: this._optimizeChanges,
            _tokenizer: this._tokenizer
        };
    }
    /**
     * Deserialize the inverted index.
     * @param {{docStore: *, _fields: *, index: *}} serialized - The serialized inverted index.
     * @param {Object.<string, function>|Tokenizer} funcTok[undefined] - the depending functions with labels
     *  or an equivalent tokenizer
     */
    static fromJSONObject(serialized, funcTok = undefined) {
        const invIdx = new InvertedIndex({
            store: serialized._store,
            optimizeChanges: serialized._optimizeChanges,
            tokenizer: __WEBPACK_IMPORTED_MODULE_0__tokenizer__["a" /* Tokenizer */].fromJSONObject(serialized._tokenizer, funcTok)
        });
        if (invIdx._store) {
            invIdx._docCount = serialized._docCount;
            invIdx._docStore = serialized._docStore;
            invIdx._totalFieldLength = serialized._totalFieldLength;
            invIdx._root = InvertedIndex.deserializeIndex(serialized._root);
        }
        const regenerate = (index, parent) => {
            // Set parent.
            if (parent !== null) {
                Object.defineProperties(index, {
                    pa: { enumerable: false, configurable: true, writable: false, value: parent }
                });
            }
            // Iterate over subtree.
            for (const child of index.values()) {
                regenerate(child, index);
            }
            if (index.dc !== undefined) {
                // Get documents of term.
                const docIds = Object.keys(index.dc);
                for (let j = 0; j < docIds.length; j++) {
                    // Get document store at specific document/field.
                    const ref = invIdx._docStore[docIds[j]];
                    if (ref.termRefs === undefined) {
                        Object.defineProperties(ref, {
                            termRefs: { enumerable: false, configurable: true, writable: true, value: [] }
                        });
                    }
                    // Set reference to term index.
                    ref.termRefs.push(index);
                }
            }
        };
        if (invIdx._optimizeChanges) {
            regenerate(invIdx._root, null);
        }
        return invIdx;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = InvertedIndex;



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Splits a string at non-alphanumeric characters into lower case tokens.
 * @param {string} str - the string
 * @returns {string[]} - the tokens
 * @private
 */
function defaultSplitter(str) {
    let tokens = str.split(/[^\w]+/);
    for (let i = 0; i < tokens.length; i++) {
        tokens[i] = tokens[i].toLowerCase();
    }
    return tokens;
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
        this._queue = [];
        this._symbol = Symbol("label");
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
            throw Error("Cannot find existing function.");
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
            throw Error("Cannot find existing function.");
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
            throw Error("Cannot find existing function.");
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
            throw Error("Cannot find existing function.");
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
     */
    tokenize(str) {
        let tokens = this._splitter(str);
        // Apply each token over the queue functions.
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
     */
    toJSON() {
        let serialized = {
            tokenizers: []
        };
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
     *  or an equivalent tokenizer
     */
    static fromJSONObject(serialized, funcTok = undefined) {
        let tkz = new Tokenizer();
        if (funcTok !== undefined && funcTok instanceof Tokenizer) {
            if (serialized.splitter !== undefined) {
                let splitter = funcTok.getSplitter();
                if (serialized.splitter !== splitter[0]) {
                    throw Error("Splitter function not found.");
                }
                tkz.setSplitter(splitter[0], splitter[1]);
            }
            for (let i = 0; i < serialized.tokenizers.length; i++) {
                if (!funcTok.has(serialized.tokenizers[i])) {
                    throw Error("Tokenizer function not found.");
                }
                let labelFunc = funcTok.get(serialized.tokenizers[i]);
                tkz.add(labelFunc[0], labelFunc[1]);
            }
        }
        else {
            if (serialized.splitter !== undefined) {
                if (funcTok.splitters[serialized.splitter] === undefined) {
                    throw Error("Splitter function not found.");
                }
                tkz.setSplitter(serialized.splitter, funcTok.splitters[serialized.splitter]);
            }
            for (let i = 0; i < serialized.tokenizers.length; i++) {
                if (funcTok.tokenizers[serialized.tokenizers[i]] === undefined) {
                    throw Error("Tokenizer function not found.");
                }
                tkz.add(serialized.tokenizers[i], funcTok.tokenizers[serialized.tokenizers[i]]);
            }
        }
        return tkz;
    }
    /**
     * Returns the position of a function inside the queue.
     * @param {string|function} labelFunc - an existing label or function
     * @return {number} the position
     * @private
     */
    _getPosition(labelFunc) {
        if (labelFunc instanceof Function) {
            return this._queue.indexOf(labelFunc);
        }
        else {
            for (let i = 0; i < this._queue.length; i++) {
                if (this._queue[i][this._symbol] === labelFunc) {
                    return i;
                }
            }
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
/**
 * The base query class to enable boost to a query type.
 */
class BaseQuery {
    /**
     * @param {string} type - the type name of the query
     * @param data
     */
    constructor(type, data = {}) {
        this._data = data;
        this._data.type = type;
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
        if (value < 0) {
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
 * @extends BaseQuery
 */
class TermQuery extends BaseQuery {
    /**
     * @param {string} field - the field name of the document
     * @param {string} term - the term
     * @param data
     */
    constructor(field, term, data = {}) {
        super("term", data);
        this._data.field = field;
        this._data.value = term;
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
 * @extends BaseQuery
 */
class TermsQuery extends BaseQuery {
    /**
     * @param {string} field - the field name of the document
     * @param {string[]} terms - the terms
     * @param data
     */
    constructor(field, terms, data = {}) {
        super("terms", data);
        this._data.field = field;
        this._data.value = terms;
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
 * * To enable scoring for wildcard queries, use {@link WildcardQuery#enableScoring}.
 *
 * See also [Lucene#WildcardQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/WildcardQuery.html}
 * and [Elasticsearch#WildcardQuery]{@link https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-wildcard-query.html}.
 *
 * @example
 * new QueryBuilder()
 *   .wildcard("question", "e?nst*n\?")
 * .build();
 * // The resulting documents:
 * // contains the wildcard surname e?nst*n\? (like Einstein? or Eynsteyn? but not Einsteine or Ensten?)
 *
 * @extends BaseQuery
 */
class WildcardQuery extends BaseQuery {
    /**
     * @param {string} field - the field name of the document
     * @param {string} wildcard - the wildcard term
     * @param data
     */
    constructor(field, wildcard, data = {}) {
        super("wildcard", data);
        this._data.field = field;
        this._data.value = wildcard;
    }
    /**
     * This flag enables scoring for wildcard results, similar to {@link TermQuery}.
     * @param {boolean} enable - flag to enable or disable scoring
     * @return {WildcardQuery}
     */
    enableScoring(enable) {
        this._data.enable_scoring = enable;
        return this;
    }
}
/* unused harmony export WildcardQuery */

/**
 * A query which finds documents where the fuzzy term can be transformed into an existing document field term within a
 * given edit distance.
 * ([Damerau–Levenshtein distance]{@link https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance}).
 *
 * The edit distance is the minimum number of an insertion, deletion or substitution of a single character
 * or a transposition of two adjacent characters.
 *
 * * To set the maximal allowed edit distance, use {@link FuzzyQuery#fuzziness} (default is AUTO).
 * * To set the initial word length, which should ignored for fuzziness, use {@link FuzzyQuery#prefixLength}.
 * * To include longer document field terms than the fuzzy term and edit distance together, use
 *   {@link FuzzyQuery#extended}.
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
 * @extends BaseQuery
 */
class FuzzyQuery extends BaseQuery {
    /**
     * @param {string} field - the field name of the document
     * @param {string} fuzzy - the fuzzy term
     * @param data
     */
    constructor(field, fuzzy, data = {}) {
        super("fuzzy", data);
        this._data.field = field;
        this._data.value = fuzzy;
    }
    /**
     * Sets the maximal allowed fuzziness.
     * @param {number|string} fuzziness - the edit distance as number or AUTO
     *
     * AUTO generates an edit distance based on the length of the term:
     * * 0..2 -> must match exactly
     * * 3..5 -> one edit allowed
     * * >5 two edits allowed
     *
     * @return {FuzzyQuery} - object itself for cascading
     */
    fuzziness(fuzziness) {
        if (fuzziness !== "AUTO" && fuzziness < 0) {
            throw TypeError("Fuzziness must be a positive number or AUTO.");
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
        if (prefixLength < 0) {
            throw TypeError("Prefix length must be a positive number.");
        }
        this._data.prefix_length = prefixLength;
        return this;
    }
    /**
     * This flag allows longer document field terms than the actual fuzzy.
     * @param {boolean} extended - flag to enable or disable extended search
     * @return {FuzzyQuery}
     */
    extended(extended) {
        this._data.extended = extended;
        return this;
    }
}
/* unused harmony export FuzzyQuery */

/**
 * A query which matches documents containing the prefix of a term inside a field.
 *
 * * To enable scoring for wildcard queries, use {@link WildcardQuery#enableScoring}.
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
 * @extends BaseQuery
 */
class PrefixQuery extends BaseQuery {
    /**
     * @param {string} field - the field name of the document
     * @param {string} prefix - the prefix of a term
     * @param data
     */
    constructor(field, prefix, data = {}) {
        super("prefix", data);
        this._data.field = field;
        this._data.value = prefix;
    }
    /**
     * This flag enables scoring for prefix results, similar to {@link TermQuery}.
     * @param {boolean} enable - flag to enable or disable scoring
     * @return {PrefixQuery}
     */
    enableScoring(enable) {
        this._data.enable_scoring = enable;
        return this;
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
 * @extends BaseQuery
 */
class ExistsQuery extends BaseQuery {
    /**
     * @param {string} field - the field name of the document
     * @param data
     */
    constructor(field, data = {}) {
        super("exists", data);
        this._data.field = field;
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
 * To enable a [fuzzy query]{@link FuzzyQuery} for the tokens, use {@link MatchQuery#fuzziness},
 * {@link MatchQuery#prefixLength} and {@link MatchQuery#extended}
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
 * @extends BaseQuery
 */
class MatchQuery extends BaseQuery {
    /**
     * @param {string} field - the field name of the document
     * @param {string} query - the query text
     * @param data
     */
    constructor(field, query, data = {}) {
        super("match", data);
        this._data.field = field;
        this._data.value = query;
    }
    /**
     * Controls the amount of minimum matching sub queries before a document will be considered.
     * @param {number} minShouldMatch - number of minimum matching sub queries
     *   minShouldMatch >= 1: Indicates a fixed value regardless of the number of sub queries.
     *   minShouldMatch <= -1: Indicates that the number of sub queries, minus this number should be mandatory.
     *   minShouldMatch < 0: Indicates that this percent of the total number of sub queries can be missing.
     *     The number computed from the percentage is rounded down, before being subtracted from the total to determine
     *     the minimum.
     *   minShouldMatch < 1: Indicates that this percent of the total number of sub queries are necessary.
     *     The number computed from the percentage is rounded down and used as the minimum.
     * @return {MatchQuery} object itself for cascading
     */
    minimumShouldMatch(minShouldMatch) {
        if (this._data.operator !== undefined && this._data.operator === "and") {
            throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
        }
        this._data.minimum_should_match = minShouldMatch;
        return this;
    }
    /**
     * Sets the boolean operator.
     * @param {string} op - the operator ("or" || "and")
     * @return {MatchQuery} object itself for cascading
     */
    operator(op) {
        if (op !== "and" && op !== "or") {
            throw SyntaxError("Unknown operator.");
        }
        this._data.operator = op;
        if (this._data.minimum_should_match !== undefined && this._data.operator === "and") {
            throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
        }
        return this;
    }
    /**
     * Sets the maximal allowed fuzziness.
     * @param {number|string} fuzziness - the edit distance as number or AUTO
     *
     * AUTO generates an edit distance based on the length of the term:
     * * 0..2 -> must match exactly
     * * 3..5 -> one edit allowed
     * * >5 two edits allowed
     *
     * @return {MatchQuery} - object itself for cascading
     */
    fuzziness(fuzziness) {
        if (fuzziness !== "AUTO" && fuzziness < 0) {
            throw TypeError("Fuzziness must be a positive number or AUTO.");
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
        if (prefixLength < 0) {
            throw TypeError("Prefix length must be a positive number.");
        }
        this._data.prefix_length = prefixLength;
        return this;
    }
    /**
     * This flag allows longer document field terms than the actual fuzzy.
     * @param {boolean} extended - flag to enable or disable extended search
     * @return {MatchQuery}
     */
    extended(extended) {
        this._data.extended = extended;
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
 */
class ArrayQuery extends BaseQuery {
    constructor(callbackName, callback, data = {}) {
        super("array", data);
        this._data.values = [];
        this._callbackName = callbackName;
        this[callbackName] = callback;
        this._prepare = (queryType, ...args) => {
            const data = {};
            const query = new queryType(...args, data);
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
/* unused harmony export ArrayQuery */

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
 *     .beginFilter()
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
    beginFilter() {
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
 *     .beginMust().boost(2)
 *       .term("first_name", "albert")
 *     .endMust()
 *     .beginFilter()
 *       .term("birthplace", "ulm")
 *     .endFilter()
 *     .beginShould().minimumShouldMatch(2)
 *       .fuzzy("surname", "einstin")
 *       .wildcard("name", "geni?s")
 *       .term("quotes", "infinity")
 *     .endShould()
 *     .beginNot()
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
    beginMust() {
        this._data.must = {};
        return new ArrayQuery("endMust", () => {
            return this;
        }, this._data.must);
    }
    /**
     * Starts an array of queries for filter clause. Use endFilter() to finish the array.
     * @return {ArrayQuery} array query for holding sub queries
     */
    beginFilter() {
        this._data.filter = {};
        return new ArrayQuery("endFilter", () => {
            return this;
        }, this._data.filter);
    }
    /**
     * Starts an array of queries for should clause. Use endShould() to finish the array.
     * @return {ArrayQuery} array query for holding sub queries
     */
    beginShould() {
        this._data.should = {};
        return new ArrayQuery("endShould", () => {
            return this;
        }, this._data.should);
    }
    /**
     * Starts an array of queries for not clause. Use endNot() to finish the array.
     * @return {ArrayQuery} array query for holding sub queries
     */
    beginNot() {
        this._data.not = {};
        return new ArrayQuery("endNot", () => {
            return this;
        }, this._data.not);
    }
    /**
     * Controls the amount of minimum matching sub queries before a document will be considered.
     * @param {number} minShouldMatch - number of minimum matching sub queries
     *   minShouldMatch >= 1: Indicates a fixed value regardless of the number of sub queries.
     *   minShouldMatch <= -1: Indicates that the number of sub queries, minus this number should be mandatory.
     *   minShouldMatch < 0: Indicates that this percent of the total number of sub queries can be missing.
     *     The number computed from the percentage is rounded down, before being subtracted from the total to determine
     *     the minimum.
     *   minShouldMatch < 1: Indicates that this percent of the total number of sub queries are necessary.
     *     The number computed from the percentage is rounded down and used as the minimum.
     * @return {BoolQuery} object itself for cascading
     */
    minimumShouldMatch(minShouldMatch) {
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
        this._data = { query: {} };
        this.useBM25();
    }
    /**
     * The query performs a final scoring over all scored sub queries and rank documents by there relevant.
     * @param {boolean} enable - flag to enable or disable final scoring
     * @return {QueryBuilder}
     */
    enableFinalScoring(enable) {
        this._data.final_scoring = enable;
        return this;
    }
    /**
     * Use [Okapi BM25]{@link https://en.wikipedia.org/wiki/Okapi_BM25} as scoring model (default).
     *
     * See also [Lucene#MatchAllDocsQuery]{@link https://lucene.apache.org/core/6_4_0/core/org/apache/lucene/search/similarities/BM25Similarity.html}
     * and [Elasticsearch#BM25]{@link https://www.elastic.co/guide/en/elasticsearch/guide/current/pluggable-similarites.html#bm25}.
     *
     * @param {number} [k1=1.2] - controls how quickly an increase in term frequency results in term-frequency saturation.
     *                            Lower values result in quicker saturation, and higher values in slower saturation.
     * @param {number} [b=0.75] - controls how much effect field-length normalization should have.
     *                            A value of 0.0 disables normalization completely, and a value of 1.0 normalizes fully.
     * @return {QueryBuilder}
     */
    useBM25(k1 = 1.2, b = 0.75) {
        if (k1 < 0) {
            throw TypeError("BM25s k1 must be a positive number.");
        }
        if (b < 0 || b > 1) {
            throw TypeError("BM25s b must be a number between 0 and 1 inclusive.");
        }
        this._data.scoring = {
            type: "BM25",
            k1,
            b
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
/**
 * Class supports 64Bit integer operations.
 * A cut-down version of dcodeIO/long.js.
 */
class Long {
    constructor(low = 0, high = 0) {
        this.low = low;
        this.high = high;
    }
    /**
     * Returns this long with bits arithmetically shifted to the right by the given amount.
     * @param {number} numBits - number of bits
     * @returns {Long} the long
     */
    shiftRight(numBits) {
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return new Long((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits);
        else
            return new Long((this.high >> (numBits - 32)), this.high >= 0 ? 0 : -1);
    }
    /**
     * Returns this long with bits arithmetically shifted to the left by the given amount.
     * @param {number} numBits - number of bits
     * @returns {Long} the long
     */
    shiftLeft(numBits) {
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return new Long(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)));
        else
            return new Long(0, this.low << (numBits - 32));
    }
    /**
     * Returns the bitwise AND of this Long and the specified.
     * @param {Long} other - the other Long
     * @returns {Long} the long
     */
    and(other) {
        return new Long(this.low & other.low, this.high & other.high);
    }
    /**
     * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
     * @returns {number}
     */
    toInt() {
        return this.low;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Long;



/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__full_text_search__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__tokenizer__ = __webpack_require__(1);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Tokenizer", function() { return __WEBPACK_IMPORTED_MODULE_1__tokenizer__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__query_builder__ = __webpack_require__(2);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "QueryBuilder", function() { return __WEBPACK_IMPORTED_MODULE_2__query_builder__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__inverted_index__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "InvertedIndex", function() { return __WEBPACK_IMPORTED_MODULE_3__inverted_index__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "FullTextSearch", function() { return __WEBPACK_IMPORTED_MODULE_0__full_text_search__["a"]; });





/* harmony default export */ __webpack_exports__["default"] = (__WEBPACK_IMPORTED_MODULE_0__full_text_search__["a" /* FullTextSearch */]);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__inverted_index__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__index_searcher__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__common_plugin__ = __webpack_require__(13);



class FullTextSearch {
    /**
     * Initialize the full text search for the given fields.
     * @param {object[]} fields - the field options
     * @param {string} fields.name - the name of the field
     * @param {boolean=true} fields.store - flag to indicate if the full text search should be stored on serialization or
     *  rebuild on deserialization
     * @param {boolean=true} fields.optimizeChanges - flag to indicate if deleting/updating a document should be optimized
     *  (requires more memory but performs better)
     * @param {Tokenizer=Tokenizer} fields.tokenizer - the tokenizer of the field
     * @param {string=$loki} id - the property name of the document index
     */
    constructor(fields = [], id = "$loki") {
        this._invIdxs = {};
        // Create inverted indices for each field.
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            this._invIdxs[field.name] = new __WEBPACK_IMPORTED_MODULE_0__inverted_index__["a" /* InvertedIndex */](field);
        }
        this._id = id;
        this._docs = new Set();
        this._idxSearcher = new __WEBPACK_IMPORTED_MODULE_1__index_searcher__["a" /* IndexSearcher */](this._invIdxs, this._docs);
    }
    /**
     * Registers the full text search as plugin.
     */
    static register() {
        __WEBPACK_IMPORTED_MODULE_2__common_plugin__["a" /* PLUGINS */]["FullTextSearch"] = FullTextSearch;
    }
    addDocument(doc, id = doc[this._id]) {
        let fieldNames = Object.keys(doc);
        for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
            if (this._invIdxs[fieldName] !== undefined) {
                this._invIdxs[fieldName].insert(doc[fieldName], id);
            }
        }
        this._docs.add(id);
        this.setDirty();
    }
    removeDocument(doc, id = doc[this._id]) {
        let fieldNames = Object.keys(this._invIdxs);
        for (let i = 0; i < fieldNames.length; i++) {
            this._invIdxs[fieldNames[i]].remove(id);
        }
        this._docs.delete(id);
        this.setDirty();
    }
    updateDocument(doc, id = doc[this._id]) {
        this.removeDocument(doc, id);
        this.addDocument(doc, id);
    }
    clear() {
        for (let id of this._docs) {
            this.removeDocument(null, id);
        }
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
    static fromJSONObject(serialized, tokenizers = []) {
        let fts = new FullTextSearch();
        let fieldNames = Object.keys(serialized);
        for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
            fts._invIdxs[fieldName] = __WEBPACK_IMPORTED_MODULE_0__inverted_index__["a" /* InvertedIndex */].fromJSONObject(serialized[fieldName], tokenizers[fieldName]);
        }
        return fts;
    }
    setDirty() {
        this._idxSearcher.setDirty();
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = FullTextSearch;

/* unused harmony default export */ var _unused_webpack_default_export = (FullTextSearch);


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scorer__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__inverted_index__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__query_builder__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__fuzzy_RunAutomaton__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__fuzzy_LevenshteinAutomata__ = __webpack_require__(9);





class IndexSearcher {
    /**
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
        let finalScoring = query.final_scoring !== undefined ? query.final_scoring : true;
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
        let boost = query.boost !== undefined ? query.boost : 1;
        let fieldName = query.field !== undefined ? query.field : null;
        let enableScoring = query.enable_scoring !== undefined ? query.enable_scoring : false;
        let root = null;
        let tokenizer = null;
        if (this._invIdxs[fieldName] !== undefined) {
            root = this._invIdxs[fieldName].root;
            tokenizer = this._invIdxs[fieldName].tokenizer;
        }
        switch (query.type) {
            case "bool": {
                docResults = null;
                if (query.must !== undefined) {
                    docResults = this._getUnique(query.must.values, doScoring, docResults);
                }
                if (query.filter !== undefined) {
                    docResults = this._getUnique(query.filter.values, false, docResults);
                }
                if (query.should !== undefined) {
                    let shouldDocs = this._getAll(query.should.values, doScoring);
                    let empty = false;
                    if (docResults === null) {
                        docResults = {};
                        empty = true;
                    }
                    let msm = 1;
                    // TODO: Enable percent and ranges.
                    if (query.minimum_should_match !== undefined) {
                        msm = query.minimum_should_match;
                        let shouldLength = query.should.values.length;
                        if (msm <= -1) {
                            msm = shouldLength + msm;
                        }
                        else if (msm < 0) {
                            msm = shouldLength - Math.floor(shouldLength * -msm);
                        }
                        else if (msm < 1) {
                            msm = Math.floor(shouldLength * msm);
                        }
                    }
                    // Remove all docs with fewer matches.
                    let docs = Object.keys(shouldDocs);
                    for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
                        if (shouldDocs[docId].length >= msm) {
                            if (docResults[docId] !== undefined) {
                                docResults[docId].push(...shouldDocs[docId]);
                            }
                            else if (empty) {
                                docResults[docId] = shouldDocs[docId];
                            }
                            else {
                                delete docResults[docId];
                            }
                        }
                    }
                }
                if (query.not !== undefined) {
                    let notDocs = this._getAll(query.not.values, false);
                    // Remove all docs.
                    let docs = Object.keys(notDocs);
                    for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
                        if (docResults[docId] !== undefined) {
                            delete docResults[docId];
                        }
                    }
                }
                break;
            }
            case "term": {
                const cps = Object(__WEBPACK_IMPORTED_MODULE_1__inverted_index__["b" /* toCodePoints */])(query.value);
                let termIdx = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(cps, root);
                this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, cps);
                break;
            }
            case "terms": {
                for (let i = 0; i < query.value.length; i++) {
                    const cps = Object(__WEBPACK_IMPORTED_MODULE_1__inverted_index__["b" /* toCodePoints */])(query.value[i]);
                    let termIdx = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(cps, root);
                    this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, cps);
                }
                break;
            }
            case "fuzzy": {
                let f = fuzzySearch(query, root);
                // for (let i = 0; i < f.length; i++) {
                //   this._scorer.prepare(fieldName, boost * f[i].boost, f[i].index, doScoring, docResults, f[i].term as any);
                // }
                break;
            }
            case "wildcard": {
                let w = wildcardSearch(query, root);
                for (let i = 0; i < w.length; i++) {
                    this._scorer.prepare(fieldName, boost, w[i].index, doScoring && enableScoring, docResults, w[i].term);
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
                let tmpDocResults = this._getAll(query.filter.values, false);
                let docs = Object.keys(tmpDocResults);
                // Add to each document a constant score.
                for (let i = 0; i < docs.length; i++) {
                    this._scorer.scoreConstant(boost, docs[i], docResults);
                }
                break;
            }
            case "prefix": {
                const cps = Object(__WEBPACK_IMPORTED_MODULE_1__inverted_index__["b" /* toCodePoints */])(query.value);
                let termIdx = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(cps, root);
                if (termIdx !== null) {
                    const termIdxs = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].extendTermIndex(termIdx);
                    for (let i = 0; i < termIdxs.length; i++) {
                        this._scorer.prepare(fieldName, boost, termIdxs[i].index, doScoring && enableScoring, docResults, [...cps, ...termIdxs[i].term]);
                    }
                }
                break;
            }
            case "exists": {
                if (root !== null) {
                    let docs = Object.keys(this._invIdxs[fieldName].documentStore);
                    for (let i = 0; i < docs.length; i++) {
                        this._scorer.scoreConstant(boost, docs[i], docResults);
                    }
                }
                break;
            }
            case "match": {
                let terms = tokenizer.tokenize(query.value);
                let operator = query.operator !== undefined ? query.operator : "or";
                let tmpQuery = new __WEBPACK_IMPORTED_MODULE_2__query_builder__["a" /* QueryBuilder */]().bool();
                if (operator === "or") {
                    if (query.minimum_should_match !== undefined) {
                        tmpQuery = tmpQuery.minimumShouldMatch(query.minimum_should_match);
                    }
                    // Build a should query.
                    tmpQuery = tmpQuery.beginShould();
                }
                else {
                    // Build a must query.
                    tmpQuery = tmpQuery.beginMust();
                }
                tmpQuery = tmpQuery.boost(boost);
                if (query.fuzziness !== undefined) {
                    let prefixLength = query.prefix_length !== undefined ? query.prefix_length : 2;
                    let extended = query.extended !== undefined ? query.extended : false;
                    // Add each fuzzy.
                    for (let i = 0; i < terms.length; i++) {
                        tmpQuery = tmpQuery.fuzzy(fieldName, terms[i]).fuzziness(query.fuzziness).prefixLength(prefixLength).extended(extended);
                    }
                }
                else {
                    // Add each term.
                    for (let i = 0; i < terms.length; i++) {
                        tmpQuery = tmpQuery.term(fieldName, terms[i]);
                    }
                }
                if (operator === "or") {
                    tmpQuery = tmpQuery.endShould();
                }
                else {
                    tmpQuery = tmpQuery.endMust();
                }
                docResults = this._recursive(tmpQuery.build().query, doScoring);
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
                if (currDocs[docId] === undefined) {
                    delete docResults[docId];
                }
                else {
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
                if (docResults[docId] === undefined) {
                    docResults[docId] = currDocs[docId];
                }
                else {
                    docResults[docId].push(...currDocs[docId]);
                }
            }
        }
        return docResults;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = IndexSearcher;

/**
 * Calculates the levenshtein distance.
 * Copyright Kigiri: https://github.com/kigiri
 *           Milot Mirdita: https://github.com/milot-mirdita
 *           Toni Neubert:  https://github.com/Viatorus/
 * @param {string} a - a string
 * @param {string} b - a string
 */
function levenshteinDistance(a, b) {
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;
    let tmp;
    let i;
    let j;
    let prev;
    let val;
    // swap to save some memory O(min(a,b)) instead of O(a)
    if (a.length > b.length) {
        tmp = a;
        a = b;
        b = tmp;
    }
    const row = Array(a.length + 1);
    // init the row
    for (i = 0; i <= a.length; i++) {
        row[i] = i;
    }
    // fill in the rest
    for (i = 1; i <= b.length; i++) {
        prev = i;
        for (j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                val = row[j - 1];
            }
            else {
                val = Math.min(row[j - 1] + 1, // substitution
                Math.min(prev + 1, // insertion
                row[j] + 1)); // deletion
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
function fuzzySearch(query, root) {
    let res = [];
    function calculateDistance(state, a, n) {
        let ed = 0;
        state = a.step(state, 0);
        if (state !== -1) {
            ed++;
            state = a.step(state, 0);
            if (state !== -1) {
                ed++;
            }
        }
        return n - ed;
    }
    function run(a, root) {
        let edit_distance = 1;
        function rec(state, key, idx, r) {
            r[r.length - 1] = key;
            state = a.step(state, key);
            if (state === -1) {
                //console.log("bad: ", String.fromCodePoint(...r));
                return;
            }
            if (a.isAccept(state) && idx.df !== undefined) {
                //console.log("found: ", String.fromCodePoint(...r));
                res.push({ index: root, term: String.fromCodePoint(...r) });
            }
            r.push(0);
            for (const child of idx) {
                rec(state, child[0], child[1], r);
            }
            r.pop();
        }
        let r = [0];
        for (const child of root) {
            rec(0, child[0], child[1], r);
        }
        //rec(root)
    }
    let la = new __WEBPACK_IMPORTED_MODULE_4__fuzzy_LevenshteinAutomata__["a" /* LevenshteinAutomata */](Object(__WEBPACK_IMPORTED_MODULE_1__inverted_index__["b" /* toCodePoints */])(query.value));
    let tr = la.run();
    let ra = new __WEBPACK_IMPORTED_MODULE_3__fuzzy_RunAutomaton__["a" /* RunAutomaton */](tr);
    run(ra, root);
    throw res;
    // return res;
}
/**
 * Performs a fuzzy search.
 * @param {ANY} query - the fuzzy query
 * @param {InvertedIndex.Index} root - the root index
 * @returns {Array}
 */
function fuzzySearch2(query, root) {
    let value = query.value;
    let fuzziness = query.fuzziness !== undefined ? query.fuzziness : "AUTO";
    if (fuzziness === "AUTO") {
        if (value.length <= 2) {
            fuzziness = 0;
        }
        else if (value.length <= 5) {
            fuzziness = 1;
        }
        else {
            fuzziness = 2;
        }
    }
    let prefixLength = query.prefix_length !== undefined ? query.prefix_length : 2;
    let extended = query.extended !== undefined ? query.extended : false;
    // Todo: Include levenshtein to reduce similar iterations.
    // Tree tokens at same depth share same row until depth (should works if recursive).
    // Pregenerate tree token ?
    // var treeToken = Array(token.length + maxDistance);
    let start = root;
    let pre = value.slice(0, prefixLength);
    let fuzzy = value;
    if (prefixLength !== 0) {
        start = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex(pre, start);
        fuzzy = fuzzy.slice(prefixLength);
    }
    if (start === null) {
        return [];
    }
    if (fuzzy.length === 0) {
        // Return if prefixLength == value length.
        return [{ term: "", index: start, boost: 1 }];
    }
    /// Fuzziness of the fuzzy without extension.
    let extend_fuzzy = 1e10;
    let similarTokens = [];
    let stack = [start];
    let treeStack = [""];
    do {
        let index = stack.pop();
        let treeTerms = treeStack.pop();
        // Check if fuzzy should be extended.
        if (extended) {
            if (treeTerms.length === fuzzy.length) {
                extend_fuzzy = levenshteinDistance(fuzzy, treeTerms);
            }
            else {
                extend_fuzzy = extend_fuzzy <= fuzziness && treeTerms.length >= fuzzy.length
                    ? extend_fuzzy
                    : 1e10;
            }
        }
        // Compare tokens if they are in near distance.
        if (index.df !== undefined) {
            let matched = false;
            if (Math.abs(fuzzy.length - treeTerms.length) <= fuzziness) {
                const distance = levenshteinDistance(fuzzy, treeTerms);
                if (distance <= fuzziness) {
                    let term = pre + treeTerms;
                    // Calculate boost.
                    let boost = 1 - distance / Math.min(term.length, value.length);
                    similarTokens.push({ term, index: index, boost });
                    matched = true;
                }
            }
            // Only include extended terms that did not previously match.
            if (extend_fuzzy <= fuzziness && !matched) {
                let term = pre + treeTerms;
                // Calculate boost.
                let boost = 1 - (extend_fuzzy + treeTerms.length - fuzzy.length) / Math.min(term.length, value.length);
                similarTokens.push({ term: term, index: index, boost });
            }
        }
        // Iterate over all subtrees.
        // If token from tree is not longer than maximal distance.
        if ((treeTerms.length - fuzzy.length <= fuzziness) || extend_fuzzy <= fuzziness) {
            // Iterate over all subtrees.
            let keys = Object.keys(index);
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].length === 1) {
                    stack.push(index[keys[i]]);
                    treeStack.push(treeTerms + keys[i]);
                }
            }
        }
    } while (stack.length !== 0);
    return similarTokens;
}
/**
 * Performs a wildcard search.
 * @param {ANY} query - the wildcard query
 * @param {InvertedIndex.Index} root - the root index
 * @returns {Array}
 */
function wildcardSearch(query, root) {
    let wildcard = Object(__WEBPACK_IMPORTED_MODULE_1__inverted_index__["b" /* toCodePoints */])(query.value);
    let result = [];
    function recursive(index, idx = 0, term = [], escaped = false) {
        if (index === null) {
            return;
        }
        if (idx === wildcard.length) {
            if (index.df !== undefined) {
                result.push({ index: index, term: term.slice() });
            }
            return;
        }
        // Escaped character.
        if (!escaped && wildcard[idx] === 92 /* \ */) {
            recursive(index, idx + 1, term, true);
        }
        else if (!escaped && wildcard[idx] === 63 /* ? */) {
            for (const child of index) {
                recursive(child[1], idx + 1, term + child[0]);
            }
        }
        else if (!escaped && wildcard[idx] === 42 /* * */) {
            // Check if asterisk is last wildcard character
            if (idx + 1 === wildcard.length) {
                const all = __WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].extendTermIndex(index);
                for (let i = 0; i < all.length; i++) {
                    recursive(all[i].index, idx + 1, [...term, ...all[i].term]);
                }
            }
            else {
                // Iterate over the whole tree.
                recursive(index, idx + 1, term, false);
                const indices = [{ index: index, term: [] }];
                do {
                    const index = indices.pop();
                    for (const child of index.index) {
                        recursive(child[1], idx + 1, [...term, ...index.term, child[0]]);
                        indices.push({ index: child[1], term: [...index.term, child[0]] });
                    }
                } while (indices.length !== 0);
            }
        }
        else {
            recursive(__WEBPACK_IMPORTED_MODULE_1__inverted_index__["a" /* InvertedIndex */].getTermIndex([wildcard[idx]], index), idx + 1, [...term, wildcard[idx]]);
        }
    }
    recursive(root);
    return result;
}


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class Scorer {
    constructor(invIdxs) {
        this._cache = {};
        this._invIdxs = invIdxs;
    }
    setDirty() {
        this._cache = {};
    }
    prepare(fieldName, boost, termIdx, doScoring, docResults = {}, term = null) {
        if (termIdx === null || termIdx.dc === undefined) {
            return null;
        }
        const idf = this._idf(fieldName, termIdx.df);
        const docIds = Object.keys(termIdx.dc);
        for (let j = 0; j < docIds.length; j++) {
            const docId = docIds[j];
            if (docResults[docId] === undefined) {
                docResults[docId] = [];
            }
            if (doScoring) {
                const tf = termIdx.dc[docId];
                docResults[docId].push({ type: "BM25", tf, idf, boost, fieldName, term });
            }
            else {
                docResults[docId] = [{ type: "constant", value: 1, boost, fieldName }];
            }
        }
        return docResults;
    }
    scoreConstant(boost, docId, docResults = {}) {
        if (docResults[docId] === undefined) {
            docResults[docId] = [];
        }
        docResults[docId].push({ type: "constant", value: 1, boost });
        return docResults;
    }
    finalScore(query, docResults = {}) {
        const result = {};
        const k1 = query.scoring.k1;
        const b = query.scoring.b;
        const docs = Object.keys(docResults);
        for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
            let docScore = 0;
            for (let j = 0; j < docResults[docId].length; j++) {
                const docResult = docResults[docId][j];
                let res = 0;
                switch (docResult.type) {
                    case "BM25": {
                        const tf = docResult.tf;
                        const fieldLength = Scorer._calculateFieldLength(this._invIdxs[docResult.fieldName].documentStore[docId]
                            .fieldLength);
                        const avgFieldLength = this._avgFieldLength(docResult.fieldName);
                        const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (fieldLength / avgFieldLength)));
                        res = docResult.idf * tfNorm * docResult.boost;
                        // console.log(
                        // 	docId + ":" + docResult.fieldName + ":" + docResult.term + " = " + res,
                        // 	"\n\ttype: BM25",
                        // 	"\n\tboost: " + docResult.boost,
                        // 	"\n\tidf : " + docResult.idf,
                        // 	"\n\ttfNorm : " + tfNorm,
                        // 	"\n\ttf : " + tf,
                        // 	"\n\tavg : " + avgFieldLength,
                        // 	"\n\tfl : " + fieldLength);
                        break;
                    }
                    case "constant":
                        res = docResult.value * docResult.boost;
                        // console.log(
                        //  "Constant: " + res,
                        //  "\n\tboost: " + docResult.boost,
                        //  "\n\tvalue : " + docResult.value);
                        break;
                }
                docScore += res;
            }
            //console.log(docId, " === ", docScore);
            result[docId] = docScore;
        }
        return result;
    }
    static _calculateFieldLength(fieldLength) {
        return fieldLength;
    }
    _getCache(fieldName) {
        if (this._cache[fieldName] === undefined) {
            const avgFieldLength = this._invIdxs[fieldName].totalFieldLength / this._invIdxs[fieldName].documentCount;
            this._cache[fieldName] = { idfs: {}, avgFieldLength };
        }
        return this._cache[fieldName];
    }
    /**
     * Returns the idf by either calculate it or use a cached one.
     * @param {string} fieldName - the name of the field
     * @param {number} docFreq - the doc frequency of the term
     * @returns {number} the idf
     * @private
     */
    _idf(fieldName, docFreq) {
        const cache = this._getCache(fieldName);
        if (cache.idfs[docFreq] !== undefined) {
            return cache.idfs[docFreq];
        }
        return cache.idfs[docFreq] = Math.log(1 + (this._invIdxs[fieldName].documentCount - docFreq + 0.5) / (docFreq + 0.5));
    }
    _avgFieldLength(fieldName) {
        return this._getCache(fieldName).avgFieldLength;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Scorer;



/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class RunAutomaton {
    constructor(a) {
        this.automaton = a;
        this.points = a.getStartPoints();
        this.size = a.getNumStates();
        this.accept = [];
        this.transitions = [];
        for (let n = 0; n < this.size; n++) {
            this.accept[n] = a.isAccept(n);
            for (let c = 0; c < this.points.length; c++) {
                let dest = a.step(n, this.points[c]);
                if (dest !== -1 && dest >= this.size) {
                    //exit(0);
                    // console.log("bad1");
                }
                this.transitions[n * this.points.length + c] = dest;
            }
        }
        this.alphabetSize = 256;
        this.classmap = new Array(Math.min(256, this.alphabetSize));
        let i = 0;
        for (let j = 0; j < this.classmap.length; j++) {
            if (i + 1 < this.points.length && j === this.points[i + 1]) {
                i++;
            }
            this.classmap[j] = i;
        }
    }
    getCharClass(c) {
        // binary search
        let a = 0;
        let b = this.points.length;
        while (b - a > 1) {
            let d = (a + b) >>> 1;
            if (this.points[d] > c)
                b = d;
            else if (this.points[d] < c)
                a = d;
            else
                return d;
        }
        return a;
    }
    step(state, c) {
        if (c >= this.classmap.length) {
            return this.transitions[state * this.points.length + this.getCharClass(c)];
        }
        else {
            return this.transitions[state * this.points.length + this.classmap[c]];
        }
    }
    isAccept(state) {
        return this.accept[state];
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = RunAutomaton;



/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Automata__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Lev1TParametricDescription__ = __webpack_require__(11);


class LevenshteinAutomata {
    constructor(input, alphaMax = __WEBPACK_IMPORTED_MODULE_0__Automata__["b" /* MAX_CODE_POINT */]) {
        this.word = input;
        this.alphabet = Array.from(this.word).sort((a, b) => a - b);
        this.numRanges = 0;
        this.rangeLower = new Array(this.alphabet.length + 2);
        this.rangeUpper = new Array(this.alphabet.length + 2);
        // calculate the unicode range intervals that exclude the alphabet
        // these are the ranges for all unicode characters not in the alphabet
        let lower = 0;
        for (let i = 0; i < this.alphabet.length; i++) {
            const higher = this.alphabet[i];
            if (higher > lower) {
                this.rangeLower[this.numRanges] = lower;
                this.rangeUpper[this.numRanges] = higher - 1;
                this.numRanges++;
            }
            lower = higher + 1;
        }
        /* add the final endpoint */
        if (lower <= alphaMax) {
            this.rangeLower[this.numRanges] = lower;
            this.rangeUpper[this.numRanges] = alphaMax;
            this.numRanges++;
        }
        this.description = new __WEBPACK_IMPORTED_MODULE_1__Lev1TParametricDescription__["a" /* Lev1TParametricDescription */](input.length);
    }
    getVector(x, pos, end) {
        let vector = 0;
        for (let i = pos; i < end; i++) {
            vector <<= 1;
            if (this.word[i] === x) {
                vector |= 1;
            }
        }
        return vector;
    }
    run() {
        let automat = new __WEBPACK_IMPORTED_MODULE_0__Automata__["a" /* Automaton */]();
        const n = 1;
        const range = 2 * n + 1;
        // the number of states is based on the length of the word and n
        const numStates = this.description.size();
        // TODO: Prefix
        automat.createState();
        const stateOffset = 0;
        // create all states, and mark as accept states if appropriate
        for (let i = 1; i < numStates; i++) {
            let state = automat.createState();
            automat.setAccept(state, this.description.isAccept(i));
        }
        // console.log(automat.isAccept);
        for (let k = 0; k < numStates; k++) {
            const xpos = this.description.getPosition(k);
            if (xpos < 0) {
                continue;
            }
            const end = xpos + Math.min(this.word.length - xpos, range);
            // console.log("k:", k, "xpos:", xpos, "end:", end);
            for (let x = 0; x < this.alphabet.length; x++) {
                const ch = this.alphabet[x];
                const cvec = this.getVector(ch, xpos, end);
                const dest = this.description.transition(k, xpos, cvec);
                // console.log("x:", x, "ch:", ch, "cvec:", cvec, "dest:", dest);
                if (dest >= 0) {
                    // console.log("transition");
                    automat.addTransition(stateOffset + k, stateOffset + dest, ch, ch);
                }
            }
            // console.log("last trans, k:", k, "xpos", xpos);
            const dest = this.description.transition(k, xpos, 0);
            if (dest >= 0) {
                for (let r = 0; r < this.numRanges; r++) {
                    // console.log("transition", r);
                    automat.addTransition(stateOffset + k, stateOffset + dest, this.rangeLower[r], this.rangeUpper[r]);
                }
            }
        }
        if (!automat.deterministic) {
            //exit(0);
            // console.log("bad d");
        }
        automat.finishState();
        return automat;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = LevenshteinAutomata;



/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
class Transition {
    constructor(dest, min, max) {
        this.dest = dest;
        this.min = min;
        this.max = max;
    }
}
/* unused harmony export Transition */

const MIN_CODE_POINT = 0;
/* unused harmony export MIN_CODE_POINT */

const MAX_CODE_POINT = 1114111;
/* harmony export (immutable) */ __webpack_exports__["b"] = MAX_CODE_POINT;

class Automaton {
    constructor() {
        this.transitions = [];
        this.transitions = [];
        this._isAccept = new Set();
        this.nextState = 0;
        this.currState = -1;
        this.deterministic = true;
        this.trans = {};
    }
    isAccept(n) {
        return this._isAccept.has(n);
    }
    createState() {
        return this.nextState++;
    }
    setAccept(state, accept) {
        if (accept) {
            this._isAccept.add(state);
        }
        else {
            this._isAccept.delete(state);
        }
    }
    finishState() {
        if (this.currState !== -1) {
            this.finishCurrentState();
            this.currState = -1;
        }
    }
    finishCurrentState() {
        const destMinMax = (a, b) => {
            if (a.dest < b.dest) {
                return -1;
            }
            else if (a.dest > b.dest) {
                return 1;
            }
            if (a.min < b.min) {
                return -1;
            }
            else if (a.min > b.min) {
                return 1;
            }
            if (a.max < b.max) {
                return -1;
            }
            else if (a.max > b.max) {
                return 1;
            }
            return 0;
        };
        const minMaxDest = (a, b) => {
            if (a.min < b.min) {
                return -1;
            }
            else if (a.min > b.min) {
                return 1;
            }
            if (a.max < b.max) {
                return -1;
            }
            else if (a.max > b.max) {
                return 1;
            }
            if (a.dest < b.dest) {
                return -1;
            }
            else if (a.dest > b.dest) {
                return 1;
            }
            return 0;
        };
        // Sort all transitions
        this.transitions.sort(destMinMax);
        let offset = 0;
        let upto = 0;
        let p = new Transition(-1, -1, -1);
        for (let i = 0, len = this.transitions.length; i < len; i++) {
            // tDest = transitions[offset + 3 * i];
            // tMin = transitions[offset + 3 * i + 1];
            // tMax = transitions[offset + 3 * i + 2];
            let t = this.transitions[i];
            if (p.dest === t.dest) {
                if (t.min <= p.max + 1) {
                    if (t.max > p.max) {
                        p.max = t.max;
                    }
                }
                else {
                    if (p.dest !== -1) {
                        this.transitions[offset + upto].dest = p.dest;
                        this.transitions[offset + upto].min = p.min;
                        this.transitions[offset + upto].max = p.max;
                        upto++;
                    }
                    p.min = t.min;
                    p.max = t.max;
                }
            }
            else {
                if (p.dest !== -1) {
                    this.transitions[offset + upto].dest = p.dest;
                    this.transitions[offset + upto].min = p.min;
                    this.transitions[offset + upto].max = p.max;
                    upto++;
                }
                p.dest = t.dest;
                p.min = t.min;
                p.max = t.max;
            }
        }
        if (p.dest !== -1) {
            // Last transition
            this.transitions[offset + upto].dest = p.dest;
            this.transitions[offset + upto].min = p.min;
            this.transitions[offset + upto].max = p.max;
            upto++;
        }
        this.transitions = this.transitions.slice(0, upto);
        this.transitions.sort(minMaxDest);
        if (this.deterministic && upto > 1) {
            let lastMax = this.transitions[0].max;
            for (let i = 1; i < upto; i++) {
                let min = this.transitions[i].min;
                if (min <= lastMax) {
                    this.deterministic = false;
                    break;
                }
                lastMax = this.transitions[i].max;
            }
        }
        this.trans[this.currState] = this.transitions.slice();
        this.transitions = [];
    }
    getStartPoints() {
        let pointset = new Set();
        pointset.add(MIN_CODE_POINT);
        const states = Object.keys(this.trans);
        for (let i = 0; i < states.length; i++) {
            let trans = this.trans[states[i]];
            for (let j = 0; j < trans.length; j++) {
                let tran = trans[j];
                pointset.add(tran.min);
                if (tran.max < MAX_CODE_POINT) {
                    pointset.add(tran.max + 1);
                }
            }
        }
        return Array.from(pointset).sort((a, b) => a - b);
    }
    step(state, label) {
        let trans = this.trans[state];
        if (trans) {
            for (let i = 0; i < trans.length; i++) {
                let tran = trans[i];
                if (tran.min <= label && label <= tran.max) {
                    return tran.dest;
                }
            }
        }
        return -1;
    }
    getNumStates() {
        return this.nextState;
    }
    addTransition(source, dest, min, max) {
        if (this.currState !== source) {
            if (this.currState !== -1) {
                this.finishCurrentState();
            }
            this.currState = source;
        }
        this.transitions.push(new Transition(dest, min, max));
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Automaton;



/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Long__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ParametricDescription__ = __webpack_require__(12);


// 1 vectors; 2 states per vector; array length = 2
const toStates0 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x2)];
const offsetIncrs0 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x0)];
// 2 vectors; 3 states per vector; array length = 6
const toStates1 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xa43)];
const offsetIncrs1 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x38)];
// 4 vectors; 6 states per vector; array length = 24
const toStates2 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x82140003, 0x34534914), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x6d)];
const offsetIncrs2 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x55a20000, 0x5555)];
// 8 vectors; 6 states per vector; array length = 48
const toStates3 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x900C0003, 0x21520854), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x4534916d, 0x5b4d19a2), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xda34)];
const offsetIncrs3 = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x20fc0000, 0x5555ae0a), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x55555555)];
// state map
//   0 -> [(0, 0)]
//   1 -> [(0, 1)]
//   2 -> [(0, 1), (1, 1)]
//   3 -> [(0, 1), (2, 1)]
//   4 -> [t(0, 1), (0, 1), (1, 1), (2, 1)]
//   5 -> [(0, 1), (1, 1), (2, 1)]
class Lev1TParametricDescription extends __WEBPACK_IMPORTED_MODULE_1__ParametricDescription__["a" /* ParametricDescription */] {
    constructor(w) {
        super(w, 1, [0, 1, 0, -1, -1, -1]);
    }
    transition(absState, position, vector) {
        // null absState should never be passed in
        //assert absState != -1;
        // decode absState -> state, offset
        let state = Math.floor(absState / (this.w + 1));
        let offset = absState % (this.w + 1);
        //assert offset >= 0;
        if (position === this.w) {
            if (state < 2) {
                const loc = vector * 2 + state;
                offset += this.unpack(offsetIncrs0, loc, 1);
                state = this.unpack(toStates0, loc, 2) - 1;
            }
        }
        else if (position === this.w - 1) {
            if (state < 3) {
                const loc = vector * 3 + state;
                offset += this.unpack(offsetIncrs1, loc, 1);
                state = this.unpack(toStates1, loc, 2) - 1;
            }
        }
        else if (position === this.w - 2) {
            if (state < 6) {
                const loc = vector * 6 + state;
                offset += this.unpack(offsetIncrs2, loc, 2);
                state = this.unpack(toStates2, loc, 3) - 1;
            }
        }
        else {
            if (state < 6) {
                const loc = vector * 6 + state;
                offset += this.unpack(offsetIncrs3, loc, 2);
                state = this.unpack(toStates3, loc, 3) - 1;
            }
        }
        if (state === -1) {
            // null state
            return -1;
        }
        else {
            // translate back to abs
            return state * (this.w + 1) + offset;
        }
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Lev1TParametricDescription;



/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Long__ = __webpack_require__(3);

const MASKS = [new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x1), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x3), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x7), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xf),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x1f), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x3f), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x7f), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x1ff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x3ff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x7ff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xf, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xf, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xf, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xf, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffffff, 0x7fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xfffffffffff, 0xffff),
    new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffffffff, 0x1fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffffffff, 0x3fff), new __WEBPACK_IMPORTED_MODULE_0__Long__["a" /* Long */](0xffffffffffff, 0x7fff)];
class ParametricDescription {
    constructor(w, n, minErrors) {
        this.w = w;
        this.n = n;
        this.minErrors = minErrors;
    }
    /**
     * Return the number of states needed to compute a Levenshtein DFA
     */
    size() {
        return this.minErrors.length * (this.w + 1);
    }
    /**
     * Returns true if the <code>state</code> in any Levenshtein DFA is an accept state (final state).
     */
    isAccept(absState) {
        // decode absState -> state, offset
        let state = Math.floor(absState / (this.w + 1));
        let offset = absState % (this.w + 1);
        //assert offset >= 0;
        return this.w - offset + this.minErrors[state] <= this.n;
    }
    /**
     * Returns the position in the input word for a given <code>state</code>.
     * This is the minimal boundary for the state.
     */
    getPosition(absState) {
        return absState % (this.w + 1);
    }
    unpack(data, index, bitsPerValue) {
        const bitLoc = bitsPerValue * index;
        const dataLoc = (bitLoc >> 6);
        const bitStart = (bitLoc & 63);
        if (bitStart + bitsPerValue <= 64) {
            // not split
            return data[dataLoc].shiftRight(bitStart).and(MASKS[bitsPerValue - 1]).toInt();
        }
        else {
            // split
            const part = 64 - bitStart;
            return (data[dataLoc].shiftRight(bitStart).and(MASKS[part - 1])).toInt()
                + (data[1 + dataLoc].and(MASKS[bitsPerValue - part - 1]).shiftLeft(part)).toInt();
        }
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ParametricDescription;



/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {function getGlobal() {
    let glob;
    (function (global) {
        glob = global;
    })(global !== undefined && global || this);
    return glob;
}
function create() {
    const global = getGlobal();
    const sym = Symbol.for("LOKI");
    if (global[sym] === undefined) {
        global[sym] = {};
    }
    return global[sym];
}
/**
 * @hidden
 */
const PLUGINS = create();
/* harmony export (immutable) */ __webpack_exports__["a"] = PLUGINS;


/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(14)))

/***/ }),
/* 14 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ })
/******/ ]);
});
//# sourceMappingURL=lokijs.full-text-search.js.map