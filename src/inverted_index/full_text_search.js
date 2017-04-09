import {InvertedIndex} from './inverted_index';
import {IndexSearcher} from './index_searcher';
import {Tokenizer} from './tokenizer';
import * as Utils from './utils.js';
import {Plugin} from '../core/plugin'

export class FullTextSearch {
	/**
	 *
	 * @param options
	 */
	constructor(fields) {
		if (fields === undefined) {
			throw new SyntaxError('Fields needs to be defined!');
		}

		this._invIdxs = {};
		// Get field names and tokenizers.
		if (Array.isArray(fields)) {
			for (let i = 0; i < fields.length; i++) {
				let field = fields[i];
				let name = Utils.asString(field.name, TypeError('Field name needs to be a string.'));
				let tokenizer = field.tokenizer;
				if (tokenizer !== undefined) {
					if (!(tokenizer instanceof Tokenizer)) {
						throw new TypeError("Field tokenizer needs to be a instance of tokenizer.");
					}
				} else {
					tokenizer = new Tokenizer();
				}
				this._invIdxs[field.name] = new InvertedIndex(name, tokenizer);
			}
		} else {
			throw new TypeError('fields needs to be an array with field name and a tokenizer (optional).');
		}

		this._docs = new Set();
		this._idxSearcher = new IndexSearcher(this._invIdxs, this._docs);
	}

	addDocument(doc, boosts = {}) {
		if (!doc.hasOwnProperty('$loki')) {
			throw new Error('Document is not stored in the collection.');
		}

		let fieldNames = Object.keys(doc);
		for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
			if (this._invIdxs.hasOwnProperty(fieldName)) {
				let boost = boosts.hasOwnProperty(fieldName) ? boosts[fieldName] : 1;
				this._invIdxs[fieldName].insert(doc[fieldName], doc.$loki, boost);
			}
		}

		this._docs.add(doc.$loki);
		this.setDirty();
	}

	removeDocument(doc) {
		if (!doc.hasOwnProperty('$loki')) {
			throw new Error('Document is not stored in the collection.');
		}

		let fieldNames = Object.keys(this._invIdxs);
		for (let i = 0; i < fieldNames.length; i++) {
			this._invIdxs[fieldNames[i]].remove(doc.$loki);
		}

		this._docs.delete(doc.$loki);
		this.setDirty();
	}

	updateDocument(doc, boosts = {}) {
		this.removeDocument(doc);
		this.addDocument(doc, boosts);
	}

	search(query) {
		return this._idxSearcher.search(query);
	}

	toJSON() {
		let serialized = {};
		let fieldNames = Object.keys(this._invIdxs);
		for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
			serialized[fieldName] = this._invIdxs[fieldName].toJSON();
		}
		return serialized;
	}

	loadJSON(serialized) {
		let db = JSON.parse(serialized);
		let fieldNames = Object.keys(db);
		for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
			this._invIdxs[fieldName] = new InvertedIndex({});
			this._invIdxs[fieldName].loadJSON(db[fieldName]);
		}
	}

	setDirty() {
		this._idxSearcher.setDirty();
	}
}

Plugin.FullTextSearch = FullTextSearch;
