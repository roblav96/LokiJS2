import {InvertedIndex} from './inverted_index';
import {IndexSearcher} from './index_searcher';
import {Tokenizer} from './tokenizer';

export class FullTextSearch {
  /**
   * Initialize the full text search for the given fields.
   * @param {object[]} fields - the field options
   * @param {string} fields.name - the name of the field
   * @param {boolean=true} fields.store - flag to indicate if the full text search should be stored on serialization or
   *  rebuild on deserialization
   * @param {Tokenizer=Tokenizer} fields.tokenizer - the tokenizer of the field
   * @param {string=$loki} id - the field name of the document index
   */
  constructor(fields, {id = "$loki"} = {}) {
    if (fields === undefined) {
      throw new SyntaxError('Fields needs to be defined!');
    }

    this._invIdxs = {};
    // Get field names and tokenizers.
    if (Array.isArray(fields)) {
      for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        let name = field.name;

        let store = field.store !== undefined ? field.store : true;

        let tokenizer = null;
        if (field.tokenizer !== undefined) {
          tokenizer = field.tokenizer;
        } else {
          tokenizer = new Tokenizer();
        }
        this._invIdxs[name] = new InvertedIndex(store, tokenizer);
      }
    } else {
      throw new TypeError('fields needs to be an array with field name and a tokenizer (optional).');
    }
    this._id = id;
    this._docs = new Set();
    this._idxSearcher = new IndexSearcher(this._invIdxs, this._docs);
  }

  addDocument(doc) {
    if (doc[this._id] === undefined) {
      throw new Error('Document is not stored in the collection.');
    }

    let fieldNames = Object.keys(doc);
    for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
      if (this._invIdxs[fieldName] !== undefined) {
        this._invIdxs[fieldName].insert(doc[fieldName], doc[this._id]);
      }
    }

    this._docs.add(doc[this._id]);
    this.setDirty();
  }

  removeDocument(doc) {
    if (doc[this._id] === undefined) {
      throw new Error('Document is not stored in the collection.');
    }

    let fieldNames = Object.keys(this._invIdxs);
    for (let i = 0; i < fieldNames.length; i++) {
      this._invIdxs[fieldNames[i]].remove(doc[this._id]);
    }

    this._docs.delete(doc[this._id]);
    this.setDirty();
  }

  updateDocument(doc) {
    this.removeDocument(doc);
    this.addDocument(doc);
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

  static fromJSONObject(serialized, tokenizers) {
    let fts = new FuzzySearch();
    let db = JSON.parse(serialized);
    let fieldNames = Object.keys(db);
    for (let i = 0, fieldName; i < fieldNames.length, fieldName = fieldNames[i]; i++) {
      fts._invIdxs[fieldName] = new InvertedIndex();
      fts._invIdxs[fieldName].loadJSON(db[fieldName], tokenizers[fieldName]);
    }
    return fts;
  }

  setDirty() {
    this._idxSearcher.setDirty();
  }
}
