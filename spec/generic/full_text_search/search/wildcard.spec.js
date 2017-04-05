/* global describe, it, expect */
import {FullTextSearch} from '../../../../src/inverted_index/full_text_search';
import {QueryBuilder} from '../../../../src/inverted_index/queries';
import {Tokenizer} from '../../../../src/inverted_index/tokenizer';

describe('wildcard query', function () {
	// from lucene 6.4.0 core: TestWildCard

	let assertMatches = (searcher, query, result) => {
		let res = searcher.search(query);
		expect(Object.keys(res).length).toEqual(result);
	};


	it('Tests Wildcard queries with an asterisk.', function (done) {
		let docs = ["metal", "metals", "mXtals", "mXtXls"];
		let fts = new FullTextSearch({fields: [{name: "body"}]});
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}
		let query = null;
		query = new QueryBuilder().wildcard("body", "metal*").build();
		assertMatches(fts, query, 2);
		query = new QueryBuilder().wildcard("body", "metals*").build();
		assertMatches(fts, query, 1);
		query = new QueryBuilder().wildcard("body", "mx*").build();
		assertMatches(fts, query, 2);
		query = new QueryBuilder().wildcard("body", "mX*").build();
		assertMatches(fts, query, 0);
		query = new QueryBuilder().wildcard("body", "m*").build();
		assertMatches(fts, query, 4);

		done();
	});

	it('Tests Wildcard queries with a question mark.', function (done) {
		let docs = ["metal", "metals", "mXtals", "mXtXls"];
		let fts = new FullTextSearch({fields: [{name: "body"}]});
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
		let docs = ["foo*bar", "foo??bar", "fooCDbar", "fooSOMETHINGbar", "foo\\", "foo\\\\"];

		let tkz = new Tokenizer();
		// Don't split the text.
		tkz.setSplitter("nosplit", function (text) {
			return [text];
		});

		let fts = new FullTextSearch({fields: [{name: "body", tokenizer: tkz}]});
		for (let i = 0; i < docs.length; i++) {
			fts.addDocument({
				$loki: i,
				body: docs[i]
			});
		}
		let query = null;
		//query = new QueryBuilder().wildcard("body", "foo*bar").build();
		//assertMatches(fts, query, 4); // * not implemented
		query = new QueryBuilder().wildcard("body", "foo\\*bar").build();
		assertMatches(fts, query, 1);
		query = new QueryBuilder().wildcard("body", "foo??bar").build();
		assertMatches(fts, query, 2);
		query = new QueryBuilder().wildcard("body", "foo\\?\\?bar").build();
		assertMatches(fts, query, 1);
		query = new QueryBuilder().wildcard("body", "foo\\\\").build();
		assertMatches(fts, query, 1);
		query = new QueryBuilder().wildcard("body", "foo\\\\*").build();
		assertMatches(fts, query, 2);

		done();
	});
});
