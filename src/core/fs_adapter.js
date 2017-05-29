/**
 * A loki persistence adapter which persists using node fs module
 * @constructor LokiFsAdapter
 */
export class LokiFsAdapter {

	constructor() {
		// TODO
		if (typeof global !== "undefined" && ({}).toString.call(global) === '[object global]') {
			this.fs = require('fs');
		}
	}

	/**
	 * loadDatabase() - Load data from file, will throw an error if the file does not exist
	 * @param {string} dbname - the filename of the database to load
	 * @returns {Promise} a Promise that resolves after the database was loaded
	 * @memberof LokiFsAdapter
	 */
	loadDatabase(dbname) {
		return new Promise((resolve, reject) => {
			this.fs.stat(dbname, (err, stats) => {
				if (!err && stats.isFile()) {
					this.fs.readFile(dbname, {
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
		const tmpdbname = dbname + '~';

		return new Promise((resolve, reject) => {
			this.fs.writeFile(tmpdbname, dbstring, (err) => {
				if (err) {
					reject(err);
				} else {
					this.fs.rename(tmpdbname, dbname, (err) => {
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
		return new Promise((resolve, reject) => {
			this.fs.unlink(dbname, function deleteDatabaseCallback(err) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}
