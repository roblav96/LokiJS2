(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("adapter-local-storage", [], factory);
	else if(typeof exports === 'object')
		exports["adapter-local-storage"] = factory();
	else
		root["adapter-local-storage"] = factory();
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
function localStorageAvailable() {
  try {
    return (window && window.localStorage !== undefined && window.localStorage !== null);
  } catch (e) {
    return false;
  }
}

/**
 * A loki persistence adapter which persists to web browser's local storage object
 * @constructor LokiLocalStorageAdapter
 */
class LocalStorageAdapter {

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
/* harmony export (immutable) */ __webpack_exports__["a"] = LocalStorageAdapter;



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__local_storage_adapter__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "LocalStorageAdapter", function() { return __WEBPACK_IMPORTED_MODULE_0__local_storage_adapter__["a"]; });






/***/ })
/******/ ]);
});
//# sourceMappingURL=adapter-local-storage.js.map