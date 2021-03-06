import {StorageAdapter} from "../../common/types";

export type ANY = any;

/**
 * In in-memory persistence adapter for an in-memory database.
 * This simple 'key/value' adapter is intended for unit testing and diagnostics.
 */
export class LokiMemoryAdapter implements StorageAdapter {

  private hashStore: object;
  private options: ANY;

  /**
   * @param {object} options - memory adapter options
   * @param {boolean} [options.asyncResponses=false] - whether callbacks are invoked asynchronously (default: false)
   * @param {int} [options.asyncTimeout=50] - timeout in ms to queue callbacks (default: 50)
   * @param {ANY} options
   */
  constructor(options?: ANY) {
    this.hashStore = {};
    this.options = options || {};

    if (this.options.asyncResponses === undefined) {
      this.options.asyncResponses = false;
    }

    if (this.options.asyncTimeout === undefined) {
      this.options.asyncTimeout = 50; // 50 ms default
    }
  }

  /**
   * Loads a serialized database from its in-memory store.
   * (Loki persistence adapter interface function)
   *
   * @param {string} dbname - name of the database (filename/keyname)
   * @returns {Promise} a Promise that resolves after the database was loaded
   */
  loadDatabase(dbname: string): Promise<string> {
    if (this.options.asyncResponses) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (this.hashStore[dbname] !== undefined) {
            resolve(this.hashStore[dbname].value);
          }
          else {
            reject(new Error("unable to load database, " + dbname + " was not found in memory adapter"));
          }
        }, this.options.asyncTimeout);
      });
    }
    else {
      if (this.hashStore[dbname] !== undefined) {
        return Promise.resolve(this.hashStore[dbname].value);
      }
      else {
        return Promise.reject(new Error("unable to load database, " + dbname + " was not found in memory adapter"));
      }
    }
  }

  /**
   * Saves a serialized database to its in-memory store.
   * (Loki persistence adapter interface function)
   *
   * @param {string} dbname - name of the database (filename/keyname)
   * @returns {Promise} a Promise that resolves after the database was persisted
   */
  saveDatabase(dbname: string, dbstring: string): Promise<void> {
    let saveCount;

    if (this.options.asyncResponses) {
      return new Promise((resolve) => {
        setTimeout(() => {
          saveCount = (this.hashStore[dbname] !== undefined ? this.hashStore[dbname].savecount : 0);

          this.hashStore[dbname] = {
            savecount: saveCount + 1,
            lastsave: new Date(),
            value: dbstring
          };

          resolve();
        }, this.options.asyncTimeout);
        return Promise.resolve();
      });
    } else {
      saveCount = (this.hashStore[dbname] !== undefined ? this.hashStore[dbname].savecount : 0);

      this.hashStore[dbname] = {
        savecount: saveCount + 1,
        lastsave: new Date(),
        value: dbstring
      };

      return Promise.resolve();
    }
  }

  /**
   * Deletes a database from its in-memory store.
   *
   * @param {string} dbname - name of the database (filename/keyname)
   * @returns {Promise} a Promise that resolves after the database was deleted
   */
  deleteDatabase(dbname: string) {
    if (this.hashStore[dbname] !== undefined) {
      delete this.hashStore[dbname];
    }

    return Promise.resolve();
  }
}
