/* global describe, it, expect */
import {FullTextSearch} from '../../../../src/inverted_index/full_text_search';
import {QueryBuilder} from '../../../../src/inverted_index/queries';

describe('fuzzy query', function () {
	// from lucene 6.4.0 core: TestFuzzyQuery

	let assertMatches = (searcher, query, result) => {
		let res = searcher.search(query);
		expect(Object.keys(res).length).toEqual(result);
		return res;
	};

	it('Tests Fuzzy queries fuzziness.', function (done) {
		let docs = ["aaaaa", "aaaab", "aaabb", "aabbb", "abbbb", "bbbbb", "ddddd"];
		let fts = new FullTextSearch({fields: ["body"]});
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}
		let query = null;
		let result = null;

		query = new QueryBuilder().fuzzy("body", "aaaaa").build();
		assertMatches(fts, query, 3);

		// With prefix.
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(1).build();
		assertMatches(fts, query, 3);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(2).build();
		assertMatches(fts, query, 3);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(3).build();
		assertMatches(fts, query, 3);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(4).build();
		assertMatches(fts, query, 2);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(5).build();
		assertMatches(fts, query, 1);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(6).build();
		assertMatches(fts, query, 1);

		// not similar enough:
		query = new QueryBuilder().fuzzy("body", "xxxxx").build();
		assertMatches(fts, query, 0);
		query = new QueryBuilder().fuzzy("body", "aaccc").build();
		assertMatches(fts, query, 0);

		// query identical to a word in the index:
		query = new QueryBuilder().fuzzy("body", "aaaaa").build();
		result = assertMatches(fts, query, 3);
		expect(result).toHaveMember("0");
		expect(result).toHaveMember("1");
		expect(result).toHaveMember("2");

		// query similar to a word in the index:
		query = new QueryBuilder().fuzzy("body", "aaaac").build();
		result = assertMatches(fts, query, 3);
		expect(result).toHaveMember("0");
		expect(result).toHaveMember("1");
		expect(result).toHaveMember("2");

		// With prefix.
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(1).build();
		result = assertMatches(fts, query, 3);
		expect(result).toHaveMember("0");
		expect(result).toHaveMember("1");
		expect(result).toHaveMember("2");
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(2).build();
		result = assertMatches(fts, query, 3);
		expect(result).toHaveMember("0");
		expect(result).toHaveMember("1");
		expect(result).toHaveMember("2");
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(3).build();
		result = assertMatches(fts, query, 3);
		expect(result).toHaveMember("0");
		expect(result).toHaveMember("1");
		expect(result).toHaveMember("2");
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(4).build();
		result = assertMatches(fts, query, 2);
		expect(result).toHaveMember("0");
		expect(result).toHaveMember("1");
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(5).build();
		assertMatches(fts, query, 0);

		// Something other.
		query = new QueryBuilder().fuzzy("body", "ddddx").build();
		result = assertMatches(fts, query, 1);
		expect(result).toHaveMember("6");

		// With prefix
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(1).build();
		result = assertMatches(fts, query, 1);
		expect(result).toHaveMember("6");
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(2).build();
		result = assertMatches(fts, query, 1);
		expect(result).toHaveMember("6");
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(3).build();
		result = assertMatches(fts, query, 1);
		expect(result).toHaveMember("6");
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(4).build();
		result = assertMatches(fts, query, 1);
		expect(result).toHaveMember("6");
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(5).build();
		assertMatches(fts, query, 0);

		done();
	});

	it('Tests Fuzzy queries fuzziness 2.', function (done) {
		let docs = ["lange", "lueth", "pirsing", "riegel", "trzecziak", "walker", "wbr", "we", "web", "webe", "weber",
			"webere", "webree", "weberei", "wbre", "wittkopf", "wojnarowski", "wricke"];
		let fts = new FullTextSearch({fields: ["body"]});
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}
		let query = new QueryBuilder().fuzzy("body", "weber").prefixLength(1).build();
		assertMatches(fts, query, 8);

		done();
	});
});
