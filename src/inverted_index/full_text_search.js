import {InvertedIndex} from './inverted_index';
import {IndexSearcher} from './index_searcher';
import * as Utils from './utils.js';

export class FullTextSearch {
	constructor(options) {
		if (options === undefined) {
			throw new SyntaxError('Options needs to be defined!');
		}

		this._invIdxs = {};
		// Get field names.
		if (Utils.isString(options.fields)) {
			this._invIdxs[options.fields] = new InvertedIndex(options.fields);
		} else if (Array.isArray(options.fields)) {
			for (let i = 0; i < options.fields.length; i++) {
				this._invIdxs[options.fields[i]] = new InvertedIndex(Utils.asString(options.fields[i],
					TypeError('Fields needs to be a string or an array of strings')));
			}
		} else {
			throw new TypeError('Fields needs to be a string or an array of strings');
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
