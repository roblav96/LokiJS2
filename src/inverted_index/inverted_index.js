import {Tokenizer} from './tokenizer';

/**
 * Inverted index class handles featured text search for specific document fields.
 * @constructor InvertedIndex
 * @param {object} options - a configuration object
 * @param {string|string[]} options.fields - string or array of field names to define featured text search for
 * @param {boolean} [options.store=true] - inverted index will be stored at serialization rather than rebuilt on load.
 */
export class InvertedIndex {
	constructor(fieldName) {
		this._fieldName = fieldName;
		this._docCount = 0;
		this._docStore = {};
		this._totalFieldLength = 0;
		this._tokenizer = new Tokenizer();
		this._root = {};
	}

	/**
	 * Adds defined fields of a document to the inverted index.
	 * @param {object} doc - the document to add
	 * @param {number} [boost=1] - object with field (key) specific boost (value)
	 */
	insert(doc, docId, boost = 1) {
		if (this._docStore.hasOwnProperty(docId)) {
			throw new Error('Document already added.');
		}

		this._docCount += 1;
		this._docStore[docId] = {};

		// Tokenize document field.
		let fieldTokens = this._tokenizer.tokenize(doc);
		this._totalFieldLength += fieldTokens.length;

		let termRefs = [];
		this._docStore[docId] = {fieldLength: fieldTokens.length, boost: boost};
		Object.defineProperties(this._docStore[docId], {
			termRefs: {enumerable: false, configurable: true, writable: true, value: termRefs}
		});

		// Iterate over all unique field terms.
		for (let term of new Set(fieldTokens)) {
			if (term == '') {
				throw Error('Term cannot be empty!');
			}
			// Calculate term frequency.
			let tf = 0;
			for (let j = 0; j < fieldTokens.length; j++) {
				if (fieldTokens[j] == term) {
					tf++;
				}
			}

			// Add term to index tree.
			let branch = this._root;
			for (let i = 0; i < term.length; i++) {
				let c = term[i];
				if (!branch.hasOwnProperty(c)) {
					let child = {};
					Object.defineProperties(child, {
						parent: {enumerable: false, configurable: true, writable: true, value: branch}
					});
					branch[c] = child;
				}
				branch = branch[c];
			}
			// Add term info to index leaf.
			if (!branch.hasOwnProperty('docs')) {
				branch.docs = {};
				branch.df = 0;
			}
			branch.docs[docId] = tf;
			branch.df += 1;

			// Store index leaf for deletion.
			termRefs.push(branch);
		}
	}

	/**
	 * Removes all relevant terms of a document from the inverted index.
	 * @param {number} docId - the document.
	 */
	remove(docId) {
		if (!this._docStore.hasOwnProperty(String(docId))) {
			return;
		}
		let docStore = this._docStore[docId];
		// Remove document.
		delete this._docStore[docId];
		this._docCount -= 1;

		// Reduce total field length.
		this._totalFieldLength -= docStore.fieldLength;

		// Iterate over all term references.
		// Remove docId from docs and decrement document frequency.
		let termRefs = docStore.termRefs;
		for (let j = 0; j < termRefs.length; j++) {
			let index = termRefs[j];
			index.df -= 1;
			delete index.docs[docId];

			// Delete term branch if not used anymore.
			if (index.df === 0) {
				do {
					// Go tree upwards.
					let parent = index.parent;
					// Delete parent reference for preventing memory leak (cycle reference)
					delete index.parent;

					// Iterate over all children.
					var keys = Object.keys(parent);
					for (let k = 0; k < keys.length; k++) {
						let key = keys[k];
						if (key === 'df' || key === 'docs') {
							continue;
						}
						// Remove previous child form parent.
						if (parent[key] === index) {
							delete parent[key];
							break;
						}
					}
					index = parent;
				} while (index.hasOwnProperty('parent') && keys.length === 1);
			}
		}
	}

	getDocumentCount() {
		return this._docCount;
	}

	getDocumentStore() {
		return this._docStore;
	}

	getTotalFieldLength() {
		return this._totalFieldLength;
	}

	getFieldName() {
		return this._fieldName;
	}

	getTokenizer() {
		return this._tokenizer;
	}

	/**
	 * Gets the term index of a term.
	 * @param {string} term - the term.
	 * @param {object} root - the term index to start from
	 * @param {number} start - the position of the term string to start from
	 * @return {object} - The term index or null if the term is not in the term tree.
	 */
	static getTermIndex(term, root, start = 0) {
		if (start >= term.length) {
			return null;
		}
		for (let i = start; i < term.length; i++) {
			if (!root.hasOwnProperty(term[i])) {
				return null;
			}
			root = root[term[i]];
		}
		return root;
	}

	/**
	 * Extends a term index for the one branch.
	 * @param {object} root - the term index to start from
	 * @return {Array} - array with term indices and extension
	 */
	static getNextTermIndex(root) {
		let termIndices = [];
		let keys = Object.keys(root);
		for (let i = 0; i < keys.length; i++) {
			if (keys[i] !== 'docs' && keys[i] !== 'df') {
				termIndices.push({index: root[keys[i]], term: keys[i]});
			}
		}
		return termIndices;
	}

	/**
	 * Extends a term index to all available term leafs.
	 * @param {object} root - the term index to start from
	 * @returns {Array} - Array with term indices and extension
	 */
	static extendTermIndex(root) {
		let termIndices = [];
		let stack = [root];
		let treeStack = [''];
		do {
			let root = stack.pop();
			let treeTermn = treeStack.pop();

			if (root.hasOwnProperty('df')) {
				termIndices.push({index: root, term: treeTermn});
			}

			let keys = Object.keys(root);
			for (let i = 0; i < keys.length; i++) {
				if (keys[i] !== 'docs' && keys[i] !== 'df') {
					stack.push(root[keys[i]]);
					treeStack.push(treeTermn + keys[i]);
				}
			}
		} while (stack.length !== 0);

		return termIndices;
	}

	/**
	 * Serialize the inverted index.
	 * @returns {{docStore: *, _fields: *, index: *}}
	 */
	toJSON() {
		return this;
	}

	/**
	 * Deserialize the inverted index.
	 * @param {string} serialized - The serialized inverted index.
	 */
	loadJSON(serialized) {
		let dbObject = serialized;

		this._fieldName = dbObject._fieldName;
		this._docCount = dbObject._docCount;
		this._docStore = dbObject._docStore;
		this._totalFieldLength = dbObject._totalFieldLength;
		this._tokenizer = dbObject._tokenizer;
		this._root = dbObject._root;

		let self = this;

		function regenerate(index, parent) {
			// Set parent.
			if (parent !== null) {
				Object.defineProperties(index, {
					parent: {enumerable: false, configurable: true, writable: false, value: parent}
				});
			}

			// Iterate over all keys.
			let keys = Object.keys(index);
			for (let i = 0; i < keys.length; i++) {
				// Found term, save in document store.
				if (keys[i] == 'docs') {
					// Get documents of term.
					let docIds = Object.keys(index.docs);
					for (let j = 0; j < docIds.length; j++) {
						// Get document store at specific document/field.
						let ref = self._docStore[docIds[j]];
						if (!ref.hasOwnProperty('termRefs')) {
							Object.defineProperties(ref, {
								termRefs: {enumerable: false, configurable: true, writable: true, value: []}
							});
						}
						// Set reference to term index.
						ref.termRefs.push(index);
					}
				} else if (keys[i] != 'df') {
					// Iterate over subtree.
					regenerate(index[keys[i]], index);
				}
			}
		}

		regenerate(this._root, null);
	}
}
