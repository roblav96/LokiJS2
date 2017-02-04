import {Scorer} from './scorer';
import {InvertedIndex} from './inverted_index';
import {QueryBuilder} from './queries';

export class IndexSearcher {
	/**
	 *
	 * @param {object} invIdxs
	 */
	constructor(invIdxs, docs) {
		this._invIdxs = invIdxs;
		this._docs = docs;
		this._scorer = new Scorer(this._invIdxs);
	}

	search(query) {
		let docResults = this._recursive(query.query, true);

		// Final scoring.
		let finalScoring = query.hasOwnProperty("final_scoring") ? query.final_scoring : true;
		if (finalScoring) {
			return this._scorer.finalScore(query, docResults);
		}
		return docResults;
	}

	setDirty() {
		this._scorer.setDirty();
	}

	_recursive(query, doScoring) {
		let docResults = {};
		let boost = query.hasOwnProperty('boost') ? query.boost : 1;
		let fieldName = query.hasOwnProperty("field") ? query.field : null;

		let root = null;
		let tokenizer = null;
		if (this._invIdxs.hasOwnProperty(fieldName)) {
			root = this._invIdxs[fieldName].root;
			tokenizer = this._invIdxs[fieldName].tokenizer;
		}

		switch (query.type) {
			case "bool": {
				docResults = null;
				if (query.hasOwnProperty("must")) {
					docResults = this._getUnique(query.must.values, doScoring, docResults);
				}
				if (query.hasOwnProperty("filter")) {
					docResults = this._getUnique(query.filter.values, false, docResults);
				}

				if (query.hasOwnProperty("should")) {
					let shouldDocs = this._getAll(query.should.values, doScoring);

					let empty = false;
					if (docResults === null) {
						docResults = {};
						empty = true;
					}

					let msm = query.hasOwnProperty("minimum_should_match") ? query.minimum_should_match : 1;
					// Remove all docs with fewer matches.
					// TODO: Enable percent, negative values and ranges.
					let docs = Object.keys(shouldDocs);
					for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
						if (shouldDocs[docId].length >= msm) {
							if (docResults.hasOwnProperty(docId)) {
								docResults[docId].push(...shouldDocs[docId]);
							} else if (empty) {
								docResults[docId] = shouldDocs[docId];
							} else {
								delete docResults[docId];
							}
						}
					}
				}
				if (query.hasOwnProperty("not")) {
					let notDocs = this._getAll(query.not.values, false);
					// Remove all docs.
					let docs = Object.keys(notDocs);
					for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
						if (docResults.hasOwnProperty(docId)) {
							delete docResults[docId];
						}
					}
				}
				break;
			}
			case "term": {
				let termIdx = InvertedIndex.getTermIndex(query.value, root);
				this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, query.value);
				break;
			}
			case "terms": {
				for (let i = 0; i < query.values.length; i++) {
					let termIdx = InvertedIndex.getTermIndex(query.values[i], root);
					this._scorer.prepare(fieldName, boost, termIdx, doScoring, docResults, query.values[i]);
				}
				break;
			}
			case "fuzzy": {
				let f = new FuzzySearch(query);
				let b = f.search(root);
				for (let i = 0; i < b.length; i++) {
					this._scorer.prepare(fieldName, boost * b[i].boost, b[i].index, doScoring, docResults, b[i].term);
				}
				break;
			}
			case "wildcard": {
				let w = new WildcardSearch(query);
				let a = w.search(root);
				for (let i = 0; i < a.length; i++) {
					this._scorer.prepare(fieldName, boost, a[i].index, doScoring, docResults, a[i].term);
				}
				break;
			}
			case "match_all": {
				for (let docId of this._docs) {
					this._scorer.scoreConstant(boost, docId, docResults);
				}
				break;
			}
			case "constant_score": {
				docResults = this._getAll(query.filter.values, false);
				let docs = Object.keys(docResults);
				// Add to each document a constant score.
				for (let i = 0; i < docs.length; i++) {
					this._scorer.scoreConstant(boost, docs[i], docResults);
				}
				break;
			}
			case "prefix": {
				let termIdx = InvertedIndex.getTermIndex(query.value, root);
				if (termIdx != null) {
					termIdx = InvertedIndex.extendTermIndex(termIdx);
				}
				for (let i = 0; i < termIdx.length; i++) {
					this._scorer.prepare(fieldName, boost, termIdx[i].index, doScoring, docResults, query.value + termIdx[i].term);
				}
				break;
			}
			case "exists": {
				if (root != null) {
					let docs = Object.keys(this._invIdxs[fieldName].documentStore);
					for (let i = 0; i < docs.length; i++) {
						this._scorer.scoreConstant(boost, docs[i], docResults);
					}
				}
				break;
			}
			case "match": {
				let terms = tokenizer.tokenize(query.query);
				let operator = query.hasOwnProperty("operator") ? query.operator : "or";

				let tmpQuery = new QueryBuilder().bool();
				if (operator === "or") {
					if (query.hasOwnProperty("minimum_should_match")) {
						tmpQuery = tmpQuery.minimumShouldMatch(query.minimum_should_match);
					}
					// Build a should query.
					tmpQuery = tmpQuery.startShould();
				} else {
					// Build a must query.
					tmpQuery = tmpQuery.startMust();
				}
				tmpQuery = tmpQuery.boost(boost);

				if (query.hasOwnProperty("fuzziness")) {
					let prefixLength = query.hasOwnProperty("prefix_length") ? query.prefix_length : 2;
					// Add each fuzzy.
					for (let i = 0; i < terms.length; i++) {
						tmpQuery = tmpQuery.fuzzy(fieldName, terms[i]).fuzziness(query.fuzziness).prefixLength(prefixLength);
					}
				} else {
					// Add each term.
					for (let i = 0; i < terms.length; i++) {
						tmpQuery = tmpQuery.term(fieldName, terms[i]);
					}
				}
				if (operator === "or") {
					tmpQuery = tmpQuery.endShould();
				} else {
					tmpQuery = tmpQuery.endMust();
				}

				docResults = this._recursive(tmpQuery.build(), doScoring);
				break;
			}
			default:
				break;
		}
		return docResults;
	}

	_getUnique(values, doScoring, docResults) {
		if (values.length === 0) {
			return docResults;
		}

		for (let i = 0; i < values.length; i++) {
			let currDocs = this._recursive(values[i], doScoring);
			if (docResults === null) {
				docResults = this._recursive(values[0], doScoring);
				continue;
			}

			let docs = Object.keys(docResults);
			for (let j = 0, docId; j < docs.length, docId = docs[j]; j++) {
				if (!currDocs.hasOwnProperty(docId)) {
					delete docResults[docId];
				} else {
					docResults[docId].push(...currDocs[docId]);
				}
			}
		}
		return docResults;
	}

	_getAll(values, doScoring) {
		let docResults = {};
		for (let i = 0; i < values.length; i++) {
			let currDocs = this._recursive(values[i], doScoring);
			let docs = Object.keys(currDocs);
			for (let j = 0, docId; j < docs.length, docId = docs[j]; j++) {
				if (!docResults.hasOwnProperty(docId)) {
					docResults[docId] = currDocs[docId];
				} else {
					docResults[docId].push(...currDocs[docId]);
				}
			}
		}
		return docResults;
	}
}


class FuzzySearch {
	constructor(query) {
		this._fuzzy = query.value;
		this._fuzziness = query.hasOwnProperty('fuzziness') ? query.fuzziness : 2;
		this._prefixLength = query.hasOwnProperty('prefix_length') ? query.prefix_length : 2;
	}

	/**
	 * Copyright Kigiri: https://github.com/kigiri
	 *                     Milot Mirdita: https://github.com/milot-mirdita
	 *                     Toni Neubert:  https://github.com/Viatorus/
	 */
	levenshtein_distance(a, b) {
		if (a.length === 0) return b.length;
		if (b.length === 0) return a.length;
		let tmp, i, j, prev, val;
		// swap to save some memory O(min(a,b)) instead of O(a)
		if (a.length > b.length) {
			tmp = a;
			a = b;
			b = tmp;
		}

		var row = Array(a.length + 1);
		// init the row
		for (i = 0; i <= a.length; i++) {
			row[i] = i;
		}

		// fill in the rest
		for (i = 1; i <= b.length; i++) {
			prev = i;
			for (j = 1; j <= a.length; j++) {
				if (b[i - 1] === a[j - 1]) {	// match
					val = row[j - 1];
				} else {
					val = Math.min(row[j - 1] + 1, // substitution
						Math.min(prev + 1,         // insertion
							row[j] + 1));          // deletion

					// transposition.
					if (i > 1 && j > 1 && b[i - 2] === a[j - 1] && a[j - 2] === b[i - 1]) {
						val = Math.min(val, row[j - 1] - (a[j - 1] === b[i - 1] ? 1 : 0));
					}
				}
				row[j - 1] = prev;
				prev = val;
			}
			row[a.length] = prev;
		}
		return row[a.length];
	}

	/**
	 * Performs a fuzzy search for a given term.
	 * @param {string} query - a fuzzy term to match.
	 * @param {number} [maxDistance=2] - maximal edit distance between terms
	 * @returns {Array} - array with all matching term indices.
	 */
	search(root) {
		// Todo: Include levenshtein to reduce similar iterations.
		// Tree tokens at same depth share same row until depth (should works if recursive).
		// Pregenerate tree token ?
		//var treeToken = Array(token.length + maxDistance);

		let start = root;
		let pre = this._fuzzy.slice(0, this._prefixLength);
		let fuzzy = this._fuzzy;
		if (this._prefixLength != 0) {
			start = InvertedIndex.getTermIndex(pre, start);
			fuzzy = fuzzy.slice(this._prefixLength);
		}
		if (start === null) {
			return [];
		}

		let similarTokens = [];

		let stack = [start];
		let treeStack = [''];
		do {
			let root = stack.pop();
			let treeTerms = treeStack.pop();

			// Compare tokens if they are in near distance.
			if (root.hasOwnProperty('df') && Math.abs(fuzzy.length - treeTerms.length) <= this._fuzziness) {
				var distance = this.levenshtein_distance(fuzzy, treeTerms);
				if (distance <= this._fuzziness) {
					// Calculate boost.
					let boost = 1 - distance / (pre.length + treeTerms.length);
					similarTokens.push({term: pre + treeTerms, index: root, boost: boost});
				}
			}

			// Iterate over all subtrees.
			// If token from tree is not longer than maximal distance.
			if (treeTerms.length - fuzzy.length <= this._fuzziness) {
				// Iterate over all subtrees.
				let keys = Object.keys(root);
				for (let i = 0; i < keys.length; i++) {
					if (keys[i] !== 'docs' && keys[i] !== 'df') {
						stack.push(root[keys[i]]);
						treeStack.push(treeTerms + keys[i]);
					}
				}
			}
		} while (stack.length !== 0);

		return similarTokens;
	}
}

class WildcardSearch {

	constructor(query) {
		this._wildcard = query.wildcard;
		this._result = [];
	}

	/**
	 * Performs a wild card search for a given query term.
	 * @param {string} query - a wild card query to match.
	 * @returns {Array} - array with all matching term indices.
	 */
	search(root) {
		// Todo: Need an implementation for star operator.
		this._result = [];
		this._recursive(root);
		return this._result;
	}

	/**
	 *
	 * @param root
	 * @param idx
	 * @param term
	 * @param escaped
	 * @private
	 */
	_recursive(root, idx = 0, term = '', escaped = false) {
		if (root === null) {
			return;
		}

		if (idx === this._wildcard.length) {
			if (root.hasOwnProperty('df')) {
				this._result.push({index: root, term: term});
			}
			return;
		}

		if (!escaped && this._wildcard[idx] === '\\') {
			this._recursive(root, idx + 1, term, true);
		} else if (!escaped && this._wildcard[idx] === '?') {
			let others = InvertedIndex.getNextTermIndex(root);
			for (let i = 0; i < others.length; i++) {
				this._recursive(others[i].index, idx + 1, term + others[i].term);
			}
		} else {
			this._recursive(InvertedIndex.getTermIndex(this._wildcard[idx], root), idx + 1, term + this._wildcard[idx]);
		}
	}
}