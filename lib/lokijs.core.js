(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("core", [], factory);
	else if(typeof exports === 'object')
		exports["core"] = factory();
	else
		root["lokijs"] = root["lokijs"] || {}, root["lokijs"]["core"] = factory();
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
	
	var _lokicore = __webpack_require__(1);
	
	module.exports = _lokicore.Loki;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.Loki = undefined;
	
	var _event_emitter = __webpack_require__(2);
	
	var _fs_adapter = __webpack_require__(3);
	
	var _local_storage_adapter = __webpack_require__(4);
	
	var _collection = __webpack_require__(5);
	
	var _utils = __webpack_require__(10);
	
	/*
	'LokiFsAdapter' is not defined                 no-undef	x
	'LokiLocalStorageAdapter' is not defined       no-undef	x
	'Collection' is not defined                    no-undef	x
	'delim' is not defined                         no-undef	x
	'Utils' is not defined                         no-undef	x
	 */
	
	/**
	 * Loki: The main database class
	 * @constructor Loki
	 * @implements LokiEventEmitter
	 * @param {string} filename - name of the file to be saved to
	 * @param {object=} options - (Optional) config options object
	 * @param {string} options.env - override environment detection as 'NODEJS', 'BROWSER', 'CORDOVA'
	 * @param {boolean} options.verbose - enable console output (default is 'false')
	 */
	class Loki extends _event_emitter.LokiEventEmitter {
	
		constructor(filename, options) {
			super();
			this.filename = filename || 'loki.db';
			this.collections = [];
	
			// persist version of code which created the database to the database.
			// could use for upgrade scenarios
			this.databaseVersion = 1.1;
			this.engineVersion = 1.1;
	
			// autosave support (disabled by default)
			// pass autosave: true, autosaveInterval: 6000 in options to set 6 second autosave
			this.autosave = false;
			this.autosaveInterval = 5000;
			this.autosaveHandle = null;
	
			this.options = {
				serializationMethod: options && options.hasOwnProperty('serializationMethod') ? options.serializationMethod : 'normal',
				destructureDelimiter: options && options.hasOwnProperty('destructureDelimiter') ? options.destructureDelimiter : '$<\n'
			};
	
			// currently keeping persistenceMethod and persistenceAdapter as loki level properties that
			// will not or cannot be deserialized.  You are required to configure persistence every time
			// you instantiate a loki object (or use default environment detection) in order to load the database anyways.
	
			// persistenceMethod could be 'fs', 'localStorage', or 'adapter'
			// this is optional option param, otherwise environment detection will be used
			// if user passes their own adapter we will force this method to 'adapter' later, so no need to pass method option.
			this.persistenceMethod = null;
	
			// retain reference to optional (non-serializable) persistenceAdapter 'instance'
			this.persistenceAdapter = null;
	
			// enable console output if verbose flag is set (disabled by default)
			this.verbose = options && options.hasOwnProperty('verbose') ? options.verbose : false;
	
			this.events = {
				'init': [],
				'loaded': [],
				'flushChanges': [],
				'close': [],
				'changes': [],
				'warning': []
			};
	
			var getENV = function () {
				if (typeof window === 'undefined') {
					return 'NODEJS';
				}
	
				if (typeof global !== 'undefined' && global.window) {
					return 'NODEJS'; //node-webkit
				}
	
				if (typeof document !== 'undefined') {
					if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1) {
						return 'CORDOVA';
					}
					return 'BROWSER';
				}
				return 'CORDOVA';
			};
	
			// refactored environment detection due to invalid detection for browser environments.
			// if they do not specify an options.env we want to detect env rather than default to nodejs.
			// currently keeping two properties for similar thing (options.env and options.persistenceMethod)
			//   might want to review whether we can consolidate.
			if (options && options.hasOwnProperty('env')) {
				this.ENV = options.env;
			} else {
				this.ENV = getENV();
			}
	
			this.on('init', this.clearChanges);
		}
	
		// experimental support for browserify's abstract syntax scan to pick up dependency of indexed adapter.
		// Hopefully, once this hits npm a browserify require of lokijs should scan the main file and detect this indexed adapter reference.
		getIndexedAdapter() {
			var adapter;
	
			if (true) {
				adapter = __webpack_require__(13);
			}
	
			return adapter;
		}
	
		/**
	  * configures options related to database persistence.
	  *
	  * @param {object} options - configuration options to apply to loki db object
	  * @param {adapter} options.adapter - an instance of a loki persistence adapter
	  * @param {boolean} options.autosave - enables autosave
	  * @param {int} options.autosaveInterval - time interval (in milliseconds) between saves (if dirty)
	  * @param {boolean} options.autoload - enables autoload on loki instantiation
	  * @param {object} options.inflate - options that are passed to loadDatabase if autoload enabled
	  * @param {string} options.serializationMethod - ['normal', 'pretty', 'destructured']
	  * @param {string} options.destructureDelimiter - string delimiter used for destructured serialization
	  * @returns {Promise} a Promise that resolves after initialization and (if enabled) autoloading the database
	  * @memberof Loki
	  */
		initializePersistence(options) {
			var self = this;
			var defaultPersistence = {
				'NODEJS': 'fs',
				'BROWSER': 'localStorage',
				'CORDOVA': 'localStorage'
			},
			    persistenceMethods = {
				'fs': _fs_adapter.LokiFsAdapter,
				'localStorage': _local_storage_adapter.LokiLocalStorageAdapter
			};
	
			this.options = options || {};
	
			this.persistenceMethod = null;
			// retain reference to optional persistence adapter 'instance'
			// currently keeping outside options because it can't be serialized
			this.persistenceAdapter = null;
	
			// process the options
			if (this.options.hasOwnProperty('persistenceMethod')) {
				// check if the specified persistence method is known
				if (typeof persistenceMethods[this.options.persistenceMethod] === 'function') {
					this.persistenceMethod = this.options.persistenceMethod;
					this.persistenceAdapter = new persistenceMethods[this.options.persistenceMethod]();
				}
				// should be throw an error here, or just fall back to defaults ??
			}
	
			// ensure defaults exists for options which were not set
			if (!this.options.hasOwnProperty('serializationMethod')) {
				this.options.serializationMethod = 'normal';
			}
	
			// ensure passed or default option exists
			if (!this.options.hasOwnProperty('destructureDelimiter')) {
				this.options.destructureDelimiter = '$<\n';
			}
	
			// if by now there is no adapter specified by user nor derived from persistenceMethod: use sensible defaults
			if (this.persistenceAdapter === null) {
				this.persistenceMethod = defaultPersistence[this.ENV];
				if (this.persistenceMethod) {
					this.persistenceAdapter = new persistenceMethods[this.persistenceMethod]();
				}
			}
	
			// if user passes adapter, set persistence mode to adapter and retain persistence adapter instance
			if (this.options.hasOwnProperty('adapter')) {
				this.persistenceMethod = 'adapter';
				this.persistenceAdapter = this.options.adapter;
			}
	
			if (this.options.hasOwnProperty('autosaveInterval')) {
				this.autosaveInterval = parseInt(this.options.autosaveInterval, 10);
			}
	
			this.autosaveDisable();
	
			var loaded;
	
			// if they want to load database on loki instantiation, now is a good time to load... after adapter set and before possible autosave initiation
			if (this.options.autoload) {
				loaded = this.loadDatabase(this.options.inflate);
			} else {
				loaded = Promise.resolve();
			}
	
			return loaded.then(function () {
				if (self.options.autosave) {
					self.autosaveEnable();
				}
			});
		}
	
		/**
	  * Copies 'this' database into a new Loki instance. Object references are shared to make lightweight.
	  *
	  * @param {object} options - apply or override collection level settings
	  * @param {bool} options.removeNonSerializable - nulls properties not safe for serialization.
	  * @memberof Loki
	  */
		copy(options) {
			var databaseCopy = new Loki(this.filename);
			var clen, idx;
	
			options = options || {};
	
			// currently inverting and letting loadJSONObject do most of the work
			databaseCopy.loadJSONObject(this, {
				retainDirtyFlags: true
			});
	
			// since our JSON serializeReplacer is not invoked for reference database adapters, this will let us mimic
			if (options.hasOwnProperty("removeNonSerializable") && options.removeNonSerializable === true) {
				databaseCopy.autosaveHandle = null;
				databaseCopy.persistenceAdapter = null;
	
				clen = databaseCopy.collections.length;
				for (idx = 0; idx < clen; idx++) {
					databaseCopy.collections[idx].constraints = null;
					databaseCopy.collections[idx].ttl = null;
				}
			}
	
			return databaseCopy;
		}
	
		/**
	  * Shorthand method for quickly creating and populating an anonymous collection.
	  *    This collection is not referenced internally so upon losing scope it will be garbage collected.
	  *
	  * @example
	  * var results = new loki().anonym(myDocArray).find({'age': {'$gt': 30} });
	  *
	  * @param {Array} docs - document array to initialize the anonymous collection with
	  * @param {object} options - configuration object, see {@link Loki#addCollection} options
	  * @returns {Collection} New collection which you can query or chain
	  * @memberof Loki
	  */
		anonym(docs, options) {
			var collection = new _collection.Collection('anonym', options);
			collection.insert(docs);
	
			if (this.verbose) collection.console = console;
	
			return collection;
		}
	
		/**
	  * Adds a collection to the database.
	  * @param {string} name - name of collection to add
	  * @param {object=} options - (optional) options to configure collection with.
	  * @param {array} options.unique - array of property names to define unique constraints for
	  * @param {array} options.exact - array of property names to define exact constraints for
	  * @param {array} options.indices - array property names to define binary indexes for
	  * @param {boolean} options.asyncListeners - default is false
	  * @param {boolean} options.disableChangesApi - default is true
	  * @param {boolean} options.autoupdate - use Object.observe to update objects automatically (default: false)
	  * @param {boolean} options.clone - specify whether inserts and queries clone to/from user
	  * @param {string} options.cloneMethod - 'parse-stringify' (default), 'jquery-extend-deep', 'shallow'
	  * @param {int} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
	  * @returns {Collection} a reference to the collection which was just added
	  * @memberof Loki
	  */
		addCollection(name, options) {
			var collection = new _collection.Collection(name, options);
			this.collections.push(collection);
	
			if (this.verbose) collection.console = console;
	
			return collection;
		}
	
		loadCollection(collection) {
			if (!collection.name) {
				throw new Error('Collection must have a name property to be loaded');
			}
			this.collections.push(collection);
		}
	
		/**
	  * Retrieves reference to a collection by name.
	  * @param {string} collectionName - name of collection to look up
	  * @returns {Collection} Reference to collection in database by that name, or null if not found
	  * @memberof Loki
	  */
		getCollection(collectionName) {
			var i,
			    len = this.collections.length;
	
			for (i = 0; i < len; i += 1) {
				if (this.collections[i].name === collectionName) {
					return this.collections[i];
				}
			}
	
			// no such collection
			this.emit('warning', 'collection ' + collectionName + ' not found');
			return null;
		}
	
		listCollections() {
	
			var i = this.collections.length,
			    colls = [];
	
			while (i--) {
				colls.push({
					name: this.collections[i].name,
					type: this.collections[i].objType,
					count: this.collections[i].data.length
				});
			}
			return colls;
		}
	
		/**
	  * Removes a collection from the database.
	  * @param {string} collectionName - name of collection to remove
	  * @memberof Loki
	  */
		removeCollection(collectionName) {
			var i,
			    len = this.collections.length;
	
			for (i = 0; i < len; i += 1) {
				if (this.collections[i].name === collectionName) {
					var tmpcol = new _collection.Collection(collectionName, {});
					var curcol = this.collections[i];
					for (var prop in curcol) {
						if (curcol.hasOwnProperty(prop) && tmpcol.hasOwnProperty(prop)) {
							curcol[prop] = tmpcol[prop];
						}
					}
					this.collections.splice(i, 1);
					return;
				}
			}
		}
	
		getName() {
			return this.name;
		}
	
		/**
	  * serializeReplacer - used to prevent certain properties from being serialized
	  *
	  */
		serializeReplacer(key, value) {
			switch (key) {
				case 'autosaveHandle':
				case 'persistenceAdapter':
				case 'constraints':
				case 'ttl':
					return null;
				default:
					return value;
			}
		}
	
		/**
	  * Serialize database to a string which can be loaded via {@link Loki#loadJSON}
	  *
	  * @returns {string} Stringified representation of the loki database.
	  * @memberof Loki
	  */
		serialize(options) {
			options = options || {};
	
			if (!options.hasOwnProperty("serializationMethod")) {
				options.serializationMethod = this.options.serializationMethod;
			}
	
			switch (options.serializationMethod) {
				case "normal":
					return JSON.stringify(this, this.serializeReplacer);
				case "pretty":
					return JSON.stringify(this, this.serializeReplacer, 2);
				case "destructured":
					return this.serializeDestructured(); // use default options
				default:
					return JSON.stringify(this, this.serializeReplacer);
			}
		}
	
		// alias of serialize
		toJson() {
			return this.serialize;
		}
	
		/**
	  * Destructured JSON serialization routine to allow alternate serialization methods.
	  * Internally, Loki supports destructuring via loki "serializationMethod' option and
	  * the optional LokiPartitioningAdapter class. It is also available if you wish to do
	  * your own structured persistence or data exchange.
	  *
	  * @param {object=} options - output format options for use externally to loki
	  * @param {bool=} options.partitioned - (default: false) whether db and each collection are separate
	  * @param {int=} options.partition - can be used to only output an individual collection or db (-1)
	  * @param {bool=} options.delimited - (default: true) whether subitems are delimited or subarrays
	  * @param {string=} options.delimiter - override default delimiter
	  *
	  * @returns {string|array} A custom, restructured aggregation of independent serializations.
	  * @memberof Loki
	  */
		serializeDestructured(options) {
			var idx, sidx, result, resultlen;
			var reconstruct = [];
			var dbcopy;
	
			options = options || {};
	
			if (!options.hasOwnProperty("partitioned")) {
				options.partitioned = false;
			}
	
			if (!options.hasOwnProperty("delimited")) {
				options.delimited = true;
			}
	
			if (!options.hasOwnProperty("delimiter")) {
				options.delimiter = this.options.destructureDelimiter;
			}
	
			// 'partitioned' along with 'partition' of 0 or greater is a request for single collection serialization
			if (options.partitioned === true && options.hasOwnProperty("partition") && options.partition >= 0) {
				return this.serializeCollection({
					delimited: options.delimited,
					delimiter: options.delimiter,
					collectionIndex: options.partition
				});
			}
	
			// not just an individual collection, so we will need to serialize db container via shallow copy
			dbcopy = new Loki(this.filename);
			dbcopy.loadJSONObject(this);
	
			for (idx = 0; idx < dbcopy.collections.length; idx++) {
				dbcopy.collections[idx].data = [];
			}
	
			// if we -only- wanted the db container portion, return it now
			if (options.partitioned === true && options.partition === -1) {
				// since we are deconstructing, override serializationMethod to normal for here
				return dbcopy.serialize({
					serializationMethod: "normal"
				});
			}
	
			// at this point we must be deconstructing the entire database
			// start by pushing db serialization into first array element
			reconstruct.push(dbcopy.serialize({
				serializationMethod: "normal"
			}));
	
			dbcopy = null;
	
			// push collection data into subsequent elements
			for (idx = 0; idx < this.collections.length; idx++) {
				result = this.serializeCollection({
					delimited: options.delimited,
					delimiter: options.delimiter,
					collectionIndex: idx
				});
	
				// NDA : Non-Delimited Array : one iterable concatenated array with empty string collection partitions
				if (options.partitioned === false && options.delimited === false) {
					if (!Array.isArray(result)) {
						throw new Error("a nondelimited, non partitioned collection serialization did not return an expected array");
					}
	
					// Array.concat would probably duplicate memory overhead for copying strings.
					// Instead copy each individually, and clear old value after each copy.
					// Hopefully this will allow g.c. to reduce memory pressure, if needed.
					resultlen = result.length;
	
					for (sidx = 0; sidx < resultlen; sidx++) {
						reconstruct.push(result[sidx]);
						result[sidx] = null;
					}
	
					reconstruct.push("");
				} else {
					reconstruct.push(result);
				}
			}
	
			// Reconstruct / present results according to four combinations : D, DA, NDA, NDAA
			if (options.partitioned) {
				// DA : Delimited Array of strings [0] db [1] collection [n] collection { partitioned: true, delimited: true }
				// useful for simple future adaptations of existing persistence adapters to save collections separately
				if (options.delimited) {
					return reconstruct;
				}
				// NDAA : Non-Delimited Array with subArrays. db at [0] and collection subarrays at [n] { partitioned: true, delimited : false }
				// This format might be the most versatile for 'rolling your own' partitioned sync or save.
				// Memory overhead can be reduced by specifying a specific partition, but at this code path they did not, so its all.
				else {
						return reconstruct;
					}
			} else {
				// D : one big Delimited string { partitioned: false, delimited : true }
				// This is the method Loki will use internally if 'destructured'.
				// Little memory overhead improvements but does not require multiple asynchronous adapter call scheduling
				if (options.delimited) {
					// indicate no more collections
					reconstruct.push("");
	
					return reconstruct.join(options.delimiter);
				}
				// NDA : Non-Delimited Array : one iterable array with empty string collection partitions { partitioned: false, delimited: false }
				// This format might be best candidate for custom synchronous syncs or saves
				else {
						// indicate no more collections
						reconstruct.push("");
	
						return reconstruct;
					}
			}
	
			reconstruct.push("");
	
			return reconstruct.join(delim);
		}
	
		/**
	  * Utility method to serialize a collection in a 'destructured' format
	  *
	  * @param {object} options - used to determine output of method
	  * @param {int=} options.delimited - whether to return single delimited string or an array
	  * @param {string=} options.delimiter - (optional) if delimited, this is delimiter to use
	  * @param {int} options.collectionIndex -  specify which collection to serialize data for
	  *
	  * @returns {string|array} A custom, restructured aggregation of independent serializations for a single collection.
	  * @memberof Loki
	  */
		serializeCollection(options) {
			var doccount,
			    docidx,
			    resultlines = [];
	
			options = options || {};
	
			if (!options.hasOwnProperty("delimited")) {
				options.delimited = true;
			}
	
			if (!options.hasOwnProperty("collectionIndex")) {
				throw new Error("serializeCollection called without 'collectionIndex' option");
			}
	
			doccount = this.collections[options.collectionIndex].data.length;
	
			resultlines = [];
	
			for (docidx = 0; docidx < doccount; docidx++) {
				resultlines.push(JSON.stringify(this.collections[options.collectionIndex].data[docidx]));
			}
	
			// D and DA
			if (options.delimited) {
				// indicate no more documents in collection (via empty delimited string)
				resultlines.push("");
	
				return resultlines.join(options.delimiter);
			} else {
				// NDAA and NDA
				return resultlines;
			}
		}
	
		/**
	  * Destructured JSON deserialization routine to minimize memory overhead.
	  * Internally, Loki supports destructuring via loki "serializationMethod' option and
	  * the optional LokiPartitioningAdapter class. It is also available if you wish to do
	  * your own structured persistence or data exchange.
	  *
	  * @param {string|array} destructuredSource - destructured json or array to deserialize from
	  * @param {object=} options - source format options
	  * @param {bool=} options.partitioned - (default: false) whether db and each collection are separate
	  * @param {int=} options.partition - can be used to deserialize only a single partition
	  * @param {bool=} options.delimited - (default: true) whether subitems are delimited or subarrays
	  * @param {string=} options.delimiter - override default delimiter
	  *
	  * @returns {object|array} An object representation of the deserialized database, not yet applied to 'this' db or document array
	  * @memberof Loki
	  */
		deserializeDestructured(destructuredSource, options) {
			var workarray = [];
			var len, cdb;
			var idx,
			    collIndex = 0,
			    collCount,
			    lineIndex = 1,
			    done = false;
			var currLine, currObject;
	
			options = options || {};
	
			if (!options.hasOwnProperty("partitioned")) {
				options.partitioned = false;
			}
	
			if (!options.hasOwnProperty("delimited")) {
				options.delimited = true;
			}
	
			if (!options.hasOwnProperty("delimiter")) {
				options.delimiter = this.options.destructureDelimiter;
			}
	
			// Partitioned
			// DA : Delimited Array of strings [0] db [1] collection [n] collection { partitioned: true, delimited: true }
			// NDAA : Non-Delimited Array with subArrays. db at [0] and collection subarrays at [n] { partitioned: true, delimited : false }
			// -or- single partition
			if (options.partitioned) {
				// handle single partition
				if (options.hasOwnProperty('partition')) {
					// db only
					if (options.partition === -1) {
						cdb = JSON.parse(destructuredSource[0]);
	
						return cdb;
					}
	
					// single collection, return doc array
					return this.deserializeCollection(destructuredSource[options.partition + 1], options);
				}
	
				// Otherwise we are restoring an entire partitioned db
				cdb = JSON.parse(destructuredSource[0]);
				collCount = cdb.collections.length;
				for (collIndex = 0; collIndex < collCount; collIndex++) {
					// attach each collection docarray to container collection data, add 1 to collection array index since db is at 0
					cdb.collections[collIndex].data = this.deserializeCollection(destructuredSource[collIndex + 1], options);
				}
	
				return cdb;
			}
	
			// Non-Partitioned
			// D : one big Delimited string { partitioned: false, delimited : true }
			// NDA : Non-Delimited Array : one iterable array with empty string collection partitions { partitioned: false, delimited: false }
	
			// D
			if (options.delimited) {
				workarray = destructuredSource.split(options.delimiter);
				destructuredSource = null; // lower memory pressure
				len = workarray.length;
	
				if (len === 0) {
					return null;
				}
			}
			// NDA
			else {
					workarray = destructuredSource;
				}
	
			// first line is database and collection shells
			cdb = JSON.parse(workarray[0]);
			collCount = cdb.collections.length;
			workarray[0] = null;
	
			while (!done) {
				currLine = workarray[lineIndex];
	
				// empty string indicates either end of collection or end of file
				if (workarray[lineIndex] === "") {
					// if no more collections to load into, we are done
					if (++collIndex > collCount) {
						done = true;
					}
				} else {
					currObject = JSON.parse(workarray[lineIndex]);
					cdb.collections[collIndex].data.push(currObject);
				}
	
				// lower memory pressure and advance iterator
				workarray[lineIndex++] = null;
			}
	
			return cdb;
		}
	
		/**
	  * Deserializes a destructured collection.
	  *
	  * @param {string|array} destructuredSource - destructured representation of collection to inflate
	  * @param {object} options - used to describe format of destructuredSource input
	  * @param {int} options.delimited - whether source is delimited string or an array
	  * @param {string} options.delimiter - (optional) if delimited, this is delimiter to use
	  *
	  * @returns {array} an array of documents to attach to collection.data.
	  * @memberof Loki
	  */
		deserializeCollection(destructuredSource, options) {
			var workarray = [];
			var idx, len;
	
			options = options || {};
	
			if (!options.hasOwnProperty("partitioned")) {
				options.partitioned = false;
			}
	
			if (!options.hasOwnProperty("delimited")) {
				options.delimited = true;
			}
	
			if (!options.hasOwnProperty("delimiter")) {
				options.delimiter = this.options.destructureDelimiter;
			}
	
			if (options.delimited) {
				workarray = destructuredSource.split(options.delimiter);
				workarray.pop();
			} else {
				workarray = destructuredSource;
			}
	
			len = workarray.length;
			for (idx = 0; idx < len; idx++) {
				workarray[idx] = JSON.parse(workarray[idx]);
			}
	
			return workarray;
		}
	
		/**
	  * Inflates a loki database from a serialized JSON string
	  *
	  * @param {string} serializedDb - a serialized loki database string
	  * @param {object} options - apply or override collection level settings
	  * @memberof Loki
	  */
		loadJSON(serializedDb, options) {
			var dbObject;
			if (serializedDb.length === 0) {
				dbObject = {};
			} else {
				// using option defined in instantiated db not what was in serialized db
				switch (this.options.serializationMethod) {
					case "normal":
					case "pretty":
						dbObject = JSON.parse(serializedDb);
						break;
					case "destructured":
						dbObject = this.deserializeDestructured(serializedDb);
						break;
					default:
						dbObject = JSON.parse(serializedDb);
						break;
				}
			}
	
			this.loadJSONObject(dbObject, options);
		}
	
		/**
	  * Inflates a loki database from a JS object
	  *
	  * @param {object} dbObject - a serialized loki database string
	  * @param {object} options - apply or override collection level settings
	  * @param {bool?} options.retainDirtyFlags - whether collection dirty flags will be preserved
	  * @memberof Loki
	  */
		loadJSONObject(dbObject, options) {
			var i = 0,
			    len = dbObject.collections ? dbObject.collections.length : 0,
			    coll,
			    copyColl,
			    clen,
			    j,
			    loader,
			    collObj;
	
			this.name = dbObject.name;
	
			// restore database version
			this.databaseVersion = 1.0;
			if (dbObject.hasOwnProperty('databaseVersion')) {
				this.databaseVersion = dbObject.databaseVersion;
			}
	
			this.collections = [];
	
			function makeLoader(coll) {
				var collOptions = options[coll.name];
				var inflater;
	
				if (collOptions.proto) {
					inflater = collOptions.inflate || _utils.Utils.copyProperties;
	
					return function (data) {
						var collObj = new collOptions.proto();
						inflater(data, collObj);
						return collObj;
					};
				}
	
				return collOptions.inflate;
			}
	
			for (i; i < len; i += 1) {
				coll = dbObject.collections[i];
				copyColl = this.addCollection(coll.name);
	
				copyColl.adaptiveBinaryIndices = coll.hasOwnProperty('adaptiveBinaryIndices') ? coll.adaptiveBinaryIndices === true : false;
				copyColl.transactional = coll.transactional;
				copyColl.asyncListeners = coll.asyncListeners;
				copyColl.disableChangesApi = coll.disableChangesApi;
				copyColl.cloneObjects = coll.cloneObjects;
				copyColl.cloneMethod = coll.cloneMethod || "parse-stringify";
				copyColl.autoupdate = coll.autoupdate;
				copyColl.changes = coll.changes;
	
				if (options && options.retainDirtyFlags === true) {
					copyColl.dirty = coll.dirty;
				} else {
					copyColl.dirty = false;
				}
	
				// load each element individually
				clen = coll.data.length;
				j = 0;
				if (options && options.hasOwnProperty(coll.name)) {
					loader = makeLoader(coll);
	
					for (j; j < clen; j++) {
						collObj = loader(coll.data[j]);
						copyColl.data[j] = collObj;
						copyColl.addAutoUpdateObserver(collObj);
					}
				} else {
	
					for (j; j < clen; j++) {
						copyColl.data[j] = coll.data[j];
						copyColl.addAutoUpdateObserver(copyColl.data[j]);
					}
				}
	
				copyColl.maxId = coll.data.length === 0 ? 0 : coll.maxId;
				copyColl.idIndex = coll.idIndex;
				if (typeof coll.binaryIndices !== 'undefined') {
					copyColl.binaryIndices = coll.binaryIndices;
				}
				if (typeof coll.transforms !== 'undefined') {
					copyColl.transforms = coll.transforms;
				}
	
				copyColl.ensureId();
	
				// regenerate unique indexes
				copyColl.uniqueNames = [];
				if (coll.hasOwnProperty("uniqueNames")) {
					copyColl.uniqueNames = coll.uniqueNames;
					for (j = 0; j < copyColl.uniqueNames.length; j++) {
						copyColl.ensureUniqueIndex(copyColl.uniqueNames[j]);
					}
				}
	
				// in case they are loading a database created before we added dynamic views, handle undefined
				if (typeof coll.DynamicViews === 'undefined') continue;
	
				// reinflate DynamicViews and attached Resultsets
				for (var idx = 0; idx < coll.DynamicViews.length; idx++) {
					var colldv = coll.DynamicViews[idx];
	
					var dv = copyColl.addDynamicView(colldv.name, colldv.options);
					dv.resultdata = colldv.resultdata;
					dv.resultsdirty = colldv.resultsdirty;
					dv.filterPipeline = colldv.filterPipeline;
	
					dv.sortCriteria = colldv.sortCriteria;
					dv.sortFunction = null;
	
					dv.sortDirty = colldv.sortDirty;
					dv.resultset.filteredrows = colldv.resultset.filteredrows;
					dv.resultset.searchIsChained = colldv.resultset.searchIsChained;
					dv.resultset.filterInitialized = colldv.resultset.filterInitialized;
	
					dv.rematerialize({
						removeWhereFilters: true
					});
				}
			}
		}
	
		/**
	  * Emits the close event. In autosave scenarios, if the database is dirty, this will save and disable timer.
	  * Does not actually destroy the db.
	  *
	  * @returns {Promise} a Promise that resolves after closing the database succeeded
	  * @memberof Loki
	  */
		close() {
			var self = this;
			var saved;
	
			// for autosave scenarios, we will let close perform final save (if dirty)
			// For web use, you might call from window.onbeforeunload to shutdown database, saving pending changes
			if (this.autosave) {
				this.autosaveDisable();
				if (this.autosaveDirty()) {
					saved = this.saveDatabase();
				}
			}
	
			return Promise.resolve(saved).then(function () {
				self.emit('close');
			});
		}
	
		/**-------------------------+
	  | Changes API               |
	  +--------------------------*/
	
		/**
	  * The Changes API enables the tracking the changes occurred in the collections since the beginning of the session,
	  * so it's possible to create a differential dataset for synchronization purposes (possibly to a remote db)
	  */
	
		/**
	  * (Changes API) : takes all the changes stored in each
	  * collection and creates a single array for the entire database. If an array of names
	  * of collections is passed then only the included collections will be tracked.
	  *
	  * @param {array=} optional array of collection names. No arg means all collections are processed.
	  * @returns {array} array of changes
	  * @see private method createChange() in Collection
	  * @memberof Loki
	  */
		generateChangesNotification(arrayOfCollectionNames) {
			function getCollName(coll) {
				return coll.name;
			}
			var changes = [],
			    selectedCollections = arrayOfCollectionNames || this.collections.map(getCollName);
	
			this.collections.forEach(function (coll) {
				if (selectedCollections.indexOf(getCollName(coll)) !== -1) {
					changes = changes.concat(coll.getChanges());
				}
			});
			return changes;
		}
	
		/**
	  * (Changes API) - stringify changes for network transmission
	  * @returns {string} string representation of the changes
	  * @memberof Loki
	  */
		serializeChanges(collectionNamesArray) {
			return JSON.stringify(this.generateChangesNotification(collectionNamesArray));
		}
	
		/**
	  * (Changes API) : clears all the changes in all collections.
	  * @memberof Loki
	  */
		clearChanges() {
			this.collections.forEach(function (coll) {
				if (coll.flushChanges) {
					coll.flushChanges();
				}
			});
		}
	
		/**
	  * Handles loading from file system, local storage, or adapter (indexeddb).
	  *
	  * @param {object} options - an object containing inflation options for each collection
	  * @returns {Promise} a Promise that resolves after the database is loaded
	  * @memberof Loki
	  */
		loadDatabase(options) {
			var self = this;
	
			// the persistenceAdapter should be present if all is ok, but check to be sure.
			if (this.persistenceAdapter === null) {
				return Promise.reject(new Error('persistenceAdapter not configured'));
			}
	
			return Promise.resolve(this.persistenceAdapter.loadDatabase(this.filename)).then(function loadDatabaseCallback(dbString) {
				if (typeof dbString === 'string') {
					self.loadJSON(dbString, options || {});
					self.emit('load', self);
				} else {
					// if adapter has returned an js object (other than null or error) attempt to load from JSON object
					if (typeof dbString === "object" && dbString !== null && !(dbString instanceof Error)) {
						self.loadJSONObject(dbString, options || {});
						self.emit('load', self);
					} else {
						if (dbString instanceof Error) throw dbString;
	
						throw new TypeError('The persistence adapter did not load a serialized DB string or object.');
					}
				}
			});
		}
	
		/**
	  * Handles saving to file system, local storage, or adapter (indexeddb)
	  *
	  * @memberof Loki
	  * @returns {Promise} a Promise that resolves after the database is persisted
	  */
		saveDatabase() {
			var self = this;
	
			// the persistenceAdapter should be present if all is ok, but check to be sure.
			if (this.persistenceAdapter === null) {
				return Promise.reject(new Error('persistenceAdapter not configured'));
			}
	
			var saved;
	
			// check if the adapter is requesting (and supports) a 'reference' mode export
			if (this.persistenceAdapter.mode === "reference" && typeof this.persistenceAdapter.exportDatabase === "function") {
				// filename may seem redundant but loadDatabase will need to expect this same filename
				saved = this.persistenceAdapter.exportDatabase(this.filename, this.copy({
					removeNonSerializable: true
				}));
			}
			// otherwise just pass the serialized database to adapter
			else {
					saved = this.persistenceAdapter.saveDatabase(this.filename, self.serialize());
				}
	
			return Promise.resolve(saved).then(function () {
				self.autosaveClearFlags();
				self.emit("save");
			});
		}
	
		// alias
		save() {
			return this.saveDatabase();
		}
	
		/**
	  * Handles deleting a database from file system, local storage, or adapter (indexeddb)
	  *
	  * @returns {Promise} a Promise that resolves after the database is deleted
	  * @memberof Loki
	  */
		deleteDatabase() {
			// the persistenceAdapter should be present if all is ok, but check to be sure.
			if (this.persistenceAdapter === null) {
				return Promise.reject(new Error('persistenceAdapter not configured'));
			}
	
			return Promise.resolve(this.persistenceAdapter.deleteDatabase(this.filename));
		}
	
		/**
	  * autosaveDirty - check whether any collections are 'dirty' meaning we need to save (entire) database
	  *
	  * @returns {boolean} - true if database has changed since last autosave, false if not.
	  */
		autosaveDirty() {
			for (var idx = 0; idx < this.collections.length; idx++) {
				if (this.collections[idx].dirty) {
					return true;
				}
			}
	
			return false;
		}
	
		/**
	  * autosaveClearFlags - resets dirty flags on all collections.
	  *    Called from saveDatabase() after db is saved.
	  *
	  */
		autosaveClearFlags() {
			for (var idx = 0; idx < this.collections.length; idx++) {
				this.collections[idx].dirty = false;
			}
		}
	
		/**
	  * autosaveEnable - begin a javascript interval to periodically save the database.
	  *
	  */
		autosaveEnable() {
			if (this.autosaveHandle) {
				return;
			}
	
			var self = this;
			var running = true;
	
			this.autosave = true;
			this.autosaveHandle = function () {
				running = false;
				self.autosaveHandle = undefined;
			};
	
			(function saveDatabase() {
				setTimeout(function () {
					if (running) {
						self.saveDatabase().then(saveDatabase, saveDatabase);
					}
				}, self.autosaveInterval);
			})();
		}
	
		/**
	  * autosaveDisable - stop the autosave interval timer.
	  *
	  */
		autosaveDisable() {
			this.autosave = false;
	
			if (this.autosaveHandle) {
				this.autosaveHandle();
			}
		}
	}
	exports.Loki = Loki;
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	/*
	 'listen' is not defined  no-undef
	 */
	
	/**
	 * LokiEventEmitter is a minimalist version of EventEmitter. It enables any
	 * constructor that inherits EventEmitter to emit events and trigger
	 * listeners that have been added to the event through the on(event, callback) method
	 *
	 * @constructor LokiEventEmitter
	 */
	class LokiEventEmitter {
	
		constructor() {
			/**
	   * @prop {hashmap} events - a hashmap, with each property being an array of callbacks
	   * @memberof LokiEventEmitter
	   */
			this.events = {};
	
			/**
	   * @prop {boolean} asyncListeners - boolean determines whether or not the callbacks associated with each event
	   * should happen in an async fashion or not
	   * Default is false, which means events are synchronous
	   * @memberof LokiEventEmitter
	   */
			this.asyncListeners = false;
		}
	
		/**
	  * on(eventName, listener) - adds a listener to the queue of callbacks associated to an event
	  * @param {string|string[]} eventName - the name(s) of the event(s) to listen to
	  * @param {function} listener - callback function of listener to attach
	  * @returns {int} the index of the callback in the array of listeners for a particular event
	  * @memberof LokiEventEmitter
	  */
		on(eventName, listener) {
			var event;
			var self = this;
	
			if (Array.isArray(eventName)) {
				eventName.forEach(function (currentEventName) {
					self.on(currentEventName, listener);
				});
				return listener;
			}
	
			event = this.events[eventName];
			if (!event) {
				event = this.events[eventName] = [];
			}
			event.push(listener);
			return listener;
		}
	
		/**
	  * emit(eventName, data) - emits a particular event
	  * with the option of passing optional parameters which are going to be processed by the callback
	  * provided signatures match (i.e. if passing emit(event, arg0, arg1) the listener should take two parameters)
	  * @param {string} eventName - the name of the event
	  * @param {object=} data - optional object passed with the event
	  * @memberof LokiEventEmitter
	  */
		emit(eventName, data) {
			var self = this;
			if (eventName && this.events[eventName]) {
				this.events[eventName].forEach(function (listener) {
					if (self.asyncListeners) {
						setTimeout(function () {
							listener(data);
						}, 1);
					} else {
						listener(data);
					}
				});
			}
		}
	
		/**
	  * Alias of LokiEventEmitter.prototype.on
	  * addListener(eventName, listener) - adds a listener to the queue of callbacks associated to an event
	  * @param {string|string[]} eventName - the name(s) of the event(s) to listen to
	  * @param {function} listener - callback function of listener to attach
	  * @returns {int} the index of the callback in the array of listeners for a particular event
	  * @memberof LokiEventEmitter
	  */
		addListener(eventName, listener) {
			return this.on(eventName, listener);
		}
	
		/**
	  * removeListener() - removes the listener at position 'index' from the event 'eventName'
	  * @param {string|string[]} eventName - the name(s) of the event(s) which the listener is attached to
	  * @param {function} listener - the listener callback function to remove from emitter
	  * @memberof LokiEventEmitter
	  */
		removeListener(eventName, listener) {
			var self = this;
			if (Array.isArray(eventName)) {
				eventName.forEach(function (currentEventName) {
					self.removeListener(currentEventName, listen);
				});
			}
	
			if (this.events[eventName]) {
				var listeners = this.events[eventName];
				listeners.splice(listeners.indexOf(listener), 1);
			}
		}
	}
	exports.LokiEventEmitter = LokiEventEmitter;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	/**
	 * A loki persistence adapter which persists using node fs module
	 * @constructor LokiFsAdapter
	 */
	class LokiFsAdapter {
	
		constructor() {
			this.fs = undefined; //TODO require('fs');
		}
	
		/**
	  * loadDatabase() - Load data from file, will throw an error if the file does not exist
	  * @param {string} dbname - the filename of the database to load
	  * @returns {Promise} a Promise that resolves after the database was loaded
	  * @memberof LokiFsAdapter
	  */
		loadDatabase(dbname) {
			var self = this;
	
			return new Promise(function (resolve, reject) {
				self.fs.stat(dbname, function (err, stats) {
					if (!err && stats.isFile()) {
						self.fs.readFile(dbname, {
							encoding: 'utf8'
						}, function readFileCallback(err, data) {
							if (err) {
								reject(err);
							} else {
								resolve(data);
							}
						});
					} else {
						reject();
					}
				});
			});
		}
	
		/**
	  * saveDatabase() - save data to file, will throw an error if the file can't be saved
	  * might want to expand this to avoid dataloss on partial save
	  * @param {string} dbname - the filename of the database to load
	  * @returns {Promise} a Promise that resolves after the database was persisted
	  * @memberof LokiFsAdapter
	  */
		saveDatabase(dbname, dbstring) {
			var self = this;
			var tmpdbname = dbname + '~';
	
			return new Promise(function (resolve, reject) {
				self.fs.writeFile(tmpdbname, dbstring, function (err) {
					if (err) {
						reject(err);
					} else {
						self.fs.rename(tmpdbname, dbname, function (err) {
							if (err) {
								reject(err);
							} else {
								resolve();
							}
						});
					}
				});
			});
		}
	
		/**
	  * deleteDatabase() - delete the database file, will throw an error if the
	  * file can't be deleted
	  * @param {string} dbname - the filename of the database to delete
	  * @returns {Promise} a Promise that resolves after the database was deleted
	  * @memberof LokiFsAdapter
	  */
		deleteDatabase(dbname) {
			var self = this;
	
			return new Promise(function (resolve, reject) {
				self.fs.unlink(dbname, function deleteDatabaseCallback(err) {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}
	}
	exports.LokiFsAdapter = LokiFsAdapter;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	function localStorageAvailable() {
		try {
			return window && window.localStorage !== undefined && window.localStorage !== null;
		} catch (e) {
			return false;
		}
	}
	/*
	 'localStorageAvailable' is not defined
	 */
	
	/**
	 * A loki persistence adapter which persists to web browser's local storage object
	 * @constructor LokiLocalStorageAdapter
	 */
	class LokiLocalStorageAdapter {
	
		/**
	  * loadDatabase() - Load data from localstorage
	  * @param {string} dbname - the name of the database to load
	  * @returns {Promise} a Promise that resolves after the database was loaded
	  * @memberof LokiLocalStorageAdapter
	  */
		loadDatabase(dbname) {
			if (localStorageAvailable()) {
				return Promise.resolve(localStorage.getItem(dbname));
			}
	
			return Promise.reject(new Error('localStorage is not available'));
		}
	
		/**
	  * saveDatabase() - save data to localstorage, will throw an error if the file can't be saved
	  * might want to expand this to avoid dataloss on partial save
	  * @param {string} dbname - the filename of the database to load
	  * @returns {Promise} a Promise that resolves after the database was saved
	  * @memberof LokiLocalStorageAdapter
	  */
		saveDatabase(dbname, dbstring) {
			if (localStorageAvailable()) {
				localStorage.setItem(dbname, dbstring);
	
				return Promise.resolve();
			}
	
			return Promise.reject(new Error('localStorage is not available'));
		}
	
		/**
	  * deleteDatabase() - delete the database from localstorage, will throw an error if it
	  * can't be deleted
	  * @param {string} dbname - the filename of the database to delete
	  * @returns {Promise} a Promise that resolves after the database was deleted
	  * @memberof LokiLocalStorageAdapter
	  */
		deleteDatabase(dbname) {
			if (localStorageAvailable()) {
				localStorage.removeItem(dbname);
	
				return Promise.resolve();
			}
	
			return Promise.reject(new Error('localStorage is not available'));
		}
	}
	exports.LokiLocalStorageAdapter = LokiLocalStorageAdapter;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.Collection = undefined;
	
	var _event_emitter = __webpack_require__(2);
	
	var _unique_index = __webpack_require__(6);
	
	var _exact_index = __webpack_require__(7);
	
	var _resultset = __webpack_require__(8);
	
	var _dynamic_view = __webpack_require__(12);
	
	var _clone = __webpack_require__(9);
	
	var _helper = __webpack_require__(11);
	
	/**
	 * General utils, including statistical functions
	 */
	function isDeepProperty(field) {
		return field.indexOf('.') !== -1;
	}
	
	function parseBase10(num) {
		return parseFloat(num, 10);
	}
	
	function add(a, b) {
		return a + b;
	}
	
	function sub(a, b) {
		return a - b;
	}
	
	function average(array) {
		return array.reduce(add, 0) / array.length;
	}
	
	function standardDeviation(values) {
		var avg = average(values);
		var squareDiffs = values.map(function (value) {
			var diff = value - avg;
			var sqrDiff = diff * diff;
			return sqrDiff;
		});
	
		var avgSquareDiff = average(squareDiffs);
	
		var stdDev = Math.sqrt(avgSquareDiff);
		return stdDev;
	}
	
	function deepProperty(obj, property, isDeep) {
		if (isDeep === false) {
			// pass without processing
			return obj[property];
		}
		var pieces = property.split('.'),
		    root = obj;
		while (pieces.length > 0) {
			root = root[pieces.shift()];
		}
		return root;
	}
	
	/*
	'UniqueIndex' is not defined                 no-undef
	'ExactIndex' is not defined                  no-undef
	'ltHelper' is not defined                    no-undef
	'gtHelper' is not defined                    no-undef
	'DynamicView' is not defined                 no-undef
	'clone' is not defined                       no-undef
	'Resultset' is not defined                   no-undef
	'cloneObjectArray' is not defined            no-undef
	
	'isDeepProperty' is not defined              no-undef
	'deepProperty' is not defined                no-undef
	'average' is not defined                     no-undef
	'standardDeviation' is not defined           no-undef
	'sub' is not defined                         no-undef
	 */
	
	/**
	 * Collection class that handles documents of same type
	 * @constructor Collection
	 * @implements LokiEventEmitter
	 * @param {string} name - collection name
	 * @param {(array|object)=} options - (optional) array of property names to be indicized OR a configuration object
	 * @param {array} options.unique - array of property names to define unique constraints for
	 * @param {array} options.exact - array of property names to define exact constraints for
	 * @param {array} options.indices - array property names to define binary indexes for
	 * @param {boolean} options.adaptiveBinaryIndices - collection indices will be actively rebuilt rather than lazily (default: true)
	 * @param {boolean} options.asyncListeners - default is false
	 * @param {boolean} options.disableChangesApi - default is true
	 * @param {boolean} options.autoupdate - use Object.observe to update objects automatically (default: false)
	 * @param {boolean} options.clone - specify whether inserts and queries clone to/from user
	 * @param {string} options.cloneMethod - 'parse-stringify' (default), 'jquery-extend-deep', 'shallow'
	 * @param {int} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
	 * @see {@link Loki#addCollection} for normal creation of collections
	 */
	class Collection extends _event_emitter.LokiEventEmitter {
	
		constructor(name, options) {
			super();
			// the name of the collection
	
			this.name = name;
			// the data held by the collection
			this.data = [];
			this.idIndex = []; // index of id
			this.binaryIndices = {}; // user defined indexes
			this.constraints = {
				unique: {},
				exact: {}
			};
	
			// unique contraints contain duplicate object references, so they are not persisted.
			// we will keep track of properties which have unique contraint applied here, and regenerate on load
			this.uniqueNames = [];
	
			// transforms will be used to store frequently used query chains as a series of steps
			// which itself can be stored along with the database.
			this.transforms = {};
	
			// the object type of the collection
			this.objType = name;
	
			// in autosave scenarios we will use collection level dirty flags to determine whether save is needed.
			// currently, if any collection is dirty we will autosave the whole database if autosave is configured.
			// defaulting to true since this is called from addCollection and adding a collection should trigger save
			this.dirty = true;
	
			// private holders for cached data
			this.cachedIndex = null;
			this.cachedBinaryIndex = null;
			this.cachedData = null;
			var self = this;
	
			/* OPTIONS */
			options = options || {};
	
			// exact match and unique constraints
			if (options.hasOwnProperty('unique')) {
				if (!Array.isArray(options.unique)) {
					options.unique = [options.unique];
				}
				options.unique.forEach(function (prop) {
					self.uniqueNames.push(prop); // used to regenerate on subsequent database loads
					self.constraints.unique[prop] = new _unique_index.UniqueIndex(prop);
				});
			}
	
			if (options.hasOwnProperty('exact')) {
				options.exact.forEach(function (prop) {
					self.constraints.exact[prop] = new _exact_index.ExactIndex(prop);
				});
			}
	
			// if set to true we will optimally keep indices 'fresh' during insert/update/remove ops (never dirty/never needs rebuild)
			// if you frequently intersperse insert/update/remove ops between find ops this will likely be significantly faster option.
			this.adaptiveBinaryIndices = options.hasOwnProperty('adaptiveBinaryIndices') ? options.adaptiveBinaryIndices : true;
	
			// is collection transactional
			this.transactional = options.hasOwnProperty('transactional') ? options.transactional : false;
	
			// options to clone objects when inserting them
			this.cloneObjects = options.hasOwnProperty('clone') ? options.clone : false;
	
			// default clone method (if enabled) is parse-stringify
			this.cloneMethod = options.hasOwnProperty('cloneMethod') ? options.cloneMethod : "parse-stringify";
	
			// option to make event listeners async, default is sync
			this.asyncListeners = options.hasOwnProperty('asyncListeners') ? options.asyncListeners : false;
	
			// disable track changes
			this.disableChangesApi = options.hasOwnProperty('disableChangesApi') ? options.disableChangesApi : true;
	
			// option to observe objects and update them automatically, ignored if Object.observe is not supported
			this.autoupdate = options.hasOwnProperty('autoupdate') ? options.autoupdate : false;
	
			//option to activate a cleaner daemon - clears "aged" documents at set intervals.
			this.ttl = {
				age: null,
				ttlInterval: null,
				daemon: null
			};
			this.setTTL(options.ttl || -1, options.ttlInterval);
	
			// currentMaxId - change manually at your own peril!
			this.maxId = 0;
	
			this.DynamicViews = [];
	
			// events
			this.events = {
				'insert': [],
				'update': [],
				'pre-insert': [],
				'pre-update': [],
				'close': [],
				'flushbuffer': [],
				'error': [],
				'delete': [],
				'warning': []
			};
	
			// changes are tracked by collection and aggregated by the db
			this.changes = [];
	
			// initialize the id index
			this.ensureId();
			var indices = [];
			// initialize optional user-supplied indices array ['age', 'lname', 'zip']
			if (options && options.indices) {
				if (Object.prototype.toString.call(options.indices) === '[object Array]') {
					indices = options.indices;
				} else if (typeof options.indices === 'string') {
					indices = [options.indices];
				} else {
					throw new TypeError('Indices needs to be a string or an array of strings');
				}
			}
	
			for (var idx = 0; idx < indices.length; idx++) {
				this.ensureIndex(indices[idx]);
			}
	
			function observerCallback(changes) {
	
				var changedObjects = typeof Set === 'function' ? new Set() : [];
	
				if (!changedObjects.add) changedObjects.add = function (object) {
					if (this.indexOf(object) === -1) this.push(object);
					return this;
				};
	
				changes.forEach(function (change) {
					changedObjects.add(change.object);
				});
	
				changedObjects.forEach(function (object) {
					if (!hasOwnProperty.call(object, '$loki')) return self.removeAutoUpdateObserver(object);
					try {
						self.update(object);
					} catch (err) {}
				});
			}
	
			this.observerCallback = observerCallback;
	
			/*
	   * This method creates a clone of the current status of an object and associates operation and collection name,
	   * so the parent db can aggregate and generate a changes object for the entire db
	   */
			function createChange(name, op, obj) {
				self.changes.push({
					name: name,
					operation: op,
					obj: JSON.parse(JSON.stringify(obj))
				});
			}
	
			// clear all the changes
			function flushChanges() {
				self.changes = [];
			}
	
			this.getChanges = function () {
				return self.changes;
			};
	
			this.flushChanges = flushChanges;
	
			/**
	   * If the changes API is disabled make sure only metadata is added without re-evaluating everytime if the changesApi is enabled
	   */
			function insertMeta(obj) {
				if (!obj) {
					return;
				}
				if (!obj.meta) {
					obj.meta = {};
				}
	
				obj.meta.created = new Date().getTime();
				obj.meta.revision = 0;
			}
	
			function updateMeta(obj) {
				if (!obj) {
					return;
				}
				obj.meta.updated = new Date().getTime();
				obj.meta.revision += 1;
			}
	
			function createInsertChange(obj) {
				createChange(self.name, 'I', obj);
			}
	
			function createUpdateChange(obj) {
				createChange(self.name, 'U', obj);
			}
	
			function insertMetaWithChange(obj) {
				insertMeta(obj);
				createInsertChange(obj);
			}
	
			function updateMetaWithChange(obj) {
				updateMeta(obj);
				createUpdateChange(obj);
			}
	
			/* assign correct handler based on ChangesAPI flag */
			var insertHandler, updateHandler;
	
			function setHandlers() {
				insertHandler = self.disableChangesApi ? insertMeta : insertMetaWithChange;
				updateHandler = self.disableChangesApi ? updateMeta : updateMetaWithChange;
			}
	
			setHandlers();
	
			this.setChangesApi = function (enabled) {
				self.disableChangesApi = !enabled;
				setHandlers();
			};
			/**
	   * built-in events
	   */
			this.on('insert', function insertCallback(obj) {
				insertHandler(obj);
			});
	
			this.on('update', function updateCallback(obj) {
				updateHandler(obj);
			});
	
			this.on('delete', function deleteCallback(obj) {
				if (!self.disableChangesApi) {
					createChange(self.name, 'R', obj);
				}
			});
	
			this.on('warning', function (warning) {
				self.console.warn(warning);
			});
			// for de-serialization purposes
			flushChanges();
	
			this.console = {
				log: function () {},
				warn: function () {},
				error: function () {}
			};
	
			/* ------ STAGING API -------- */
			/**
	   * stages: a map of uniquely identified 'stages', which hold copies of objects to be
	   * manipulated without affecting the data in the original collection
	   */
			this.stages = {};
			this.commitLog = [];
		}
	
		addAutoUpdateObserver(object) {
			if (!this.autoupdate || typeof Object.observe !== 'function') return;
	
			Object.observe(object, this.observerCallback, ['add', 'update', 'delete', 'reconfigure', 'setPrototype']);
		}
	
		removeAutoUpdateObserver(object) {
			if (!this.autoupdate || typeof Object.observe !== 'function') return;
	
			Object.unobserve(object, this.observerCallback);
		}
	
		/**
	  * Adds a named collection transform to the collection
	  * @param {string} name - name to associate with transform
	  * @param {array} transform - an array of transformation 'step' objects to save into the collection
	  * @memberof Collection
	  */
		addTransform(name, transform) {
			if (this.transforms.hasOwnProperty(name)) {
				throw new Error("a transform by that name already exists");
			}
	
			this.transforms[name] = transform;
		}
	
		/**
	  * Updates a named collection transform to the collection
	  * @param {string} name - name to associate with transform
	  * @param {object} transform - a transformation object to save into collection
	  * @memberof Collection
	  */
		setTransform(name, transform) {
			this.transforms[name] = transform;
		}
	
		/**
	  * Removes a named collection transform from the collection
	  * @param {string} name - name of collection transform to remove
	  * @memberof Collection
	  */
		removeTransform(name) {
			delete this.transforms[name];
		}
	
		byExample(template) {
			var k, obj, query;
			query = [];
			for (k in template) {
				if (!template.hasOwnProperty(k)) continue;
				query.push((obj = {}, obj[k] = template[k], obj));
			}
			return {
				'$and': query
			};
		}
	
		findObject(template) {
			return this.findOne(this.byExample(template));
		}
	
		findObjects(template) {
			return this.find(this.byExample(template));
		}
	
		/*----------------------------+
	  | TTL daemon                  |
	  +----------------------------*/
		ttlDaemonFuncGen() {
			var collection = this;
			var age = this.ttl.age;
			return function ttlDaemon() {
				var now = Date.now();
				var toRemove = collection.chain().where(function daemonFilter(member) {
					var timestamp = member.meta.updated || member.meta.created;
					var diff = now - timestamp;
					return age < diff;
				});
				toRemove.remove();
			};
		}
	
		setTTL(age, interval) {
			if (age < 0) {
				clearInterval(this.ttl.daemon);
			} else {
				this.ttl.age = age;
				this.ttl.ttlInterval = interval;
				this.ttl.daemon = setInterval(this.ttlDaemonFuncGen(), interval);
			}
		}
	
		/*----------------------------+
	  | INDEXING                    |
	  +----------------------------*/
	
		/**
	  * create a row filter that covers all documents in the collection
	  */
		prepareFullDocIndex() {
			var len = this.data.length;
			var indexes = new Array(len);
			for (var i = 0; i < len; i += 1) {
				indexes[i] = i;
			}
			return indexes;
		}
	
		/**
	  * Will allow reconfiguring certain collection options.
	  * @param {boolean} options.adaptiveBinaryIndices - collection indices will be actively rebuilt rather than lazily
	  * @memberof Collection
	  */
		configureOptions(options) {
			options = options || {};
	
			if (options.hasOwnProperty('adaptiveBinaryIndices')) {
				this.adaptiveBinaryIndices = options.adaptiveBinaryIndices;
	
				// if switching to adaptive binary indices, make sure none are 'dirty'
				if (this.adaptiveBinaryIndices) {
					this.ensureAllIndexes();
				}
			}
		}
	
		/**
	  * Ensure binary index on a certain field
	  * @param {string} property - name of property to create binary index on
	  * @param {boolean=} force - (Optional) flag indicating whether to construct index immediately
	  * @memberof Collection
	  */
		ensureIndex(property, force) {
			// optional parameter to force rebuild whether flagged as dirty or not
			if (typeof force === 'undefined') {
				force = false;
			}
	
			if (property === null || property === undefined) {
				throw new Error('Attempting to set index without an associated property');
			}
	
			if (this.binaryIndices[property] && !force) {
				if (!this.binaryIndices[property].dirty) return;
			}
	
			// if the index is already defined and we are using adaptiveBinaryIndices and we are not forcing a rebuild, return.
			if (this.adaptiveBinaryIndices === true && this.binaryIndices.hasOwnProperty(property) && !force) {
				return;
			}
	
			var index = {
				'name': property,
				'dirty': true,
				'values': this.prepareFullDocIndex()
			};
			this.binaryIndices[property] = index;
	
			var wrappedComparer = function (p, data) {
				return function (a, b) {
					var objAp = data[a][p],
					    objBp = data[b][p];
					if (objAp !== objBp) {
						if ((0, _helper.ltHelper)(objAp, objBp, false)) return -1;
						if ((0, _helper.gtHelper)(objAp, objBp, false)) return 1;
					}
					return 0;
				};
			}(property, this.data);
	
			index.values.sort(wrappedComparer);
			index.dirty = false;
	
			this.dirty = true; // for autosave scenarios
		}
	
		getSequencedIndexValues(property) {
			var idx,
			    idxvals = this.binaryIndices[property].values;
			var result = "";
	
			for (idx = 0; idx < idxvals.length; idx++) {
				result += " [" + idx + "] " + this.data[idxvals[idx]][property];
			}
	
			return result;
		}
	
		ensureUniqueIndex(field) {
			var index = this.constraints.unique[field];
			if (!index) {
				// keep track of new unique index for regenerate after database (re)load.
				if (this.uniqueNames.indexOf(field) == -1) {
					this.uniqueNames.push(field);
				}
			}
	
			// if index already existed, (re)loading it will likely cause collisions, rebuild always
			this.constraints.unique[field] = index = new _unique_index.UniqueIndex(field);
			this.data.forEach(function (obj) {
				index.set(obj);
			});
			return index;
		}
	
		/**
	  * Ensure all binary indices
	  */
		ensureAllIndexes(force) {
			var key,
			    bIndices = this.binaryIndices;
			for (key in bIndices) {
				if (hasOwnProperty.call(bIndices, key)) {
					this.ensureIndex(key, force);
				}
			}
		}
	
		flagBinaryIndexesDirty() {
			var key,
			    bIndices = this.binaryIndices;
			for (key in bIndices) {
				if (hasOwnProperty.call(bIndices, key)) {
					bIndices[key].dirty = true;
				}
			}
		}
	
		flagBinaryIndexDirty(index) {
			if (this.binaryIndices[index]) this.binaryIndices[index].dirty = true;
		}
	
		/**
	  * Quickly determine number of documents in collection (or query)
	  * @param {object=} query - (optional) query object to count results of
	  * @returns {number} number of documents in the collection
	  * @memberof Collection
	  */
		count(query) {
			if (!query) {
				return this.data.length;
			}
	
			return this.chain().find(query).filteredrows.length;
		}
	
		/**
	  * Rebuild idIndex
	  */
		ensureId() {
			var len = this.data.length,
			    i = 0;
	
			this.idIndex = [];
			for (i; i < len; i += 1) {
				this.idIndex.push(this.data[i].$loki);
			}
		}
	
		/**
	  * Add a dynamic view to the collection
	  * @param {string} name - name of dynamic view to add
	  * @param {object=} options - (optional) options to configure dynamic view with
	  * @param {boolean} options.persistent - indicates if view is to main internal results array in 'resultdata'
	  * @param {string} options.sortPriority - 'passive' (sorts performed on call to data) or 'active' (after updates)
	  * @param {number} options.minRebuildInterval - minimum rebuild interval (need clarification to docs here)
	  * @returns {DynamicView} reference to the dynamic view added
	  * @memberof Collection
	  **/
	
		addDynamicView(name, options) {
			var dv = new _dynamic_view.DynamicView(this, name, options);
			this.DynamicViews.push(dv);
	
			return dv;
		}
	
		/**
	  * Remove a dynamic view from the collection
	  * @param {string} name - name of dynamic view to remove
	  * @memberof Collection
	  **/
		removeDynamicView(name) {
			for (var idx = 0; idx < this.DynamicViews.length; idx++) {
				if (this.DynamicViews[idx].name === name) {
					this.DynamicViews.splice(idx, 1);
				}
			}
		}
	
		/**
	  * Look up dynamic view reference from within the collection
	  * @param {string} name - name of dynamic view to retrieve reference of
	  * @returns {DynamicView} A reference to the dynamic view with that name
	  * @memberof Collection
	  **/
		getDynamicView(name) {
			for (var idx = 0; idx < this.DynamicViews.length; idx++) {
				if (this.DynamicViews[idx].name === name) {
					return this.DynamicViews[idx];
				}
			}
	
			return null;
		}
	
		/**
	  * Applies a 'mongo-like' find query object and passes all results to an update function.
	  * For filter function querying you should migrate to [updateWhere()]{@link Collection#updateWhere}.
	  *
	  * @param {object|function} filterObject - 'mongo-like' query object (or deprecated filterFunction mode)
	  * @param {function} updateFunction - update function to run against filtered documents
	  * @memberof Collection
	  */
		findAndUpdate(filterObject, updateFunction) {
			if (typeof filterObject === "function") {
				this.updateWhere(filterObject, updateFunction);
			} else {
				this.chain().find(filterObject).update(updateFunction);
			}
		}
	
		/**
	  * Applies a 'mongo-like' find query object removes all documents which match that filter.
	  *
	  * @param {object} filterObject - 'mongo-like' query object
	  * @memberof Collection
	  */
		findAndRemove(filterObject) {
			this.chain().find(filterObject).remove();
		}
	
		/**
	  * Adds object(s) to collection, ensure object(s) have meta properties, clone it if necessary, etc.
	  * @param {(object|array)} doc - the document (or array of documents) to be inserted
	  * @returns {(object|array)} document or documents inserted
	  * @memberof Collection
	  */
		insert(doc) {
			if (!Array.isArray(doc)) {
				return this.insertOne(doc);
			}
	
			// holder to the clone of the object inserted if collections is set to clone objects
			var obj;
			var results = [];
	
			this.emit('pre-insert', doc);
			for (var i = 0, len = doc.length; i < len; i++) {
				obj = this.insertOne(doc[i], true);
				if (!obj) {
					return undefined;
				}
				results.push(obj);
			}
			this.emit('insert', doc);
			return results.length === 1 ? results[0] : results;
		}
	
		/**
	  * Adds a single object, ensures it has meta properties, clone it if necessary, etc.
	  * @param {object} doc - the document to be inserted
	  * @param {boolean} bulkInsert - quiet pre-insert and insert event emits
	  * @returns {object} document or 'undefined' if there was a problem inserting it
	  * @memberof Collection
	  */
		insertOne(doc, bulkInsert) {
			var err = null;
			var returnObj;
	
			if (typeof doc !== 'object') {
				err = new TypeError('Document needs to be an object');
			} else if (doc === null) {
				err = new TypeError('Object cannot be null');
			}
	
			if (err !== null) {
				this.emit('error', err);
				throw err;
			}
	
			// if configured to clone, do so now... otherwise just use same obj reference
			var obj = this.cloneObjects ? (0, _clone.clone)(doc, this.cloneMethod) : doc;
	
			if (typeof obj.meta === 'undefined') {
				obj.meta = {
					revision: 0,
					created: 0
				};
			}
	
			// allow pre-insert to modify actual collection reference even if cloning
			if (!bulkInsert) {
				this.emit('pre-insert', obj);
			}
			if (!this.add(obj)) {
				return undefined;
			}
	
			// if cloning, give user back clone of 'cloned' object with $loki and meta
			returnObj = this.cloneObjects ? (0, _clone.clone)(obj, this.cloneMethod) : obj;
	
			this.addAutoUpdateObserver(returnObj);
			if (!bulkInsert) {
				this.emit('insert', returnObj);
			}
			return returnObj;
		}
	
		/**
	  * Empties the collection.
	  * @param {object=} options - configure clear behavior
	  * @param {bool=} options.removeIndices - (default: false)
	  * @memberof Collection
	  */
		clear(options) {
			var self = this;
	
			options = options || {};
	
			this.data = [];
			this.idIndex = [];
			this.cachedIndex = null;
			this.cachedBinaryIndex = null;
			this.cachedData = null;
			this.maxId = 0;
			this.DynamicViews = [];
			this.dirty = true;
	
			// if removing indices entirely
			if (options.removeIndices === true) {
				this.binaryIndices = {};
	
				this.constraints = {
					unique: {},
					exact: {}
				};
				this.uniqueNames = [];
			}
			// clear indices but leave definitions in place
			else {
					// clear binary indices
					var keys = Object.keys(this.binaryIndices);
					keys.forEach(function (biname) {
						self.binaryIndices[biname].dirty = false;
						self.binaryIndices[biname].values = [];
					});
	
					// clear entire unique indices definition
					this.constraints = {
						unique: {},
						exact: {}
					};
	
					// add definitions back
					this.uniqueNames.forEach(function (uiname) {
						self.ensureUniqueIndex(uiname);
					});
				}
		}
	
		/**
	  * Updates an object and notifies collection that the document has changed.
	  * @param {object} doc - document to update within the collection
	  * @memberof Collection
	  */
		update(doc) {
			if (Array.isArray(doc)) {
				var k = 0,
				    len = doc.length;
				for (k; k < len; k += 1) {
					this.update(doc[k]);
				}
				return;
			}
	
			// verify object is a properly formed document
			if (!hasOwnProperty.call(doc, '$loki')) {
				throw new Error('Trying to update unsynced document. Please save the document first by using insert() or addMany()');
			}
			try {
				this.startTransaction();
				var arr = this.get(doc.$loki, true),
				    oldInternal,
				    // ref to existing obj
				newInternal,
				    // ref to new internal obj
				position,
				    self = this;
	
				if (!arr) {
					throw new Error('Trying to update a document not in collection.');
				}
	
				oldInternal = arr[0]; // -internal- obj ref
				position = arr[1]; // position in data array
	
				// if configured to clone, do so now... otherwise just use same obj reference
				newInternal = this.cloneObjects ? (0, _clone.clone)(doc, this.cloneMethod) : doc;
	
				this.emit('pre-update', doc);
	
				Object.keys(this.constraints.unique).forEach(function (key) {
					self.constraints.unique[key].update(oldInternal, newInternal);
				});
	
				// operate the update
				this.data[position] = newInternal;
	
				if (newInternal !== doc) {
					this.addAutoUpdateObserver(doc);
				}
	
				// now that we can efficiently determine the data[] position of newly added document,
				// submit it for all registered DynamicViews to evaluate for inclusion/exclusion
				for (var idx = 0; idx < this.DynamicViews.length; idx++) {
					this.DynamicViews[idx].evaluateDocument(position, false);
				}
	
				var key;
				if (this.adaptiveBinaryIndices) {
					// for each binary index defined in collection, immediately update rather than flag for lazy rebuild
					var bIndices = this.binaryIndices;
					for (key in bIndices) {
						this.adaptiveBinaryIndexUpdate(position, key);
					}
				} else {
					this.flagBinaryIndexesDirty();
				}
	
				this.idIndex[position] = newInternal.$loki;
				//this.flagBinaryIndexesDirty();
	
				this.commit();
				this.dirty = true; // for autosave scenarios
	
				this.emit('update', doc, this.cloneObjects ? (0, _clone.clone)(oldInternal, this.cloneMethod) : null);
				return doc;
			} catch (err) {
				this.rollback();
				this.console.error(err.message);
				this.emit('error', err);
				throw err; // re-throw error so user does not think it succeeded
			}
		}
	
		/**
	  * Add object to collection
	  */
		add(obj) {
			// if parameter isn't object exit with throw
			if ('object' !== typeof obj) {
				throw new TypeError('Object being added needs to be an object');
			}
			// if object you are adding already has id column it is either already in the collection
			// or the object is carrying its own 'id' property.  If it also has a meta property,
			// then this is already in collection so throw error, otherwise rename to originalId and continue adding.
			if (typeof obj.$loki !== 'undefined') {
				throw new Error('Document is already in collection, please use update()');
			}
	
			/*
	   * try adding object to collection
	   */
			try {
				this.startTransaction();
				this.maxId++;
	
				if (isNaN(this.maxId)) {
					this.maxId = this.data[this.data.length - 1].$loki + 1;
				}
	
				obj.$loki = this.maxId;
				obj.meta.version = 0;
	
				var key,
				    constrUnique = this.constraints.unique;
				for (key in constrUnique) {
					if (hasOwnProperty.call(constrUnique, key)) {
						constrUnique[key].set(obj);
					}
				}
	
				// add new obj id to idIndex
				this.idIndex.push(obj.$loki);
	
				// add the object
				this.data.push(obj);
	
				var addedPos = this.data.length - 1;
	
				// now that we can efficiently determine the data[] position of newly added document,
				// submit it for all registered DynamicViews to evaluate for inclusion/exclusion
				var dvlen = this.DynamicViews.length;
				for (var i = 0; i < dvlen; i++) {
					this.DynamicViews[i].evaluateDocument(addedPos, true);
				}
	
				if (this.adaptiveBinaryIndices) {
					// for each binary index defined in collection, immediately update rather than flag for lazy rebuild
					var bIndices = this.binaryIndices;
					for (key in bIndices) {
						this.adaptiveBinaryIndexInsert(addedPos, key);
					}
				} else {
					this.flagBinaryIndexesDirty();
				}
	
				this.commit();
				this.dirty = true; // for autosave scenarios
	
				return this.cloneObjects ? (0, _clone.clone)(obj, this.cloneMethod) : obj;
			} catch (err) {
				this.rollback();
				this.console.error(err.message);
				this.emit('error', err);
				throw err; // re-throw error so user does not think it succeeded
			}
		}
	
		/**
	  * Applies a filter function and passes all results to an update function.
	  *
	  * @param {function} filterFunction - filter function whose results will execute update
	  * @param {function} updateFunction - update function to run against filtered documents
	  * @memberof Collection
	  */
		updateWhere(filterFunction, updateFunction) {
			var results = this.where(filterFunction),
			    i = 0,
			    obj;
			try {
				for (i; i < results.length; i++) {
					obj = updateFunction(results[i]);
					this.update(obj);
				}
			} catch (err) {
				this.rollback();
				this.console.error(err.message);
			}
		}
	
		/**
	  * Remove all documents matching supplied filter function.
	  * For 'mongo-like' querying you should migrate to [findAndRemove()]{@link Collection#findAndRemove}.
	  * @param {function|object} query - query object to filter on
	  * @memberof Collection
	  */
		removeWhere(query) {
			var list;
			if (typeof query === 'function') {
				list = this.data.filter(query);
				this.remove(list);
			} else {
				this.chain().find(query).remove();
			}
		}
	
		removeDataOnly() {
			this.remove(this.data.slice());
		}
	
		/**
	  * Remove a document from the collection
	  * @param {object} doc - document to remove from collection
	  * @memberof Collection
	  */
		remove(doc) {
			if (typeof doc === 'number') {
				doc = this.get(doc);
			}
	
			if ('object' !== typeof doc) {
				throw new Error('Parameter is not an object');
			}
			if (Array.isArray(doc)) {
				var k = 0,
				    len = doc.length;
				for (k; k < len; k += 1) {
					this.remove(doc[k]);
				}
				return;
			}
	
			if (!hasOwnProperty.call(doc, '$loki')) {
				throw new Error('Object is not a document stored in the collection');
			}
	
			try {
				this.startTransaction();
				var arr = this.get(doc.$loki, true),
	
				// obj = arr[0],
				position = arr[1];
				var self = this;
				Object.keys(this.constraints.unique).forEach(function (key) {
					if (doc[key] !== null && typeof doc[key] !== 'undefined') {
						self.constraints.unique[key].remove(doc[key]);
					}
				});
				// now that we can efficiently determine the data[] position of newly added document,
				// submit it for all registered DynamicViews to remove
				for (var idx = 0; idx < this.DynamicViews.length; idx++) {
					this.DynamicViews[idx].removeDocument(position);
				}
	
				if (this.adaptiveBinaryIndices) {
					// for each binary index defined in collection, immediately update rather than flag for lazy rebuild
					var key,
					    bIndices = this.binaryIndices;
					for (key in bIndices) {
						this.adaptiveBinaryIndexRemove(position, key);
					}
				} else {
					this.flagBinaryIndexesDirty();
				}
	
				this.data.splice(position, 1);
				this.removeAutoUpdateObserver(doc);
	
				// remove id from idIndex
				this.idIndex.splice(position, 1);
	
				this.commit();
				this.dirty = true; // for autosave scenarios
				this.emit('delete', arr[0]);
				delete doc.$loki;
				delete doc.meta;
				return doc;
			} catch (err) {
				this.rollback();
				this.console.error(err.message);
				this.emit('error', err);
				return null;
			}
		}
	
		/*---------------------+
	  | Finding methods     |
	  +----------------------*/
	
		/**
	  * Get by Id - faster than other methods because of the searching algorithm
	  * @param {int} id - $loki id of document you want to retrieve
	  * @param {boolean} returnPosition - if 'true' we will return [object, position]
	  * @returns {(object|array|null)} Object reference if document was found, null if not,
	  *     or an array if 'returnPosition' was passed.
	  * @memberof Collection
	  */
		get(id, returnPosition) {
			var retpos = returnPosition || false,
			    data = this.idIndex,
			    max = data.length - 1,
			    min = 0,
			    mid = min + max >> 1;
	
			id = typeof id === 'number' ? id : parseInt(id, 10);
	
			if (isNaN(id)) {
				throw new TypeError('Passed id is not an integer');
			}
	
			while (data[min] < data[max]) {
				mid = min + max >> 1;
	
				if (data[mid] < id) {
					min = mid + 1;
				} else {
					max = mid;
				}
			}
	
			if (max === min && data[min] === id) {
				if (retpos) {
					return [this.data[min], min];
				}
				return this.data[min];
			}
			return null;
		}
	
		/**
	  * Perform binary range lookup for the data[dataPosition][binaryIndexName] property value
	  *    Since multiple documents may contain the same value (which the index is sorted on),
	  *    we hone in on range and then linear scan range to find exact index array position.
	  * @param {int} dataPosition : coll.data array index/position
	  * @param {string} binaryIndexName : index to search for dataPosition in
	  */
		getBinaryIndexPosition(dataPosition, binaryIndexName) {
			var val = this.data[dataPosition][binaryIndexName];
			var index = this.binaryIndices[binaryIndexName].values;
	
			// i think calculateRange can probably be moved to collection
			// as it doesn't seem to need resultset.  need to verify
			//var rs = new Resultset(this, null, null);
			var range = this.calculateRange("$eq", binaryIndexName, val);
	
			if (range[0] === 0 && range[1] === -1) {
				// uhoh didn't find range
				return null;
			}
	
			var min = range[0];
			var max = range[1];
	
			// narrow down the sub-segment of index values
			// where the indexed property value exactly matches our
			// value and then linear scan to find exact -index- position
			for (var idx = min; idx <= max; idx++) {
				if (index[idx] === dataPosition) return idx;
			}
	
			// uhoh
			return null;
		}
	
		/**
	  * Adaptively insert a selected item to the index.
	  * @param {int} dataPosition : coll.data array index/position
	  * @param {string} binaryIndexName : index to search for dataPosition in
	  */
		adaptiveBinaryIndexInsert(dataPosition, binaryIndexName) {
			var index = this.binaryIndices[binaryIndexName].values;
			var val = this.data[dataPosition][binaryIndexName];
			//var rs = new Resultset(this, null, null);
			var idxPos = this.calculateRangeStart(binaryIndexName, val);
	
			// insert new data index into our binary index at the proper sorted location for relevant property calculated by idxPos.
			// doing this after adjusting dataPositions so no clash with previous item at that position.
			this.binaryIndices[binaryIndexName].values.splice(idxPos, 0, dataPosition);
		}
	
		/**
	  * Adaptively update a selected item within an index.
	  * @param {int} dataPosition : coll.data array index/position
	  * @param {string} binaryIndexName : index to search for dataPosition in
	  */
		adaptiveBinaryIndexUpdate(dataPosition, binaryIndexName) {
			// linear scan needed to find old position within index unless we optimize for clone scenarios later
			// within (my) node 5.6.0, the following for() loop with strict compare is -much- faster than indexOf()
			var idxPos,
			    index = this.binaryIndices[binaryIndexName].values,
			    len = index.length;
	
			for (idxPos = 0; idxPos < len; idxPos++) {
				if (index[idxPos] === dataPosition) break;
			}
	
			//var idxPos = this.binaryIndices[binaryIndexName].values.indexOf(dataPosition);
			this.binaryIndices[binaryIndexName].values.splice(idxPos, 1);
	
			//this.adaptiveBinaryIndexRemove(dataPosition, binaryIndexName, true);
			this.adaptiveBinaryIndexInsert(dataPosition, binaryIndexName);
		}
	
		/**
	  * Adaptively remove a selected item from the index.
	  * @param {int} dataPosition : coll.data array index/position
	  * @param {string} binaryIndexName : index to search for dataPosition in
	  */
		adaptiveBinaryIndexRemove(dataPosition, binaryIndexName, removedFromIndexOnly) {
			var idxPos = this.getBinaryIndexPosition(dataPosition, binaryIndexName);
			var index = this.binaryIndices[binaryIndexName].values;
			var len, idx;
	
			if (idxPos === null) {
				// throw new Error('unable to determine binary index position');
				return null;
			}
	
			// remove document from index
			this.binaryIndices[binaryIndexName].values.splice(idxPos, 1);
	
			// if we passed this optional flag parameter, we are calling from adaptiveBinaryIndexUpdate,
			// in which case data positions stay the same.
			if (removedFromIndexOnly === true) {
				return;
			}
	
			// since index stores data array positions, if we remove a document
			// we need to adjust array positions -1 for all document positions greater than removed position
			len = index.length;
			for (idx = 0; idx < len; idx++) {
				if (index[idx] > dataPosition) {
					index[idx]--;
				}
			}
		}
	
		/**
	  * Internal method used for index maintenance.  Given a prop (index name), and a value
	  * (which may or may not yet exist) this will find the proper location where it can be added.
	  */
		calculateRangeStart(prop, val) {
			var rcd = this.data;
			var index = this.binaryIndices[prop].values;
			var min = 0;
			var max = index.length - 1;
			var mid = 0;
	
			if (index.length === 0) {
				return 0;
			}
	
			var minVal = rcd[index[min]][prop];
			var maxVal = rcd[index[max]][prop];
	
			// hone in on start position of value
			while (min < max) {
				mid = min + max >> 1;
	
				if ((0, _helper.ltHelper)(rcd[index[mid]][prop], val, false)) {
					min = mid + 1;
				} else {
					max = mid;
				}
			}
	
			var lbound = min;
	
			if ((0, _helper.ltHelper)(rcd[index[lbound]][prop], val, false)) {
				return lbound + 1;
			} else {
				return lbound;
			}
		}
	
		/**
	  * Internal method used for indexed $between.  Given a prop (index name), and a value
	  * (which may or may not yet exist) this will find the final position of that upper range value.
	  */
		calculateRangeEnd(prop, val) {
			var rcd = this.data;
			var index = this.binaryIndices[prop].values;
			var min = 0;
			var max = index.length - 1;
			var mid = 0;
	
			if (index.length === 0) {
				return 0;
			}
	
			var minVal = rcd[index[min]][prop];
			var maxVal = rcd[index[max]][prop];
	
			// hone in on start position of value
			while (min < max) {
				mid = min + max >> 1;
	
				if ((0, _helper.ltHelper)(val, rcd[index[mid]][prop], false)) {
					max = mid;
				} else {
					min = mid + 1;
				}
			}
	
			var ubound = max;
	
			if ((0, _helper.gtHelper)(rcd[index[ubound]][prop], val, false)) {
				return ubound - 1;
			} else {
				return ubound;
			}
		}
	
		/**
	  * calculateRange() - Binary Search utility method to find range/segment of values matching criteria.
	  *    this is used for collection.find() and first find filter of resultset/dynview
	  *    slightly different than get() binary search in that get() hones in on 1 value,
	  *    but we have to hone in on many (range)
	  * @param {string} op - operation, such as $eq
	  * @param {string} prop - name of property to calculate range for
	  * @param {object} val - value to use for range calculation.
	  * @returns {array} [start, end] index array positions
	  */
		calculateRange(op, prop, val) {
			var rcd = this.data;
			var index = this.binaryIndices[prop].values;
			var min = 0;
			var max = index.length - 1;
			var mid = 0;
	
			// when no documents are in collection, return empty range condition
			if (rcd.length === 0) {
				return [0, -1];
			}
	
			var minVal = rcd[index[min]][prop];
			var maxVal = rcd[index[max]][prop];
	
			// if value falls outside of our range return [0, -1] to designate no results
			switch (op) {
				case '$eq':
				case '$aeq':
					if ((0, _helper.ltHelper)(val, minVal, false) || (0, _helper.gtHelper)(val, maxVal, false)) {
						return [0, -1];
					}
					break;
				case '$dteq':
					if ((0, _helper.ltHelper)(val, minVal, false) || (0, _helper.gtHelper)(val, maxVal, false)) {
						return [0, -1];
					}
					break;
				case '$gt':
					if ((0, _helper.gtHelper)(val, maxVal, true)) {
						return [0, -1];
					}
					break;
				case '$gte':
					if ((0, _helper.gtHelper)(val, maxVal, false)) {
						return [0, -1];
					}
					break;
				case '$lt':
					if ((0, _helper.ltHelper)(val, minVal, true)) {
						return [0, -1];
					}
					if ((0, _helper.ltHelper)(maxVal, val, false)) {
						return [0, rcd.length - 1];
					}
					break;
				case '$lte':
					if ((0, _helper.ltHelper)(val, minVal, false)) {
						return [0, -1];
					}
					if ((0, _helper.ltHelper)(maxVal, val, true)) {
						return [0, rcd.length - 1];
					}
					break;
				case '$between':
					return [this.calculateRangeStart(prop, val[0]), this.calculateRangeEnd(prop, val[1])];
				case '$in':
					var idxset = [],
					    segResult = [];
					// query each value '$eq' operator and merge the seqment results.
					for (var j = 0, len = val.length; j < len; j++) {
						var seg = this.calculateRange('$eq', prop, val[j]);
	
						for (var i = seg[0]; i <= seg[1]; i++) {
							if (idxset[i] === undefined) {
								idxset[i] = true;
								segResult.push(i);
							}
						}
					}
					return segResult;
			}
	
			// hone in on start position of value
			while (min < max) {
				mid = min + max >> 1;
	
				if ((0, _helper.ltHelper)(rcd[index[mid]][prop], val, false)) {
					min = mid + 1;
				} else {
					max = mid;
				}
			}
	
			var lbound = min;
	
			// do not reset min, as the upper bound cannot be prior to the found low bound
			max = index.length - 1;
	
			// hone in on end position of value
			while (min < max) {
				mid = min + max >> 1;
	
				if ((0, _helper.ltHelper)(val, rcd[index[mid]][prop], false)) {
					max = mid;
				} else {
					min = mid + 1;
				}
			}
	
			var ubound = max;
	
			var lval = rcd[index[lbound]][prop];
			var uval = rcd[index[ubound]][prop];
	
			switch (op) {
				case '$eq':
					if (lval !== val) {
						return [0, -1];
					}
					if (uval !== val) {
						ubound--;
					}
	
					return [lbound, ubound];
				case '$dteq':
					if (lval > val || lval < val) {
						return [0, -1];
					}
					if (uval > val || uval < val) {
						ubound--;
					}
	
					return [lbound, ubound];
	
				case '$gt':
					if ((0, _helper.ltHelper)(uval, val, true)) {
						return [0, -1];
					}
	
					return [ubound, rcd.length - 1];
	
				case '$gte':
					if ((0, _helper.ltHelper)(lval, val, false)) {
						return [0, -1];
					}
	
					return [lbound, rcd.length - 1];
	
				case '$lt':
					if (lbound === 0 && (0, _helper.ltHelper)(lval, val, false)) {
						return [0, 0];
					}
					return [0, lbound - 1];
	
				case '$lte':
					if (uval !== val) {
						ubound--;
					}
	
					if (ubound === 0 && (0, _helper.ltHelper)(uval, val, false)) {
						return [0, 0];
					}
					return [0, ubound];
	
				default:
					return [0, rcd.length - 1];
			}
		}
	
		/**
	  * Retrieve doc by Unique index
	  * @param {string} field - name of uniquely indexed property to use when doing lookup
	  * @param {value} value - unique value to search for
	  * @returns {object} document matching the value passed
	  * @memberof Collection
	  */
		by(field, value) {
			var self;
			if (value === undefined) {
				self = this;
				return function (value) {
					return self.by(field, value);
				};
			}
	
			var result = this.constraints.unique[field].get(value);
			if (!this.cloneObjects) {
				return result;
			} else {
				return (0, _clone.clone)(result, this.cloneMethod);
			}
		}
	
		/**
	  * Find one object by index property, by property equal to value
	  * @param {object} query - query object used to perform search with
	  * @returns {(object|null)} First matching document, or null if none
	  * @memberof Collection
	  */
		findOne(query) {
			query = query || {};
	
			// Instantiate Resultset and exec find op passing firstOnly = true param
			var result = new _resultset.Resultset(this, {
				queryObj: query,
				firstOnly: true
			});
	
			if (Array.isArray(result) && result.length === 0) {
				return null;
			} else {
				if (!this.cloneObjects) {
					return result;
				} else {
					return (0, _clone.clone)(result, this.cloneMethod);
				}
			}
		}
	
		/**
	  * Chain method, used for beginning a series of chained find() and/or view() operations
	  * on a collection.
	  *
	  * @param {array} transform - Ordered array of transform step objects similar to chain
	  * @param {object} parameters - Object containing properties representing parameters to substitute
	  * @returns {Resultset} (this) resultset, or data array if any map or join functions where called
	  * @memberof Collection
	  */
		chain(transform, parameters) {
			var rs = new _resultset.Resultset(this);
	
			if (typeof transform === 'undefined') {
				return rs;
			}
	
			return rs.transform(transform, parameters);
		}
	
		/**
	  * Find method, api is similar to mongodb.
	  * for more complex queries use [chain()]{@link Collection#chain} or [where()]{@link Collection#where}.
	  * @example {@tutorial Query Examples}
	  * @param {object} query - 'mongo-like' query object
	  * @returns {array} Array of matching documents
	  * @memberof Collection
	  */
		find(query) {
			if (typeof query === 'undefined') {
				query = 'getAll';
			}
	
			var results = new _resultset.Resultset(this, {
				queryObj: query
			});
			if (!this.cloneObjects) {
				return results;
			} else {
				return (0, _clone.cloneObjectArray)(results, this.cloneMethod);
			}
		}
	
		/**
	  * Find object by unindexed field by property equal to value,
	  * simply iterates and returns the first element matching the query
	  */
		findOneUnindexed(prop, value) {
			var i = this.data.length,
			    doc;
			while (i--) {
				if (this.data[i][prop] === value) {
					doc = this.data[i];
					return doc;
				}
			}
			return null;
		}
	
		/**
	  * Transaction methods
	  */
	
		/** start the transation */
		startTransaction() {
			if (this.transactional) {
				this.cachedData = (0, _clone.clone)(this.data, this.cloneMethod);
				this.cachedIndex = this.idIndex;
				this.cachedBinaryIndex = this.binaryIndices;
	
				// propagate startTransaction to dynamic views
				for (var idx = 0; idx < this.DynamicViews.length; idx++) {
					this.DynamicViews[idx].startTransaction();
				}
			}
		}
	
		/** commit the transation */
		commit() {
			if (this.transactional) {
				this.cachedData = null;
				this.cachedIndex = null;
				this.cachedBinaryIndex = null;
	
				// propagate commit to dynamic views
				for (var idx = 0; idx < this.DynamicViews.length; idx++) {
					this.DynamicViews[idx].commit();
				}
			}
		}
	
		/** roll back the transation */
		rollback() {
			if (this.transactional) {
				if (this.cachedData !== null && this.cachedIndex !== null) {
					this.data = this.cachedData;
					this.idIndex = this.cachedIndex;
					this.binaryIndices = this.cachedBinaryIndex;
				}
	
				// propagate rollback to dynamic views
				for (var idx = 0; idx < this.DynamicViews.length; idx++) {
					this.DynamicViews[idx].rollback();
				}
			}
		}
	
		/**
	  * Query the collection by supplying a javascript filter function.
	  * @example
	  * var results = coll.where(function(obj) {
	  *   return obj.legs === 8;
	  * });
	  *
	  * @param {function} fun - filter function to run against all collection docs
	  * @returns {array} all documents which pass your filter function
	  * @memberof Collection
	  */
		where(fun) {
			var results = new _resultset.Resultset(this, {
				queryFunc: fun
			});
			if (!this.cloneObjects) {
				return results;
			} else {
				return (0, _clone.cloneObjectArray)(results, this.cloneMethod);
			}
		}
	
		/**
	  * Map Reduce operation
	  *
	  * @param {function} mapFunction - function to use as map function
	  * @param {function} reduceFunction - function to use as reduce function
	  * @returns {data} The result of your mapReduce operation
	  * @memberof Collection
	  */
		mapReduce(mapFunction, reduceFunction) {
			try {
				return reduceFunction(this.data.map(mapFunction));
			} catch (err) {
				throw err;
			}
		}
	
		/**
	  * Join two collections on specified properties
	  *
	  * @param {array} joinData - array of documents to 'join' to this collection
	  * @param {string} leftJoinProp - property name in collection
	  * @param {string} rightJoinProp - property name in joinData
	  * @param {function=} mapFun - (Optional) map function to use
	  * @returns {Resultset} Result of the mapping operation
	  * @memberof Collection
	  */
		eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun) {
			// logic in Resultset class
			return new _resultset.Resultset(this).eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun);
		}
	
		/* ------ STAGING API -------- */
		/**
	  * stages: a map of uniquely identified 'stages', which hold copies of objects to be
	  * manipulated without affecting the data in the original collection
	  */
	
		/**
	  * (Staging API) create a stage and/or retrieve it
	  * @memberof Collection
	  */
		getStage(name) {
			if (!this.stages[name]) {
				this.stages[name] = {};
			}
			return this.stages[name];
		}
	
		/**
	  * a collection of objects recording the changes applied through a commmitStage
	  */
	
		/**
	  * (Staging API) create a copy of an object and insert it into a stage
	  * @memberof Collection
	  */
		stage(stageName, obj) {
			var copy = JSON.parse(JSON.stringify(obj));
			this.getStage(stageName)[obj.$loki] = copy;
			return copy;
		}
	
		/**
	  * (Staging API) re-attach all objects to the original collection, so indexes and views can be rebuilt
	  * then create a message to be inserted in the commitlog
	  * @param {string} stageName - name of stage
	  * @param {string} message
	  * @memberof Collection
	  */
		commitStage(stageName, message) {
			var stage = this.getStage(stageName),
			    prop,
			    timestamp = new Date().getTime();
	
			for (prop in stage) {
	
				this.update(stage[prop]);
				this.commitLog.push({
					timestamp: timestamp,
					message: message,
					data: JSON.parse(JSON.stringify(stage[prop]))
				});
			}
			this.stages[stageName] = {};
		}
	
		no_op() {
			return;
		}
	
		/**
	  * @memberof Collection
	  */
		extract(field) {
			var i = 0,
			    len = this.data.length,
			    isDotNotation = isDeepProperty(field),
			    result = [];
			for (i; i < len; i += 1) {
				result.push(deepProperty(this.data[i], field, isDotNotation));
			}
			return result;
		}
	
		/**
	  * @memberof Collection
	  */
		max(field) {
			return Math.max.apply(null, this.extract(field));
		}
	
		/**
	  * @memberof Collection
	  */
		min(field) {
			return Math.min.apply(null, this.extract(field));
		}
	
		/**
	  * @memberof Collection
	  */
		maxRecord(field) {
			var i = 0,
			    len = this.data.length,
			    deep = isDeepProperty(field),
			    result = {
				index: 0,
				value: undefined
			},
			    max;
	
			for (i; i < len; i += 1) {
				if (max !== undefined) {
					if (max < deepProperty(this.data[i], field, deep)) {
						max = deepProperty(this.data[i], field, deep);
						result.index = this.data[i].$loki;
					}
				} else {
					max = deepProperty(this.data[i], field, deep);
					result.index = this.data[i].$loki;
				}
			}
			result.value = max;
			return result;
		}
	
		/**
	  * @memberof Collection
	  */
		minRecord(field) {
			var i = 0,
			    len = this.data.length,
			    deep = isDeepProperty(field),
			    result = {
				index: 0,
				value: undefined
			},
			    min;
	
			for (i; i < len; i += 1) {
				if (min !== undefined) {
					if (min > deepProperty(this.data[i], field, deep)) {
						min = deepProperty(this.data[i], field, deep);
						result.index = this.data[i].$loki;
					}
				} else {
					min = deepProperty(this.data[i], field, deep);
					result.index = this.data[i].$loki;
				}
			}
			result.value = min;
			return result;
		}
	
		/**
	  * @memberof Collection
	  */
		extractNumerical(field) {
			return this.extract(field).map(parseBase10).filter(Number).filter(function (n) {
				return !isNaN(n);
			});
		}
	
		/**
	  * Calculates the average numerical value of a property
	  *
	  * @param {string} field - name of property in docs to average
	  * @returns {number} average of property in all docs in the collection
	  * @memberof Collection
	  */
		avg(field) {
			return average(this.extractNumerical(field));
		}
	
		/**
	  * Calculate standard deviation of a field
	  * @memberof Collection
	  * @param {string} field
	  */
		stdDev(field) {
			return standardDeviation(this.extractNumerical(field));
		}
	
		/**
	  * @memberof Collection
	  * @param {string} field
	  */
		mode(field) {
			var dict = {},
			    data = this.extract(field);
			data.forEach(function (obj) {
				if (dict[obj]) {
					dict[obj] += 1;
				} else {
					dict[obj] = 1;
				}
			});
			var max, prop, mode;
			for (prop in dict) {
				if (max) {
					if (max < dict[prop]) {
						mode = prop;
					}
				} else {
					mode = prop;
					max = dict[prop];
				}
			}
			return mode;
		}
	
		/**
	  * @memberof Collection
	  * @param {string} field - property name
	  */
		median(field) {
			var values = this.extractNumerical(field);
			values.sort(sub);
	
			var half = Math.floor(values.length / 2);
	
			if (values.length % 2) {
				return values[half];
			} else {
				return (values[half - 1] + values[half]) / 2.0;
			}
		}
	}
	exports.Collection = Collection;

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	class UniqueIndex {
	
		constructor(uniqueField) {
			this.field = uniqueField;
			this.keyMap = {};
			this.lokiMap = {};
		}
	
		set(obj) {
			var fieldValue = obj[this.field];
			if (fieldValue !== null && typeof fieldValue !== 'undefined') {
				if (this.keyMap[fieldValue]) {
					throw new Error('Duplicate key for property ' + this.field + ': ' + fieldValue);
				} else {
					this.keyMap[fieldValue] = obj;
					this.lokiMap[obj.$loki] = fieldValue;
				}
			}
		}
	
		get(key) {
			console.log(key);
			return this.keyMap[key];
		}
	
		byId(id) {
			console.log("byId", key);
			return this.keyMap[this.lokiMap[id]];
		}
	
		/**
	  * Updates a document's unique index given an updated object.
	  * @param  {Object} obj Original document object
	  * @param  {Object} doc New document object (likely the same as obj)
	  */
		update(obj, doc) {
			if (this.lokiMap[obj.$loki] !== doc[this.field]) {
				var old = this.lokiMap[obj.$loki];
				this.set(doc);
				// make the old key fail bool test, while avoiding the use of delete (mem-leak prone)
				this.keyMap[old] = undefined;
			} else {
				this.keyMap[obj[this.field]] = doc;
			}
		}
		remove(key) {
			var obj = this.keyMap[key];
			if (obj !== null && typeof obj !== 'undefined') {
				this.keyMap[key] = undefined;
				this.lokiMap[obj.$loki] = undefined;
			} else {
				throw new Error('Key is not in unique index: ' + this.field);
			}
		}
		clear() {
			this.keyMap = {};
			this.lokiMap = {};
		}
	}
	exports.UniqueIndex = UniqueIndex;

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	class ExactIndex {
	
		constructor(exactField) {
			this.index = {};
			this.field = exactField;
		}
	
		// add the value you want returned to the key in the index
		set(key, val) {
			if (this.index[key]) {
				this.index[key].push(val);
			} else {
				this.index[key] = [val];
			}
			console.log("?");
		}
	
		// remove the value from the index, if the value was the last one, remove the key
		remove(key, val) {
			var idxSet = this.index[key];
			for (var i in idxSet) {
				if (idxSet[i] == val) {
					idxSet.splice(i, 1);
				}
			}
			if (idxSet.length < 1) {
				this.index[key] = undefined;
			}
		}
	
		// get the values related to the key, could be more than one
		get(key) {
			console.log("!");
			return this.index[key];
		}
	
		// clear will zap the index
		clear(key) {
			this.index = {};
		}
	}
	exports.ExactIndex = ExactIndex;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.Resultset = exports.LokiOps = undefined;
	
	var _event_emitter = __webpack_require__(2);
	
	var _clone = __webpack_require__(9);
	
	var _collection = __webpack_require__(5);
	
	var _utils = __webpack_require__(10);
	
	var _helper = __webpack_require__(11);
	
	function containsCheckFn(a) {
		if (typeof a === 'string' || Array.isArray(a)) {
			return function (b) {
				return a.indexOf(b) !== -1;
			};
		} else if (typeof a === 'object' && a !== null) {
			return function (b) {
				return hasOwnProperty.call(a, b);
			};
		}
		return null;
	}
	
	function doQueryOp(val, op) {
		for (var p in op) {
			if (hasOwnProperty.call(op, p)) {
				return LokiOps[p](val, op[p]);
			}
		}
		return false;
	}
	
	var LokiOps = exports.LokiOps = {
		// comparison operators
		// a is the value in the collection
		// b is the query value
		$eq: function (a, b) {
			return a === b;
		},
	
		// abstract/loose equality
		$aeq: function (a, b) {
			return a == b;
		},
	
		$ne: function (a, b) {
			// ecma 5 safe test for NaN
			if (b !== b) {
				// ecma 5 test value is not NaN
				return a === a;
			}
	
			return a !== b;
		},
	
		$dteq: function (a, b) {
			if ((0, _helper.ltHelper)(a, b, false)) {
				return false;
			}
			return !(0, _helper.gtHelper)(a, b, false);
		},
	
		$gt: function (a, b) {
			return (0, _helper.gtHelper)(a, b, false);
		},
	
		$gte: function (a, b) {
			return (0, _helper.gtHelper)(a, b, true);
		},
	
		$lt: function (a, b) {
			return (0, _helper.ltHelper)(a, b, false);
		},
	
		$lte: function (a, b) {
			return (0, _helper.ltHelper)(a, b, true);
		},
	
		// ex : coll.find({'orderCount': {$between: [10, 50]}});
		$between: function (a, vals) {
			if (a === undefined || a === null) return false;
			return (0, _helper.gtHelper)(a, vals[0], true) && (0, _helper.ltHelper)(a, vals[1], true);
		},
	
		$in: function (a, b) {
			return b.indexOf(a) !== -1;
		},
	
		$nin: function (a, b) {
			return b.indexOf(a) === -1;
		},
	
		$keyin: function (a, b) {
			return a in b;
		},
	
		$nkeyin: function (a, b) {
			return !(a in b);
		},
	
		$definedin: function (a, b) {
			return b[a] !== undefined;
		},
	
		$undefinedin: function (a, b) {
			return b[a] === undefined;
		},
	
		$regex: function (a, b) {
			return b.test(a);
		},
	
		$containsString: function (a, b) {
			return typeof a === 'string' && a.indexOf(b) !== -1;
		},
	
		$containsNone: function (a, b) {
			return !LokiOps.$containsAny(a, b);
		},
	
		$containsAny: function (a, b) {
			var checkFn = containsCheckFn(a);
			if (checkFn !== null) {
				return Array.isArray(b) ? b.some(checkFn) : checkFn(b);
			}
			return false;
		},
	
		$contains: function (a, b) {
			var checkFn = containsCheckFn(a);
			if (checkFn !== null) {
				return Array.isArray(b) ? b.every(checkFn) : checkFn(b);
			}
			return false;
		},
	
		$type: function (a, b) {
			var type = typeof a;
			if (type === 'object') {
				if (Array.isArray(a)) {
					type = 'array';
				} else if (a instanceof Date) {
					type = 'date';
				}
			}
			return typeof b !== 'object' ? type === b : doQueryOp(type, b);
		},
	
		$size: function (a, b) {
			if (Array.isArray(a)) {
				return typeof b !== 'object' ? a.length === b : doQueryOp(a.length, b);
			}
			return false;
		},
	
		$len: function (a, b) {
			if (typeof a === 'string') {
				return typeof b !== 'object' ? a.length === b : doQueryOp(a.length, b);
			}
			return false;
		},
	
		$where: function (a, b) {
			return b(a) === true;
		},
	
		// field-level logical operators
		// a is the value in the collection
		// b is the nested query operation (for '$not')
		//   or an array of nested query operations (for '$and' and '$or')
		$not: function (a, b) {
			return !doQueryOp(a, b);
		},
	
		$and: function (a, b) {
			for (var idx = 0, len = b.length; idx < len; idx += 1) {
				if (!doQueryOp(a, b[idx])) {
					return false;
				}
			}
			return true;
		},
	
		$or: function (a, b) {
			for (var idx = 0, len = b.length; idx < len; idx += 1) {
				if (doQueryOp(a, b[idx])) {
					return true;
				}
			}
			return false;
		}
	};
	
	// making indexing opt-in... our range function knows how to deal with these ops :
	var indexedOpsList = ['$eq', '$aeq', '$dteq', '$gt', '$gte', '$lt', '$lte', '$in', '$between'];
	
	function sortHelper(prop1, prop2, desc) {
		if (prop1 === prop2) {
			return 0;
		}
	
		if ((0, _helper.ltHelper)(prop1, prop2, false)) {
			return desc ? 1 : -1;
		}
	
		if ((0, _helper.gtHelper)(prop1, prop2, false)) {
			return desc ? -1 : 1;
		}
	
		// not lt, not gt so implied equality-- date compatible
		return 0;
	}
	
	/**
	 * compoundeval() - helper function for compoundsort(), performing individual object comparisons
	 *
	 * @param {array} properties - array of property names, in order, by which to evaluate sort order
	 * @param {object} obj1 - first object to compare
	 * @param {object} obj2 - second object to compare
	 * @returns {integer} 0, -1, or 1 to designate if identical (sortwise) or which should be first
	 */
	function compoundeval(properties, obj1, obj2) {
		var res = 0;
		var prop, field;
		for (var i = 0, len = properties.length; i < len; i++) {
			prop = properties[i];
			field = prop[0];
			res = sortHelper(obj1[field], obj2[field], prop[1]);
			if (res !== 0) {
				return res;
			}
		}
		return 0;
	}
	
	/**
	 * dotSubScan - helper function used for dot notation queries.
	 *
	 * @param {object} root - object to traverse
	 * @param {array} paths - array of properties to drill into
	 * @param {function} fun - evaluation function to test with
	 * @param {any} value - comparative value to also pass to (compare) fun
	 * @param {number} poffset - index of the item in 'paths' to start the sub-scan from
	 */
	function dotSubScan(root, paths, fun, value, poffset) {
		var pathOffset = poffset || 0;
		var path = paths[pathOffset];
		if (root === undefined || root === null || !hasOwnProperty.call(root, path)) {
			return false;
		}
	
		var valueFound = false;
		var element = root[path];
		if (pathOffset + 1 >= paths.length) {
			// if we have already expanded out the dot notation,
			// then just evaluate the test function and value on the element
			valueFound = fun(element, value);
		} else if (Array.isArray(element)) {
			for (var index = 0, len = element.length; index < len; index += 1) {
				valueFound = dotSubScan(element[index], paths, fun, value, pathOffset + 1);
				if (valueFound === true) {
					break;
				}
			}
		} else {
			valueFound = dotSubScan(element, paths, fun, value, pathOffset + 1);
		}
	
		return valueFound;
	}
	
	/*
	'Utils' is not defined                 no-undef	x
	'sortHelper' is not defined            no-undef
	'compoundeval' is not defined          no-undef
	'indexedOpsList' is not defined        no-undef
	'LokiOps' is not defined               no-undef
	'dotSubScan' is not defined            no-undef
	'clone' is not defined                 no-undef
	 */
	
	/**
	 * Resultset class allowing chainable queries.  Intended to be instanced internally.
	 *    Collection.find(), Collection.where(), and Collection.chain() instantiate this.
	 *
	 * @example
	 *    mycollection.chain()
	 *      .find({ 'doors' : 4 })
	 *      .where(function(obj) { return obj.name === 'Toyota' })
	 *      .data();
	 *
	 * @constructor Resultset
	 * @param {Collection} collection - The collection which this Resultset will query against.
	 * @param {Object=} options - Object containing one or more options.
	 * @param {string} options.queryObj - Optional mongo-style query object to initialize resultset with.
	 * @param {function} options.queryFunc - Optional javascript filter function to initialize resultset with.
	 * @param {bool} options.firstOnly - Optional boolean used by collection.findOne().
	 */
	class Resultset {
	
		constructor(collection, options) {
			options = options || {};
	
			options.queryObj = options.queryObj || null;
			options.queryFunc = options.queryFunc || null;
			options.firstOnly = options.firstOnly || false;
	
			// retain reference to collection we are querying against
			this.collection = collection;
	
			// if chain() instantiates with null queryObj and queryFunc, so we will keep flag for later
			this.searchIsChained = !options.queryObj && !options.queryFunc;
			this.filteredrows = [];
			this.filterInitialized = false;
	
			// if user supplied initial queryObj or queryFunc, apply it
			if (typeof options.queryObj !== "undefined" && options.queryObj !== null) {
				return this.find(options.queryObj, options.firstOnly);
			}
			if (typeof options.queryFunc !== "undefined" && options.queryFunc !== null) {
				return this.where(options.queryFunc);
			}
	
			// otherwise return unfiltered Resultset for future filtering
			return this;
		}
	
		/**
	  * reset() - Reset the resultset to its initial state.
	  *
	  * @returns {Resultset} Reference to this resultset, for future chain operations.
	  */
		reset() {
			if (this.filteredrows.length > 0) {
				this.filteredrows = [];
			}
			this.filterInitialized = false;
			return this;
		}
	
		/**
	  * toJSON() - Override of toJSON to avoid circular references
	  *
	  */
		toJSON() {
			var copy = this.copy();
			copy.collection = null;
			return copy;
		}
	
		/**
	  * Allows you to limit the number of documents passed to next chain operation.
	  *    A resultset copy() is made to avoid altering original resultset.
	  *
	  * @param {int} qty - The number of documents to return.
	  * @returns {Resultset} Returns a copy of the resultset, limited by qty, for subsequent chain ops.
	  * @memberof Resultset
	  */
		limit(qty) {
			// if this is chained resultset with no filters applied, we need to populate filteredrows first
			if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
				this.filteredrows = this.collection.prepareFullDocIndex();
			}
	
			var rscopy = new Resultset(this.collection);
			rscopy.filteredrows = this.filteredrows.slice(0, qty);
			rscopy.filterInitialized = true;
			return rscopy;
		}
	
		/**
	  * Used for skipping 'pos' number of documents in the resultset.
	  *
	  * @param {int} pos - Number of documents to skip; all preceding documents are filtered out.
	  * @returns {Resultset} Returns a copy of the resultset, containing docs starting at 'pos' for subsequent chain ops.
	  * @memberof Resultset
	  */
		offset(pos) {
			// if this is chained resultset with no filters applied, we need to populate filteredrows first
			if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
				this.filteredrows = this.collection.prepareFullDocIndex();
			}
	
			var rscopy = new Resultset(this.collection);
			rscopy.filteredrows = this.filteredrows.slice(pos);
			rscopy.filterInitialized = true;
			return rscopy;
		}
	
		/**
	  * copy() - To support reuse of resultset in branched query situations.
	  *
	  * @returns {Resultset} Returns a copy of the resultset (set) but the underlying document references will be the same.
	  * @memberof Resultset
	  */
		copy() {
			var result = new Resultset(this.collection);
	
			if (this.filteredrows.length > 0) {
				result.filteredrows = this.filteredrows.slice();
			}
			result.filterInitialized = this.filterInitialized;
	
			return result;
		}
	
		/**
	  * Alias of copy()
	  * @memberof Resultset
	  */
		branch() {
			return this.copy();
		}
	
		/**
	  * transform() - executes a named collection transform or raw array of transform steps against the resultset.
	  *
	  * @param transform {(string|array)} - name of collection transform or raw transform array
	  * @param parameters {object=} - (Optional) object property hash of parameters, if the transform requires them.
	  * @returns {Resultset} either (this) resultset or a clone of of this resultset (depending on steps)
	  * @memberof Resultset
	  */
		transform(transform, parameters) {
			var idx,
			    step,
			    rs = this;
	
			// if transform is name, then do lookup first
			if (typeof transform === 'string') {
				if (this.collection.transforms.hasOwnProperty(transform)) {
					transform = this.collection.transforms[transform];
				}
			}
	
			// either they passed in raw transform array or we looked it up, so process
			if (typeof transform !== 'object' || !Array.isArray(transform)) {
				throw new Error("Invalid transform");
			}
	
			if (typeof parameters !== 'undefined') {
				transform = _utils.Utils.resolveTransformParams(transform, parameters);
			}
	
			for (idx = 0; idx < transform.length; idx++) {
				step = transform[idx];
	
				switch (step.type) {
					case "find":
						rs.find(step.value);
						break;
					case "where":
						rs.where(step.value);
						break;
					case "simplesort":
						rs.simplesort(step.property, step.desc);
						break;
					case "compoundsort":
						rs.compoundsort(step.value);
						break;
					case "sort":
						rs.sort(step.value);
						break;
					case "limit":
						rs = rs.limit(step.value);
						break; // limit makes copy so update reference
					case "offset":
						rs = rs.offset(step.value);
						break; // offset makes copy so update reference
					case "map":
						rs = rs.map(step.value);
						break;
					case "eqJoin":
						rs = rs.eqJoin(step.joinData, step.leftJoinKey, step.rightJoinKey, step.mapFun);
						break;
					// following cases break chain by returning array data so make any of these last in transform steps
					case "mapReduce":
						rs = rs.mapReduce(step.mapFunction, step.reduceFunction);
						break;
					// following cases update documents in current filtered resultset (use carefully)
					case "update":
						rs.update(step.value);
						break;
					case "remove":
						rs.remove();
						break;
					default:
						break;
				}
			}
	
			return rs;
		}
	
		/**
	  * Instances a new anonymous collection with the documents contained in the current resultset.
	  *
	  * @param {object} collectionOptions - Options to pass to new anonymous collection construction.
	  * @returns {Collection} A reference to an anonymous collection initialized with resultset data().
	  * @memberof Resultset
	  */
		instance(collectionOptions) {
			var docs = this.data();
			var idx, doc;
	
			collectionOptions = collectionOptions || {};
	
			var instanceCollection = new _collection.Collection(collectionOptions);
	
			for (idx = 0; idx < docs.length; idx++) {
				if (this.collection.cloneObjects) {
					doc = docs[idx];
				} else {
					doc = (0, _clone.clone)(docs[idx], this.collection.cloneMethod);
				}
	
				delete doc.$loki;
				delete doc.meta;
	
				instanceCollection.insert(doc);
			}
	
			return instanceCollection;
		}
	
		/**
	  * User supplied compare function is provided two documents to compare. (chainable)
	  * @example
	  *    rslt.sort(function(obj1, obj2) {
	  *      if (obj1.name === obj2.name) return 0;
	  *      if (obj1.name > obj2.name) return 1;
	  *      if (obj1.name < obj2.name) return -1;
	  *    });
	  *
	  * @param {function} comparefun - A javascript compare function used for sorting.
	  * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
	  * @memberof Resultset
	  */
		sort(comparefun) {
			// if this is chained resultset with no filters applied, just we need to populate filteredrows first
			if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
				this.filteredrows = this.collection.prepareFullDocIndex();
			}
	
			var wrappedComparer = function (userComparer, data) {
				return function (a, b) {
					return userComparer(data[a], data[b]);
				};
			}(comparefun, this.collection.data);
	
			this.filteredrows.sort(wrappedComparer);
	
			return this;
		}
	
		/**
	  * Simpler, loose evaluation for user to sort based on a property name. (chainable).
	  *    Sorting based on the same lt/gt helper functions used for binary indices.
	  *
	  * @param {string} propname - name of property to sort by.
	  * @param {bool=} isdesc - (Optional) If true, the property will be sorted in descending order
	  * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
	  * @memberof Resultset
	  */
		simplesort(propname, isdesc) {
			// if this is chained resultset with no filters applied, just we need to populate filteredrows first
			if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
				// if we have a binary index and no other filters applied, we can use that instead of sorting (again)
				if (this.collection.binaryIndices.hasOwnProperty(propname)) {
					// make sure index is up-to-date
					this.collection.ensureIndex(propname);
					// copy index values into filteredrows
					this.filteredrows = this.collection.binaryIndices[propname].values.slice(0);
					// we are done, return this (resultset) for further chain ops
					return this;
				}
				// otherwise initialize array for sort below
				else {
						this.filteredrows = this.collection.prepareFullDocIndex();
					}
			}
	
			if (typeof isdesc === 'undefined') {
				isdesc = false;
			}
	
			var wrappedComparer = function (prop, desc, data) {
				return function (a, b) {
					return sortHelper(data[a][prop], data[b][prop], desc);
				};
			}(propname, isdesc, this.collection.data);
	
			this.filteredrows.sort(wrappedComparer);
	
			return this;
		}
	
		/**
	  * Allows sorting a resultset based on multiple columns.
	  * @example
	  * // to sort by age and then name (both ascending)
	  * rs.compoundsort(['age', 'name']);
	  * // to sort by age (ascending) and then by name (descending)
	  * rs.compoundsort(['age', ['name', true]);
	  *
	  * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
	  * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
	  * @memberof Resultset
	  */
		compoundsort(properties) {
			if (properties.length === 0) {
				throw new Error("Invalid call to compoundsort, need at least one property");
			}
	
			var prop;
			if (properties.length === 1) {
				prop = properties[0];
				if (Array.isArray(prop)) {
					return this.simplesort(prop[0], prop[1]);
				}
				return this.simplesort(prop, false);
			}
	
			// unify the structure of 'properties' to avoid checking it repeatedly while sorting
			for (var i = 0, len = properties.length; i < len; i += 1) {
				prop = properties[i];
				if (!Array.isArray(prop)) {
					properties[i] = [prop, false];
				}
			}
	
			// if this is chained resultset with no filters applied, just we need to populate filteredrows first
			if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
				this.filteredrows = this.collection.prepareFullDocIndex();
			}
	
			var wrappedComparer = function (props, data) {
				return function (a, b) {
					return compoundeval(props, data[a], data[b]);
				};
			}(properties, this.collection.data);
	
			this.filteredrows.sort(wrappedComparer);
	
			return this;
		}
	
		/**
	  * findOr() - oversee the operation of OR'ed query expressions.
	  *    OR'ed expression evaluation runs each expression individually against the full collection,
	  *    and finally does a set OR on each expression's results.
	  *    Each evaluation can utilize a binary index to prevent multiple linear array scans.
	  *
	  * @param {array} expressionArray - array of expressions
	  * @returns {Resultset} this resultset for further chain ops.
	  */
		findOr(expressionArray) {
			var fr = null,
			    fri = 0,
			    frlen = 0,
			    docset = [],
			    idxset = [],
			    idx = 0,
			    origCount = this.count();
	
			// If filter is already initialized, then we query against only those items already in filter.
			// This means no index utilization for fields, so hopefully its filtered to a smallish filteredrows.
			for (var ei = 0, elen = expressionArray.length; ei < elen; ei++) {
				// we need to branch existing query to run each filter separately and combine results
				fr = this.branch().find(expressionArray[ei]).filteredrows;
				frlen = fr.length;
				// if the find operation did not reduce the initial set, then the initial set is the actual result
				if (frlen === origCount) {
					return this;
				}
	
				// add any document 'hits'
				for (fri = 0; fri < frlen; fri++) {
					idx = fr[fri];
					if (idxset[idx] === undefined) {
						idxset[idx] = true;
						docset.push(idx);
					}
				}
			}
	
			this.filteredrows = docset;
			this.filterInitialized = true;
	
			return this;
		}
		$or() {
			return this.findOr(...arguments);
		}
	
		/**
	  * findAnd() - oversee the operation of AND'ed query expressions.
	  *    AND'ed expression evaluation runs each expression progressively against the full collection,
	  *    internally utilizing existing chained resultset functionality.
	  *    Only the first filter can utilize a binary index.
	  *
	  * @param {array} expressionArray - array of expressions
	  * @returns {Resultset} this resultset for further chain ops.
	  */
		findAnd(expressionArray) {
			// we have already implementing method chaining in this (our Resultset class)
			// so lets just progressively apply user supplied and filters
			for (var i = 0, len = expressionArray.length; i < len; i++) {
				if (this.count() === 0) {
					return this;
				}
				this.find(expressionArray[i]);
			}
			return this;
		}
	
		$and() {
			return this.findAnd(...arguments);
		}
	
		/**
	  * Used for querying via a mongo-style query object.
	  *
	  * @param {object} query - A mongo-style query object used for filtering current results.
	  * @param {boolean=} firstOnly - (Optional) Used by collection.findOne()
	  * @returns {Resultset} this resultset for further chain ops.
	  * @memberof Resultset
	  */
		find(query, firstOnly) {
			if (this.collection.data.length === 0) {
				if (this.searchIsChained) {
					this.filteredrows = [];
					this.filterInitialized = true;
					return this;
				}
				return [];
			}
	
			var queryObject = query || 'getAll',
			    p,
			    property,
			    queryObjectOp,
			    operator,
			    value,
			    key,
			    searchByIndex = false,
			    result = [],
			    index = null;
	
			// if this was note invoked via findOne()
			firstOnly = firstOnly || false;
	
			if (typeof queryObject === 'object') {
				for (p in queryObject) {
					if (hasOwnProperty.call(queryObject, p)) {
						property = p;
						queryObjectOp = queryObject[p];
						break;
					}
				}
			}
	
			// apply no filters if they want all
			if (!property || queryObject === 'getAll') {
				// coll.find(), coll.findOne(), coll.chain().find().data() all path here
	
				if (firstOnly) {
					return this.collection.data.length > 0 ? this.collection.data[0] : null;
				}
	
				return this.searchIsChained ? this : this.collection.data.slice();
			}
	
			// injecting $and and $or expression tree evaluation here.
			if (property === '$and' || property === '$or') {
				if (this.searchIsChained) {
					this[property](queryObjectOp);
	
					// for chained find with firstonly,
					if (firstOnly && this.filteredrows.length > 1) {
						this.filteredrows = this.filteredrows.slice(0, 1);
					}
	
					return this;
				} else {
					// our $and operation internally chains filters
					result = this.collection.chain()[property](queryObjectOp).data();
	
					// if this was coll.findOne() return first object or empty array if null
					// since this is invoked from a constructor we can't return null, so we will
					// make null in coll.findOne();
					if (firstOnly) {
						return result.length === 0 ? [] : result[0];
					}
	
					// not first only return all results
					return result;
				}
			}
	
			// see if query object is in shorthand mode (assuming eq operator)
			if (queryObjectOp === null || typeof queryObjectOp !== 'object' || queryObjectOp instanceof Date) {
				operator = '$eq';
				value = queryObjectOp;
			} else if (typeof queryObjectOp === 'object') {
				for (key in queryObjectOp) {
					if (hasOwnProperty.call(queryObjectOp, key)) {
						operator = key;
						value = queryObjectOp[key];
						break;
					}
				}
			} else {
				throw new Error('Do not know what you want to do.');
			}
	
			// for regex ops, precompile
			if (operator === '$regex') {
				if (Array.isArray(value)) {
					value = new RegExp(value[0], value[1]);
				} else if (!(value instanceof RegExp)) {
					value = new RegExp(value);
				}
			}
	
			// if user is deep querying the object such as find('name.first': 'odin')
			var usingDotNotation = property.indexOf('.') !== -1;
	
			// if an index exists for the property being queried against, use it
			// for now only enabling for non-chained query (who's set of docs matches index)
			// or chained queries where it is the first filter applied and prop is indexed
			var doIndexCheck = !usingDotNotation && (!this.searchIsChained || !this.filterInitialized);
	
			if (doIndexCheck && this.collection.binaryIndices[property] && indexedOpsList.indexOf(operator) !== -1) {
				// this is where our lazy index rebuilding will take place
				// basically we will leave all indexes dirty until we need them
				// so here we will rebuild only the index tied to this property
				// ensureIndex() will only rebuild if flagged as dirty since we are not passing force=true param
				if (this.collection.adaptiveBinaryIndices !== true) {
					this.collection.ensureIndex(property);
				}
	
				searchByIndex = true;
				index = this.collection.binaryIndices[property];
			}
	
			// the comparison function
			var fun = LokiOps[operator];
	
			// "shortcut" for collection data
			var t = this.collection.data;
			// filter data length
			var i = 0,
			    len = 0;
	
			// Query executed differently depending on :
			//    - whether it is chained or not
			//    - whether the property being queried has an index defined
			//    - if chained, we handle first pass differently for initial filteredrows[] population
			//
			// For performance reasons, each case has its own if block to minimize in-loop calculations
	
			// If not a chained query, bypass filteredrows and work directly against data
			if (!this.searchIsChained) {
				if (!searchByIndex) {
					i = t.length;
	
					if (firstOnly) {
						if (usingDotNotation) {
							property = property.split('.');
							while (i--) {
								if (dotSubScan(t[i], property, fun, value)) {
									return t[i];
								}
							}
						} else {
							while (i--) {
								if (fun(t[i][property], value)) {
									return t[i];
								}
							}
						}
	
						return [];
					}
	
					// if using dot notation then treat property as keypath such as 'name.first'.
					// currently supporting dot notation for non-indexed conditions only
					if (usingDotNotation) {
						property = property.split('.');
						while (i--) {
							if (dotSubScan(t[i], property, fun, value)) {
								result.push(t[i]);
							}
						}
					} else {
						while (i--) {
							if (fun(t[i][property], value)) {
								result.push(t[i]);
							}
						}
					}
				} else {
					// searching by binary index via calculateRange() utility method
					var seg = this.collection.calculateRange(operator, property, value);
	
					// not chained so this 'find' was designated in Resultset constructor
					// so return object itself
					if (firstOnly) {
						if (seg[1] !== -1) {
							return t[index.values[seg[0]]];
						}
						return [];
					}
	
					if (operator !== '$in') {
						for (i = seg[0]; i <= seg[1]; i++) {
							result.push(t[index.values[i]]);
						}
					} else {
						for (i = 0, len = seg.length; i < len; i++) {
							result.push(t[index.values[seg[i]]]);
						}
					}
				}
	
				// not a chained query so return result as data[]
				return result;
			}
	
			// Otherwise this is a chained query
			// Chained queries now preserve results ordering at expense on slightly reduced unindexed performance
	
			var filter,
			    rowIdx = 0;
	
			// If the filteredrows[] is already initialized, use it
			if (this.filterInitialized) {
				filter = this.filteredrows;
				len = filter.length;
	
				// currently supporting dot notation for non-indexed conditions only
				if (usingDotNotation) {
					property = property.split('.');
					for (i = 0; i < len; i++) {
						rowIdx = filter[i];
						if (dotSubScan(t[rowIdx], property, fun, value)) {
							result.push(rowIdx);
						}
					}
				} else {
					for (i = 0; i < len; i++) {
						rowIdx = filter[i];
						if (fun(t[rowIdx][property], value)) {
							result.push(rowIdx);
						}
					}
				}
			}
			// first chained query so work against data[] but put results in filteredrows
			else {
					// if not searching by index
					if (!searchByIndex) {
						len = t.length;
	
						if (usingDotNotation) {
							property = property.split('.');
							for (i = 0; i < len; i++) {
								if (dotSubScan(t[i], property, fun, value)) {
									result.push(i);
								}
							}
						} else {
							for (i = 0; i < len; i++) {
								if (fun(t[i][property], value)) {
									result.push(i);
								}
							}
						}
					} else {
						// search by index
						var segm = this.collection.calculateRange(operator, property, value);
	
						if (operator !== '$in') {
							for (i = segm[0]; i <= segm[1]; i++) {
								result.push(index.values[i]);
							}
						} else {
							for (i = 0, len = segm.length; i < len; i++) {
								result.push(index.values[segm[i]]);
							}
						}
					}
	
					this.filterInitialized = true; // next time work against filteredrows[]
				}
	
			this.filteredrows = result;
			return this;
		}
	
		/**
	  * where() - Used for filtering via a javascript filter function.
	  *
	  * @param {function} fun - A javascript function used for filtering current results by.
	  * @returns {Resultset} this resultset for further chain ops.
	  * @memberof Resultset
	  */
		where(fun) {
			var viewFunction,
			    result = [];
	
			if ('function' === typeof fun) {
				viewFunction = fun;
			} else {
				throw new TypeError('Argument is not a stored view or a function');
			}
			try {
				// if not a chained query then run directly against data[] and return object []
				if (!this.searchIsChained) {
					var i = this.collection.data.length;
	
					while (i--) {
						if (viewFunction(this.collection.data[i]) === true) {
							result.push(this.collection.data[i]);
						}
					}
	
					// not a chained query so returning result as data[]
					return result;
				}
				// else chained query, so run against filteredrows
				else {
						// If the filteredrows[] is already initialized, use it
						if (this.filterInitialized) {
							var j = this.filteredrows.length;
	
							while (j--) {
								if (viewFunction(this.collection.data[this.filteredrows[j]]) === true) {
									result.push(this.filteredrows[j]);
								}
							}
	
							this.filteredrows = result;
	
							return this;
						}
						// otherwise this is initial chained op, work against data, push into filteredrows[]
						else {
								var k = this.collection.data.length;
	
								while (k--) {
									if (viewFunction(this.collection.data[k]) === true) {
										result.push(k);
									}
								}
	
								this.filteredrows = result;
								this.filterInitialized = true;
	
								return this;
							}
					}
			} catch (err) {
				throw err;
			}
		}
	
		/**
	  * count() - returns the number of documents in the resultset.
	  *
	  * @returns {number} The number of documents in the resultset.
	  * @memberof Resultset
	  */
		count() {
			if (this.searchIsChained && this.filterInitialized) {
				return this.filteredrows.length;
			}
			return this.collection.count();
		}
	
		/**
	  * Terminates the chain and returns array of filtered documents
	  *
	  * @param {object=} options - allows specifying 'forceClones' and 'forceCloneMethod' options.
	  * @param {boolean} options.forceClones - Allows forcing the return of cloned objects even when
	  *        the collection is not configured for clone object.
	  * @param {string} options.forceCloneMethod - Allows overriding the default or collection specified cloning method.
	  *        Possible values include 'parse-stringify', 'jquery-extend-deep', and 'shallow'
	  *
	  * @returns {array} Array of documents in the resultset
	  * @memberof Resultset
	  */
		data(options) {
			var result = [],
			    data = this.collection.data,
			    len,
			    i,
			    method;
	
			options = options || {};
	
			// if this is chained resultset with no filters applied, just return collection.data
			if (this.searchIsChained && !this.filterInitialized) {
				if (this.filteredrows.length === 0) {
					// determine whether we need to clone objects or not
					if (this.collection.cloneObjects || options.forceClones) {
						len = data.length;
						method = options.forceCloneMethod || this.collection.cloneMethod;
	
						for (i = 0; i < len; i++) {
							result.push((0, _clone.clone)(data[i], method));
						}
						return result;
					}
					// otherwise we are not cloning so return sliced array with same object references
					else {
							return data.slice();
						}
				} else {
					// filteredrows must have been set manually, so use it
					this.filterInitialized = true;
				}
			}
	
			var fr = this.filteredrows;
			len = fr.length;
	
			if (this.collection.cloneObjects || options.forceClones) {
				method = options.forceCloneMethod || this.collection.cloneMethod;
				for (i = 0; i < len; i++) {
					result.push((0, _clone.clone)(data[fr[i]], method));
				}
			} else {
				for (i = 0; i < len; i++) {
					result.push(data[fr[i]]);
				}
			}
			return result;
		}
	
		/**
	  * Used to run an update operation on all documents currently in the resultset.
	  *
	  * @param {function} updateFunction - User supplied updateFunction(obj) will be executed for each document object.
	  * @returns {Resultset} this resultset for further chain ops.
	  * @memberof Resultset
	  */
		update(updateFunction) {
	
			if (typeof updateFunction !== "function") {
				throw new TypeError('Argument is not a function');
			}
	
			// if this is chained resultset with no filters applied, we need to populate filteredrows first
			if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
				this.filteredrows = this.collection.prepareFullDocIndex();
			}
	
			var len = this.filteredrows.length,
			    rcd = this.collection.data;
	
			for (var idx = 0; idx < len; idx++) {
				// pass in each document object currently in resultset to user supplied updateFunction
				updateFunction(rcd[this.filteredrows[idx]]);
	
				// notify collection we have changed this object so it can update meta and allow DynamicViews to re-evaluate
				this.collection.update(rcd[this.filteredrows[idx]]);
			}
	
			return this;
		}
	
		/**
	  * Removes all document objects which are currently in resultset from collection (as well as resultset)
	  *
	  * @returns {Resultset} this (empty) resultset for further chain ops.
	  * @memberof Resultset
	  */
		remove() {
	
			// if this is chained resultset with no filters applied, we need to populate filteredrows first
			if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
				this.filteredrows = this.collection.prepareFullDocIndex();
			}
	
			this.collection.remove(this.data());
	
			this.filteredrows = [];
	
			return this;
		}
	
		/**
	  * data transformation via user supplied functions
	  *
	  * @param {function} mapFunction - this function accepts a single document for you to transform and return
	  * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
	  * @returns {value} The output of your reduceFunction
	  * @memberof Resultset
	  */
		mapReduce(mapFunction, reduceFunction) {
			try {
				return reduceFunction(this.data().map(mapFunction));
			} catch (err) {
				throw err;
			}
		}
	
		/**
	  * eqJoin() - Left joining two sets of data. Join keys can be defined or calculated properties
	  * eqJoin expects the right join key values to be unique.  Otherwise left data will be joined on the last joinData object with that key
	  * @param {Array} joinData - Data array to join to.
	  * @param {(string|function)} leftJoinKey - Property name in this result set to join on or a function to produce a value to join on
	  * @param {(string|function)} rightJoinKey - Property name in the joinData to join on or a function to produce a value to join on
	  * @param {function=} mapFun - (Optional) A function that receives each matching pair and maps them into output objects - function(left,right){return joinedObject}
	  * @returns {Resultset} A resultset with data in the format [{left: leftObj, right: rightObj}]
	  * @memberof Resultset
	  */
		eqJoin(joinData, leftJoinKey, rightJoinKey, mapFun) {
	
			var leftData = [],
			    leftDataLength,
			    rightData = [],
			    rightDataLength,
			    key,
			    result = [],
			    leftKeyisFunction = typeof leftJoinKey === 'function',
			    rightKeyisFunction = typeof rightJoinKey === 'function',
			    joinMap = {};
	
			//get the left data
			leftData = this.data();
			leftDataLength = leftData.length;
	
			//get the right data
			if (joinData instanceof Resultset) {
				rightData = joinData.data();
			} else if (Array.isArray(joinData)) {
				rightData = joinData;
			} else {
				throw new TypeError('joinData needs to be an array or result set');
			}
			rightDataLength = rightData.length;
	
			//construct a lookup table
	
			for (var i = 0; i < rightDataLength; i++) {
				key = rightKeyisFunction ? rightJoinKey(rightData[i]) : rightData[i][rightJoinKey];
				joinMap[key] = rightData[i];
			}
	
			if (!mapFun) {
				mapFun = function (left, right) {
					return {
						left: left,
						right: right
					};
				};
			}
	
			//Run map function over each object in the resultset
			for (var j = 0; j < leftDataLength; j++) {
				key = leftKeyisFunction ? leftJoinKey(leftData[j]) : leftData[j][leftJoinKey];
				result.push(mapFun(leftData[j], joinMap[key] || {}));
			}
	
			//return return a new resultset with no filters
			this.collection = new _collection.Collection('joinData');
			this.collection.insert(result);
			this.filteredrows = [];
			this.filterInitialized = false;
	
			return this;
		}
	
		map(mapFun) {
			var data = this.data().map(mapFun);
			//return return a new resultset with no filters
			this.collection = new _collection.Collection('mappedData');
			this.collection.insert(data);
			this.filteredrows = [];
			this.filterInitialized = false;
	
			return this;
		}
	}
	exports.Resultset = Resultset;

/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.clone = clone;
	exports.cloneObjectArray = cloneObjectArray;
	function clone(data, method) {
		if (data === null || data === undefined) {
			return null;
		}
	
		var cloneMethod = method || 'parse-stringify',
		    cloned;
	
		switch (cloneMethod) {
			case "parse-stringify":
				cloned = JSON.parse(JSON.stringify(data));
				break;
			case "jquery-extend-deep":
				cloned = jQuery.extend(true, {}, data);
				break;
			case "shallow":
				cloned = Object.create(data.prototype || null);
				Object.keys(data).map(function (i) {
					cloned[i] = data[i];
				});
				break;
			default:
				break;
		}
	
		return cloned;
	}
	
	function cloneObjectArray(objarray, method) {
		var i,
		    result = [];
	
		if (method == "parse-stringify") {
			return clone(objarray, method);
		}
	
		i = objarray.length - 1;
	
		for (; i <= 0; i--) {
			result.push(clone(objarray[i], method));
		}
	
		return result;
	}

/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	/**
	 * Created by toni on 1/27/17.
	 */
	
	var Utils = exports.Utils = {
		copyProperties: function (src, dest) {
			var prop;
			for (prop in src) {
				dest[prop] = src[prop];
			}
		},
		// used to recursively scan hierarchical transform step object for param substitution
		resolveTransformObject: function (subObj, params, depth) {
			var prop, pname;
	
			if (typeof depth !== 'number') {
				depth = 0;
			}
	
			if (++depth >= 10) return subObj;
	
			for (prop in subObj) {
				if (typeof subObj[prop] === 'string' && subObj[prop].indexOf("[%lktxp]") === 0) {
					pname = subObj[prop].substring(8);
					if (params.hasOwnProperty(pname)) {
						subObj[prop] = params[pname];
					}
				} else if (typeof subObj[prop] === "object") {
					subObj[prop] = Utils.resolveTransformObject(subObj[prop], params, depth);
				}
			}
	
			return subObj;
		},
		// top level utility to resolve an entire (single) transform (array of steps) for parameter substitution
		resolveTransformParams: function (transform, params) {
			var idx,
			    clonedStep,
			    resolvedTransform = [];
	
			if (typeof params === 'undefined') return transform;
	
			// iterate all steps in the transform array
			for (idx = 0; idx < transform.length; idx++) {
				// clone transform so our scan and replace can operate directly on cloned transform
				clonedStep = JSON.parse(JSON.stringify(transform[idx]));
				resolvedTransform.push(Utils.resolveTransformObject(clonedStep, params));
			}
	
			return resolvedTransform;
		}
	};

/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.ltHelper = ltHelper;
	exports.gtHelper = gtHelper;
	/**
	 * Created by toni on 1/27/17.
	 */
	
	/** Helper function for determining 'less-than' conditions for ops, sorting, and binary indices.
	 *     In the future we might want $lt and $gt ops to use their own functionality/helper.
	 *     Since binary indices on a property might need to index [12, NaN, new Date(), Infinity], we
	 *     need this function (as well as gtHelper) to always ensure one value is LT, GT, or EQ to another.
	 */
	function ltHelper(prop1, prop2, equal) {
		var cv1, cv2;
	
		// 'falsy' and Boolean handling
		if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
			if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
				if (equal) {
					return prop1 === prop2;
				} else {
					if (prop1) {
						return false;
					} else {
						return prop2;
					}
				}
			}
	
			if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
				return equal;
			}
			if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
				return true;
			}
		}
	
		if (prop1 === prop2) {
			return equal;
		}
	
		if (prop1 < prop2) {
			return true;
		}
	
		if (prop1 > prop2) {
			return false;
		}
	
		// not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
		cv1 = prop1.toString();
		cv2 = prop2.toString();
	
		if (cv1 == cv2) {
			return equal;
		}
	
		if (cv1 < cv2) {
			return true;
		}
	
		return false;
	}
	
	function gtHelper(prop1, prop2, equal) {
		var cv1, cv2;
	
		// 'falsy' and Boolean handling
		if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
			if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
				if (equal) {
					return prop1 === prop2;
				} else {
					if (prop1) {
						return !prop2;
					} else {
						return false;
					}
				}
			}
	
			if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
				return equal;
			}
			if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
				return true;
			}
		}
	
		if (prop1 === prop2) {
			return equal;
		}
	
		if (prop1 > prop2) {
			return true;
		}
	
		if (prop1 < prop2) {
			return false;
		}
	
		// not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
		cv1 = prop1.toString();
		cv2 = prop2.toString();
	
		if (cv1 == cv2) {
			return equal;
		}
	
		if (cv1 > cv2) {
			return true;
		}
	
		return false;
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.DynamicView = undefined;
	
	var _event_emitter = __webpack_require__(2);
	
	var _resultset = __webpack_require__(8);
	
	/*
	'LokiEventEmitter' is not defined        no-undef
	'Resultset' is not defined               no-undef
	 */
	
	/**
	 * DynamicView class is a versatile 'live' view class which can have filters and sorts applied.
	 *    Collection.addDynamicView(name) instantiates this DynamicView object and notifies it
	 *    whenever documents are add/updated/removed so it can remain up-to-date. (chainable)
	 *
	 * @example
	 * var mydv = mycollection.addDynamicView('test');  // default is non-persistent
	 * mydv.applyFind({ 'doors' : 4 });
	 * mydv.applyWhere(function(obj) { return obj.name === 'Toyota'; });
	 * var results = mydv.data();
	 *
	 * @constructor DynamicView
	 * @implements LokiEventEmitter
	 * @param {Collection} collection - A reference to the collection to work against
	 * @param {string} name - The name of this dynamic view
	 * @param {object=} options - (Optional) Pass in object with 'persistent' and/or 'sortPriority' options.
	 * @param {boolean} options.persistent - indicates if view is to main internal results array in 'resultdata'
	 * @param {string} options.sortPriority - 'passive' (sorts performed on call to data) or 'active' (after updates)
	 * @param {number} options.minRebuildInterval - minimum rebuild interval (need clarification to docs here)
	 * @see {@link Collection#addDynamicView} to construct instances of DynamicView
	 */
	class DynamicView extends _event_emitter.LokiEventEmitter {
	
		constructor(collection, name, options) {
			super();
			this.collection = collection;
			this.name = name;
			this.rebuildPending = false;
			this.options = options || {};
	
			if (!this.options.hasOwnProperty('persistent')) {
				this.options.persistent = false;
			}
	
			// 'persistentSortPriority':
			// 'passive' will defer the sort phase until they call data(). (most efficient overall)
			// 'active' will sort async whenever next idle. (prioritizes read speeds)
			if (!this.options.hasOwnProperty('sortPriority')) {
				this.options.sortPriority = 'passive';
			}
	
			if (!this.options.hasOwnProperty('minRebuildInterval')) {
				this.options.minRebuildInterval = 1;
			}
	
			this.resultset = new _resultset.Resultset(collection);
			this.resultdata = [];
			this.resultsdirty = false;
	
			this.cachedresultset = null;
	
			// keep ordered filter pipeline
			this.filterPipeline = [];
	
			// sorting member variables
			// we only support one active search, applied using applySort() or applySimpleSort()
			this.sortFunction = null;
			this.sortCriteria = null;
			this.sortDirty = false;
	
			// for now just have 1 event for when we finally rebuilt lazy view
			// once we refactor transactions, i will tie in certain transactional events
	
			this.events = {
				'rebuild': []
			};
		}
	
		/**
	  * rematerialize() - intended for use immediately after deserialization (loading)
	  *    This will clear out and reapply filterPipeline ops, recreating the view.
	  *    Since where filters do not persist correctly, this method allows
	  *    restoring the view to state where user can re-apply those where filters.
	  *
	  * @param {Object=} options - (Optional) allows specification of 'removeWhereFilters' option
	  * @returns {DynamicView} This dynamic view for further chained ops.
	  * @memberof DynamicView
	  * @fires DynamicView.rebuild
	  */
		rematerialize(options) {
			var fpl, fpi, idx;
	
			options = options || {};
	
			this.resultdata = [];
			this.resultsdirty = true;
			this.resultset = new _resultset.Resultset(this.collection);
	
			if (this.sortFunction || this.sortCriteria) {
				this.sortDirty = true;
			}
	
			if (options.hasOwnProperty('removeWhereFilters')) {
				// for each view see if it had any where filters applied... since they don't
				// serialize those functions lets remove those invalid filters
				fpl = this.filterPipeline.length;
				fpi = fpl;
				while (fpi--) {
					if (this.filterPipeline[fpi].type === 'where') {
						if (fpi !== this.filterPipeline.length - 1) {
							this.filterPipeline[fpi] = this.filterPipeline[this.filterPipeline.length - 1];
						}
	
						this.filterPipeline.length--;
					}
				}
			}
	
			// back up old filter pipeline, clear filter pipeline, and reapply pipeline ops
			var ofp = this.filterPipeline;
			this.filterPipeline = [];
	
			// now re-apply 'find' filterPipeline ops
			fpl = ofp.length;
			for (idx = 0; idx < fpl; idx++) {
				this.applyFind(ofp[idx].val);
			}
	
			// during creation of unit tests, i will remove this forced refresh and leave lazy
			this.data();
	
			// emit rebuild event in case user wants to be notified
			this.emit('rebuild', this);
	
			return this;
		}
	
		/**
	  * branchResultset() - Makes a copy of the internal resultset for branched queries.
	  *    Unlike this dynamic view, the branched resultset will not be 'live' updated,
	  *    so your branched query should be immediately resolved and not held for future evaluation.
	  *
	  * @param {(string|array=)} transform - Optional name of collection transform, or an array of transform steps
	  * @param {object=} parameters - optional parameters (if optional transform requires them)
	  * @returns {Resultset} A copy of the internal resultset for branched queries.
	  * @memberof DynamicView
	  */
		branchResultset(transform, parameters) {
			var rs = this.resultset.branch();
	
			if (typeof transform === 'undefined') {
				return rs;
			}
	
			return rs.transform(transform, parameters);
		}
	
		/**
	  * toJSON() - Override of toJSON to avoid circular references
	  *
	  */
		toJSON() {
			var copy = new DynamicView(this.collection, this.name, this.options);
	
			copy.resultset = this.resultset;
			copy.resultdata = []; // let's not save data (copy) to minimize size
			copy.resultsdirty = true;
			copy.filterPipeline = this.filterPipeline;
			copy.sortFunction = this.sortFunction;
			copy.sortCriteria = this.sortCriteria;
			copy.sortDirty = this.sortDirty;
	
			// avoid circular reference, reapply in db.loadJSON()
			copy.collection = null;
	
			return copy;
		}
	
		/**
	  * removeFilters() - Used to clear pipeline and reset dynamic view to initial state.
	  *     Existing options should be retained.
	  * @param {object=} options - configure removeFilter behavior
	  * @param {boolean=} options.queueSortPhase - (default: false) if true we will async rebuild view (maybe set default to true in future?)
	  * @memberof DynamicView
	  */
		removeFilters(options) {
			options = options || {};
	
			this.rebuildPending = false;
			this.resultset.reset();
			this.resultdata = [];
			this.resultsdirty = true;
	
			this.cachedresultset = null;
	
			// keep ordered filter pipeline
			this.filterPipeline = [];
	
			// sorting member variables
			// we only support one active search, applied using applySort() or applySimpleSort()
			this.sortFunction = null;
			this.sortCriteria = null;
			this.sortDirty = false;
	
			if (options.queueSortPhase === true) {
				this.queueSortPhase();
			}
		}
	
		/**
	  * applySort() - Used to apply a sort to the dynamic view
	  * @example
	  * dv.applySort(function(obj1, obj2) {
	  *   if (obj1.name === obj2.name) return 0;
	  *   if (obj1.name > obj2.name) return 1;
	  *   if (obj1.name < obj2.name) return -1;
	  * });
	  *
	  * @param {function} comparefun - a javascript compare function used for sorting
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  * @memberof DynamicView
	  */
		applySort(comparefun) {
			this.sortFunction = comparefun;
			this.sortCriteria = null;
	
			this.queueSortPhase();
	
			return this;
		}
	
		/**
	  * applySimpleSort() - Used to specify a property used for view translation.
	  * @example
	  * dv.applySimpleSort("name");
	  *
	  * @param {string} propname - Name of property by which to sort.
	  * @param {boolean=} isdesc - (Optional) If true, the sort will be in descending order.
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  * @memberof DynamicView
	  */
		applySimpleSort(propname, isdesc) {
			this.sortCriteria = [[propname, isdesc || false]];
			this.sortFunction = null;
	
			this.queueSortPhase();
	
			return this;
		}
	
		/**
	  * applySortCriteria() - Allows sorting a resultset based on multiple columns.
	  * @example
	  * // to sort by age and then name (both ascending)
	  * dv.applySortCriteria(['age', 'name']);
	  * // to sort by age (ascending) and then by name (descending)
	  * dv.applySortCriteria(['age', ['name', true]);
	  * // to sort by age (descending) and then by name (descending)
	  * dv.applySortCriteria(['age', true], ['name', true]);
	  *
	  * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
	  * @returns {DynamicView} Reference to this DynamicView, sorted, for future chain operations.
	  * @memberof DynamicView
	  */
		applySortCriteria(criteria) {
			this.sortCriteria = criteria;
			this.sortFunction = null;
	
			this.queueSortPhase();
	
			return this;
		}
	
		/**
	  * startTransaction() - marks the beginning of a transaction.
	  *
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  */
		startTransaction() {
			this.cachedresultset = this.resultset.copy();
	
			return this;
		}
	
		/**
	  * commit() - commits a transaction.
	  *
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  */
		commit() {
			this.cachedresultset = null;
	
			return this;
		}
	
		/**
	  * rollback() - rolls back a transaction.
	  *
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  */
		rollback() {
			this.resultset = this.cachedresultset;
	
			if (this.options.persistent) {
				// for now just rebuild the persistent dynamic view data in this worst case scenario
				// (a persistent view utilizing transactions which get rolled back), we already know the filter so not too bad.
				this.resultdata = this.resultset.data();
	
				this.emit('rebuild', this);
			}
	
			return this;
		}
	
		/**
	  * Implementation detail.
	  * _indexOfFilterWithId() - Find the index of a filter in the pipeline, by that filter's ID.
	  *
	  * @param {(string|number)} uid - The unique ID of the filter.
	  * @returns {number}: index of the referenced filter in the pipeline; -1 if not found.
	  */
		_indexOfFilterWithId(uid) {
			if (typeof uid === 'string' || typeof uid === 'number') {
				for (var idx = 0, len = this.filterPipeline.length; idx < len; idx += 1) {
					if (uid === this.filterPipeline[idx].uid) {
						return idx;
					}
				}
			}
			return -1;
		}
	
		/**
	  * Implementation detail.
	  * _addFilter() - Add the filter object to the end of view's filter pipeline and apply the filter to the resultset.
	  *
	  * @param {object} filter - The filter object. Refer to applyFilter() for extra details.
	  */
		_addFilter(filter) {
			this.filterPipeline.push(filter);
			this.resultset[filter.type](filter.val);
		}
	
		/**
	  * reapplyFilters() - Reapply all the filters in the current pipeline.
	  *
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  */
		reapplyFilters() {
			this.resultset.reset();
	
			this.cachedresultset = null;
			if (this.options.persistent) {
				this.resultdata = [];
				this.resultsdirty = true;
			}
	
			var filters = this.filterPipeline;
			this.filterPipeline = [];
	
			for (var idx = 0, len = filters.length; idx < len; idx += 1) {
				this._addFilter(filters[idx]);
			}
	
			if (this.sortFunction || this.sortCriteria) {
				this.queueSortPhase();
			} else {
				this.queueRebuildEvent();
			}
	
			return this;
		}
	
		/**
	  * applyFilter() - Adds or updates a filter in the DynamicView filter pipeline
	  *
	  * @param {object} filter - A filter object to add to the pipeline.
	  *    The object is in the format { 'type': filter_type, 'val', filter_param, 'uid', optional_filter_id }
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  * @memberof DynamicView
	  */
		applyFilter(filter) {
			var idx = this._indexOfFilterWithId(filter.uid);
			if (idx >= 0) {
				this.filterPipeline[idx] = filter;
				return this.reapplyFilters();
			}
	
			this.cachedresultset = null;
			if (this.options.persistent) {
				this.resultdata = [];
				this.resultsdirty = true;
			}
	
			this._addFilter(filter);
	
			if (this.sortFunction || this.sortCriteria) {
				this.queueSortPhase();
			} else {
				this.queueRebuildEvent();
			}
	
			return this;
		}
	
		/**
	  * applyFind() - Adds or updates a mongo-style query option in the DynamicView filter pipeline
	  *
	  * @param {object} query - A mongo-style query object to apply to pipeline
	  * @param {(string|number)=} uid - Optional: The unique ID of this filter, to reference it in the future.
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  * @memberof DynamicView
	  */
		applyFind(query, uid) {
			this.applyFilter({
				type: 'find',
				val: query,
				uid: uid
			});
			return this;
		}
	
		/**
	  * applyWhere() - Adds or updates a javascript filter function in the DynamicView filter pipeline
	  *
	  * @param {function} fun - A javascript filter function to apply to pipeline
	  * @param {(string|number)=} uid - Optional: The unique ID of this filter, to reference it in the future.
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  * @memberof DynamicView
	  */
		applyWhere(fun, uid) {
			this.applyFilter({
				type: 'where',
				val: fun,
				uid: uid
			});
			return this;
		}
	
		/**
	  * removeFilter() - Remove the specified filter from the DynamicView filter pipeline
	  *
	  * @param {(string|number)} uid - The unique ID of the filter to be removed.
	  * @returns {DynamicView} this DynamicView object, for further chain ops.
	  * @memberof DynamicView
	  */
		removeFilter(uid) {
			var idx = this._indexOfFilterWithId(uid);
			if (idx < 0) {
				throw new Error("Dynamic view does not contain a filter with ID: " + uid);
			}
	
			this.filterPipeline.splice(idx, 1);
			this.reapplyFilters();
			return this;
		}
	
		/**
	  * count() - returns the number of documents representing the current DynamicView contents.
	  *
	  * @returns {number} The number of documents representing the current DynamicView contents.
	  * @memberof DynamicView
	  */
		count() {
			// in order to be accurate we will pay the minimum cost (and not alter dv state management)
			// recurring resultset data resolutions should know internally its already up to date.
			// for persistent data this will not update resultdata nor fire rebuild event.
			if (this.resultsdirty) {
				this.resultdata = this.resultset.data();
			}
	
			return this.resultset.count();
		}
	
		/**
	  * data() - resolves and pending filtering and sorting, then returns document array as result.
	  *
	  * @returns {array} An array of documents representing the current DynamicView contents.
	  * @memberof DynamicView
	  */
		data() {
			// using final sort phase as 'catch all' for a few use cases which require full rebuild
			if (this.sortDirty || this.resultsdirty) {
				this.performSortPhase({
					suppressRebuildEvent: true
				});
			}
			return this.options.persistent ? this.resultdata : this.resultset.data();
		}
	
		/**
	  * queueRebuildEvent() - When the view is not sorted we may still wish to be notified of rebuild events.
	  *     This event will throttle and queue a single rebuild event when batches of updates affect the view.
	  */
		queueRebuildEvent() {
			if (this.rebuildPending) {
				return;
			}
			this.rebuildPending = true;
	
			var self = this;
			setTimeout(function () {
				if (self.rebuildPending) {
					self.rebuildPending = false;
					self.emit('rebuild', self);
				}
			}, this.options.minRebuildInterval);
		}
	
		/**
	  * queueSortPhase : If the view is sorted we will throttle sorting to either :
	  *    (1) passive - when the user calls data(), or
	  *    (2) active - once they stop updating and yield js thread control
	  */
		queueSortPhase() {
			// already queued? exit without queuing again
			if (this.sortDirty) {
				return;
			}
			this.sortDirty = true;
	
			var self = this;
			if (this.options.sortPriority === "active") {
				// active sorting... once they are done and yield js thread, run async performSortPhase()
				setTimeout(function () {
					self.performSortPhase();
				}, this.options.minRebuildInterval);
			} else {
				// must be passive sorting... since not calling performSortPhase (until data call), lets use queueRebuildEvent to
				// potentially notify user that data has changed.
				this.queueRebuildEvent();
			}
		}
	
		/**
	  * performSortPhase() - invoked synchronously or asynchronously to perform final sort phase (if needed)
	  *
	  */
		performSortPhase(options) {
			// async call to this may have been pre-empted by synchronous call to data before async could fire
			if (!this.sortDirty && !this.resultsdirty) {
				return;
			}
	
			options = options || {};
	
			if (this.sortDirty) {
				if (this.sortFunction) {
					this.resultset.sort(this.sortFunction);
				} else if (this.sortCriteria) {
					this.resultset.compoundsort(this.sortCriteria);
				}
	
				this.sortDirty = false;
			}
	
			if (this.options.persistent) {
				// persistent view, rebuild local resultdata array
				this.resultdata = this.resultset.data();
				this.resultsdirty = false;
			}
	
			if (!options.suppressRebuildEvent) {
				this.emit('rebuild', this);
			}
		}
	
		/**
	  * evaluateDocument() - internal method for (re)evaluating document inclusion.
	  *    Called by : collection.insert() and collection.update().
	  *
	  * @param {int} objIndex - index of document to (re)run through filter pipeline.
	  * @param {bool} isNew - true if the document was just added to the collection.
	  */
		evaluateDocument(objIndex, isNew) {
			// if no filter applied yet, the result 'set' should remain 'everything'
			if (!this.resultset.filterInitialized) {
				if (this.options.persistent) {
					this.resultdata = this.resultset.data();
				}
				// need to re-sort to sort new document
				if (this.sortFunction || this.sortCriteria) {
					this.queueSortPhase();
				} else {
					this.queueRebuildEvent();
				}
				return;
			}
	
			var ofr = this.resultset.filteredrows;
			var oldPos = isNew ? -1 : ofr.indexOf(+objIndex);
			var oldlen = ofr.length;
	
			// creating a 1-element resultset to run filter chain ops on to see if that doc passes filters;
			// mostly efficient algorithm, slight stack overhead price (this function is called on inserts and updates)
			var evalResultset = new _resultset.Resultset(this.collection);
			evalResultset.filteredrows = [objIndex];
			evalResultset.filterInitialized = true;
			var filter;
			for (var idx = 0, len = this.filterPipeline.length; idx < len; idx++) {
				filter = this.filterPipeline[idx];
				evalResultset[filter.type](filter.val);
			}
	
			// not a true position, but -1 if not pass our filter(s), 0 if passed filter(s)
			var newPos = evalResultset.filteredrows.length === 0 ? -1 : 0;
	
			// wasn't in old, shouldn't be now... do nothing
			if (oldPos === -1 && newPos === -1) return;
	
			// wasn't in resultset, should be now... add
			if (oldPos === -1 && newPos !== -1) {
				ofr.push(objIndex);
	
				if (this.options.persistent) {
					this.resultdata.push(this.collection.data[objIndex]);
				}
	
				// need to re-sort to sort new document
				if (this.sortFunction || this.sortCriteria) {
					this.queueSortPhase();
				} else {
					this.queueRebuildEvent();
				}
	
				return;
			}
	
			// was in resultset, shouldn't be now... delete
			if (oldPos !== -1 && newPos === -1) {
				if (oldPos < oldlen - 1) {
					ofr.splice(oldPos, 1);
	
					if (this.options.persistent) {
						this.resultdata.splice(oldPos, 1);
					}
				} else {
					ofr.length = oldlen - 1;
	
					if (this.options.persistent) {
						this.resultdata.length = oldlen - 1;
					}
				}
	
				// in case changes to data altered a sort column
				if (this.sortFunction || this.sortCriteria) {
					this.queueSortPhase();
				} else {
					this.queueRebuildEvent();
				}
	
				return;
			}
	
			// was in resultset, should still be now... (update persistent only?)
			if (oldPos !== -1 && newPos !== -1) {
				if (this.options.persistent) {
					// in case document changed, replace persistent view data with the latest collection.data document
					this.resultdata[oldPos] = this.collection.data[objIndex];
				}
	
				// in case changes to data altered a sort column
				if (this.sortFunction || this.sortCriteria) {
					this.queueSortPhase();
				} else {
					this.queueRebuildEvent();
				}
	
				return;
			}
		}
	
		/**
	  * removeDocument() - internal function called on collection.delete()
	  */
		removeDocument(objIndex) {
			// if no filter applied yet, the result 'set' should remain 'everything'
			if (!this.resultset.filterInitialized) {
				if (this.options.persistent) {
					this.resultdata = this.resultset.data();
				}
				// in case changes to data altered a sort column
				if (this.sortFunction || this.sortCriteria) {
					this.queueSortPhase();
				} else {
					this.queueRebuildEvent();
				}
				return;
			}
	
			var ofr = this.resultset.filteredrows;
			var oldPos = ofr.indexOf(+objIndex);
			var oldlen = ofr.length;
			var idx;
	
			if (oldPos !== -1) {
				// if not last row in resultdata, swap last to hole and truncate last row
				if (oldPos < oldlen - 1) {
					ofr[oldPos] = ofr[oldlen - 1];
					ofr.length = oldlen - 1;
	
					if (this.options.persistent) {
						this.resultdata[oldPos] = this.resultdata[oldlen - 1];
						this.resultdata.length = oldlen - 1;
					}
				}
				// last row, so just truncate last row
				else {
						ofr.length = oldlen - 1;
	
						if (this.options.persistent) {
							this.resultdata.length = oldlen - 1;
						}
					}
	
				// in case changes to data altered a sort column
				if (this.sortFunction || this.sortCriteria) {
					this.queueSortPhase();
				} else {
					this.queueRebuildEvent();
				}
			}
	
			// since we are using filteredrows to store data array positions
			// if they remove a document (whether in our view or not),
			// we need to adjust array positions -1 for all document array references after that position
			oldlen = ofr.length;
			for (idx = 0; idx < oldlen; idx++) {
				if (ofr[idx] > objIndex) {
					ofr[idx]--;
				}
			}
		}
	
		/**
	  * mapReduce() - data transformation via user supplied functions
	  *
	  * @param {function} mapFunction - this function accepts a single document for you to transform and return
	  * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
	  * @returns The output of your reduceFunction
	  * @memberof DynamicView
	  */
		mapReduce(mapFunction, reduceFunction) {
			try {
				return reduceFunction(this.data().map(mapFunction));
			} catch (err) {
				throw err;
			}
		}
	}
	exports.DynamicView = DynamicView;

/***/ },
/* 13 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	/*
	Loki IndexedDb Adapter (need to include this script to use it)
	
	Console Usage can be used for management/diagnostic, here are a few examples :
	adapter.getDatabaseList(); // with no callback passed, this method will log results to console
	adapter.saveDatabase("UserDatabase", JSON.stringify(myDb));
	adapter.loadDatabase("UserDatabase"); // will log the serialized db to console
	adapter.deleteDatabase("UserDatabase");
	*/
	
	/**
	 * Loki persistence adapter class for indexedDb.
	 *     This class fulfills abstract adapter interface which can be applied to other storage methods.
	 *     Utilizes the included LokiCatalog app/key/value database for actual database persistence.
	 *     IndexedDb storage is provided per-domain, so we implement app/key/value database to
	 *     allow separate contexts for separate apps within a domain.
	 *
	 * @example
	 * var idbAdapter = new LokiIndexedAdapter("finance");
	 *
	 * @constructor LokiIndexedAdapter
	 *
	 * @param {string} appname - (Optional) Application name context can be used to distinguish subdomains, "loki" by default
	 */
	class LokiIndexedAdapter {
	
		constructor(appname) {
			this.app = "loki";
	
			if (typeof appname !== "undefined") {
				this.app = appname;
			}
	
			// keep reference to catalog class for base AKV operations
			this.catalog = null;
	
			if (!this.checkAvailability()) {
				throw new Error("indexedDB does not seem to be supported for your environment");
			}
		}
	
		/**
	  * Used to check if adapter is available
	  *
	  * @returns {boolean} true if indexeddb is available, false if not.
	  * @memberof LokiIndexedAdapter
	  */
		checkAvailability() {
			if (typeof indexedDB !== "undefined" && indexedDB) return true;
	
			return false;
		}
	
		/**
	  * Retrieves a serialized db string from the catalog.
	  *
	  * @example
	  * // LOAD
	  * var idbAdapter = new LokiIndexedAdapter("finance");
	  * var db = new loki("test", { adapter: idbAdapter });
	  *   db.loadDatabase(function(result) {
	  *   console.log("done");
	  * });
	  *
	  * @param {string} dbname - the name of the database to retrieve.
	  * @returns {Promise} a Promise that resolves after the database was loaded
	  * @memberof LokiIndexedAdapter
	  */
		loadDatabase(dbname) {
			var appName = this.app;
			var adapter = this;
	
			// lazy open/create db reference so dont -need- callback in constructor
			if (this.catalog === null || this.catalog.db === null) {
				return new Promise(function (resolve) {
					adapter.catalog = new LokiCatalog(function (cat) {
						adapter.catalog = cat;
	
						resolve(adapter.loadDatabase(dbname));
					});
				});
			}
	
			// lookup up db string in AKV db
			return new Promise(function (resolve) {
				this.catalog.getAppKey(appName, dbname, function (result) {
					if (result.id === 0) {
						resolve();
						return;
					}
					resolve(result.val);
				});
			});
		}
	
		// alias
		loadKey(dbname) {
			return this.loadDatabase(dbname);
		}
	
		/**
	  * Saves a serialized db to the catalog.
	  *
	  * @example
	  * // SAVE : will save App/Key/Val as "finance"/"test"/{serializedDb}
	  * var idbAdapter = new LokiIndexedAdapter("finance");
	  * var db = new loki("test", { adapter: idbAdapter });
	  * var coll = db.addCollection("testColl");
	  * coll.insert({test: "val"});
	  * db.saveDatabase();  // could pass callback if needed for async complete
	  *
	  * @param {string} dbname - the name to give the serialized database within the catalog.
	  * @param {string} dbstring - the serialized db string to save.
	  * @returns {Promise} a Promise that resolves after the database was persisted
	  * @memberof LokiIndexedAdapter
	  */
		saveDatabase(dbname, dbstring) {
			var appName = this.app;
			var adapter = this;
	
			var resolve, reject;
			var result = new Promise(function (res, rej) {
				resolve = res;
				reject = rej;
			});
	
			function saveCallback(result) {
				if (result && result.success === true) {
					resolve();
				} else {
					reject(new Error("Error saving database"));
				}
			}
	
			// lazy open/create db reference so dont -need- callback in constructor
			if (this.catalog === null || this.catalog.db === null) {
				this.catalog = new LokiCatalog(function (cat) {
					adapter.catalog = cat;
	
					// now that catalog has been initialized, set (add/update) the AKV entry
					cat.setAppKey(appName, dbname, dbstring, saveCallback);
				});
	
				return result;
			}
	
			// set (add/update) entry to AKV database
			this.catalog.setAppKey(appName, dbname, dbstring, saveCallback);
	
			return result;
		}
	
		// alias
		saveKey(dbname, dbstring) {
			return this.saveDatabase(dbname, dbstring);
		}
	
		/**
	  * Deletes a serialized db from the catalog.
	  *
	  * @example
	  * // DELETE DATABASE
	  * // delete "finance"/"test" value from catalog
	  * idbAdapter.deleteDatabase("test", function {
	  *   // database deleted
	  * });
	  *
	  * @param {string} dbname - the name of the database to delete from the catalog.
	  * @returns {Promise} a Promise that resolves after the database was deleted
	  * @memberof LokiIndexedAdapter
	  */
		deleteDatabase(dbname) {
			var appName = this.app;
			var adapter = this;
	
			// lazy open/create db reference and pass callback ahead
			if (this.catalog === null || this.catalog.db === null) {
				return new Promise(function (resolve) {
					adapter.catalog = new LokiCatalog(function (cat) {
						adapter.catalog = cat;
	
						resolve(adapter.deleteDatabase(dbname));
					});
				});
			}
	
			// catalog was already initialized, so just lookup object and delete by id
			return new Promise(function (resolve) {
				this.catalog.getAppKey(appName, dbname, function (result) {
					var id = result.id;
	
					if (id !== 0) {
						adapter.catalog.deleteAppKey(id);
					}
	
					resolve();
				});
			});
		}
	
		// alias
		deleteKey(dbname) {
			return this.deleteDatabase(dbname);
		}
	
		/**
	  * Removes all database partitions and pages with the base filename passed in.
	  * This utility method does not (yet) guarantee async deletions will be completed before returning
	  *
	  * @param {string} dbname - the base filename which container, partitions, or pages are derived
	  * @memberof LokiIndexedAdapter
	  */
		deleteDatabasePartitions(dbname) {
			var self = this;
			this.getDatabaseList(function (result) {
				result.forEach(function (str) {
					if (str.startsWith(dbname)) {
						self.deleteDatabase(str);
					}
				});
			});
		}
	
		/**
	  * Retrieves object array of catalog entries for current app.
	  *
	  * @example
	  * idbAdapter.getDatabaseList(function(result) {
	  *   // result is array of string names for that appcontext ("finance")
	  *   result.forEach(function(str) {
	  *     console.log(str);
	  *   });
	  * });
	  *
	  * @param {function} callback - should accept array of database names in the catalog for current app.
	  * @memberof LokiIndexedAdapter
	  */
		getDatabaseList(callback) {
			var appName = this.app;
			var adapter = this;
	
			// lazy open/create db reference so dont -need- callback in constructor
			if (this.catalog === null || this.catalog.db === null) {
				this.catalog = new LokiCatalog(function (cat) {
					adapter.catalog = cat;
	
					adapter.getDatabaseList(callback);
				});
	
				return;
			}
	
			// catalog already initialized
			// get all keys for current appName, and transpose results so just string array
			this.catalog.getAppKeys(appName, function (results) {
				var names = [];
	
				for (var idx = 0; idx < results.length; idx++) {
					names.push(results[idx].key);
				}
	
				if (typeof callback === "function") {
					callback(names);
				} else {
					names.forEach(function (obj) {
						console.log(obj);
					});
				}
			});
		}
	
		// alias
		getKeyList(callback) {
			return this.getDatabaseList(callback);
		}
	
		/**
	  * Allows retrieval of list of all keys in catalog along with size
	  *
	  * @param {function} callback - (Optional) callback to accept result array.
	  * @memberof LokiIndexedAdapter
	  */
		getCatalogSummary(callback) {
			var appName = this.app;
			var adapter = this;
	
			// lazy open/create db reference
			if (this.catalog === null || this.catalog.db === null) {
				this.catalog = new LokiCatalog(function (cat) {
					adapter.catalog = cat;
	
					adapter.getCatalogSummary(callback);
				});
	
				return;
			}
	
			// catalog already initialized
			// get all keys for current appName, and transpose results so just string array
			this.catalog.getAllKeys(function (results) {
				var entries = [];
				var obj, size, oapp, okey, oval;
	
				for (var idx = 0; idx < results.length; idx++) {
					obj = results[idx];
					oapp = obj.app || '';
					okey = obj.key || '';
					oval = obj.val || '';
	
					// app and key are composited into an appkey column so we will mult by 2
					size = oapp.length * 2 + okey.length * 2 + oval.length + 1;
	
					entries.push({
						"app": obj.app,
						"key": obj.key,
						"size": size
					});
				}
	
				if (typeof callback === "function") {
					callback(entries);
				} else {
					entries.forEach(function (obj) {
						console.log(obj);
					});
				}
			});
		}
	}
	
	exports.LokiIndexedAdapter = LokiIndexedAdapter; /**
	                                                  * LokiCatalog - underlying App/Key/Value catalog persistence
	                                                  *    This non-interface class implements the actual persistence.
	                                                  *    Used by the IndexedAdapter class.
	                                                  */
	
	class LokiCatalog {
		constructor(callback) {
			this.db = null;
			this.initializeLokiCatalog(callback);
		}
	
		initializeLokiCatalog(callback) {
			var openRequest = indexedDB.open("LokiCatalog", 1);
			var cat = this;
	
			// If database doesn't exist yet or its version is lower than our version specified above (2nd param in line above)
			openRequest.onupgradeneeded = function (e) {
				var thisDB = e.target.result;
				if (thisDB.objectStoreNames.contains("LokiAKV")) {
					thisDB.deleteObjectStore("LokiAKV");
				}
	
				if (!thisDB.objectStoreNames.contains("LokiAKV")) {
					var objectStore = thisDB.createObjectStore("LokiAKV", {
						keyPath: "id",
						autoIncrement: true
					});
					objectStore.createIndex("app", "app", {
						unique: false
					});
					objectStore.createIndex("key", "key", {
						unique: false
					});
					// hack to simulate composite key since overhead is low (main size should be in val field)
					// user (me) required to duplicate the app and key into comma delimited appkey field off object
					// This will allow retrieving single record with that composite key as well as
					// still supporting opening cursors on app or key alone
					objectStore.createIndex("appkey", "appkey", {
						unique: true
					});
				}
			};
	
			openRequest.onsuccess = function (e) {
				cat.db = e.target.result;
	
				if (typeof callback === "function") callback(cat);
			};
	
			openRequest.onerror = function (e) {
				throw e;
			};
		}
	
		getAppKey(app, key, callback) {
			var transaction = this.db.transaction(["LokiAKV"], "readonly");
			var store = transaction.objectStore("LokiAKV");
			var index = store.index("appkey");
			var appkey = app + "," + key;
			var request = index.get(appkey);
	
			request.onsuccess = function (usercallback) {
				return function (e) {
					var lres = e.target.result;
	
					if (lres === null || typeof lres === "undefined") {
						lres = {
							id: 0,
							success: false
						};
					}
	
					if (typeof usercallback === "function") {
						usercallback(lres);
					} else {
						console.log(lres);
					}
				};
			}(callback);
	
			request.onerror = function (usercallback) {
				return function (e) {
					if (typeof usercallback === "function") {
						usercallback({
							id: 0,
							success: false
						});
					} else {
						throw e;
					}
				};
			}(callback);
		}
	
		getAppKeyById(id, callback, data) {
			var transaction = this.db.transaction(["LokiAKV"], "readonly");
			var store = transaction.objectStore("LokiAKV");
			var request = store.get(id);
	
			request.onsuccess = function (data, usercallback) {
				return function (e) {
					if (typeof usercallback === "function") {
						usercallback(e.target.result, data);
					} else {
						console.log(e.target.result);
					}
				};
			}(data, callback);
		}
	
		setAppKey(app, key, val, callback) {
			var transaction = this.db.transaction(["LokiAKV"], "readwrite");
			var store = transaction.objectStore("LokiAKV");
			var index = store.index("appkey");
			var appkey = app + "," + key;
			var request = index.get(appkey);
	
			// first try to retrieve an existing object by that key
			// need to do this because to update an object you need to have id in object, otherwise it will append id with new autocounter and clash the unique index appkey
			request.onsuccess = function (e) {
				var res = e.target.result;
	
				if (res === null || res === undefined) {
					res = {
						app: app,
						key: key,
						appkey: app + "," + key,
						val: val
					};
				} else {
					res.val = val;
				}
	
				var requestPut = store.put(res);
	
				requestPut.onerror = function (usercallback) {
					return function (e) {
						if (typeof usercallback === "function") {
							usercallback({
								success: false
							});
						} else {
							console.error("LokiCatalog.setAppKey (set) onerror");
							console.error(request.error);
						}
					};
				}(callback);
	
				requestPut.onsuccess = function (usercallback) {
					return function (e) {
						if (typeof usercallback === "function") {
							usercallback({
								success: true
							});
						}
					};
				}(callback);
			};
	
			request.onerror = function (usercallback) {
				return function (e) {
					if (typeof usercallback === "function") {
						usercallback({
							success: false
						});
					} else {
						console.error("LokiCatalog.setAppKey (get) onerror");
						console.error(request.error);
					}
				};
			}(callback);
		}
	
		deleteAppKey(id, callback) {
			var transaction = this.db.transaction(["LokiAKV"], "readwrite");
			var store = transaction.objectStore("LokiAKV");
			var request = store.delete(id);
	
			request.onsuccess = function (usercallback) {
				return function (evt) {
					if (typeof usercallback === "function") usercallback({
						success: true
					});
				};
			}(callback);
	
			request.onerror = function (usercallback) {
				return function (evt) {
					if (typeof usercallback === "function") {
						usercallback(false);
					} else {
						console.error("LokiCatalog.deleteAppKey raised onerror");
						console.error(request.error);
					}
				};
			}(callback);
		}
	
		getAppKeys(app, callback) {
			var transaction = this.db.transaction(["LokiAKV"], "readonly");
			var store = transaction.objectStore("LokiAKV");
			var index = store.index("app");
	
			// We want cursor to all values matching our (single) app param
			var singleKeyRange = IDBKeyRange.only(app);
	
			// To use one of the key ranges, pass it in as the first argument of openCursor()/openKeyCursor()
			var cursor = index.openCursor(singleKeyRange);
	
			// cursor internally, pushing results into this.data[] and return
			// this.data[] when done (similar to service)
			var localdata = [];
	
			cursor.onsuccess = function (data, callback) {
				return function (e) {
					var cursor = e.target.result;
					if (cursor) {
						var currObject = cursor.value;
	
						data.push(currObject);
	
						cursor.continue();
					} else {
						if (typeof callback === "function") {
							callback(data);
						} else {
							console.log(data);
						}
					}
				};
			}(localdata, callback);
	
			cursor.onerror = function (usercallback) {
				return function (e) {
					if (typeof usercallback === "function") {
						usercallback(null);
					} else {
						console.error("LokiCatalog.getAppKeys raised onerror");
						console.error(e);
					}
				};
			}(callback);
		}
	
		// Hide "cursoring" and return array of { id: id, key: key }
		getAllKeys(callback) {
			var transaction = this.db.transaction(["LokiAKV"], "readonly");
			var store = transaction.objectStore("LokiAKV");
			var cursor = store.openCursor();
	
			var localdata = [];
	
			cursor.onsuccess = function (data, callback) {
				return function (e) {
					var cursor = e.target.result;
					if (cursor) {
						var currObject = cursor.value;
	
						data.push(currObject);
	
						cursor.continue();
					} else {
						if (typeof callback === "function") {
							callback(data);
						} else {
							console.log(data);
						}
					}
				};
			}(localdata, callback);
	
			cursor.onerror = function (usercallback) {
				return function (e) {
					if (typeof usercallback === "function") usercallback(null);
				};
			}(callback);
		}
	}

/***/ }
/******/ ])
});
;
//# sourceMappingURL=lokijs.core.js.map