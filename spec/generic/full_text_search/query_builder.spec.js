/* global describe, it, expect */
import * as Query from '../../../src/inverted_index/queries';

describe('tokenizer', function () {

	it('BaseQuery', function (done) {
		let q = new Query.BaseQuery("custom").boost(1.5).build();
		expect(q).toEqual({type: "custom", boost: 1.5});

		expect(() => new Query.BaseQuery(undefined)).toThrowErrorOfType("TypeError");
		expect(() => new Query.BaseQuery("custom").boost("1")).toThrowErrorOfType("TypeError");
		expect(() => new Query.BaseQuery("custom").boost(-1)).toThrowErrorOfType("TypeError");

		done();
	});

	it('TermQuery', function (done) {
		let q = new Query.TermQuery("user", "albert").boost(2.5).build();
		expect(q).toEqual({type: "term", field: "user", value: "albert", boost: 2.5});

		q = new Query.TermQuery(1, 1).build();
		expect(q).toEqual({type: "term", field: "1", value: "1"});
		expect(() => new Query.TermQuery("user", undefined)).toThrowErrorOfType("TypeError");
		expect(() => new Query.TermQuery(null, "albert")).toThrowErrorOfType("TypeError");

		done();
	});

	it('TermsQuery', function (done) {
		let q = new Query.TermsQuery("user", ["albert", "einstein"]).boost(3.5).build();
		expect(q).toEqual({type: "terms", field: "user", value: ["albert", "einstein"], boost: 3.5});

		q = new Query.TermsQuery(1, [1, -123]).build();
		expect(q).toEqual({type: "terms", field: "1", value: ["1", "-123"]});
		expect(() => new Query.TermsQuery("user", "albert")).toThrowErrorOfType("TypeError");
		expect(() => new Query.TermsQuery("user", ["albert", {abc: 123}])).toThrowErrorOfType("TypeError");
		expect(() => new Query.TermsQuery("user", undefined)).toThrowErrorOfType("TypeError");
		expect(() => new Query.TermsQuery(null, ["albert", "einstein"])).toThrowErrorOfType("TypeError");

		done();
	});

	it('WildcardQuery', function (done) {
		let q = new Query.WildcardQuery("user", "alb?rt").boost(4.5).build();
		expect(q).toEqual({type: "wildcard", field: "user", value: "alb?rt", boost: 4.5});

		q = new Query.WildcardQuery(1, 1).build();
		expect(q).toEqual({type: "wildcard", field: "1", value: "1"});
		expect(() => new Query.WildcardQuery("user", undefined)).toThrowErrorOfType("TypeError");
		expect(() => new Query.WildcardQuery(null, "alb?rt")).toThrowErrorOfType("TypeError");

		done();
	});

	it('FuzzyQuery', function (done) {
		let q = new Query.FuzzyQuery("user", "albrt").boost(5.5).fuzziness(3).prefixLength(3).build();
		expect(q).toEqual({type: "fuzzy", field: "user", value: "albrt", boost: 5.5, fuzziness: 3, prefix_length: 3});

		q = new Query.FuzzyQuery(1, 1);
		expect(q.build()).toEqual({type: "fuzzy", field: "1", value: "1"});
		expect(() => q.fuzziness(-3)).toThrowErrorOfType("TypeError");
		expect(() => q.fuzziness("3")).toThrowErrorOfType("TypeError");
		expect(() => q.prefixLength(-1)).toThrowErrorOfType("TypeError");
		expect(() => q.prefixLength("1")).toThrowErrorOfType("TypeError");
		expect(() => new Query.FuzzyQuery("user", undefined)).toThrowErrorOfType("TypeError");
		expect(() => new Query.FuzzyQuery(null, "albrt")).toThrowErrorOfType("TypeError");

		done();
	});

	it('PrefixQuery', function (done) {
		let q = new Query.PrefixQuery("user", "alb").boost(5.5).build();
		expect(q).toEqual({type: "prefix", field: "user", value: "alb", boost: 5.5});

		q = new Query.PrefixQuery(1, 1).build();
		expect(q).toEqual({type: "prefix", field: "1", value: "1"});
		expect(() => new Query.PrefixQuery("user", undefined)).toThrowErrorOfType("TypeError");
		expect(() => new Query.PrefixQuery(null, "alb?rt")).toThrowErrorOfType("TypeError");

		done();
	});

	it('ExistsQuery', function (done) {
		let q = new Query.ExistsQuery("user").boost(6.5).build();
		expect(q).toEqual({type: "exists", field: "user", boost: 6.5});

		q = new Query.ExistsQuery(1).build();
		expect(q).toEqual({type: "exists", field: "1"});
		expect(() => new Query.ExistsQuery(undefined)).toThrowErrorOfType("TypeError");

		done();
	});

	it('MatchQuery', function (done) {
		let q = new Query.MatchQuery("user", "albert einstein").boost(7.5).build();
		expect(q).toEqual({type: "match", field: "user", value: "albert einstein", boost: 7.5});

		q = new Query.MatchQuery(1, 1).operator("and").fuzziness(3).prefixLength(3).build();
		expect(q).toEqual({type: "match", field: "1", value: "1", operator: "and", fuzziness: 3, prefix_length: 3});
		q = new Query.MatchQuery(2, 2).operator("or").minimumShouldMatch(3).build();
		expect(q).toEqual({type: "match", field: "2", value: "2", operator: "or", minimum_should_match: 3});
		q = new Query.MatchQuery(1, 1);
		expect(() => q.minimumShouldMatch(-2)).toThrowErrorOfType("TypeError");
		expect(() => q.minimumShouldMatch("4")).toThrowErrorOfType("TypeError");
		expect(() => q.minimumShouldMatch(4)).not.toThrowAnyError();
		expect(() => q.operator("and")).toThrowErrorOfType("SyntaxError");
		expect(() => q.operator("not")).toThrowErrorOfType("SyntaxError");
		q = new Query.MatchQuery(1, 1).operator("and");
		expect(() => q.minimumShouldMatch(3)).toThrowErrorOfType("SyntaxError");
		q = new Query.MatchQuery(1, 1);
		expect(() => q.fuzziness(-3)).toThrowErrorOfType("TypeError");
		expect(() => q.fuzziness("3")).toThrowErrorOfType("TypeError");
		expect(() => q.prefixLength(-1)).toThrowErrorOfType("TypeError");
		expect(() => q.prefixLength("1")).toThrowErrorOfType("TypeError");
		expect(() => new Query.MatchQuery("user", undefined)).toThrowErrorOfType("TypeError");
		expect(() => new Query.MatchQuery(null, "albrt")).toThrowErrorOfType("TypeError");

		done();
	});

	it('MatchAllQuery', function (done) {
		let q = new Query.MatchAllQuery().boost(8.5).build();
		expect(q).toEqual({type: "match_all", boost: 8.5});

		done();
	});

	it('ConstantScoreQuery', function (done) {
		let q = new Query.ConstantScoreQuery().boost(8.5).build();
		expect(q).toEqual({type: "constant_score", boost: 8.5});

		q = new Query.ConstantScoreQuery().startFilter()
			.term("user", "albert")
			.fuzzy("name", "einsten")
			.endFilter().build();
		expect(q).toEqual({type: 'constant_score', filter: { type: 'array',
			values: [new Query.TermQuery("user", "albert").build(), new Query.FuzzyQuery("name", "einsten").build()]}});

		done();
	});
});
