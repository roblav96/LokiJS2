import {Loki} from './lokicore';

/**
 * An adapter for adapters.  Converts a non reference mode adapter into a reference mode adapter
 * which can perform destructuring and partioning.  Each collection will be stored in its own key/save and
 * only dirty collections will be saved.  If you  turn on paging with default page size of 25megs and save
 * a 75 meg collection it should use up roughly 3 save slots (key/value pairs sent to inner adapter).
 * A dirty collection that spans three pages will save all three pages again
 * Paging mode was added mainly because Chrome has issues saving 'too large' of a string within a
 * single indexeddb row.  If a single document update causes the collection to be flagged as dirty, all
 * of that collection's pages will be written on next save.
 *
 * @param {object} adapter - reference to a 'non-reference' mode loki adapter instance.
 * @param {object=} options - configuration options for partitioning and paging
 * @param {bool} options.paging - (default: false) set to true to enable paging collection data.
 * @param {int} options.pageSize - (default : 25MB) you can use this to limit size of strings passed to inner adapter.
 * @param {string} options.delimiter - allows you to override the default delimeter
 * @constructor LokiPartitioningAdapter
 */
export class LokiPartitioningAdapter {

	constructor(adapter, options) {
		this.mode = "reference";
		this.adapter = null;
		this.options = options || {};
		this.dbref = null;
		this.dbname = "";
		this.pageIterator = {};

		// verify user passed an appropriate adapter
		if (adapter) {
			if (adapter.mode === "reference") {
				throw new Error("LokiPartitioningAdapter cannot be instantiated with a reference mode adapter");
			} else {
				this.adapter = adapter;
			}
		} else {
			throw new Error("LokiPartitioningAdapter requires a (non-reference mode) adapter on construction");
		}

		// set collection paging defaults
		if (!this.options.hasOwnProperty("paging")) {
			this.options.paging = false;
		}

		// default to page size of 25 megs (can be up to your largest serialized object size larger than this)
		if (!this.options.hasOwnProperty("pageSize")) {
			this.options.pageSize = 25 * 1024 * 1024;
		}

		if (!this.options.hasOwnProperty("delimiter")) {
			this.options.delimiter = '$<\n';
		}
	}

	/**
	 * Loads a database which was partitioned into several key/value saves.
	 * (Loki persistence adapter interface function)
	 *
	 * @param {string} dbname - name of the database (filename/keyname)
	 * @returns {Promise} a Promise that resolves after the database was loaded
	 * @memberof LokiMemoryAdapter
	 */
	loadDatabase(dbname) {
		var self = this;
		this.dbname = dbname;
		this.dbref = new Loki(dbname);

		// load the db container (without data)
		return this.adapter.loadDatabase(dbname).then(function(result) {
			if (typeof result !== "string") {
				throw new Error("LokiPartitioningAdapter received an unexpected response from inner adapter loadDatabase()");
			}

			// I will want to use loki destructuring helper methods so i will inflate into typed instance
			var db = JSON.parse(result);
			self.dbref.loadJSONObject(db);
			db = null;

			var clen = self.dbref.collections.length;

			if (self.dbref.collections.length === 0) {
				return self.dbref;
			}

			self.pageIterator = {
				collection: 0,
				pageIndex: 0
			};

			return self.loadNextPartition(0).then(function() {
				return self.dbref;
			});
		});
	}

	/**
	 * Used to sequentially load each collection partition, one at a time.
	 *
	 * @param {int} partition - ordinal collection position to load next
	 * @returns {Promise} a Promise that resolves after the next partition is loaded
	 */
	loadNextPartition(partition) {
		var keyname = this.dbname + "." + partition;
		var self = this;

		if (this.options.paging === true) {
			this.pageIterator.pageIndex = 0;
			return this.loadNextPage();
		}

		return this.adapter.loadDatabase(keyname).then(function(result) {
			var data = self.dbref.deserializeCollection(result, {
				delimited: true,
				collectionIndex: partition
			});
			self.dbref.collections[partition].data = data;

			if (++partition < self.dbref.collections.length) {
				return self.loadNextPartition(partition);
			}
		});
	}

	/**
	 * Used to sequentially load the next page of collection partition, one at a time.
	 *
	 * @returns {Promise} a Promise that resolves after the next page is loaded
	 */
	loadNextPage() {
		// calculate name for next saved page in sequence
		var keyname = this.dbname + "." + this.pageIterator.collection + "." + this.pageIterator.pageIndex;
		var self = this;

		// load whatever page is next in sequence
		return this.adapter.loadDatabase(keyname).then(function(result) {
			var data = result.split(self.options.delimiter);
			result = ""; // free up memory now that we have split it into array
			var dlen = data.length;
			var idx;

			// detect if last page by presence of final empty string element and remove it if so
			var isLastPage = (data[dlen - 1] === "");
			if (isLastPage) {
				data.pop();
				dlen = data.length;
				// empty collections are just a delimiter meaning two blank items
				if (data[dlen - 1] === "" && dlen === 1) {
					data.pop();
					dlen = data.length;
				}
			}

			// convert stringified array elements to object instances and push to collection data
			for (idx = 0; idx < dlen; idx++) {
				self.dbref.collections[self.pageIterator.collection].data.push(JSON.parse(data[idx]));
				data[idx] = null;
			}
			data = [];

			// if last page, we are done with this partition
			if (isLastPage) {
				// if there are more partitions, kick off next partition load
				if (++self.pageIterator.collection < self.dbref.collections.length) {
					return self.loadNextPartition(self.pageIterator.collection);
				}
			} else {
				self.pageIterator.pageIndex++;
				return self.loadNextPage();
			}
		});
	}

	/**
	 * Saves a database by partioning into separate key/value saves.
	 * (Loki 'reference mode' persistence adapter interface function)
	 *
	 * @param {string} dbname - name of the database (filename/keyname)
	 * @param {object} dbref - reference to database which we will partition and save.
	 * @returns {Promise} a Promise that resolves after the database was deleted
	 *
	 * @memberof LokiPartitioningAdapter
	 */
	exportDatabase(dbname, dbref) {
		var self = this;
		var idx, clen = dbref.collections.length;

		this.dbref = dbref;
		this.dbname = dbname;

		// queue up dirty partitions to be saved
		this.dirtyPartitions = [-1];
		for (idx = 0; idx < clen; idx++) {
			if (dbref.collections[idx].dirty) {
				this.dirtyPartitions.push(idx);
			}
		}

		return this.saveNextPartition();
	}

	/**
	 * Helper method used internally to save each dirty collection, one at a time.
	 *
	 * @returns {Promise} a Promise that resolves after the next partition is saved
	 */
	saveNextPartition() {
		var self = this;
		var partition = this.dirtyPartitions.shift();
		var keyname = this.dbname + ((partition === -1) ? "" : ("." + partition));

		// if we are doing paging and this is collection partition
		if (this.options.paging && partition !== -1) {
			this.pageIterator = {
				collection: partition,
				docIndex: 0,
				pageIndex: 0
			};

			// since saveNextPage recursively calls itself until done, our callback means this whole paged partition is finished
			return this.saveNextPage().then(function() {
				if (self.dirtyPartitions.length !== 0) {
					return self.saveNextPartition();
				}
			});
		}

		// otherwise this is 'non-paged' partioning...
		var result = this.dbref.serializeDestructured({
			partitioned: true,
			delimited: true,
			partition: partition
		});

		return this.adapter.saveDatabase(keyname, result).then(function() {
			if (self.dirtyPartitions.length !== 0) {
				return self.saveNextPartition();
			}
		});
	}

	/**
	 * Helper method used internally to generate and save the next page of the current (dirty) partition.
	 *
	 * @returns {Promise} a Promise that resolves after the next partition is saved
	 */
	saveNextPage() {
		var self = this;
		var coll = this.dbref.collections[this.pageIterator.collection];
		var keyname = this.dbname + "." + this.pageIterator.collection + "." + this.pageIterator.pageIndex;
		var pageLen = 0,
			cdlen = coll.data.length,
			delimlen = this.options.delimiter.length;
		var serializedObject = "",
			pageBuilder = "";
		var doneWithPartition = false,
			doneWithPage = false;

		var pageSaveCallback = function() {
			pageBuilder = "";

			// update meta properties then continue process by invoking callback
			if (!doneWithPartition) {
				self.pageIterator.pageIndex++;
				return self.saveNextPage();
			}
		};

		if (coll.data.length === 0) {
			doneWithPartition = true;
		}

		while (true) {
			if (!doneWithPartition) {
				// serialize object
				serializedObject = JSON.stringify(coll.data[this.pageIterator.docIndex]);
				pageBuilder += serializedObject;
				pageLen += serializedObject.length;

				// if no more documents in collection to add, we are done with partition
				if (++this.pageIterator.docIndex >= cdlen) doneWithPartition = true;
			}
			// if our current page is bigger than defined pageSize, we are done with page
			if (pageLen >= this.options.pageSize) doneWithPage = true;

			// if not done with current page, need delimiter before next item
			// if done with partition we also want a delmiter to indicate 'end of pages' final empty row
			if (!doneWithPage || doneWithPartition) {
				pageBuilder += this.options.delimiter;
				pageLen += delimlen;
			}

			// if we are done with page save it and pass off to next recursive call or callback
			if (doneWithPartition || doneWithPage) {
				return this.adapter.saveDatabase(keyname, pageBuilder).then(pageSaveCallback);
			}
		}
	}
}
