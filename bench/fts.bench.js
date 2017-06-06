/* global suite, benchmark, _ */
import {FullTextSearch} from "../src/inverted_index/full_text_search";
import {Tokenizer} from "../src/inverted_index/tokenizer";
import {DATA} from "../spec/node/full_text_search/scoring/MOCK_DATA";
import {QUERIES} from "../spec/node/full_text_search/scoring/QUERIES";

let tkz = new Tokenizer();
tkz.add("stop-word", (token) => (token !== "habitasse" && token !== "morbi") ? token : "");

const FIELD_NAME_1 = "msg";
let fts = new FullTextSearch([{
	name: FIELD_NAME_1,
	tokenizer: tkz
}]);

// Add documents.
for (let i = 0; i < DATA.length; i++) {
	fts.addDocument({
		$loki: DATA[i].id,
		[FIELD_NAME_1]: DATA[i][FIELD_NAME_1]
	});
}

suite("Full text search queries", function () {
	for (let i = 0; i < QUERIES.length; i++) {
		let query = QUERIES[i];
		benchmark(i + ""/*+ ": " + JSON.stringify(query)*/, function () {
			fts.search(query.fts);
		});
	}
});

suite("Full text search comparison", function () {

});
