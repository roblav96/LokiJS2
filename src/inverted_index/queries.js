class BoostQuery {
	constructor(type, data = {}) {
		this._data = data;
		this._data.type = type;
	}

	boost(value) {
		if (typeof(value) !== "number" || value < 0) {
			throw TypeError("Boost must be a positive number.");
		}
		this._data.boost = value;
		return this;
	}

	build() {
		return this._data;
	}
}

class TermQuery extends BoostQuery {
	/**
	 * Constructs a term query.
	 * @param {string} field - the field name where the term should be searched
	 * @param {string} term - the term
	 */
	constructor(field, term, data = {}) {
		super("term", data);
		this._data.field = field;
		this._data.value = term;
	}
}

class TermsQuery extends BoostQuery {
	/**
	 * Constructs a term query.
	 * @param {string} field - the field name where the term should be searched
	 * @param {string} term - the term
	 */
	constructor(field, terms, data = {}) {
		super("terms", data);
		this._data.field = field;
		if (!Array.isArray(terms)) {
			throw TypeError("Value for terms must be an array.");
		}
		this._data.values = terms;
	}
}


class WildcardQuery extends BoostQuery {
	constructor(field, wildcard, data = {}) {
		super("wildcard", data);
		this._data.field = field;
		this._data.wildcard = wildcard;
	}
}

class FuzzyQuery extends BoostQuery {
	constructor(field, fuzzy, data = {}) {
		super("fuzzy", data);
		this._data.field = field;
		this._data.value = fuzzy;
	}

	fuzziness(fuzziness) {
		if (typeof(fuzziness) !== "number" || fuzziness < 0) {
			throw TypeError("Fuzziness must be a positive number.");
		}
		this._data.fuzziness = fuzziness;
		return this;
	}

	prefixLength(prefixLength) {
		if (typeof(prefixLength) !== "number" || prefixLength < 0) {
			throw TypeError("Prefix length must be a positive number.");
		}
		this._data.prefix_length = prefixLength;
		return this;
	}
}

class PrefixQuery extends BoostQuery {
	constructor(field, prefix, data = {}) {
		super("prefix", data);
		this._data.field = field;
		this._data.value = prefix;
	}
}

class ExistsQuery extends BoostQuery {
	constructor(field, data = {}) {
		super("exists", data);
		this._data.field = field;
	}
}

class MatchQuery extends BoostQuery {
	constructor(field, query, data = {}) {
		super("match", data);
		this._data.field = field;
		this._data.query = query;
	}

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

	fuzziness(fuzziness) {
		if (typeof(fuzziness) !== "number" || fuzziness < 0) {
			throw TypeError("Fuzziness must be a positive number.");
		}
		this._data.fuzziness = fuzziness;
		return this;
	}

	prefixLength(prefixLength) {
		if (typeof(prefixLength) !== "number" || prefixLength < 0) {
			throw TypeError("Prefix length must be a positive number.");
		}
		this._data.prefix_length = prefixLength;
		return this;
	}
}

class MatchAll extends BoostQuery {
	constructor(data = {}) {
		super("match_all", data);
	}
}

class ArrayQuery extends BoostQuery {
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

class ConstantScoreQuery extends BoostQuery {
	constructor(data = {}) {
		super("constant_score", data);

		let self = this;
		this._callback = () => {
			return self;
		};
	}

	startFilter() {
		this._data.filter = {};
		return new ArrayQuery("endFilter", this._callback, this._data.filter);
	}
}

class BoolQuery extends BoostQuery {
	constructor(data = {}) {
		super("bool", data);

		let self = this;
		this._callback = () => {
			return self;
		};
	}

	startMust() {
		this._data.must = {};
		return new ArrayQuery("endMust", this._callback, this._data.must);
	}

	startFilter() {
		this._data.filter = {};
		return new ArrayQuery("endFilter", this._callback, this._data.filter);
	}

	startShould() {
		this._data.should = {};
		return new ArrayQuery("endShould", this._callback, this._data.should);
	}

	startNot() {
		this._data.not = {};
		return new ArrayQuery("endNot", this._callback, this._data.not);
	}

	minimumShouldMatch(minShouldMatch) {
		if (typeof(minShouldMatch) !== "number" || minShouldMatch < 0) {
			throw TypeError("Minimum should match must be a number greater than zero.");
		}
		this._data.minimum_should_match = minShouldMatch;
		return this;
	}
}

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
