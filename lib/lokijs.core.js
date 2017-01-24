(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("lokijs", [], factory);
	else if(typeof exports === 'object')
		exports["lokijs"] = factory();
	else
		root["lokijs"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
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
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.getInstance = getInstance;
	
	var _calculator = __webpack_require__(1);
	
	function getInstance() {
		return new _calculator.Calculator();
	}
	
	//module.exports = getInstance;

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	/**
		* Test class.
		*/
	class Calculator {
		/**
	 	*
	 	* @param op1
	 	* @param op2
	 	* @returns {*}
	 	*/
		add(op1, op2) {
			return op1 + op2;
		}
	
		/**
	 	*
	 	* @param op1
	 	* @param op2
	 	* @returns {number}
	 	*/
		subtract(op1, op2) {
			return op1 - op2;
		}
	
		anyFunc() {}
	}
	exports.Calculator = Calculator;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=lokijs.core.js.map