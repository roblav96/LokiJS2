/**
 * Query builder
 */

/**
 * @param {string} field - the field name of the document where the term should be searched
 * @param {string} term - the term to search
 */
export class BaseQuery {
	constructor(type, data = {}) {
		this._data = data;
		this._data.type = type;
	}

	/**
	 * Boosts the query result.
	 * @param {number} value - the positive boost
	 * @return {BaseQuery} object itself for cascading
	 */
	boost(value) {
		if (typeof(value) !== "number" || value < 0) {
			throw TypeError("Boost must be a positive number.");
		}
		this._data.boost = value;
		return this;
	}

	/**
	 * Build the final query.
	 * @return {Object} - the final query
	 */
	build() {
		return this._data;
	}
}
/**
 *
 * Hello world, abc
 *
 * @param {string} field - the field name of the document where the term should be searched
 * @param {string} term - the term to search
 * @extends BaseQuery
 */
export class TermQuery extends BaseQuery {
	constructor(field, term, data = {}) {
		super("term", data);
		this._data.field = field;
		this._data.value = term;
	}
}

/**

 * @param {string} field - the field name of the document where the term should be searched
 * @param {string[]} terms - the terms to search
 * @extends BaseQuery
 */
export class TermsQuery extends BaseQuery {
	constructor(field, terms, data = {}) {
		super("terms", data);
		this._data.field = field;
		if (!Array.isArray(terms)) {
			throw TypeError("Value for terms must be an array.");
		}
		this._data.values = terms;
	}
}

/**
 * Single character wildcard is the ? (question mark).
 * Multiple character wildcard is the * (asterisk).
 *
 * @param {string} field - the field name of the document where the term should be searched
 * @param {string} wildcard - the wildcard to search
 * @extends BaseQuery
 */
export class WildcardQuery extends BaseQuery {
	constructor(field, wildcard, data = {}) {
		super("wildcard", data);
		this._data.field = field;
		this._data.wildcard = wildcard;
	}
}

/**
 * @param {string} field - the field name of the document where the term should be searched
 * @param {string} fuzzy - the fuzzy to search
 * @extends BaseQuery
 */
export class FuzzyQuery extends BaseQuery {
	constructor(field, fuzzy, data = {}) {
		super("fuzzy", data);
		this._data.field = field;
		this._data.value = fuzzy;
	}

	/**
	 * Sets the maximal allowed fuzziness.
	 * @param {number} fuzziness - the fuzziness
	 * @return {FuzzyQuery} - object itself for cascading
	 */
	fuzziness(fuzziness) {
		if (typeof(fuzziness) !== "number" || fuzziness < 0) {
			throw TypeError("Fuzziness must be a positive number.");
		}
		this._data.fuzziness = fuzziness;
		return this;
	}

	/**
	 * Sets the starting word length which should not be considered for fuzzy query.
	 * @param {number} prefixLength - the positive prefix length
	 * @return {FuzzyQuery}  object itself for cascading
	 */
	prefixLength(prefixLength) {
		if (typeof(prefixLength) !== "number" || prefixLength < 0) {
			throw TypeError("Prefix length must be a positive number.");
		}
		this._data.prefix_length = prefixLength;
		return this;
	}
}

/**
 * @param {string} field - the field name of the document where the term should be searched
 * @param {string} prefix - the positive prefix length
 * @extends BaseQuery
 */
export class PrefixQuery extends BaseQuery {
	constructor(field, prefix, data = {}) {
		super("prefix", data);
		this._data.field = field;
		this._data.value = prefix;
	}
}

/**
 * @param {string} field - the field name of the document where the term should be searched
 * @extends BaseQuery
 */
export class ExistsQuery extends BaseQuery {
	constructor(field, data = {}) {
		super("exists", data);
		this._data.field = field;
	}
}

/**
 * @param {string} field - the field name of the document where the term should be searched
 * @param {string} query - the field name of the document where the term should be searched
 * @extends BaseQuery
 */
export class MatchQuery extends BaseQuery {
	constructor(field, query, data = {}) {
		super("match", data);
		this._data.field = field;
		this._data.query = query;
	}

	/**
	 * Sets m
	 * @param {number} minShouldMatch
	 * @return {MatchQuery} object itself for cascading
	 */
	minimumShouldMatch(minShouldMatch) {
		if (typeof(minShouldMatch) !== "number") {
			throw TypeError("Value for minimum should match must be a number.");
		}
		if (this._data.hasOwnProperty("operator") && this._data.operator == "and") {
			throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
		}
		this._data.minimum_should_match = minShouldMatch;
		return this;
	}

	/**
	 *
	 * @param value
	 * @return {MatchQuery} object itself for cascading
	 */
	operator(value) {
		if (typeof(value) !== "string") {
			throw TypeError("Value for operator must be a string.");
		}
		if (value != 'and' && value != 'or') {
			throw SyntaxError("Unknown operator.");
		}
		this._data.operator = value;
		if (this._data.hasOwnProperty("minimum_should_match") && this._data.operator == "and") {
			throw SyntaxError("Match query with \"and\" operator does not support minimum should match.");
		}
		return this;
	}

	/**
	 *
	 * @param fuzziness
	 * @return {MatchQuery} object itself for cascading
	 */
	fuzziness(fuzziness) {
		if (typeof(fuzziness) !== "number" || fuzziness < 0) {
			throw TypeError("Fuzziness must be a positive number.");
		}
		this._data.fuzziness = fuzziness;
		return this;
	}

	/**
	 *
	 * @param prefixLength
	 * @return {InvertedIndex.Queries.MatchQuery} - object itself for cascading
	 */
	prefixLength(prefixLength) {
		if (typeof(prefixLength) !== "number" || prefixLength < 0) {
			throw TypeError("Prefix length must be a positive number.");
		}
		this._data.prefix_length = prefixLength;
		return this;
	}
}

/**
 * A query that matches all documents and giving them a constant score equal to the query boost.
 *
 * Typically used inside a must clause of a {@link BoolQuery} to subsequently reject non matching documents with the not
 * clause.
 *
 * @example
 * new QueryBuilder()
 *   .matchAll().boost(2.5)
 * .build()
 * // Matches all documents and giving them a score of 2.5.
 *
 * @extends BaseQuery
 */
export class MatchAll extends BaseQuery {
	constructor(data = {}) {
		super("match_all", data);
	}
}

/**
 * A query which holds all sub queries like an array.
 * @private
 */
class ArrayQuery extends BaseQuery {
	constructor(callbackName, callback, data = {}) {
		super("array", data);
		this._data.values = [];
		this._callbackName = callbackName;
		this[callbackName] = callback;

		let self = this;
		this._prepare = (queryType, ...args) => {
			let data = {};
			let query = new queryType(...args, data);
			self._data.values.push(data);
			query.bool = self.bool;
			query.constantScore = self.constantScore;
			query.term = self.term;
			query.terms = self.terms;
			query.wildcard = self.wildcard;
			query.fuzzy = self.fuzzy;
			query.match = self.match;
			query.matchAll = self.matchAll;
			query.prefix = self.prefix;
			query.exists = self.exists;
			query._prepare = self._prepare;
			query[self._callbackName] = self[self._callbackName];
			return query;
		};
	}

	bool() {
		return this._prepare(BoolQuery);
	}

	constantScore() {
		return this._prepare(ConstantScoreQuery);
	}

	term(field, term) {
		return this._prepare(TermQuery, field, term);
	}

	terms(field, terms) {
		return this._prepare(TermsQuery, field, terms);
	}

	wildcard(field, wildcard) {
		return this._prepare(WildcardQuery, field, wildcard);
	}

	fuzzy(field, fuzzy) {
		return this._prepare(FuzzyQuery, field, fuzzy);
	}

	match(field, query) {
		return this._prepare(MatchQuery, field, query);
	}

	matchAll() {
		return this._prepare(MatchAll);
	}

	prefix(field, prefix) {
		return this._prepare(PrefixQuery, field, prefix);
	}

	exists(field) {
		return this._prepare(ExistsQuery, field);
	}
}

/**
 * A query that wraps sub queries and returns a constant score equal to the query boost for every document in the filter.
 *
 * @example
 * new QueryBuilder()
 *   .constantScore().boost(1.5)
 *     .startFilter()
 *       .term("first_name", "albert")
 *       .term("surname", "einstein")
 *     .endFilter()
 * .build()
 * // The resulting documents:
 * // * contains albert as first name, einstein as surname and the document score is 42.
 *
 * @extends BaseQuery
 */
export class ConstantScoreQuery extends BaseQuery {
	constructor(data = {}) {
		super("constant_score", data);
	}

	/**
	 * Starts an array of queries. Use endFilter() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startFilter() {
		this._data.filter = {};
		return new ArrayQuery("endFilter", () => {return this;}, this._data.filter);
	}
}

/**
 * A query that matches documents matching boolean combinations of sub queries.
 *
 * This query consists of one or more boolean clauses with different behavior but interrelated to each other.
 *
 * Occur         | Description
 * ------------- | -------------
 * must  | Only documents where all sub queries match will be considered and contribute to the score.
 * filter  | Only documents where all sub queries match will be considered but not contribute to the score.
 * should  | Only documents where some sub queries match will be considered and contribute to the score. The minimum amount of matches can be controlled with [minimumShouldMatch]{@link BoolQuery#minimumShouldMatch}.
 * not  | Documents which match any sub query will be ignored.
 *
 * A sub query can be any other query type and also the bool query itself.
 *
 * @example
 * new QueryBuilder()
 *   .bool()
 *     .startMust()
 *       .term("first_name", "albert")
 *     .endMust()
 *     .startFilter()
 *       .term("birthplace", "ulm")
 *     .endFilter()
 *     .startShould().minimumShouldMatch(2)
 *       .fuzzy("surname", "einstin")
 *       .wildcard("name", "geni?s")
 *       .term("quotes", "infinity")
 *     .endShould()
 *     .startNot()
 *       .terms("research_field", ["biology", "geography"])
 *     .endNot()
 * .build();
 * // The resulting documents:
 * // contains the name albert (must: contribute to the score)
 * // contains the birthplace ulm (filter: not contribute to the score)
 * // contains a minimum of two matches from the fuzzy, wildcard and/or term query (should: contribute to the score)
 * // do not contains biology or geography as research field (not: not contribute to the score)
 *
 * @extends BaseQuery
 */
export class BoolQuery extends BaseQuery {
	constructor(data = {}) {
		super("bool", data);

		let self = this;
		this._callback = () => {
			return self;
		};
	}

	/**
	 * Starts an array of queries for must clause. Use endMust() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startMust() {
		this._data.must = {};
		return new ArrayQuery("endMust", this._callback, this._data.must);
	}

	/**
	 * Starts an array of queries for filter clause. Use endFilter() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startFilter() {
		this._data.filter = {};
		return new ArrayQuery("endFilter", this._callback, this._data.filter);
	}

	/**
	 * Starts an array of queries for should clause. Use endShould() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startShould() {
		this._data.should = {};
		return new ArrayQuery("endShould", this._callback, this._data.should);
	}

	/**
	 * Starts an array of queries for not clause. Use endNot() to finish the array.
	 * @return {ArrayQuery} array query for holding sub queries
	 */
	startNot() {
		this._data.not = {};
		return new ArrayQuery("endNot", this._callback, this._data.not);
	}

	/**
	 * Controls the amount of minimum matching sub queries before a document will be considered.
	 * @param {number} minShouldMatch - number of minimum matching sub queries
	 * @return {BoolQuery} object itself for cascading
	 */
	minimumShouldMatch(minShouldMatch) {
		if (typeof(minShouldMatch) !== "number" || minShouldMatch < 0) {
			throw TypeError("Minimum should match must be a number greater than zero.");
		}
		this._data.minimum_should_match = minShouldMatch;
		return this;
	}
}

/**
 * Builder to help.
 */
export class QueryBuilder {
	constructor() {
		this._data = {query: {}};

		let self = this;
		let callback = () => {
			return self._data;
		};

		this._prepare = (queryType, ...args) => {
			this._child = new queryType(...args, this._data.query);
			this._child.build = callback;
			return this._child;
		};
	}

	enableFinalScoring(enabled) {
		if (typeof(enabled) !== "boolean") {
			throw TypeError("Enable scoring must a boolean.");
		}
		this._data.final_scoring = enabled;
		return this;
	}

	useBM25(k1, b) {
		if (typeof(k1) !== "number" || k1 < 0) {
			throw TypeError("BM25s k1 must be a positive number.");
		}
		if (typeof(b) !== "number" || b < 0 || b > 1) {
			throw TypeError("BM25s b must be a number between 0 and 1 inclusive.");
		}

		this._data.scoring = {
			type: "BM25",
			k1: k1,
			b: b
		};
		return this;
	}

	bool() {
		return this._prepare(BoolQuery);
	}

	constantScore() {
		return this._prepare(ConstantScoreQuery);
	}

	term(field, term) {
		return this._prepare(TermQuery, field, term);
	}

	terms(field, terms) {
		return this._prepare(TermsQuery, field, terms);
	}

	wildcard(field, wildcard) {
		return this._prepare(WildcardQuery, field, wildcard);
	}

	fuzzy(field, fuzzy) {
		return this._prepare(FuzzyQuery, field, fuzzy);
	}

	match(field, query) {
		return this._prepare(MatchQuery, field, query);
	}

	matchAll() {
		return this._prepare(MatchAll);
	}

	prefix(field, prefix) {
		return this._prepare(PrefixQuery, field, prefix);
	}

	exists(field) {
		return this._prepare(ExistsQuery, field);
	}
}
