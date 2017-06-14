/* global describe, it, expect */
import {Loki as loki} from '../../src/core/loki';
import {FullTextSearch} from '../../src/inverted_index/full_text_search';
import {QueryBuilder} from '../../src/inverted_index/queries';

describe('changesApi', () => {
  it('does what it says on the tin', () => {
    const db = new loki(),
      options = {
        asyncListeners: false,
        disableChangesApi: true,
        fullTextSearch: [
          {
            name: "abc",
          }
        ]
      };

    const users = db.addCollection('users', options);
    users.insert({abc: "123"});
		// users.insert({abc: "124"});
		// console.log(users._fullTextSearch.search(new QueryBuilder().wildcard("abc", "12?").build()));
		// users.findAndRemove({abc: "123"});
		// console.log(users._fullTextSearch.search(new QueryBuilder().wildcard("abc", "12?").build()));
        //
		// users.findAndUpdate({abc: "124"}, (doc) => {
		// 	doc.abc = "wow";
		// });
		// console.log(users._fullTextSearch.search(new QueryBuilder().wildcard("abc", "wow").build()));

		//users.find(query.queryObj)

  });
});
