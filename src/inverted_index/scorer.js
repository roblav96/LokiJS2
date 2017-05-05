export class Scorer {
	constructor(invIdxs) {
		this._invIdxs = invIdxs;
		this._cache = {};
	}

	setDirty() {
		this._cache = {};
	}

	prepare(fieldName, boost, termIdx, doScoring, docResults = {}, term = null) {
		if (termIdx === null || !termIdx.hasOwnProperty('docs')) {
			return null;
		}

		let idf = this._idf(fieldName, termIdx.df);
		let docIds = Object.keys(termIdx.docs);
		for (let j = 0; j < docIds.length; j++) {
			let docId = docIds[j];
			if (!docResults.hasOwnProperty(docId)) {
				docResults[docId] = [];
			}

			if (doScoring) {
				let tf = termIdx.docs[docId];
				docResults[docId].push({
					type: 'BM25',
					tf: tf,
					idf: idf,
					boost: boost,
					fieldName: fieldName,
					term: term
				});
			} else {
				docResults[docId] = [{
					type: "constant", value: 1, boost: boost, fieldName: fieldName
				}]
			}
		}

		return docResults;
	}

	scoreConstant(boost, docId, docResults = {}) {
		if (!docResults.hasOwnProperty(docId)) {
			docResults[docId] = [];
		}
		docResults[docId].push({type: "constant", value: 1, boost: boost});
		return docResults;
	}

	finalScore(query, docResults = {}) {

		let result = {};
		let k1 = query.scoring.k1;
		let b = query.scoring.b;

		let docs = Object.keys(docResults);
		for (let i = 0, docId; i < docs.length, docId = docs[i]; i++) {
			let docScore = 0;
			for (let j = 0; j < docResults[docId].length; j++) {
				let docResult = docResults[docId][j];

				let res = 0;
				switch (docResult.type) {
					case 'BM25': {
						let fieldLength = this._calculateFieldLength(this._invIdxs[docResult.fieldName].documentStore[docId]);
						let avgFieldLength = this._avgFieldLength(docResult.fieldName);
						let tfNorm = ((k1 + 1) * docResult.tf) / (k1 * ((1 - b)
							+ b * (fieldLength / avgFieldLength)) + docResult.tf);
						res = docResult.idf * tfNorm * docResult.boost;
						// console.log(
						// 	docId + ":" + docResult.fieldName + ":" + docResult.term + " = " + res,
						// 	"\n\ttype: BM25",
						// 	"\n\tboost: " + docResult.boost,
						// 	"\n\tidf : " + docResult.idf,
						// 	"\n\ttfNorm : " + tfNorm,
						// 	"\n\ttf : " + docResult.tf,
						// 	"\n\tavg : " + avgFieldLength,
						// 	"\n\tfl : " + fieldLength);
						break;
					}
					case 'constant':
						res = docResult.value * docResult.boost;
						/*console.log(
						 "Constant: " + res,
						 "\n\tboost: " + docResult.boost,
						 "\n\tvalue : " + docResult.value);*/
						break;
				}
				docScore += res;
			}
			//console.log(docId, " === ", docScore);
			result[docId] = docScore;
		}
		return result;
	}

	_calculateFieldLength(docInfo) {
		return docInfo.fieldLength / Math.pow(docInfo.boost, 2);
	}

	_getCache(fieldName) {
		if (!this._cache.hasOwnProperty(fieldName)) {
			let avgFieldLength = this._invIdxs[fieldName].totalFieldLength / this._invIdxs[fieldName].documentCount;
			this._cache[fieldName] = {idfs: {}, avgFieldLength: avgFieldLength};
		}
		return this._cache[fieldName];
	}

	/**
	 * Returns the idf by either calculate it or use a cached one.
	 * @param {string} fieldName - the name of the field
	 * @param {number} docFreq - the doc frequency of the term
	 * @returns {number} the idf
	 * @private
	 */
	_idf(fieldName, docFreq) {
		let cache = this._getCache(fieldName);
		if (cache.idfs.hasOwnProperty(String(docFreq))) {
			return cache.idfs[docFreq];
		}
		return cache.idfs[docFreq] = Math.log(1 + (this._invIdxs[fieldName].documentCount - docFreq + 0.5) / (docFreq + 0.5));
	}

	_avgFieldLength(fieldName) {
		return this._getCache(fieldName).avgFieldLength;
	}
}
