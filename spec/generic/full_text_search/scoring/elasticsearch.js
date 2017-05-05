let FullTextSearch = require('../../../../lib/loki.FullTextSearch');
var elasticsearch = require("elasticsearch");
var MOCK_DATA = require("./MOCK_DATA");
var client = new elasticsearch.Client({
	host: "localhost:9200",
	log: "warning"
});

const INDEX_NAME = "test_index";
const INDEX_TYPE = "MockUp";
const FIELD_NAME_1 = "msg";
const COMPARE_PRECISION = 1e4;

var QB = FullTextSearch.QueryBuilder;

let fts = initFTS();
let es = initES();

let queries = [
	{
		fts: new QB()
			.term(FIELD_NAME_1, "sollicitudin")
			.build(),
		es: {
			term: {
				[FIELD_NAME_1]: "sollicitudin"
			}
		}
	},
	{
		fts: new QB()
			.fuzzy(FIELD_NAME_1, "a")
			.build(),
		es: {
			fuzzy: {
				[FIELD_NAME_1]: "a"
			}
		}
	},
	{
		fts: new QB()
			.fuzzy(FIELD_NAME_1, "este")
			.build(),
		es: {
			fuzzy: {
				[FIELD_NAME_1]: "este"
			}
		}
	},
	{
		fts: new QB()
			.fuzzy(FIELD_NAME_1, "est").prefixLength(3)
			.build(),
		es: {
			fuzzy: {
				[FIELD_NAME_1]: {
					value: "est",
					prefix_length: 3
				}
			}
		}
	},
	{
		fts: new QB()
			.fuzzy(FIELD_NAME_1, "est").fuzziness(0)
			.build(),
		es: {
			fuzzy: {
				[FIELD_NAME_1]: {
					value: "est",
					fuzziness: 0
				}
			}
		}
	},
	{
		fts: new QB()
			.wildcard(FIELD_NAME_1, "a?").build(),
		es: {
			wildcard: {
				[FIELD_NAME_1]: {
					value: "a?"
				}
			}
		}
	},
	{
		fts: new QB()
			.wildcard(FIELD_NAME_1, "a?").enableScoring(true).build(),
		es: {
			wildcard: {
				[FIELD_NAME_1]: {
					value: "a?",
					rewrite: "scoring_boolean"
				}
			}
		}
	},
	{
		fts: new QB()
			.term(FIELD_NAME_1, "sollicitudin").boost(2)
			.build(),
		es: {
			term: {
				[FIELD_NAME_1]: {
					value: "sollicitudin",
					boost: 2
				}
			}
		}
	},
	{
		fts: new QB()
			.matchAll()
			.build(),
		es: {
			match_all: {}
		}
	},
	{
		fts: new QB()
			.exists(FIELD_NAME_1)
			.build(),
		es: {
			exists: {
				"field": FIELD_NAME_1
			}
		}
	},
	{
		fts: new QB()
			.prefix(FIELD_NAME_1, "es")
			.build(),
		es: {
			prefix: {
				[FIELD_NAME_1]: {
					value: "es"
				},
			}
		}
	},
	{
		fts: new QB()
			.prefix(FIELD_NAME_1, "es").enableScoring(true)
			.build(),
		es: {
			prefix: {
				[FIELD_NAME_1]: {
					value: "es",
					rewrite: "scoring_boolean"
				},
			}
		}
	},
	{
		fts: new QB()
			.bool()
			.startMust().term(FIELD_NAME_1, "a").term(FIELD_NAME_1, "ac").endMust()
			.build(),
		es: {
			bool: {
				must: [
					{
						term: {
							[FIELD_NAME_1]: "a"
						}
					},
					{
						term: {
							[FIELD_NAME_1]: "ac"
						}
					}
				]
			}
		}
	},
	{
		fts: new QB()
			.bool()
			.startMust().term(FIELD_NAME_1, "est").endMust()
			.startNot().term(FIELD_NAME_1, "ac").endNot()
			.build(),
		es: {
			bool: {
				must: [
					{
						term: {
							[FIELD_NAME_1]: "est"
						}
					}
				],
				must_not: [
					{
						term: {
							[FIELD_NAME_1]: "ac"
						}
					}
				]
			}
		}
	},
	{
		fts: new QB()
			.bool()
			.startMust().term(FIELD_NAME_1, "abc").endMust()
			.startNot().term(FIELD_NAME_1, "ac").endNot()
			.build(),
		es: {
			bool: {
				must: [
					{
						term: {
							[FIELD_NAME_1]: "abc"
						}
					}
				],
				must_not: [
					{
						term: {
							[FIELD_NAME_1]: "ac"
						}
					}
				]
			}
		},
		empty: true
	},
	{
		fts: new QB()
			.bool()
			.startMust().term(FIELD_NAME_1, "est").endMust()
			.startShould().term(FIELD_NAME_1, "ac").endShould()
			.build(),
		es: {
			bool: {
				must: [
					{
						term: {
							[FIELD_NAME_1]: "est"
						}
					}
				],
				should: [
					{
						term: {
							[FIELD_NAME_1]: "ac"
						}
					}
				]
			}
		}
	},
	{
		fts: new QB()
			.bool()
			.startMust().matchAll().endMust()
			.startNot().term(FIELD_NAME_1, "ac").endNot()
			.build(),
		es: {
			bool: {
				must: [
					{
						match_all: {}
					}
				],
				must_not: [
					{
						term: {
							[FIELD_NAME_1]: "ac"
						}
					}
				]
			}
		}
	}
];


es.then(() => {
	for (let i = 0; i < queries.length; i++) {
		let query = queries[i];
		client.search({
			index: INDEX_NAME,
			type: INDEX_TYPE,
			search_type: "dfs_query_then_fetch",
			body: {
				explain: true,
				"size": 10000,
				query: query.es
			}
		}).then(function (body) {

			// Compare results with loki.
			var esHits = body.hits.hits;
			let ftsHits = fts.search(query.fts);
			let ftsHitDocs = Object.keys(ftsHits);

			// Compare hit length.
			if (esHits.length !== ftsHitDocs.length) {
				console.log("incorrect length: ", esHits.length, " ", ftsHitDocs.length);
				return;
			}

			// Check if esHits should be empty.
			if (query.hasOwnProperty("empty") && query.empty === true) {
				if (esHits.length !== 0) {
					console.log("Hits are not 0.")
				}
				return;
			} else if (esHits.length === 0) {
				console.log("Hits are 0.");
				return;
			}

			for (let j = 0; j < ftsHitDocs.length; j++) {
				let esID = esHits[j]._id;
				let esScore = esHits[j]._score;

				if (!ftsHits.hasOwnProperty(esID)) {
					console.log("Doc not found: " + esID);
					continue;
				}

				if (Math.round(esScore * COMPARE_PRECISION) !== Math.round(ftsHits[esID] * COMPARE_PRECISION)) {
					console.log("Different score for ", esID, ": ",
						esScore, "!= ", ftsHits[esID]);
					console.log(esHits[j]._explanation)
				}
			}
		}, function (error) {
			console.trace(error.message);
		});
	}
});

function initES() {
	// Reset client.
	return client.indices.delete({
		index: INDEX_NAME
	}).then(create, create);

	function create() {
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
			return Promise.all(MOCK_DATA.map(createAction)).then(() => {
				return client.indices.refresh({index: INDEX_NAME})
			});
		});
	}
}

function initFTS() {
	// Overwrite scorer.
	const arr = [5.6493154E19, 2.95147899E18, 2.04963825E18, 1.50585663E18, 1.1529215E18, 7.3786975E17, 5.12409561E17, 3.76464157E17, 2.88230376E17, 1.84467437E17, 1.2810239E17, 9.4116039E16, 7.2057594E16, 4.6116859E16, 3.20255976E16, 2.35290098E16, 1.80143985E16, 1.15292148E16, 8.0063994E15, 5.8822525E15, 4.5035996E15, 2.8823037E15, 2.00159985E15, 1.47056311E15, 1.12589991E15, 7.2057592E14, 5.00399962E14, 3.67640778E14, 2.81474977E14, 1.80143981E14, 1.25099991E14, 9.1910195E13, 7.0368744E13, 4.5035995E13, 3.12749976E13, 2.29775486E13, 1.7592186E13, 1.12589988E13, 7.8187494E12, 5.7443872E12, 4.3980465E12, 2.8147497E12, 1.95468735E12, 1.43609679E12, 1.09951163E12, 7.0368743E11, 4.88671838E11, 3.59024198E11, 2.74877907E11, 1.75921857E11, 1.2216796E11, 8.9756049E10, 6.8719477E10, 4.3980464E10, 3.05419899E10, 2.24390124E10, 1.71798692E10, 1.0995116E10, 7.6354975E9, 5.6097531E9, 4.2949673E9, 2.74877901E9, 1.90887437E9, 1.40243827E9, 1.07374182E9, 6.8719475E8, 4.77218592E8, 3.50609568E8, 2.68435456E8, 1.71798688E8, 1.19304648E8, 8.7652392E7, 6.7108864E7, 4.2949672E7, 2.9826162E7, 2.1913098E7, 1.6777216E7, 1.0737418E7, 7456540.5, 5478274.5, 4194304.0, 2684354.5, 1864135.1, 1369568.6, 1048576.0, 671088.6, 466033.78, 342392.16, 262144.0, 167772.16, 116508.445, 85598.04, 65536.0, 41943.04, 29127.111, 21399.51, 16384.0, 10485.76, 7281.778, 5349.8774, 4096.0, 2621.44, 1820.4445, 1337.4694, 1024.0, 655.36, 455.1111, 334.36734, 256.0, 163.84, 113.77778, 83.591835, 64.0, 40.96, 28.444445, 20.897959, 16.0, 10.24, 7.111111, 5.2244897, 4.0, 2.56, 1.7777778, 1.3061224, 1.0, 0.64, 0.44444445, 0.3265306, 0.25, 0.16, 0.11111111, 0.08163265, 0.0625, 0.04, 0.027777778, 0.020408163, 0.015625, 0.01, 0.0069444445, 0.0051020407, 0.00390625, 0.0025, 0.0017361111, 0.0012755102, 9.765625E-4, 6.25E-4, 4.3402778E-4, 3.1887754E-4, 2.4414062E-4, 1.5625E-4, 1.08506945E-4, 7.9719386E-5, 6.1035156E-5, 3.90625E-5, 2.7126736E-5, 1.9929847E-5, 1.5258789E-5, 9.765625E-6, 6.781684E-6, 4.9824616E-6, 3.8146973E-6, 2.4414062E-6, 1.695421E-6, 1.2456154E-6, 9.536743E-7, 6.1035155E-7, 4.2385525E-7, 3.1140385E-7, 2.3841858E-7, 1.5258789E-7, 1.05963814E-7, 7.785096E-8, 5.9604645E-8, 3.8146972E-8, 2.6490953E-8, 1.946274E-8, 1.4901161E-8, 9.536743E-9, 6.6227384E-9, 4.865685E-9, 3.7252903E-9, 2.3841857E-9, 1.6556846E-9, 1.2164213E-9, 9.313226E-10, 5.9604643E-10, 4.1392115E-10, 3.0410532E-10, 2.3283064E-10, 1.4901161E-10, 1.0348029E-10, 7.602633E-11, 5.820766E-11, 3.7252902E-11, 2.5870072E-11, 1.9006583E-11, 1.4551915E-11, 9.3132255E-12, 6.467518E-12, 4.7516457E-12, 3.6379788E-12, 2.3283064E-12, 1.6168795E-12, 1.1879114E-12, 9.094947E-13, 5.820766E-13, 4.0421987E-13, 2.9697786E-13, 2.2737368E-13, 1.4551915E-13, 1.0105497E-13, 7.4244464E-14, 5.684342E-14, 3.6379787E-14, 2.5263742E-14, 1.8561116E-14, 1.4210855E-14, 9.094947E-15, 6.3159355E-15, 4.640279E-15, 3.5527137E-15, 2.2737367E-15, 1.5789839E-15, 1.1600697E-15, 8.881784E-16, 5.684342E-16, 3.9474597E-16, 2.9001744E-16, 2.220446E-16, 1.4210854E-16, 9.868649E-17, 7.250436E-17, 5.551115E-17, 3.5527136E-17, 2.4671623E-17, 1.812609E-17, 1.3877788E-17, 8.881784E-18, 6.1679057E-18, 4.5315225E-18, 3.469447E-18, 2.220446E-18, 1.5419764E-18, 1.1328806E-18, 8.6736174E-19, 5.551115E-19, 3.854941E-19, 2.8322015E-19, 2.1684043E-19, 1.3877787E-19, 9.637353E-20, 7.080504E-20, 5.421011E-20, 3.469447E-20, 2.4093382E-20, 1.770126E-20].reverse();

	function closest(target) {
		for (let i = 1; i < arr.length; i++) {
			// As soon as a number bigger than target is found, return the previous or current
			// number depending on which has smaller difference to the target.
			if (arr[i] >= target) {
				//var p = arr[i-1];
				//var c = arr[i];
				//return Math.abs( p-target ) < Math.abs( c-target ) ? p : c;
				return arr[i];
			}
		}
		// No number in array is bigger so return the last.
		return arr[arr.length - 1];
	}

	FullTextSearch.Scorer.prototype._calculateFieldLength2 =
		FullTextSearch.Scorer.prototype._calculateFieldLength;

	FullTextSearch.Scorer.prototype._calculateFieldLength = (...args) => {
		return closest(FullTextSearch.Scorer.prototype._calculateFieldLength2(...args));
	};

	let tkz = new FullTextSearch.Tokenizer();
	let fts = new FullTextSearch.FullTextSearch([{
		name: FIELD_NAME_1,
		tokenizer: tkz
	}]);


	for (let i = 0; i < MOCK_DATA.length; i++) {
		fts.addDocument({
			$loki: MOCK_DATA[i].id,
			[FIELD_NAME_1]: MOCK_DATA[i][FIELD_NAME_1]
		});
	}

	return fts;
}

// console.log(hit._explanation)
// let res = hit._explanation.details[1].details[0];
//
// let tf = res.details[0].value;
// let avgFieldLength = res.details[3].value;
// let fieldLength = res.details[4].value;
// let tfNorm = res.value;
// let idf = hit._explanation.details[0].details[0].value;
// let docFreq = hit._explanation.details[0].details[0].details[0].value;
// let docCount = hit._explanation.details[0].details[0].details[1].value;
//
// console.log(
// 	hit._id + ":" + hit._score,
// 	"\n\ttype: BM25",
// 	"\n\tboost: " + 1,
// 	"\n\tidf: " + idf,
// 	"\n\tdocFeq: " + docFreq,
// 	"\n\tdocCoutn: " + docCount,
// 	"\n\ttfNorm : " + tfNorm,
// 	"\n\ttf : " + tf,
// 	"\n\tavg : " + avgFieldLength,
// 	"\n\tfl : " + fieldLength);
