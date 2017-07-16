(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("adapter-fs-adapter", [], factory);
	else if(typeof exports === 'object')
		exports["adapter-fs-adapter"] = factory();
	else
		root["adapter-fs-adapter"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
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
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * A loki persistence adapter which persists using node fs module
 */
class FileSystemAdapter {

  constructor() {
    this.fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
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
/* harmony export (immutable) */ __webpack_exports__["a"] = FileSystemAdapter;



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__fs_adapter__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "FileSystemAdapter", function() { return __WEBPACK_IMPORTED_MODULE_0__fs_adapter__["a"]; });






/***/ })
/******/ ]);
});
//# sourceMappingURL=adapter-fs-adapter.js.map