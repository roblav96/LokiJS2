/* global describe, it, expect */
import {FullTextSearch} from '../../../../src/inverted_index/full_text_search';
import {Client} from 'elasticsearch';
import {DATA} from './MOCK_DATA'
import {QUERIES} from './QUERIES'

const INDEX_NAME = "test_index";
const INDEX_TYPE = "MockUp";
const FIELD_NAME_1 = "msg";
const COMPARE_PRECISION = 1e4;

describe("Compare scoring against elasticsearch", function () {

	let client = new Client({
		host: "localhost:9200",
		log: "warning"
	});

	let fts = initFTS();
	let es = initES();

	beforeEach(function (done) {
		es.then(() => {
			done();
		}, () => {
			done();
		});
	});

	for (let i = 0; i < QUERIES.length; i++) {
		let query = QUERIES[i];
		it(" -> " + i + ": " + JSON.stringify(query), function (done) {
			client.search({
				index: INDEX_NAME,
				type: INDEX_TYPE,
				search_type: "dfs_query_then_fetch",
				body: {
					explain: true,
					"size": 10000,
					query: query.es
				}
			}).then((body) => {
				// Compare results with loki.
				let esHits = body.hits.hits;
				let ftsHits = fts.search(query.fts);
				let ftsHitDocs = Object.keys(ftsHits);

				(() => {
					// Compare hit length.
					expect(esHits.length).toEqual(ftsHitDocs.length);

					// Check if esHits should be empty.
					if (query.hasOwnProperty("empty") && query.empty === true) {
						expect(esHits.length).toEqual(0);
						return;
					} else if (esHits.length === 0) {
						expect(esHits.length).not.toEqual(0);
						return;
					}

					for (let j = 0; j < ftsHitDocs.length; j++) {
						let esID = esHits[j]._id;
						expect(ftsHits).toHaveMember(esID);
						if (!ftsHits.hasOwnProperty(esID)) {
							continue;
						}

						let esScore = Math.round(esHits[j]._score * COMPARE_PRECISION) / COMPARE_PRECISION;
						let ftsScore = Math.round(ftsHits[esID] * COMPARE_PRECISION) / COMPARE_PRECISION;

						expect(esScore).toEqual(ftsScore, esHits[j]._explanation, " !==", "TODO");
					}
				})();
				done();
			}, function (error) {
				console.trace(error.message);
				done();
			});
		});
	}


	function initES() {
		// Reset client.
		return client.indices.delete({
			index: INDEX_NAME
		}).then(create, create);


		function create() {
			// Add documents.
			return client.indices.create({
				index: INDEX_NAME,
				body: {
					mappings: {
						[INDEX_TYPE]: {
							properties: {
								[FIELD_NAME_1]: {
									type: "text",
									index_options: "freqs"
								}
							}
						}
					}
				}
			}).then(() => {
				let createAction = (data) => client.index({
					index: INDEX_NAME,
					type: INDEX_TYPE,
					id: data.id,
					body: data
				});
				return Promise.all(DATA.map(createAction)).then(() => {
					return client.indices.refresh({index: INDEX_NAME})
				});
			});
		}
	}

	function initFTS() {
		let fts = new FullTextSearch([{
			name: FIELD_NAME_1
		}]);

		// Add documents.
		for (let i = 0; i < DATA.length; i++) {
			fts.addDocument({
				$loki: DATA[i].id,
				[FIELD_NAME_1]: DATA[i][FIELD_NAME_1]
			});
		}
		return fts;
	}
});
