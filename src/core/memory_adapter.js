/**
 * In in-memory persistence adapter for an in-memory database.
 * This simple 'key/value' adapter is intended for unit testing and diagnostics.
 *
 * @constructor LokiMemoryAdapter
 */
export class LokiMemoryAdapter {

	constructor() {
		this.hashStore = {};
	}


	/**
	 * Loads a serialized database from its in-memory store.
	 * (Loki persistence adapter interface function)
	 *
	 * @param {string} dbname - name of the database (filename/keyname)
	 * @returns {Promise} a Promise that resolves after the database was loaded
	 * @memberof LokiMemoryAdapter
	 */
	loadDatabase(dbname) {
		if (this.hashStore.hasOwnProperty(dbname)) {
			return Promise.resolve(this.hashStore[dbname].value);
		} else {
			return Promise.reject(new Error("unable to load database, " + dbname + " was not found in memory adapter"));
		}
	}

	/**
	 * Saves a serialized database to its in-memory store.
	 * (Loki persistence adapter interface function)
	 *
	 * @param {string} dbname - name of the database (filename/keyname)
	 * @returns {Promise} a Promise that resolves after the database was persisted
	 * @memberof LokiMemoryAdapter
	 */
	saveDatabase(dbname, dbstring) {
		var saveCount = (this.hashStore.hasOwnProperty(dbname) ? this.hashStore[dbname].savecount : 0);

		this.hashStore[dbname] = {
			savecount: saveCount + 1,
			lastsave: new Date(),
			value: dbstring
		};

		return Promise.resolve();
	}

	/**
	 * Deletes a database from its in-memory store.
	 *
	 * @param {string} dbname - name of the database (filename/keyname)
	 * @returns {Promise} a Promise that resolves after the database was deleted
	 * @memberof LokiMemoryAdapter
	 */
	deleteDatabase(dbname) {
		if (this.hashStore.hasOwnProperty(dbname)) {
			delete this.hashStore[dbname];
		}

		return Promise.resolve();
	}

}
