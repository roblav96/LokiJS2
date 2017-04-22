import * as Utils from './utils.js';

/**
 * Splits a string at non-alphanumeric characters into lower case tokens.
 * @param {string} str - the string
 * @returns {string[]} - the tokens
 * @private
 */
function defaultSplitter(str) {
	let trimmedTokens = [];
	let tokens = str.split(/[\s\-]+/);
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i] !== '') {
			trimmedTokens.push(tokens[i].toLowerCase());
		}
	}
	return trimmedTokens;
}

/**
 * The tokenizer is used to prepare the string content of a document field for the inverted index.
 * Firstly the string gets split into tokens.
 * After that the tokens will be trimmed/stemmed with defined functions from the queue.
 *
 * * To change the splitter function, use {@link Tokenizer#setSplitter}.
 * * To add functions to the queue, use {@link Tokenizer#add}, {@link Tokenizer#addBefore} and
 *   {@link Tokenizer#addAfter}.
 * * To remove a function from the queue, use {@link Tokenizer#remove}.
 * * To reset the tokenizer, use {@link Tokenizer#reset}.
 */
export class Tokenizer {
	/**
	 * Initializes the tokenizer with a splitter, which splits a string at non-alphanumeric characters.
	 * The queue is empty.
	 */
	constructor() {
		this._splitter = null;
		this._queue = [];
		this._symbol = Symbol('label');
		this.reset();
	}

	/**
	 * Sets a function with defined label as the splitter function.
	 * The function must take a string as argument and return an array of tokens.
	 *
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	setSplitter(label, func) {
		label = Utils.asString(label);
		if (!Utils.isFunction(func)) {
			throw TypeError("Splitter must be a function.");
		}
		if (label === "") {
			throw Error("Label cannot be empty.");
		}
		func[this._symbol] = label;
		this._splitter = func;
	}

	/**
	 * Gets the splitter.
	 * @return {Array.<string, function>} - tuple with label and function
	 */
	getSplitter() {
		return [this._splitter[this._symbol], this._splitter];
	}

	/**
	 * Resets the splitter to default.
	 */
	resetSplitter() {
		this._splitter = defaultSplitter;
	}

	/**
	 * Checks if a function is inside the queue.
	 * @param {string|function} labelFunc - an existing label or function
	 * @returns {boolean} true if exists, otherwise false
	 */
	has(labelFunc) {
		return this._getPosition(labelFunc) !== -1;
	}

	/**
	 * Gets a function from the queue.
	 * Only the first found function gets returned if a label or a function is multiple used.
	 *
	 * @param {string|function} labelFunc - an existing label or function
	 * @return {Array.<string, function>} - tuple with label and function
	 */
	get(labelFunc) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		return [this._queue[pos][this._symbol], this._queue[pos]];
	}

	/**
	 * Adds a function with defined label to the end of the queue.
	 * The function must take a token string as argument and return a token.
	 *
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	add(label, func) {
		this._addFunction(label, func, this._queue.length);
	}

	/**
	 * Adds a function with defined label before an existing function to the queue.
	 * The function must take a token string as argument and return a token.
	 *
	 * @param {string|function} labelFunc - an existing label or function
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	addBefore(labelFunc, label, func) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		this._addFunction(label, func, pos);
	}

	/**
	 * Adds a function with defined label after an existing function to the queue.
	 * The function must take a token string as argument and return a token.
	 *
	 * @param {string|function} labelFunc - an existing label or function
	 * @param {string} label - the label
	 * @param {function} func - the function
	 */
	addAfter(labelFunc, label, func) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		this._addFunction(label, func, pos + 1);
	}

	/**
	 * Removes a function from the queue.
	 * @param {string|function} labelFunc - an existing label or function
	 */
	remove(labelFunc) {
		let pos = this._getPosition(labelFunc);
		if (pos === -1) {
			throw Error('Cannot find existing function.');
		}
		this._queue.splice(pos, 1);
	}

	/**
	 * Resets the splitter and tokenize queue to default.
	 */
	reset() {
		this._splitter = defaultSplitter;
		this._queue = [];
	}

	/**
	 * Tokenizes a string into tokens.
	 * @param {string} str - the string
	 * @return {string[]} the tokens
	 * @protected
	 */
	tokenize(str) {
		let tokens = this._splitter(str);
		for (let i = 0; i < this._queue.length; i++) {
			let newTokens = [];
			for (let j = 0; j < tokens.length; j++) {
				let token = this._queue[i](tokens[j]);
				if (token) {
					newTokens.push(token);
				}
			}
			tokens = newTokens;
		}
		return tokens;
	}

	/**
	 * Serializes the tokenizer by returning the labels of the used functions.
	 * @returns {{splitter: string?, tokenizers: string[]}} - the serialization
	 * @protected
	 */
	toJSON() {
		let serialized = {tokenizers: []};
		if (this._splitter !== defaultSplitter) {
			serialized.splitter = this._splitter[this._symbol];
		}
		for (let i = 0; i < this._queue.length; i++) {
			serialized.tokenizers.push(this._queue[i][this._symbol]);
		}
		return serialized;
	}

	/**
	 * Deserializes the tokenizer by reassign the correct function to each label.
	 * @param {{splitter: string, tokenizers: string[]}} serialized - the serialized labels
	 * @param {Object.<string, function>|Tokenizer} funcTok - the depending functions with labels
	 * 	or an equivalent tokenizer
	 */
	static fromJSON(serialized, funcTok) {
		let tokenizer = new Tokenizer();

		if (funcTok !== undefined && funcTok instanceof Tokenizer) {
			if (serialized.hasOwnProperty("splitter")) {
				let splitter = funcTok.getSplitter();
				if (serialized.splitter !== splitter[0]) {
					throw Error("Splitter function not found.");
				}
				tokenizer.setSplitter(splitter[0], splitter[1]);
			}

			for (let i = 0; i < serialized.tokenizers.length; i++) {
				if (!funcTok.has(serialized.tokenizers[i])) {
					throw Error("Tokenizer function not found.");
				}
				let labelFunc = funcTok.get(serialized.tokenizers[i]);
				tokenizer.add(labelFunc[0], labelFunc[1]);
			}
		} else {
			if (serialized.hasOwnProperty("splitter")) {
				if (!funcTok.splitters.hasOwnProperty(serialized.splitter)) {
					throw Error("Splitter function not found.");
				}
				tokenizer.setSplitter(serialized.splitter, funcTok.splitters[serialized.splitter]);
			}
			for (let i = 0; i < serialized.tokenizers.length; i++) {
				if (!funcTok.tokenizers.hasOwnProperty(serialized.tokenizers[i])) {
					throw Error("Tokenizer function not found.");
				}
				tokenizer.add(serialized.tokenizers[i], funcTok.tokenizers[serialized.tokenizers[i]]);
			}
		}
		return tokenizer;
	}

	/**
	 * Returns the position of a function inside the queue.
	 * @param {string|function} labelFunc - an existing label or function
	 * @return {number} the position
	 * @private
	 */
	_getPosition(labelFunc) {
		if (Utils.isFunction(labelFunc)) {
			return this._queue.indexOf(labelFunc);
		} else if (Utils.isConvertibleToString(labelFunc)) {
			labelFunc = String(labelFunc);
			for (let i = 0; i < this._queue.length; i++) {
				if (this._queue[i][this._symbol] === labelFunc) {
					return i;
				}
			}
		} else {
			throw TypeError("Type of labelFunc must be string or function.");
		}
		return -1;
	}

	/**
	 * Adds a function with defined label at a specific position to the queue.
	 * @param {string} label - the label
	 * @param {function} func - the function
	 * @param {number} pos - the position
	 * @private
	 */
	_addFunction(label, func, pos) {
		label = Utils.asString(label);
		if (!Utils.isFunction(func)) {
			throw TypeError("Type of func must be function.");
		}
		if (label === "") {
			throw Error("Label cannot be empty.");
		}
		func[this._symbol] = label;
		this._queue.splice(pos, 0, func);
	}
}
