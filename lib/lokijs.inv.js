(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("inv", [], factory);
	else if(typeof exports === 'object')
		exports["inv"] = factory();
	else
		root["lokijs"] = root["lokijs"] || {}, root["lokijs"]["inv"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
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
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.FullTextSearch = undefined;
	
	var _inverted_index = __webpack_require__(1);
	
	var _index_searcher = __webpack_require__(3);
	
	class FullTextSearch {
		constructor(options) {
			if (options === undefined) {
				throw new SyntaxError('Options needs to be defined!');
			}
	
			this._invIdxs = {};
			// Get field names.
			switch (Object.prototype.toString.call(options.fields)) {
				case '[object Array]':
					for (let i = 0; i < options.fields.length; i++) {
						if (typeof options.fields[i] !== 'string') {
							throw new TypeError('Fields needs to be a string or an array of strings');
						}
						this._invIdxs[options.fields[i]] = new _inverted_index.InvertedIndex(options.fields[i]);
					}
					break;
				case '[object String]':
					this._invIdxs[options.fields] = new _inverted_index.InvertedIndex(options.fields);
					break;
				default:
					throw new TypeError('Fields needs to be a string or an array of strings');
			}
	
			this._docs = new Set();
			this._idxSearcher = new _index_searcher.IndexSearcher(this._invIdxs, this._docs);
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
	
		loadJSON(serialized) {
			let db = JSON.parse(serialized);
			let fieldNames = Object.keys(db);
			for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
				this._invIdxs[fieldName] = new _inverted_index.InvertedIndex({});
				this._invIdxs[fieldName].loadJSON(db[fieldName]);
			}
		}
	
		setDirty() {
			this._idxSearcher.setDirty();
		}
	}
	exports.FullTextSearch = FullTextSearch;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.InvertedIndex = undefined;
	
	var _tokenizer = __webpack_require__(2);
	
	/**
	 * Inverted index class handles featured text search for specific document fields.
	 * @constructor InvertedIndex
	 * @param {object} options - a configuration object
	 * @param {string|string[]} options.fields - string or array of field names to define featured text search for
	 * @param {boolean} [options.store=true] - inverted index will be stored at serialization rather than rebuilt on load.
	 */
	class InvertedIndex {
		constructor(fieldName) {
			this._fieldName = fieldName;
			this._docCount = 0;
			this._docStore = {};
			this._totalFieldLength = 0;
			this._tokenizer = new _tokenizer.Tokenizer();
			this._root = {};
		}
	
		/**
	  * Adds defined fields of a document to the inverted index.
	  * @param {object} doc - the document to add
	  * @param {number} [boost=1] - object with field (key) specific boost (value)
	  */
		insert(doc, docId, boost = 1) {
			if (this._docStore.hasOwnProperty(docId)) {
				throw new Error('Document already added.');
			}
	
			this._docCount += 1;
			this._docStore[docId] = {};
	
			// Tokenize document field.
			let fieldTokens = this._tokenizer.tokenize(doc);
			this._totalFieldLength += fieldTokens.length;
	
			let termRefs = [];
			this._docStore[docId] = { fieldLength: fieldTokens.length, boost: boost };
			Object.defineProperties(this._docStore[docId], {
				termRefs: { enumerable: false, configurable: true, writable: true, value: termRefs }
			});
	
			// Iterate over all unique field terms.
			for (let term of new Set(fieldTokens)) {
				if (term == '') {
					throw Error('Term cannot be empty!');
				}
				// Calculate term frequency.
				let tf = 0;
				for (let j = 0; j < fieldTokens.length; j++) {
					if (fieldTokens[j] == term) {
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
							parent: { enumerable: false, configurable: true, writable: true, value: branch }
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
					do {
						// Go tree upwards.
						let parent = index.parent;
						// Delete parent reference for preventing memory leak (cycle reference)
						delete index.parent;
	
						// Iterate over all children.
						var keys = Object.keys(parent);
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
	
		getDocumentCount() {
			return this._docCount;
		}
	
		getDocumentStore() {
			return this._docStore;
		}
	
		getTotalFieldLength() {
			return this._totalFieldLength;
		}
	
		getFieldName() {
			return this._fieldName;
		}
	
		getTokenizer() {
			return this._tokenizer;
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
					termIndices.push({ index: root[keys[i]], term: keys[i] });
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
					termIndices.push({ index: root, term: treeTermn });
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
			return this;
		}
	
		/**
	  * Deserialize the inverted index.
	  * @param {string} serialized - The serialized inverted index.
	  */
		loadJSON(serialized) {
			let dbObject = serialized;
	
			this._fieldName = dbObject._fieldName;
			this._docCount = dbObject._docCount;
			this._docStore = dbObject._docStore;
			this._totalFieldLength = dbObject._totalFieldLength;
			this._tokenizer = dbObject._tokenizer;
			this._root = dbObject._root;
	
			let self = this;
	
			function regenerate(index, parent) {
				// Set parent.
				if (parent !== null) {
					Object.defineProperties(index, {
						parent: { enumerable: false, configurable: true, writable: false, value: parent }
					});
				}
	
				// Iterate over all keys.
				let keys = Object.keys(index);
				for (let i = 0; i < keys.length; i++) {
					// Found term, save in document store.
					if (keys[i] == 'docs') {
						// Get documents of term.
						let docIds = Object.keys(index.docs);
						for (let j = 0; j < docIds.length; j++) {
							// Get document store at specific document/field.
							let ref = self._docStore[docIds[j]];
							if (!ref.hasOwnProperty('termRefs')) {
								Object.defineProperties(ref, {
									termRefs: { enumerable: false, configurable: true, writable: true, value: [] }
								});
							}
							// Set reference to term index.
							ref.termRefs.push(index);
						}
					} else if (keys[i] != 'df') {
						// Iterate over subtree.
						regenerate(index[keys[i]], index);
					}
				}
			}
	
			regenerate(this._root, null);
		}
	}
	exports.InvertedIndex = InvertedIndex;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
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
			// Set default splitter.
			this.setSplitter("default", Tokenizer._defaultSplitter);
		}
	
		/**
	  * Sets a function with defined label as the splitter function.
	  * The function must take a string as argument and return an array of tokens.
	  *
	  * @param {string} label - the label
	  * @param {function} func - the function
	  */
		setSplitter(label, func) {
			if (typeof label !== 'string') {
				throw TypeError("Function label must be string.");
			}
			if (typeof func !== 'function') {
				throw TypeError("Splitter must be a function.");
			}
			func[this._symbol] = label;
			this._splitter = func;
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
				throw new Error('Cannot find existing function.');
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
				throw new Error('Cannot find existing function.');
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
				return;
			}
			this._queue.splice(pos, 1);
		}
	
		/**
	  * Resets the splitter and tokenize queue to default.
	  */
		reset() {
			this._splitter = Tokenizer._defaultSplitter;
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
	  * @returns {{splitter: string, queue: string[]}} - the serialization
	  * @protected
	  */
		toJSON() {
			let serialized = { splitter: this._splitter[this._symbol], queue: [] };
			for (let i = 0; i < this._queue.length; i++) {
				serialized.queue.push(this._queue[i][this._symbol]);
			}
			return serialized;
		}
	
		/**
	  * Deserializes the tokenizer by reassign the correct function to each label.
	  * @param {{splitter: string, queue: string[]}} serialized - the serialized labels
	  * @param {{splitter: function, queue: function[]}} functions - the depending functions
	  * @protected
	  */
		loadJSON(serialized, functions) {
			this.setSplitter(serialized.splitter, functions.splitter);
			for (let i = 0; i < serialized.queue.length; i++) {
				this.add(serialized.queue[i], functions.queue[serialized.queue[i]]);
			}
		}
	
		/**
	  * Splits a string at non-alphanumeric characters into lower case tokens.
	  * @param {string} str - the string
	  * @returns {string[]} - the tokens
	  * @private
	  */
		static _defaultSplitter(str) {
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
	  * Returns the position of a function inside the queue.
	  * @param {string|function} labelFunc - an existing label or function
	  * @return {number} the position
	  * @private
	  */
		_getPosition(labelFunc) {
			if (typeof labelFunc === 'function') {
				return this._queue.indexOf(labelFunc);
			} else if (typeof labelFunc === 'string') {
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
			if (typeof label !== 'string') {
				throw TypeError("Function label must be string.");
			}
			if (typeof func !== 'function') {
				throw TypeError("Type of func must be function.");
			}
			if (typeof pos !== 'number') {
				throw TypeError("Type of pos must be number.");
			}
			func[this._symbol] = label;
			this._queue.splice(pos, 0, func);
		}
	}
	
	function f1() {}
	
	function f1_5() {}
	
	function f2() {}
	
	function f2_5() {}
	
	function f3() {}
	
	let tkz = new Tokenizer();
	tkz.add("2", f2);
	tkz.add("2.5", f2_5);
	tkz.addAfter("2.5", "3", f3);
	tkz.addBefore(f2, "1", f1);
	tkz.addAfter("1", "1.5", f1_5);
	tkz.remove(f2_5);
	tkz.remove("1.5");
	console.log(tkz._queue, tkz.toJSON());
	
	tkz = new Tokenizer();
	console.log(tkz.tokenize("hello world ho1w ar,e you toda?y."));

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.IndexSearcher = undefined;
	
	var _scorer = __webpack_require__(4);
	
	var _inverted_index = __webpack_require__(1);
	
	var _queries = __webpack_require__(5);
	
	class IndexSearcher {
		/**
	  *
	  * @param {object} invIdxs
	  */
		constructor(invIdxs, docs) {
			this._invIdxs = invIdxs;
			this._docs = docs;
			this._scorer = new _scorer.Scorer(this._invIdxs);
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
				root = this._invIdxs[fieldName]._root;
				tokenizer = this._invIdxs[fieldName]._tokenizer;
			}
	
			switch (query.type) {
				case "bool":
					{
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
				case "term":
					{
						let termIdx = _inverted_index.InvertedIndex.getTermIndex(query.value, root);
						this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, query.value);
						break;
					}
				case "terms":
					{
						for (let i = 0; i < query.values.length; i++) {
							let termIdx = _inverted_index.InvertedIndex.getTermIndex(query.values[i], root);
							this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, query.values[i]);
						}
						break;
					}
				case "fuzzy":
					{
						let f = new FuzzySearch(query);
						let b = f.search(root);
						for (let i = 0; i < b.length; i++) {
							this._scorer.prepare(fieldName, boost * b[i].boost, b[i].index, doScoring, docResults, b[i].term);
						}
						break;
					}
				case "wildcard":
					{
						let w = new WildcardSearch(query);
						let a = w.search(root);
						for (let i = 0; i < a.length; i++) {
							this._scorer.prepare(fieldName, boost, a[i].index, doScoring, docResults, a[i].term);
						}
						break;
					}
				case "match_all":
					{
						for (let docId of this._docs) {
							this._scorer.scoreConstant(boost, docId, docResults);
						}
						break;
					}
				case "constant_score":
					{
						docResults = this._getAll(query.filter.values, false);
						let docs = Object.keys(docResults);
						// Add to each document a constant score.
						for (let i = 0; i < docs.length; i++) {
							this._scorer.scoreConstant(boost, docs[i], docResults);
						}
						break;
					}
				case "prefix":
					{
						let termIdx = _inverted_index.InvertedIndex.getTermIndex(query.value, root);
						if (termIdx != null) {
							termIdx = _inverted_index.InvertedIndex.extendTermIndex(termIdx);
						}
						for (let i = 0; i < termIdx.length; i++) {
							this._scorer.prepare(fieldName, boost, termIdx[i].index, doScoring, docResults, query.value + termIdx[i].term);
						}
						break;
					}
				case "exists":
					{
						if (root != null) {
							let docs = Object.keys(this._invIdxs[fieldName].getDocumentStore());
							for (let i = 0; i < docs.length; i++) {
								this._scorer.scoreConstant(boost, docs[i], docResults);
							}
						}
						break;
					}
				case "match":
					{
						let terms = tokenizer.tokenize(query.query);
						let operator = query.hasOwnProperty("operator") ? query.operator : "or";
	
						let tmpQuery = new _queries.QueryBuilder().bool();
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
	
	exports.IndexSearcher = IndexSearcher;
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
					if (b[i - 1] === a[j - 1]) {
						// match
						val = row[j - 1];
					} else {
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
				start = _inverted_index.InvertedIndex.getTermIndex(pre, start);
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
					var distance = this.levenshtein_distance(fuzzy, treeTerms);
					if (distance <= this._fuzziness) {
						// Calculate boost.
						let boost = 1 - distance / (pre.length + treeTerms.length);
						similarTokens.push({ term: pre + treeTerms, index: root, boost: boost });
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
			this._wildcard = query.wildcard;
			this._result = [];
		}
	
		/**
	  * Performs a wild card search for a given query term.
	  * @param {string} query - a wild card query to match.
	  * @returns {Array} - array with all matching term indices.
	  */
		search(root) {
			// Todo: Need an implementation for star operator.
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
					this._result.push({ index: root, term: term });
				}
				return;
			}
	
			if (!escaped && this._wildcard[idx] === '\\') {
				this._recursive(root, idx + 1, term, true);
			} else if (!escaped && this._wildcard[idx] === '?') {
				let others = _inverted_index.InvertedIndex.getNextTermIndex(root);
				for (let i = 0; i < others.length; i++) {
					this._recursive(others[i].index, idx + 1, term + others[i].term);
				}
			} else {
				this._recursive(_inverted_index.InvertedIndex.getTermIndex(this._wildcard[idx], root), idx + 1, term + this._wildcard[idx]);
			}
		}
	}

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
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
			docResults[docId].push({ type: "constant", value: 1, boost: boost });
			return docResults;
		}
	
		finalScore(query, docResults = {}) {
	
			let result = {};
			let k1 = 1.2;
			let b = 0.75;
	
			if (query.hasOwnProperty("scoring")) {
				if (query.scoring.hasOwnProperty("k1")) {
					k1 = query.scoring.k1;
				}
				if (query.scoring.hasOwnProperty("b")) {
					b = query.scoring.b;
				}
			}
	
			let docs = Object.keys(docResults);
			for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
				let docScore = 0;
				for (let j = 0; j < docResults[docId].length; j++) {
					let docResult = docResults[docId][j];
	
					let res = 0;
					switch (docResult.type) {
						case 'BM25':
							{
								let fieldLength = this._invIdxs[docResult.fieldName].getDocumentStore()[docId].fieldLength / Math.pow(this._invIdxs[docResult.fieldName].getDocumentStore()[docId].boost, 2);
								let avgFieldLength = this._avgFieldLength(docResult.fieldName);
								let tfNorm = (k1 + 1) * docResult.tf / (k1 * (1 - b + b * (fieldLength / avgFieldLength)) + docResult.tf);
								res = docResult.idf * tfNorm * docResult.boost;
								console.log(docId + ":" + docResult.fieldName + ":" + docResult.term + " = " + res, "\n\ttype: BM25", "\n\tboost: " + docResult.boost, "\n\tidf : " + docResult.idf, "\n\ttfNorm : " + tfNorm, "\n\ttf : " + docResult.tf, "\n\tavg : " + avgFieldLength, "\n\tfl : " + fieldLength);
								break;
							}
						case 'constant':
							res = docResult.value * docResult.boost;
							console.log("Constant: " + res, "\n\tboost: " + docResult.boost, "\n\tvalue : " + docResult.value);
							break;
					}
					docScore += res;
				}
				console.log(docId, " === ", docScore);
				result[docId] = docScore;
			}
			return result;
		}
	
		_getCache(fieldName) {
			if (!this._cache.hasOwnProperty(fieldName)) {
				let avgFieldLength = this._invIdxs[fieldName].getTotalFieldLength() / this._invIdxs[fieldName].getDocumentCount();
				this._cache[fieldName] = { idfs: {}, avgFieldLength: avgFieldLength };
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
			return cache.idfs[docFreq] = Math.log(1 + (this._invIdxs[fieldName].getDocumentCount() - docFreq + 0.5) / (docFreq + 0.5));
		}
	
		_avgFieldLength(fieldName) {
			return this._getCache(fieldName).avgFieldLength;
		}
	}
	exports.Scorer = Scorer;

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	class BoostQuery {
		constructor(type, data = {}) {
			this._data = data;
			this._data.type = type;
		}
	
		boost(value) {
			if (typeof value !== "number" || value < 0) {
				throw TypeError("Boost must be a positive number.");
			}
			this._data.boost = value;
			return this;
		}
	
		build() {
			return this._data;
		}
	}
	
	class TermQuery extends BoostQuery {
		/**
	  * Constructs a term query.
	  * @param {string} field - the field name where the term should be searched
	  * @param {string} term - the term
	  */
		constructor(field, term, data = {}) {
			super("term", data);
			this._data.field = field;
			this._data.value = term;
		}
	}
	
	class TermsQuery extends BoostQuery {
		/**
	  * Constructs a term query.
	  * @param {string} field - the field name where the term should be searched
	  * @param {string} term - the term
	  */
		constructor(field, terms, data = {}) {
			super("terms", data);
			this._data.field = field;
			if (!Array.isArray(terms)) {
				throw TypeError("Value for terms must be an array.");
			}
			this._data.values = terms;
		}
	}
	
	class WildcardQuery extends BoostQuery {
		constructor(field, wildcard, data = {}) {
			super("wildcard", data);
			this._data.field = field;
			this._data.wildcard = wildcard;
		}
	}
	
	class FuzzyQuery extends BoostQuery {
		constructor(field, fuzzy, data = {}) {
			super("fuzzy", data);
			this._data.field = field;
			this._data.value = fuzzy;
		}
	
		fuzziness(fuzziness) {
			if (typeof fuzziness !== "number" || fuzziness < 0) {
				throw TypeError("Fuzziness must be a positive number.");
			}
			this._data.fuzziness = fuzziness;
			return this;
		}
	
		prefixLength(prefixLength) {
			if (typeof prefixLength !== "number" || prefixLength < 0) {
				throw TypeError("Prefix length must be a positive number.");
			}
			this._data.prefix_length = prefixLength;
			return this;
		}
	}
	
	class PrefixQuery extends BoostQuery {
		constructor(field, prefix, data = {}) {
			super("prefix", data);
			this._data.field = field;
			this._data.value = prefix;
		}
	}
	
	class ExistsQuery extends BoostQuery {
		constructor(field, data = {}) {
			super("exists", data);
			this._data.field = field;
		}
	}
	
	class MatchQuery extends BoostQuery {
		constructor(field, query, data = {}) {
			super("match", data);
			this._data.field = field;
			this._data.query = query;
		}
	
		minimumShouldMatch(minShouldMatch) {
			if (typeof minShouldMatch !== "number") {
				throw TypeError("Value for minimum should match must be a number.");
			}
			if (this._data.hasOwnProperty("operator") && this._data.operator == "and") {
				throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
			}
			this._data.minimum_should_match = minShouldMatch;
			return this;
		}
	
		operator(value) {
			if (typeof value !== "string") {
				throw TypeError("Value for operator must be a string.");
			}
			if (value != 'and' && value != 'or') {
				throw SyntaxError("Unknown operator.");
			}
			this._data.operator = value;
			if (this._data.hasOwnProperty("minimum_should_match") && this._data.operator == "and") {
				throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
			}
			return this;
		}
	
		fuzziness(fuzziness) {
			if (typeof fuzziness !== "number" || fuzziness < 0) {
				throw TypeError("Fuzziness must be a positive number.");
			}
			this._data.fuzziness = fuzziness;
			return this;
		}
	
		prefixLength(prefixLength) {
			if (typeof prefixLength !== "number" || prefixLength < 0) {
				throw TypeError("Prefix length must be a positive number.");
			}
			this._data.prefix_length = prefixLength;
			return this;
		}
	}
	
	class MatchAll extends BoostQuery {
		constructor(data = {}) {
			super("match_all", data);
		}
	}
	
	class ArrayQuery extends BoostQuery {
		constructor(callbackName, callback, data = {}) {
			super("array", data);
			this._data.values = [];
			this._callbackName = callbackName;
			this[callbackName] = callback;
	
			let self = this;
			this._prepare = (queryType, ...args) => {
				let data = {};
				let query = new queryType(...args, data);
				self._data.values.push(data);
				query.bool = self.bool;
				query.constantScore = self.constantScore;
				query.term = self.term;
				query.terms = self.terms;
				query.wildcard = self.wildcard;
				query.fuzzy = self.fuzzy;
				query.match = self.match;
				query.matchAll = self.matchAll;
				query.prefix = self.prefix;
				query.exists = self.exists;
				query._prepare = self._prepare;
				query[self._callbackName] = self[self._callbackName];
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
			return this._prepare(MatchAll);
		}
	
		prefix(field, prefix) {
			return this._prepare(PrefixQuery, field, prefix);
		}
	
		exists(field) {
			return this._prepare(ExistsQuery, field);
		}
	}
	
	class ConstantScoreQuery extends BoostQuery {
		constructor(data = {}) {
			super("constant_score", data);
	
			let self = this;
			this._callback = () => {
				return self;
			};
		}
	
		startFilter() {
			this._data.filter = {};
			return new ArrayQuery("endFilter", this._callback, this._data.filter);
		}
	}
	
	class BoolQuery extends BoostQuery {
		constructor(data = {}) {
			super("bool", data);
	
			let self = this;
			this._callback = () => {
				return self;
			};
		}
	
		startMust() {
			this._data.must = {};
			return new ArrayQuery("endMust", this._callback, this._data.must);
		}
	
		startFilter() {
			this._data.filter = {};
			return new ArrayQuery("endFilter", this._callback, this._data.filter);
		}
	
		startShould() {
			this._data.should = {};
			return new ArrayQuery("endShould", this._callback, this._data.should);
		}
	
		startNot() {
			this._data.not = {};
			return new ArrayQuery("endNot", this._callback, this._data.not);
		}
	
		minimumShouldMatch(minShouldMatch) {
			if (typeof minShouldMatch !== "number" || minShouldMatch < 0) {
				throw TypeError("Minimum should match must be a number greater than zero.");
			}
			this._data.minimum_should_match = minShouldMatch;
			return this;
		}
	}
	
	class QueryBuilder {
		constructor() {
			this._data = { query: {} };
	
			let self = this;
			let callback = () => {
				return self._data;
			};
	
			this._prepare = (queryType, ...args) => {
				this._child = new queryType(...args, this._data.query);
				this._child.build = callback;
				return this._child;
			};
		}
	
		enableFinalScoring(enabled) {
			if (typeof enabled !== "boolean") {
				throw TypeError("Enable scoring must a boolean.");
			}
			this._data.final_scoring = enabled;
			return this;
		}
	
		useBM25(k1, b) {
			if (typeof k1 !== "number" || k1 < 0) {
				throw TypeError("BM25s k1 must be a positive number.");
			}
			if (typeof b !== "number" || b < 0 || b > 1) {
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
			return this._prepare(MatchAll);
		}
	
		prefix(field, prefix) {
			return this._prepare(PrefixQuery, field, prefix);
		}
	
		exists(field) {
			return this._prepare(ExistsQuery, field);
		}
	}
	exports.QueryBuilder = QueryBuilder;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=lokijs.inv.js.map