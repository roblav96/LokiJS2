import {LokiEventEmitter} from './event_emitter';

import {LokiMemoryAdapter} from './memory_adapter';
import {LokiFsAdapter} from './fs_adapter';
import {LokiLocalStorageAdapter} from './local_storage_adapter';
import {Collection} from './collection';
import {Utils} from './utils';

/*
 'LokiFsAdapter' is not defined                 no-undef	x
 'LokiLocalStorageAdapter' is not defined       no-undef	x
 'Collection' is not defined                    no-undef	x
 'delim' is not defined                         no-undef	x
 'Utils' is not defined                         no-undef	x

 TBD:
 * Default persistence should be not available.
 * getIndexedAdapter is also obsolet
 * Make some functions private.
 * Inflate? -> Utils.copyProperties
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
export class Loki extends LokiEventEmitter {

	constructor(filename, options) {
		super();
		this.filename = filename || 'loki.db';
		this.collections = [];

		// persist version of code which created the database to the database.
		// could use for upgrade scenarios
		this.databaseVersion = 1.441;
		this.engineVersion = 1.441;

		// autosave support (disabled by default)
		// pass autosave: true, autosaveInterval: 6000 in options to set 6 second autosave
		this.autosave = false;
		this.autosaveInterval = 5000;
		this.autosaveHandle = null;
		this.throttledSaves = true;

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

		// flags used to throttle saves
		this.throttledSaveRunning = null;
		this.throttledSavePending = null;

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

		const getENV = function () {
			if (typeof global !== 'undefined' && (global.android || global.NSObject)) {
				// If no adapter is set use the default nativescript adapter
				if (!options.adapter) {
					//let LokiNativescriptAdapter = require('./loki-nativescript-adapter');
					//options.adapter=new LokiNativescriptAdapter();
				}
				return 'NATIVESCRIPT'; //nativescript
			}

			const isNode = typeof global !== "undefined" && ({}).toString.call(global) === '[object global]';

			if (isNode) {
				if (global.window) {
					return 'NODEJS'; //node-webkit
				} else {
					return 'NODEJS';
				}
			}

			const isBrowser = typeof window !== 'undefined' && ({}).toString.call(window) === '[object Window]';

			if (typeof document !== 'undefined') {
				if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1) {
					return 'CORDOVA';
				}
				return 'BROWSER';
			}

			if (!isBrowser) {
				throw SyntaxError("Unknown enviroment...");
			}
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
		let adapter;

		if (typeof require === 'function') {
			adapter = require("./loki-indexed-adapter.js");
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
	 * @param {boolean} options.throttledSaves - if true, it batches multiple calls to to saveDatabase reducing number of
	 *   disk I/O operations and guaranteeing proper serialization of the calls. Default value is true.
	 * @returns {Promise} a Promise that resolves after initialization and (if enabled) autoloading the database
	 * @memberof Loki
	 */
	initializePersistence(options) {
		const self = this;
		const defaultPersistence = {
				'NODEJS': 'fs',
				'BROWSER': 'localStorage',
				'CORDOVA': 'localStorage',
				'MEMORY': 'memory'
			},
			persistenceMethods = {
				'fs': LokiFsAdapter,
				'localStorage': LokiLocalStorageAdapter,
				'memory': LokiMemoryAdapter
			};

		this.options = options || {};

		this.persistenceMethod = null;
		// retain reference to optional persistence adapter 'instance'
		// currently keeping outside options because it can't be serialized
		this.persistenceAdapter = null;

		// process the options
		if (this.options.hasOwnProperty('persistenceMethod')) {
			// check if the specified persistence method is known
			if (typeof(persistenceMethods[this.options.persistenceMethod]) === 'function') {
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

		if (this.options.hasOwnProperty('throttledSaves')) {
			this.throttledSaves = this.options.throttledSaves;
		}

		this.autosaveDisable();

		let loaded;

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
		// in case running in an environment without accurate environment detection, pass 'NA'
		const databaseCopy = new Loki(this.filename, {env: "NA"});
		let clen, idx;

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
	 * let results = new loki().anonym(myDocArray).find({'age': {'$gt': 30} });
	 *
	 * @param {Array} docs - document array to initialize the anonymous collection with
	 * @param {object} options - configuration object, see {@link Loki#addCollection} options
	 * @returns {Collection} New collection which you can query or chain
	 * @memberof Loki
	 */
	anonym(docs, options) {
		const collection = new Collection('anonym', options);
		collection.insert(docs);

		if (this.verbose)
			collection.console = console;

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
		const collection = new Collection(name, options);
		this.collections.push(collection);

		if (this.verbose)
			collection.console = console;

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
		let i;
		const len = this.collections.length;

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
		let i = this.collections.length;
		const colls = [];

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
		let i;
		const len = this.collections.length;

		for (i = 0; i < len; i += 1) {
			if (this.collections[i].name === collectionName) {
				const tmpcol = new Collection(collectionName, {});
				const curcol = this.collections[i];
				for (const prop in curcol) {
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
		let idx, sidx, result, resultlen;
		const reconstruct = [];
		let dbcopy;

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
		let doccount, docidx, resultlines = [];

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
		let workarray = [];
		let len, cdb;
		let idx, collIndex = 0, collCount, lineIndex = 1, done = false;
		let currLine, currObject;

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
		let workarray = [];
		let idx, len;

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
		let dbObject;
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
		let i = 0;
		const len = dbObject.collections ? dbObject.collections.length : 0;
		let coll;
		let copyColl;
		let clen;
		let j;
		let loader;
		let collObj;

		this.name = dbObject.name;

		// restore database version
		// this.databaseVersion = 1.0;
		// if (dbObject.hasOwnProperty('databaseVersion')) {
		// 	this.databaseVersion = dbObject.databaseVersion;
		// }

		this.collections = [];

		function makeLoader(coll) {
			const collOptions = options[coll.name];
			let inflater;

			if (collOptions.proto) {
				inflater = collOptions.inflate || Utils.copyProperties;

				return function (data) {
					const collObj = new (collOptions.proto)();
					inflater(data, collObj);
					return collObj;
				};
			}

			return collOptions.inflate;
		}

		for (i; i < len; i += 1) {
			coll = dbObject.collections[i];
			copyColl = this.addCollection(coll.name, {disableChangesApi: coll.disableChangesApi});

			copyColl.adaptiveBinaryIndices = coll.hasOwnProperty('adaptiveBinaryIndices') ? (coll.adaptiveBinaryIndices === true) : false;
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

			copyColl.maxId = (typeof coll.maxId === 'undefined') ? 0 : coll.maxId;
			copyColl.idIndex = coll.idIndex;
			if (typeof(coll.binaryIndices) !== 'undefined') {
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
			if (typeof(coll.DynamicViews) === 'undefined') continue;

			// reinflate DynamicViews and attached Resultsets
			for (let idx = 0; idx < coll.DynamicViews.length; idx++) {
				const colldv = coll.DynamicViews[idx];

				const dv = copyColl.addDynamicView(colldv.name, colldv.options);
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

			// Upgrade Logic for binary index refactoring at version 1.4.4
			if (dbObject.databaseVersion < 1.441) {
				// rebuild all indices
				copyColl.ensureAllIndexes(true);
				copyColl.dirty = true;
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
		const self = this;
		let saved;

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

		let changes = [];
		const selectedCollections = arrayOfCollectionNames || this.collections.map(getCollName);

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
	 * Wait for throttledSaves to complete and invoke your callback when drained or duration is met.
	 *
	 * @param {object=} options - configuration options
	 * @param {boolean} options.recursiveWait - (default: true) if after queue is drained, another save was kicked off, wait for it
	 * @param {bool} options.recursiveWaitLimit - (default: false) limit our recursive waiting to a duration
	 * @param {int} options.recursiveWaitLimitDelay - (default: 2000) cutoff in ms to stop recursively re-draining
	 * @returns {Promise} a Promise that resolves when save queue is drained, it is passed a sucess parameter value
	 * @memberof Loki
	 */
	throttledSaveDrain(options) {
		const self = this;
		const now = (new Date()).getTime();

		if (!this.throttledSaves) {
			return Promise.resolve();
		}

		options = options || {};
		if (!options.hasOwnProperty('recursiveWait')) {
			options.recursiveWait = true;
		}
		if (!options.hasOwnProperty('recursiveWaitLimit')) {
			options.recursiveWaitLimit = false;
		}
		if (!options.hasOwnProperty('recursiveWaitLimitDuration')) {
			options.recursiveWaitLimitDuration = 2000;
		}
		if (!options.hasOwnProperty('started')) {
			options.started = (new Date()).getTime();
		}

		// if save is pending
		if (this.throttledSaves && this.throttledSaveRunning !== null) {
			// if we want to wait until we are in a state where there are no pending saves at all
			if (options.recursiveWait) {
				// queue the following meta callback for when it completes
				return Promise.resolve(Promise.all([this.throttledSaveRunning, this.throttledSavePending])).then(function () {
					if (self.throttledSaveRunning !== null || self.throttledSavePending !== null) {
						if (options.recursiveWaitLimit && (now - options.started > options.recursiveWaitLimitDuration)) {
							return Promise.reject();
						}
						return self.throttledSaveDrain(options);
					} else {
						return Promise.resolve();
					}
				});
			}
			// just notify when current queue is depleted
			else {
				return Promise.resolve(this.throttledSaveRunning);
			}
		}
		// no save pending, just callback
		else {
			return Promise.resolve();
		}
	}

	/**
	 * Internal load logic, decoupled from throttling/contention logic
	 *
	 * @param {object} options - an object containing inflation options for each collection
	 * @returns {Promise} a Promise that resolves after the database is loaded
	 * @memberof Loki
	 */
	loadDatabaseInternal(options) {
		const self = this;

		// the persistenceAdapter should be present if all is ok, but check to be sure.
		if (this.persistenceAdapter === null) {
			return Promise.reject(new Error('persistenceAdapter not configured'));
		}

		return Promise.resolve(this.persistenceAdapter.loadDatabase(this.filename))
			.then(function loadDatabaseCallback(dbString) {
				if (typeof (dbString) === 'string') {
					self.loadJSON(dbString, options || {});
					self.emit('load', self);
				} else {
					// if adapter has returned an js object (other than null or error) attempt to load from JSON object
					if (typeof (dbString) === "object" && dbString !== null && !(dbString instanceof Error)) {
						self.loadJSONObject(dbString, options || {});
						self.emit('load', self);
					} else {
						if (dbString instanceof Error)
							throw dbString;

						throw new TypeError('The persistence adapter did not load a serialized DB string or object.');
					}
				}
			});
	}

	/**
	 * Handles loading from file system, local storage, or adapter (indexeddb)
	 *    This method utilizes loki configuration options (if provided) to determine which
	 *    persistence method to use, or environment detection (if configuration was not provided).
	 *    To avoid contention with any throttledSaves, we will drain the save queue first.
	 *
	 * @param {object} options - if throttling saves and loads, this controls how we drain save queue before loading
	 * @param {boolean} options.recursiveWait - (default: true) wait recursively until no saves are queued
	 * @param {bool} options.recursiveWaitLimit - (default: false) limit our recursive waiting to a duration
	 * @param {int} options.recursiveWaitLimitDelay - (default: 2000) cutoff in ms to stop recursively re-draining
	 * @returns {Promise} a Promise that resolves after the database is loaded
	 * @memberof Loki
	 */
	loadDatabase(options) {
		const self = this;

		// if throttling disabled, just call internal
		if (!this.throttledSaves) {
			return this.loadDatabaseInternal(options);
		}

		// try to drain any pending saves in the queue to lock it for loading
		return this.throttledSaveDrain(options).then(function () {
			// pause/throttle saving until loading is done
			self.throttledSaveRunning = self.loadDatabaseInternal(options).then(function () {
				// now that we are finished loading, if no saves were throttled, disable flag
				self.throttledSaveRunning = null;
			});
			return self.throttledSaveRunning;
		}, function () {
			throw new Error("Unable to pause save throttling long enough to read database");
		});
	}

	saveDatabaseInternal() {
		const self = this;

		// the persistenceAdapter should be present if all is ok, but check to be sure.
		if (this.persistenceAdapter === null) {
			return Promise.reject(new Error('persistenceAdapter not configured'));
		}

		let saved;

		// check if the adapter is requesting (and supports) a 'reference' mode export
		if (this.persistenceAdapter.mode === "reference" && typeof this.persistenceAdapter.exportDatabase === "function") {
			// filename may seem redundant but loadDatabase will need to expect this same filename
			saved = this.persistenceAdapter.exportDatabase(this.filename, this.copy({removeNonSerializable: true}));
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

	/**
	 * Handles saving to file system, local storage, or adapter (indexeddb)
	 *    This method utilizes loki configuration options (if provided) to determine which
	 *    persistence method to use, or environment detection (if configuration was not provided).
	 *
	 * @memberof Loki
	 * @returns {Promise} a Promise that resolves after the database is persisted
	 */
	saveDatabase() {
		if (!this.throttledSaves) {
			return this.saveDatabaseInternal();
		}
		const self = this;

		// if the db save is currently running, a new promise for a next db save is created
		// all calls to save db will get this new promise which will be processed right after
		// the current db save is finished
		if (this.throttledSaveRunning !== null && this.throttledSavePending === null) {
			this.throttledSavePending = Promise.resolve(this.throttledSaveRunning).then(function () {
				self.throttledSaveRunning = null;
				self.throttledSavePending = null;
				return self.saveDatabase();
			});
		}
		if (this.throttledSavePending !== null) {
			return this.throttledSavePending;
		}
		this.throttledSaveRunning = this.saveDatabaseInternal().then(function () {
			self.throttledSaveRunning = null;
		});

		return this.throttledSaveRunning;
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
		for (let idx = 0; idx < this.collections.length; idx++) {
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
		for (let idx = 0; idx < this.collections.length; idx++) {
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

		const self = this;
		let running = true;

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

Loki.Plugins = {};
