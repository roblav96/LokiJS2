/* global describe, it, expect */
import {FullTextSearch} from '../../../../src/inverted_index/full_text_search';
import {QueryBuilder} from '../../../../src/inverted_index/queries';

describe('fuzzy query', function () {
	// from lucene 6.4.0 core: TestFuzzyQuery

	let assertMatches = (searcher, query, result, docIds = []) => {
		let res = searcher.search(query);
		expect(Object.keys(res).length).toEqual(result);
		for (let i = 0; i < docIds.length; i++) {
			expect(res).toHaveMember(String(docIds[i]));
			delete res[String(docIds[i])];
		}
		expect(res).toEqual({});
	};

	it('Tests Fuzzy queries fuzziness.', function (done) {
		let docs = ["aaaaa", "aaaab", "aaabb", "aabbb", "abbbb", "bbbbb", "ddddd"];
		let fts = new FullTextSearch([{name: "body"}]);
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}
		let query = null;

		// With prefix.
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(0).build();
		assertMatches(fts, query, 3, [0, 1, 2]);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(1).build();
		assertMatches(fts, query, 3, [0, 1, 2]);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(2).build();
		assertMatches(fts, query, 3, [0, 1, 2]);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(3).build();
		assertMatches(fts, query, 3, [0, 1, 2]);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(4).build();
		assertMatches(fts, query, 2, [0, 1]);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(5).build();
		assertMatches(fts, query, 1, [0]);
		query = new QueryBuilder().fuzzy("body", "aaaaa").prefixLength(6).build();
		assertMatches(fts, query, 1, [0]);

		// not similar enough:
		query = new QueryBuilder().fuzzy("body", "xxxxx").build();
		assertMatches(fts, query, 0);
		query = new QueryBuilder().fuzzy("body", "aaccc").build();
		assertMatches(fts, query, 0);

		// query identical to a word in the index:
		query = new QueryBuilder().fuzzy("body", "aaaaa").build();
		assertMatches(fts, query, 3, [0, 1, 2]);

		// query similar to a word in the index:
		query = new QueryBuilder().fuzzy("body", "aaaac").build();
		assertMatches(fts, query, 3, [0, 1, 2]);

		// With prefix.
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(1).build();
		assertMatches(fts, query, 3, [0, 1, 2]);
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(2).build();
		assertMatches(fts, query, 3, [0, 1, 2]);
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(3).build();
		assertMatches(fts, query, 3, [0, 1, 2]);
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(4).build();
		assertMatches(fts, query, 2, [0, 1]);
		query = new QueryBuilder().fuzzy("body", "aaaac").prefixLength(5).build();
		assertMatches(fts, query, 0);

		// Something other.
		query = new QueryBuilder().fuzzy("body", "ddddx").build();
		assertMatches(fts, query, 1, [6]);

		// With prefix
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(1).build();
		assertMatches(fts, query, 1, [6]);
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(2).build();
		assertMatches(fts, query, 1, [6]);
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(3).build();
		assertMatches(fts, query, 1, [6]);
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(4).build();
		assertMatches(fts, query, 1, [6]);
		query = new QueryBuilder().fuzzy("body", "ddddx").prefixLength(5).build();
		assertMatches(fts, query, 0);

		// Without prefix length (default should be 2).
		query = new QueryBuilder().fuzzy("body", "aaaab").build();
		assertMatches(fts, query, 4, [0, 1, 2, 3]);
		query = new QueryBuilder().fuzzy("body", "aaabb").build();
		assertMatches(fts, query, 4, [0, 1, 2, 3]);
		query = new QueryBuilder().fuzzy("body", "aabbb").build();
		assertMatches(fts, query, 3, [1, 2, 3]);

		// Empty.
		query = new QueryBuilder().fuzzy("body", "").build();
		assertMatches(fts, query, 0);

		done();
	});

	it('Tests Fuzzy queries fuzziness 2.', function (done) {
		let docs = ["lange", "lueth", "pirsing", "riegel", "trzecziak", "walker", "wbr", "we", "web", "webe", "weber",
			"webere", "webree", "weberei", "wbre", "wittkopf", "wojnarowski", "wricke"];
		let fts = new FullTextSearch([{name: "body"}]);
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}
		let query = new QueryBuilder().fuzzy("body", "weber").prefixLength(1).build();
		assertMatches(fts, query, 8, [6, 8, 9, 10, 11, 12, 13, 14]);

		done();
	});
});
