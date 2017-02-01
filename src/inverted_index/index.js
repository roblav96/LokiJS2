




function a() {
	/*
	 * @param {number} [from] - the from parameter defines the offset from the first result you want to fetch
	 * @param {number} [size] - the size parameter allows you to configure the maximum amount of hits to be returned
	 * @param {number} [minScore] - exclude documents which have a _score less than the minimum specified in min_score
	 * @param {object} [term] -
	 */

	// query string query:
	// https://www.elastic.co/guide/en/elasticsearch/reference/5.x/query-dsl-query-string-query.html
}

var a = new QueryBuilder()
	.bool().boost(2)
	.startFilter().boost(3)
	.wildcard("123", "123")
	.term("how", "are").boost(5)
	.endFilter()
	.startMust().boost(11)
	.match("123", "123")
	.term("with", "todo").boost(5)
	.endMust()
	.startNot()
	.bool()
	.startNot()
	.terms("name", ["carl", "harry", "unknown"])
	.matchAll()
	.endNot()
	.endNot()
	.build();


var doc1 = {"desc": "The game of life is a game of everlasting learning", $loki: 0};
var doc2 = {"desc": "The unexamined life is not worth living", $loki: 1};
var doc3 = {"desc": "Never stop learning", $loki: 2};
var doc4 = {"desc": "Gamer never lifting", $loki: 3};
var idx = new FullTextSearch({"fields": ["desc"]});
idx.addDocument(doc1, {"desc": 1});
idx.addDocument(doc2);
idx.addDocument(doc3);

var idx2 = new FullTextSearch({"fields": ["desc"]});
idx2.addDocument(doc1);
idx2.addDocument(doc2);
idx2.addDocument(doc3);
idx2.addDocument(doc4);

var idx3 = new FullTextSearch({"fields": ["desc"]});
idx3.loadJSON(JSON.stringify(idx2));
idx2.removeDocument(doc4);
idx3.removeDocument(doc4);

console.log(JSON.stringify(idx) === JSON.stringify(idx2));
console.log(JSON.stringify(idx) === JSON.stringify(idx3));
console.log(JSON.stringify(idx2) === JSON.stringify(idx3));
idx2.removeDocument(doc2);
idx3.removeDocument(doc3);
console.log(JSON.stringify(idx2) !== JSON.stringify(idx3));
idx2.removeDocument(doc3);
console.log(JSON.stringify(idx2) !== JSON.stringify(idx3));
idx3.removeDocument(doc2);
console.log(JSON.stringify(idx2) === JSON.stringify(idx3));

var query1 = new QueryBuilder()
	.useBM25(1.2, 0.75).enableFinalScoring(true)
	.bool()
	// .minimum_should_match(1)
	.startShould()
	// //.fuzzy("desc", "never").fuzziness(1).prefixLength(4)
	//.fuzzy("desc", "not").fuzziness(1)
	//.fuzzy("desc", "gamr").fuzziness(2).boost(2)
	//.match("desc", "game")
	// //.fuzzy("desc", "worth").fuzziness(1)
	//.match("desc", "gamer lifer").minimumShouldMatch(1).operator("or").fuzziness(2).prefixLength(1)
	.wildcard("desc", "gam?")
	//.prefix("desc", "l").boost(2)
	//.exists("desc")
	.endShould()
	// .startFilter()
	// //.term("desc", "not")
	// .endFilter()
	//.startShould()
	//.fuzzy("desc", "livin").fuzziness(2).boost(2)
	//.term("desc", "game")
	//.wildcard("desc", "ga?e")
	//.fuzzy("desc", "liee")
	//.term("desc", "worth").boost(1)
	//.endShould()
	//.startNot()
	//.fuzzy("desc", "worth").fuzziness(1)
	//.terms("desc", ["game", "life"])
	//.endNot()
	.build();

var res2 = idx.search(query1);
console.log(res2);

//console.log(query1);
