import {QueryBuilder as QB} from '../../../../src/inverted_index/queries';

const FIELD_NAME_1 = "msg";

export const QUERIES = [
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
			.constantScore().startFilter()
			.term(FIELD_NAME_1, "sollicitudin")
			.endFilter().boost(2.45)
			.build(),
		es: {
			constant_score: {
				filter: {
					term: {
						[FIELD_NAME_1]: "sollicitudin"
					}
				},
				boost: 2.45
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
			.prefix(FIELD_NAME_1, "es").boost(3.5)
			.build(),
		es: {
			prefix: {
				[FIELD_NAME_1]: {
					value: "es",
					boost: 3.5
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
	},
	{
		fts: new QB()
			.bool()
			.startMust().term(FIELD_NAME_1, "ac").endMust()
			.startShould().constantScore().startFilter().wildcard(FIELD_NAME_1, "a?").endFilter().endShould()
			.build(),
		es: {
			bool: {
				must: [
					{
						term: {
							[FIELD_NAME_1]: "ac"
						}
					}
				],
				should: [
					{
						constant_score: {
							filter: {
								wildcard: {
									[FIELD_NAME_1]: "a?"
								}
							}
						}
					}
				]
			}
		}
	},
	{
		fts: new QB()
			.match(FIELD_NAME_1, "orci habitasse eget")
			.build(),
		es: {
			match: {
				[FIELD_NAME_1]: "orci habitasse eget"
			}
		}
	},
];
