/* global describe, it, expect */
import {FullTextSearch} from '../../../../src/inverted_index/full_text_search';
import {QueryBuilder} from '../../../../src/inverted_index/queries';

describe('wildcard query', function () {
	// from lucene 6.4.0 core: TestWildCard

	let assertMatches = (searcher, query, result) => {
		let res = searcher.search(query);
		expect(Object.keys(res).length).toEqual(result);
	};


	it('Tests Wildcard queries with an asterisk.', function (done) {

		done();
	});

	it('Tests Wildcard queries with a question mark.', function (done) {
		let docs = ["metal", "metals", "mXtals", "mXtXls"];
		let fts = new FullTextSearch({fields: ["body"]});
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}
		let query = null;

		query = new QueryBuilder().wildcard("body", "m?tal").build();
		assertMatches(fts, query, 1);
		query = new QueryBuilder().wildcard("body", "metal?").build();
		assertMatches(fts, query, 1);
		query = new QueryBuilder().wildcard("body", "metals?").build();
		assertMatches(fts, query, 0);
		query = new QueryBuilder().wildcard("body", "m?t?ls").build();
		assertMatches(fts, query, 3);
		query = new QueryBuilder().wildcard("body", "M?t?ls").build();
		assertMatches(fts, query, 0);
		query = new QueryBuilder().wildcard("body", "meta??").build();
		assertMatches(fts, query, 1);

		done();
	});

	it('Tests if wildcard escaping works.', function (done) {
		// TODO: Change splitter of fts.
		let docs = ["foo*bar", "foo??bar", "fooCDbar", "fooSOMETHINGbar", "foo\\"];
		let fts = new FullTextSearch({fields: ["body"]});
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}

		//let query1 = new QueryBuilder().wildcard("body", "foo*bar").build();
		let query2 = new QueryBuilder().wildcard("body", "foo\\*bar").build();
		let query3 = new QueryBuilder().wildcard("body", "foo??bar").build();
		let query4 = new QueryBuilder().wildcard("body", "foo\\?\\?bar").build();
		let query5 = new QueryBuilder().wildcard("body", "foo\\").build();

		//assertMatches(fts, query1, 4);
		//assertMatches(fts, query2, 1);
		//assertMatches(fts, query3, 2);
		//assertMatches(fts, query4, 1);
		//assertMatches(fts, query5, 1);

		done();
	});
});
