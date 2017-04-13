import {LokiEventEmitter} from './event_emitter';
import {UniqueIndex} from './unique_index';
import {ExactIndex} from './exact_index';
import {Resultset} from './resultset';
import {DynamicView} from './dynamic_view';
import {clone, cloneObjectArray} from './clone';
import {ltHelper, gtHelper} from './helper';
import {Loki} from './loki';

/*
 'isDeepProperty' is not defined              no-undef
 'deepProperty' is not defined                no-undef
 'average' is not defined                     no-undef
 'standardDeviation' is not defined           no-undef
 'sub' is not defined                         no-undef

 byExample?
 indexing -> own class?
 remove data only?
 */

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
	return (array.reduce(add, 0)) / array.length;
}

function standardDeviation(values) {
	var avg = average(values);
	var squareDiffs = values.map(function(value) {
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
export class Collection extends LokiEventEmitter {

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
				self.constraints.unique[prop] = new UniqueIndex(prop);
			});
		}

		if (options.hasOwnProperty('exact')) {
			options.exact.forEach(function (prop) {
				self.constraints.exact[prop] = new ExactIndex(prop);
			});
		}

		// Inverted index
		this._fullTextSearch = null;
		if (Loki.Plugins.FullTextSearch !== undefined) {
			this._fullTextSearch = options.hasOwnProperty('fullTextSearch')
				? new (Loki.Plugins.FullTextSearch)(options.fullTextSearch) : null;
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

			if (!changedObjects.add)
				changedObjects.add = function (object) {
					if (this.indexOf(object) === -1)
						this.push(object);
					return this;
				};

			changes.forEach(function (change) {
				changedObjects.add(change.object);
			});

			changedObjects.forEach(function (object) {
				if (!hasOwnProperty.call(object, '$loki'))
					return self.removeAutoUpdateObserver(object);
				try {
					self.update(object);
				} catch (err) {
				}
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

			obj.meta.created = (new Date()).getTime();
			obj.meta.revision = 0;
		}

		function updateMeta(obj) {
			if (!obj) {
				return;
			}
			obj.meta.updated = (new Date()).getTime();
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
			log: function () {
			},
			warn: function () {
			},
			error: function () {
			},
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
		if (!this.autoupdate || typeof Object.observe !== 'function')
			return;

		Object.observe(object, this.observerCallback, ['add', 'update', 'delete', 'reconfigure', 'setPrototype']);
	}

	removeAutoUpdateObserver(object) {
		if (!this.autoupdate || typeof Object.observe !== 'function')
			return;

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
			query.push((
				obj = {},
					obj[k] = template[k],
					obj
			));
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
		if (typeof(force) === 'undefined') {
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

		var wrappedComparer =
			(function (p, data) {
				return function (a, b) {
					var objAp = data[a][p],
						objBp = data[b][p];
					if (objAp !== objBp) {
						if (ltHelper(objAp, objBp, false)) return -1;
						if (gtHelper(objAp, objBp, false)) return 1;
					}
					return 0;
				};
			})(property, this.data);

		index.values.sort(wrappedComparer);
		index.dirty = false;

		this.dirty = true; // for autosave scenarios
	}

	getSequencedIndexValues(property) {
		var idx, idxvals = this.binaryIndices[property].values;
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
		this.constraints.unique[field] = index = new UniqueIndex(field);
		this.data.forEach(function (obj) {
			index.set(obj);
		});
		return index;
	}

	/**
	 * Ensure all binary indices
	 */
	ensureAllIndexes(force) {
		var key, bIndices = this.binaryIndices;
		for (key in bIndices) {
			if (hasOwnProperty.call(bIndices, key)) {
				this.ensureIndex(key, force);
			}
		}
	}

	flagBinaryIndexesDirty() {
		var key, bIndices = this.binaryIndices;
		for (key in bIndices) {
			if (hasOwnProperty.call(bIndices, key)) {
				bIndices[key].dirty = true;
			}
		}
	}

	flagBinaryIndexDirty(index) {
		if (this.binaryIndices[index])
			this.binaryIndices[index].dirty = true;
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
		var dv = new DynamicView(this, name, options);
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
	 * For filter function querying you should migrate to [
	 * Where()]{@link Collection#updateWhere}.
	 *
	 * @param {object|function} filterObject - 'mongo-like' query object (or deprecated filterFunction mode)
	 * @param {function} updateFunction - update function to run against filtered documents
	 * @memberof Collection
	 */
	findAndUpdate(filterObject, updateFunction) {
		if (typeof(filterObject) === "function") {
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
		var obj = this.cloneObjects ? clone(doc, this.cloneMethod) : doc;

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

		// FullTextSearch.
		if (this._fullTextSearch !== null) {
			this._fullTextSearch.addDocument(doc);
		}

		// if cloning, give user back clone of 'cloned' object with $loki and meta
		returnObj = this.cloneObjects ? clone(obj, this.cloneMethod) : obj;

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
				oldInternal, // ref to existing obj
				newInternal, // ref to new internal obj
				position,
				self = this;

			if (!arr) {
				throw new Error('Trying to update a document not in collection.');
			}

			oldInternal = arr[0]; // -internal- obj ref
			position = arr[1]; // position in data array

			// if configured to clone, do so now... otherwise just use same obj reference
			newInternal = this.cloneObjects ? clone(doc, this.cloneMethod) : doc;

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

			// FullTextSearch.
			if (this._fullTextSearch !== null) {
				this._fullTextSearch.updateDocument(doc);
			}

			this.commit();
			this.dirty = true; // for autosave scenarios

			this.emit('update', doc, this.cloneObjects ? clone(oldInternal, this.cloneMethod) : null);
			return doc;
		} catch (err) {
			this.rollback();
			this.console.error(err.message);
			this.emit('error', err);
			throw (err); // re-throw error so user does not think it succeeded
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
		if (typeof(obj.$loki) !== 'undefined') {
			throw new Error('Document is already in collection, please use update()');
		}

		/*
		 * try adding object to collection
		 */
		try {
			this.startTransaction();
			this.maxId++;

			if (isNaN(this.maxId)) {
				this.maxId = (this.data[this.data.length - 1].$loki + 1);
			}

			obj.$loki = this.maxId;
			obj.meta.version = 0;

			var key, constrUnique = this.constraints.unique;
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

			return (this.cloneObjects) ? (clone(obj, this.cloneMethod)) : (obj);
		} catch (err) {
			this.rollback();
			this.console.error(err.message);
			this.emit('error', err);
			throw (err); // re-throw error so user does not think it succeeded
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
				var key, bIndices = this.binaryIndices;
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

			// FullTextSearch.
			if (this._fullTextSearch != null) {
				this._fullTextSearch.removeDocument(doc);
			}

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
			mid = (min + max) >> 1;

		id = typeof id === 'number' ? id : parseInt(id, 10);

		if (isNaN(id)) {
			throw new TypeError('Passed id is not an integer');
		}

		while (data[min] < data[max]) {
			mid = (min + max) >> 1;

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
		var len,
			idx;

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
			mid = (min + max) >> 1;

			if (ltHelper(rcd[index[mid]][prop], val, false)) {
				min = mid + 1;
			} else {
				max = mid;
			}
		}

		var lbound = min;

		if (ltHelper(rcd[index[lbound]][prop], val, false)) {
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
			mid = (min + max) >> 1;

			if (ltHelper(val, rcd[index[mid]][prop], false)) {
				max = mid;
			} else {
				min = mid + 1;
			}
		}

		var ubound = max;

		if (gtHelper(rcd[index[ubound]][prop], val, false)) {
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
				if (ltHelper(val, minVal, false) || gtHelper(val, maxVal, false)) {
					return [0, -1];
				}
				break;
			case '$dteq':
				if (ltHelper(val, minVal, false) || gtHelper(val, maxVal, false)) {
					return [0, -1];
				}
				break;
			case '$gt':
				if (gtHelper(val, maxVal, true)) {
					return [0, -1];
				}
				break;
			case '$gte':
				if (gtHelper(val, maxVal, false)) {
					return [0, -1];
				}
				break;
			case '$lt':
				if (ltHelper(val, minVal, true)) {
					return [0, -1];
				}
				if (ltHelper(maxVal, val, false)) {
					return [0, rcd.length - 1];
				}
				break;
			case '$lte':
				if (ltHelper(val, minVal, false)) {
					return [0, -1];
				}
				if (ltHelper(maxVal, val, true)) {
					return [0, rcd.length - 1];
				}
				break;
			case '$between':
				return ([this.calculateRangeStart(prop, val[0]), this.calculateRangeEnd(prop, val[1])]);
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
			mid = (min + max) >> 1;

			if (ltHelper(rcd[index[mid]][prop], val, false)) {
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
			mid = (min + max) >> 1;

			if (ltHelper(val, rcd[index[mid]][prop], false)) {
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
				if (ltHelper(uval, val, true)) {
					return [0, -1];
				}

				return [ubound, rcd.length - 1];

			case '$gte':
				if (ltHelper(lval, val, false)) {
					return [0, -1];
				}

				return [lbound, rcd.length - 1];

			case '$lt':
				if (lbound === 0 && ltHelper(lval, val, false)) {
					return [0, 0];
				}
				return [0, lbound - 1];

			case '$lte':
				if (uval !== val) {
					ubound--;
				}

				if (ubound === 0 && ltHelper(uval, val, false)) {
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
			return clone(result, this.cloneMethod);
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
		var result = new Resultset(this, {
			queryObj: query,
			firstOnly: true
		});

		if (Array.isArray(result) && result.length === 0) {
			return null;
		} else {
			if (!this.cloneObjects) {
				return result;
			} else {
				return clone(result, this.cloneMethod);
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
		var rs = new Resultset(this);

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
		if (typeof(query) === 'undefined') {
			query = 'getAll';
		}

		var results = new Resultset(this, {
			queryObj: query
		});
		if (!this.cloneObjects) {
			return results;
		} else {
			return cloneObjectArray(results, this.cloneMethod);
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
			this.cachedData = clone(this.data, this.cloneMethod);
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
		var results = new Resultset(this, {
			queryFunc: fun
		});
		if (!this.cloneObjects) {
			return results;
		} else {
			return cloneObjectArray(results, this.cloneMethod);
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
		return new Resultset(this).eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun);
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
			return !(isNaN(n));
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
		var max,
			prop, mode;
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
