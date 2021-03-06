import { LokiEventEmitter } from "./event_emitter";
import { Collection } from "./collection";
import { Doc, StorageAdapter } from "../../common/types";
export declare type ANY = any;
export declare class Loki extends LokiEventEmitter {
    private filename;
    private databaseVersion;
    private engineVersion;
    private _collections;
    private _verbose;
    private _env;
    private _serializationMethod;
    private _destructureDelimiter;
    private _persistenceMethod;
    private _persistenceAdapter;
    private _throttledSaves;
    private _throttledSaveRunning;
    private _throttledSavePending;
    private _autosave;
    private _autosaveInterval;
    private _autosaveHandle;
    /**
     * Constructs the main database class.
     * @param {string} filename - name of the file to be saved to
     * @param {object} [options={}] - options
     * @param {Loki.Environment} [options.env=auto] - overrides environment detection
     * @param {Loki.SerializationMethod} [options.serializationMethod=NORMAL] - the serialization method
     * @param {string} [options.destructureDelimiter="$<\n"] - string delimiter used for destructured serialization
     * @param {boolean} [options.verbose=false] - enable console output
     */
    constructor(filename?: string, options?: Loki.Options);
    /**
     * configures options related to database persistence.
     *
     * @param {Loki.PersistenceOptions} [options={}] - options
     * @param {adapter} [options.adapter=auto] - an instance of a loki persistence adapter
     * @param {boolean} [options.autosave=false] - enables autosave
     * @param {int} [options.autosaveInterval=5000] - time interval (in milliseconds) between saves (if dirty)
     * @param {boolean} [options.autoload=false] - enables autoload on loki instantiation
     * @param {object} options.inflate - options that are passed to loadDatabase if autoload enabled
     * @param {boolean} [options.throttledSaves=true] - if true, it batches multiple calls to to saveDatabase reducing number of
     *   disk I/O operations and guaranteeing proper serialization of the calls. Default value is true.
     * @param {Loki.PersistenceMethod} options.persistenceMethod - a persistence method which should be used (FS_STORAGE, LOCAL_STORAGE...)
     * @returns {Promise} a Promise that resolves after initialization and (if enabled) autoloading the database
     */
    initializePersistence(options?: Loki.PersistenceOptions): Promise<void>;
    /**
     * Copies 'this' database into a new Loki instance. Object references are shared to make lightweight.
     * @param {object} options - options
     * @param {boolean} options.removeNonSerializable - nulls properties not safe for serialization.
     */
    copy(options?: Loki.CopyOptions): Loki;
    /**
     * Adds a collection to the database.
     * @param {string} name - name of collection to add
     * @param {object} [options={}] - options to configure collection with.
     * @param {array} [options.unique=[]] - array of property names to define unique constraints for
     * @param {array} [options.exact=[]] - array of property names to define exact constraints for
     * @param {array} [options.indices=[]] - array property names to define binary indexes for
     * @param {boolean} [options.asyncListeners=false] - whether listeners are called asynchronously
     * @param {boolean} [options.disableChangesApi=true] - set to false to enable Changes Api
     * @param {boolean} [options.clone=false] - specify whether inserts and queries clone to/from user
     * @param {string} [options.cloneMethod=CloneMethod.DEEP] - the clone method
     * @param {int} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
     * @returns {Collection} a reference to the collection which was just added
     */
    addCollection<T extends object>(name: string, options?: Collection.Options): Collection<T>;
    loadCollection(collection: Collection): void;
    /**
     * Retrieves reference to a collection by name.
     * @param {string} collectionName - name of collection to look up
     * @returns {Collection} Reference to collection in database by that name, or null if not found
     */
    getCollection<T extends object>(collectionName: string): Collection<T>;
    /**
     * Renames an existing loki collection
     * @param {string} oldName - name of collection to rename
     * @param {string} newName - new name of collection
     * @returns {Collection} reference to the newly renamed collection
     */
    renameCollection(oldName: string, newName: string): Collection<{}>;
    listCollections(): {
        name: string;
        count: number;
    }[];
    /**
     * Removes a collection from the database.
     * @param {string} collectionName - name of collection to remove
     */
    removeCollection(collectionName: string): void;
    getName(): string;
    /**
     * Serialize database to a string which can be loaded via {@link Loki#loadJSON}
     *
     * @returns {string} Stringified representation of the loki database.
     */
    serialize(options?: Loki.SerializeOptions): string | string[];
    toJSON(): {
        _env: Loki.Environment;
        _serializationMethod: Loki.SerializationMethod;
        _autosave: boolean;
        _autosaveInterval: number;
        _collections: Collection<object>[];
        databaseVersion: number;
        engineVersion: number;
        filename: string;
        _persistenceAdapter: StorageAdapter;
        _persistenceMethod: Loki.PersistenceMethod;
        _throttledSaves: boolean;
        _verbose: boolean;
    };
    /**
     * Database level destructured JSON serialization routine to allow alternate serialization methods.
     * Internally, Loki supports destructuring via loki "serializationMethod' option and
     * the optional LokiPartitioningAdapter class. It is also available if you wish to do
     * your own structured persistence or data exchange.
     *
     * @param {object} options - output format options for use externally to loki
     * @param {boolean} [options.partitioned=false] - whether db and each collection are separate
     * @param {int} options.partition - can be used to only output an individual collection or db (-1)
     * @param {boolean} [options.delimited=true] - whether subitems are delimited or subarrays
     * @param {string} options.delimiter - override default delimiter
     *
     * @returns {string|Array} A custom, restructured aggregation of independent serializations.
     */
    serializeDestructured(options?: Loki.SerializeDestructuredOptions): string | string[];
    /**
     * Collection level utility method to serialize a collection in a 'destructured' format
     *
     * @param {object} options - used to determine output of method
     * @param {int} options.delimited - whether to return single delimited string or an array
     * @param {string} options.delimiter - (optional) if delimited, this is delimiter to use
     * @param {int} options.collectionIndex -  specify which collection to serialize data for
     *
     * @returns {string|array} A custom, restructured aggregation of independent serializations for a single collection.
     */
    serializeCollection(options?: ANY): string | string[];
    /**
     * Database level destructured JSON deserialization routine to minimize memory overhead.
     * Internally, Loki supports destructuring via loki "serializationMethod' option and
     * the optional LokiPartitioningAdapter class. It is also available if you wish to do
     * your own structured persistence or data exchange.
     *
     * @param {string|array} destructuredSource - destructured json or array to deserialize from
     * @param {object} options - source format options
     * @param {boolean} [options.partitioned=false] - whether db and each collection are separate
     * @param {int} options.partition - can be used to deserialize only a single partition
     * @param {boolean} [options.delimited=true] - whether subitems are delimited or subarrays
     * @param {string} options.delimiter - override default delimiter
     *
     * @returns {object|array} An object representation of the deserialized database, not yet applied to 'this' db or document array
     */
    deserializeDestructured(destructuredSource: ANY, options?: Loki.SerializeDestructuredOptions): any;
    /**
     * Collection level utility function to deserializes a destructured collection.
     *
     * @param {string|string[]} destructuredSource - destructured representation of collection to inflate
     * @param {object} options - used to describe format of destructuredSource input
     * @param {int} [options.delimited=false] - whether source is delimited string or an array
     * @param {string} options.delimiter - if delimited, this is delimiter to use (if other than default)
     *
     * @returns {Array} an array of documents to attach to collection.data.
     */
    deserializeCollection<T extends object>(destructuredSource: string | string[], options?: Loki.DeserializeCollectionOptions): Doc<T>;
    /**
     * Inflates a loki database from a serialized JSON string
     *
     * @param {string} serializedDb - a serialized loki database string
     * @param {object} options - apply or override collection level settings
     * @param {boolean} options.retainDirtyFlags - whether collection dirty flags will be preserved
     */
    loadJSON(serializedDb: string | string[], options?: ANY): void;
    /**
     * Inflates a loki database from a JS object
     *
     * @param {object} dbObject - a serialized loki database string
     * @param {object} options - apply or override collection level settings
     * @param {boolean} options.retainDirtyFlags - whether collection dirty flags will be preserved
     */
    loadJSONObject(dbObject: ANY, options?: Collection.DeserializeOptions): void;
    /**
     * Emits the close event. In autosave scenarios, if the database is dirty, this will save and disable timer.
     * Does not actually destroy the db.
     *
     * @returns {Promise} a Promise that resolves after closing the database succeeded
     */
    close(): Promise<void>;
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
     * @param {Array} [arrayOfCollectionNames=] - array of collection names. No arg means all collections are processed.
     * @returns {Array} array of changes
     * @see private method _createChange() in Collection
     */
    generateChangesNotification(arrayOfCollectionNames?: string[]): any[];
    /**
     * (Changes API) - stringify changes for network transmission
     * @returns {string} string representation of the changes
     */
    serializeChanges(collectionNamesArray?: string[]): string;
    /**
     * (Changes API) : clears all the changes in all collections.
     */
    clearChanges(): void;
    /**
     * Wait for throttledSaves to complete and invoke your callback when drained or duration is met.
     *
     * @param {object} options - configuration options
     * @param {boolean} [options.recursiveWait=true] - if after queue is drained, another save was kicked off, wait for it
     * @param {boolean} [options.recursiveWaitLimit=false] - limit our recursive waiting to a duration
     * @param {number} [options.recursiveWaitLimitDuration=2000] - cutoff in ms to stop recursively re-draining
     * @param {Date} [options.started=now()] - the start time of the recursive wait duration
     * @returns {Promise} a Promise that resolves when save queue is drained, it is passed a sucess parameter value
     */
    throttledSaveDrain(options?: Loki.ThrottledSaveDrainOptions): Promise<void>;
    /**
     * Internal load logic, decoupled from throttling/contention logic
     *
     * @param {object} options - an object containing inflation options for each collection
     * @returns {Promise} a Promise that resolves after the database is loaded
     */
    private _loadDatabase(options?);
    /**
     * Handles manually loading from an adapter storage (such as fs-storage)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *    To avoid contention with any throttledSaves, we will drain the save queue first.
     *
     * If you are configured with autosave, you do not need to call this method yourself.
     *
     * @param {object} [options={}] - if throttling saves and loads, this controls how we drain save queue before loading
     * @param {boolean} [options.recursiveWait=true] wait recursively until no saves are queued
     * @param {boolean} [options.recursiveWaitLimit=false] limit our recursive waiting to a duration
     * @param {number} [options.recursiveWaitLimitDelay=2000] cutoff in ms to stop recursively re-draining
     * @param {Date} [options.started=now()] - the start time of the recursive wait duration
     * @returns {Promise} a Promise that resolves after the database is loaded
     */
    loadDatabase(options?: Loki.ThrottledSaveDrainOptions): Promise<void>;
    private _saveDatabase();
    /**
     * Handles manually saving to an adapter storage (such as fs-storage)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *
     * If you are configured with autosave, you do not need to call this method yourself.
     *
     * @returns {Promise} a Promise that resolves after the database is persisted
     */
    saveDatabase(): Promise<void>;
    /**
     * Handles deleting a database from the underlying storage adapter
     *
     * @returns {Promise} a Promise that resolves after the database is deleted
     */
    deleteDatabase(): Promise<void>;
    /**
     * Starts periodically saves to the underlying storage adapter.
     */
    autosaveEnable(): void;
    /**
     * Stops the autosave interval timer.
     */
    autosaveDisable(): void;
}
export declare namespace Loki {
    interface Options {
        env?: Environment;
        serializationMethod?: SerializationMethod;
        destructureDelimiter?: string;
        verbose?: boolean;
    }
    interface PersistenceOptions {
        adapter?: StorageAdapter;
        autosave?: boolean;
        autosaveInterval?: number;
        autoload?: boolean;
        throttledSaves?: boolean;
        persistenceMethod?: Loki.PersistenceMethod;
        inflate?: any;
    }
    interface CopyOptions {
        removeNonSerializable?: boolean;
    }
    interface SerializeOptions {
        serializationMethod?: SerializationMethod;
    }
    interface SerializeDestructuredOptions {
        partitioned?: boolean;
        partition?: number;
        delimited?: boolean;
        delimiter?: string;
    }
    interface DeserializeCollectionOptions {
        partitioned?: boolean;
        delimited?: boolean;
        delimiter?: string;
    }
    interface ThrottledSaveDrainOptions {
        recursiveWait?: boolean;
        recursiveWaitLimit?: boolean;
        recursiveWaitLimitDuration?: number;
        started?: Date;
    }
    enum SerializationMethod {
        NORMAL = 0,
        PRETTY = 1,
        DESTRUCTURED = 2,
    }
    enum PersistenceMethod {
        FS_STORAGE = 0,
        LOCAL_STORAGE = 1,
        INDEXED_STORAGE = 2,
        MEMORY_STORAGE = 3,
        ADAPTER = 4,
    }
    enum Environment {
        NODE_JS = 0,
        NATIVE_SCRIPT = 1,
        BROWSER = 2,
        CORDOVA = 3,
        MEMORY = 4,
    }
}
