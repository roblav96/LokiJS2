/*
 Loki Angular Adapter (need to include this script to use it)
 * @author Joe Minichino <joe.minichino@gmail.com>
 *
 * A lightweight document oriented javascript database
 */
(((root, factory) => {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['angular', 'lokijs'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		module.exports = factory();
	} else {
		// Browser globals
		root.lokiAngular = factory(
			root.angular,
			// Use thirdParty.loki if available to cover all legacy cases
			root.thirdParty && root.thirdParty.loki ?
				root.thirdParty.loki : root.loki
		);
	}
})(this, (angular, lokijs) => {
	const module = angular.module('lokijs', [])
		.factory('Loki', Loki)
		.service('Lokiwork', Lokiwork);

	function Loki() {
		return loki;
	}

	Lokiwork.$inject = ['Loki', '$q', '$injector', '$window'];

	function Lokiwork(Loki, $q, $injector, $window) {
		const vm = this;
		vm.checkStates = checkStates;
		let statesChecked = false;
		let db;
		let userDbPreference = '';
		let userPrefJsonFile = 0;
		let numOfJsonDatabases = 0;
		const dbitems = [];
		const lokidbs = [];
		vm.dbExists = dbExists;
		vm.closeDb = closeDb;
		vm.closeAllDbs = closeAllDbs;
		vm.getCollection = getCollection;
		vm.addCollection = addCollection;
		vm.removeCollection = removeCollection;
		vm.getDoc = getDoc;
		vm.updateDoc = updateDoc;
		vm.updateCurrentDoc = updateCurrentDoc;
		vm.setCurrentDoc = setCurrentDoc;
		vm.getCurrentDoc = getCurrentDoc;
		vm.deleteDocument = deleteDocument;
		vm.deleteCurrentDoc = deleteCurrentDoc;
		vm.deleteDatabase = deleteDatbase;
		vm.addDocument = addDocument;
		vm.insertItemInDoc = insertItemInDoc;
		let currentDoc = {};
		let currentColl = {};
		numOfJsonDatabases = getNumberOfJsonDatabases();

		function getCurrentDoc() {
			return currentDoc;
		}

		function deleteDatbase(data) {
			localStorage.removeItem(data);
		}

		function deleteDocument(dbName, collName, doc) { //doc should be in {name:value} format
			return $q((resolve, reject) => {
				userDbPreference = dbName;
				_getem('delete_doc', dbName, collName, doc)
					.then((data) => {
						currentDoc = {};
						resolve(data);
					}, (data) => {
						reject(data);
					});
			});
		}


		function insertItemInDoc(item) {
			return $q((resolve, reject) => {
				_getem('insert_item_in_doc', currentDoc.dbName, currentDoc.collName, currentDoc.doc, "", item)
					.then((data) => {
						resolve(data);
					}, (data) => {
						reject(data);
					});
			});
		}

		function deleteCurrentDoc() {
			return $q((resolve, reject) => {
				_getem('delete_current_doc')
					.then((data) => {
						resolve(data);
					}, (data) => {
						reject(data);
					});
			});
		}

		function addDocument(dbName, collName, newDoc) {
			return $q((resolve, reject) => {
				userDbPreference = dbName;
				_getem('create_doc', dbName, collName, "", "", newDoc)
					.then((data) => {
						currentDoc.dbName = dbName;
						currentDoc.collName = collName;
						currentDoc.doc = data;
						currentDoc.lokiNum = data[0].$loki;
						resolve(data[0]);
					}, (data) => {
						reject(data);
					});
			});
		}

		function setCurrentDoc(dbName, collName, docName) {
			return $q((resolve, reject) => {
				userDbPreference = dbName;
				_getem('set_doc', dbName, collName, docName)
					.then((data) => {
						currentDoc.dbName = dbName;
						currentDoc.collName = collName;
						currentDoc.doc = data;
						currentDoc.lokiNum = data[0].$loki;
						resolve(data[0]);
					}, (data) => {
						reject(data);
					});
			});
		}

		function updateCurrentDoc(thekey, thevalue) {
			return $q((resolve, reject) => {
				if (currentDoc) {
					_getem('update_current_doc', currentDoc.dbName, currentDoc.collName, currentDoc.doc, thekey, thevalue)
						.then((data) => {
							resolve(data[0]);
						}, (data) => {
							reject(data);
						});
				} else {
					reject("you have to set a current doc first, use: setCurrentDoc(dbName, collName, docName)");
				}
			});
		}

		function updateDoc(dbName, collName, docName, thekey, thevalue) {
			return $q((resolve, reject) => {
				userDbPreference = dbName;
				if (currentDoc) {
					_getem('update_doc', dbName, collName, docName, thekey, thevalue)
						.then((data) => {
							resolve(data[0]);
						}, (data) => {
							reject(data);
						});
				} else {
					reject("bad, check parameters)");
				}
			});
		}

		function getDoc(dbName, collName, docName) {
			return $q((resolve, reject) => {
				userDbPreference = dbName;
				_getem('get_doc', dbName, collName, docName)
					.then((data) => {
						currentDoc.dbName = dbName;
						currentDoc.collName = collName;
						currentDoc.doc = data;
						currentDoc.lokiNum = data[0].$loki;
						resolve(data[0]);
					}, (data) => {
						reject(data);
					});
			});
		}

		function getCollection(dbName, collName) {
			return $q((resolve, reject) => {
				userDbPreference = dbName;
				_getem('get_collection', dbName, collName)
					.then((data) => {
						currentColl.dbName = dbName;
						currentColl.collName = collName;
						resolve(data);
					}, (data) => {
						reject(data);
					});
			});
		}

		function removeCollection(dbName, collName) {
			return $q((resolve, reject) => {
				userDbPreference = dbName;
				_getem('remove_collection', dbName, collName)
					.then((data) => {
						currentColl = {};
						resolve(data);
					}, (data) => {
						reject(data);
					});
			});
		}

		function addCollection(collData) {
			return $q((resolve, reject) => {
				const dbobj = breakdown_components(collData);
				userDbPreference = collData[dbobj.db];
				_getem('add_collection', userDbPreference, '', '', '', collData)
					.then((data) => {
						currentColl.dbName = userDbPreference;
						resolve(data);
					}, (data) => {
						reject(data);
					});
			});
		}

		function _getem(operation, dbName, collName, docName, thekey, thevalue) {
			return $q((resolve, reject) => {
				if (db) {
					if (db.filename === dbName) {
						getdata();
					} else {
						loadDb(dbName)
							.then(() => {
								getdata();
							});
					}
				} else {
					if (statesChecked) {
						loadDb(dbName)
							.then(() => {
								getdata();
							});
					} else {
						checkStates().then(() => {
							getdata();
						}, (data) => {
							reject(data);
						});
					}
				}


				function getdata() {
					let found;

					if (operation === 'update_doc' || operation === 'insert_item_in_doc') {
						db.loadDatabase(dbName);
						const coll = db.getCollection(collName);

						//docName is not simply a docname, this is an object like: {name: 'user settings'}
						for (const i in docName) {
							currentDoc.key = i;
							currentDoc.value = docName[i];
						}
						for (let x = 0; x < coll.data.length; x++) {
							if (coll.data[x][currentDoc.key] === currentDoc.value) {
								currentDoc.lokiNum = coll.data[x].$loki;
							}
						}
						found = coll.get(parseInt(currentDoc.lokiNum, 10));

						if (operation === 'update_doc') {
							found[thekey] = thevalue;
							coll.update(found);
						} else {
							found.insert(thevalue);
						}
						db.save();
						resolve(true);
					}
					else if (operation === 'update_current_doc') {
						db.loadDatabase(dbName);
						const coll0 = db.getCollection(collName);
						found = coll0.get(parseInt(currentDoc.lokiNum, 10));
						found[thekey] = thevalue;
						coll0.update(found);

						db.save();
						resolve(true);
					}
					else if (operation === 'delete_current_doc' || operation === 'delete_doc') {
						db.loadDatabase(dbName);
						const coll6 = db.getCollection(collName);
						if (operation === 'delete_doc') {
							for (const j in docName) {
								currentDoc.key = j;
								currentDoc.value = docName[j];
							}
							for (let y = 0; y < coll6.data.length; y++) {
								if (coll6.data[y][currentDoc.key] === currentDoc.value) {
									currentDoc.lokiNum = coll6.data[y].$loki;
								}
							}
						}
						coll6.remove(currentDoc.lokiNum);
						db.save();
						resolve(true);
					}
					else if (operation === 'get_doc' || operation === 'set_doc') {
						db.loadDatabase(dbName);
						const coll1 = db.getCollection(collName);
						found = coll1.find(docName);
						resolve(angular.fromJson(found));
					} else if (operation === 'get_collection') {
						db.loadDatabase(dbName);
						const coll2 = db.getCollection(collName);
						resolve(angular.fromJson(coll2));
					} else if (operation === 'remove_collection') {
						db.loadDatabase(dbName);
						db.removeCollection(collName);
						//coll = db.getCollection(collName);
						db.save(() => {
							resolve('collection deleted');
						});
					} else if (operation === 'add_collection') {
						db.loadDatabase(dbName);
						const dbobj = breakdown_components(thevalue);

						for (let w = 0; w < dbobj.coll_array.length; w++) {
							const items = db.addCollection(thevalue[dbobj.coll_array[w].coll]);
							items.insert(thevalue[dbobj.coll_array[w].docs]);
						}

						db.save(() => {
							resolve('collection(s) added');
						});

					} else if (operation === 'create_doc') {
						db.loadDatabase(dbName);
						const coll3 = db.getCollection(collName);
						coll3.insert(thevalue);
						db.save(() => {
							const found = coll3.find({
								name: thevalue.name
							});
							resolve(angular.fromJson(found));
						});

					}
					// _getem('delete_doc', dbName, collName, "", "", doc)
					else if (operation === 'delete_current_doc') {
						const coll5 = db.getCollection(currentDoc.collName);
						if (!coll5) {
							reject('You forgot to specify a current doc first');
						} else {
							coll5.remove(parseInt(currentDoc.lokiNum, 10));
							db.save();
							resolve(true);
						}
					}
				}
			});
		}

		function dbExists(databaseName) {
			const value = window.localStorage.getItem(databaseName);
			if (value) {
				return true;
			} else {
				return false;
			}
		}

		function closeAllDbs() {
			return $q((resolve, reject) => {
				let current = 0;
				for (let x = 0; x < lokidbs.length; x++) {
					current++;
					lokidbs[x].close();
					if (x === (lokidbs.length - 1)) {
						resolve();
					}
				}
			});
		}

		function closeDb(databaseName) {
			return $q((resolve, reject) => {

				for (let x = 0; x < lokidbs.length; x++) {
					if (lokidbs.filename === databaseName) {
						lokidbs[x].close();
						resolve();
						break;
					}
				}

			});
		}


		function checkStates() {
			return $q((resolve, reject) => {
				if (dbitems.length === 0) {
					initialiseAll().then(() => {
						console.log('had to initialize all dbs');
						statesChecked = true;
						resolve();
					}, (data) => {
						reject(data);
					});
				} else {
					console.log('db list already initialized');
					resolve();
				}
			});
		}

		function firstFewItemsOfDbList() {
			return $q((resolve, reject) => {
				for (let x = 0; x >= 0; x++) {
					if ($injector.has('json' + (x + 1))) {
						const item = {};
						const setting = $injector.get('json' + (x + 1));
						const dbobj = breakdown_components(setting);
						if (setting[dbobj.db] === userDbPreference) { //userDbPreference is the name
							userPrefJsonFile = x + 1; //userPrefJsonFile is the index
							if (x === (numOfJsonDatabases - 1)) {
								resolve();
							}
						} else {
							item.filename = dbobj.db;
							item.json = x + 1;
							dbitems.push(item);
							if (x === (numOfJsonDatabases - 1)) {
								resolve();
							}
						}
					}
					else {
						resolve();
						break;
					}
				}
			});
		}

		function initialiseDbList() {
			return $q((resolve, reject) => {
				firstFewItemsOfDbList()
					.then(() => {
						if (userPrefJsonFile === 0) {
							reject('Oops!, you didn\'t specify any starting document');
						}
						const currentdb = $injector.get('json' + userPrefJsonFile);
						const item = {};
						const dbobj = breakdown_components(currentdb);
						item.filename = dbobj.db;
						item.json = userPrefJsonFile;
						dbitems.push(item);
						resolve();
					});
			});
		}

		function getNumberOfJsonDatabases() {
			if (numOfJsonDatabases >= 1) {
				return numOfJsonDatabases;
			} else {
				for (let x = 0; x >= 0; x++) {
					if ($injector.has('json' + (x + 1))) {
						numOfJsonDatabases++;
					}
					else {
						break;
					}

				}
				return numOfJsonDatabases;
			}
		}

		let still_running = false;
		let current_iteration = 1;

		function initialiseAll() {
			return $q((resolve, reject) => {
				initialiseDbList()
					.then(() => {

						function iterate_me() {
							if ($injector.has('json' + dbitems[current_iteration - 1].json)) {
								const setting = $injector.get('json' + dbitems[current_iteration - 1].json);

								console.log('number = ' + current_iteration);
								const set = angular.fromJson(setting);
								still_running = true;
								initiateDb(set)
									.then(() => {
										//lokidbs.push(angular.copy(db));
										if (!doesDBAlreadyExistInArray(db.filename)) {
											lokidbs.push(angular.copy(db));
										}
										still_running = false;
										if (current_iteration === (dbitems.length)) {
											resolve();
										} else {
											current_iteration++;
											iterate_me();
											return;
										}
									});
							}
						}

						iterate_me();
					}, (data) => {
						reject(data);
					});
			});
		}

		function doesDBAlreadyExistInArray(dbname) {
			let answer = false;
			for (let x = 0; x < lokidbs.length; x++) {
				if (lokidbs[x].filename === dbname) {
					answer = true;
				}
			}
			return answer;
		}

		function getIndexOfDbItem(dbname) {
			let answer = -1;
			for (let x = 0; x < numOfJsonDatabases; x++) {
				if (dbitems[x].filename === dbname) {
					answer = x;
				}
			}
			return answer;
		}

		function loadDb(databaseName) {
			return $q((resolve, reject) => {
				for (let x = 0; x < lokidbs.length; x++) {
					if (lokidbs[x].filename === databaseName) {
						db = lokidbs[x];
						resolve();
					}
				}
			});
		}


		function initiateDb(database) {
			return $q((resolve, reject) => {
				const dbobj = breakdown_components(database);
				let db_does_exist = false;
				if (dbExists(database[dbobj.db])) {
					db_does_exist = true;
				}
				db = new loki(database[dbobj.db], {
					autoload: true,
					autoloadCallback: loadHandler, //loadHandler, //for some reason this has to be called like this
					autosave: true,
					autosaveInterval: 10000
				});

				function loadHandler() {
					if (db_does_exist) {

						resolve();
					} else {
						const dbobj = breakdown_components(database);
						for (let x = 0; x < dbobj.coll_array.length; x++) {
							const items = db.addCollection(database[dbobj.coll_array[x].coll]);
							items.insert(database[dbobj.coll_array[x].docs]);
						}
						db.save();
						resolve();
					}
				}
			});
		}

		function breakdown_components(db_obj) {
			let iterate = 1;
			let db_id = '';
			let coll_id = "";
			let doc_id = "";
			const collections = [];
			for (const i in db_obj) {
				if (iterate > 1) {
					if (isEven(iterate)) {
						coll_id = i;
					}
					else {
						doc_id = i;
						const tempobj = {coll: coll_id, docs: doc_id};
						collections.push(tempobj);
					}
				}
				else {
					db_id = i;
				}
				iterate++;
			}

			const dataobj = {db: db_id, coll_array: collections};
			return dataobj;
		}

		function isEven(n) {
			return n % 2 === 0;
		}

		function isOdd(n) {
			return Boolean(n % 2);
		}
	}

	return module;
}));
