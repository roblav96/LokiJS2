/* global describe, it, expect */
import {Loki} from '../../src/core/loki';
import {LokiIndexedAdapter} from '../../src/core/loki-indexed-adapter';

it('indexed adapter', (done) => {
	let db = new Loki();
	let db2 = new Loki();

	db.initializePersistence({adapter: new LokiIndexedAdapter("myTestApp")})
		.then(() => {
			db.addCollection("myColl").insert({name: "Hello World"});
			return db.saveDatabase();
		})
		.then(() => db2.initializePersistence({adapter: new LokiIndexedAdapter("myTestApp")}))
		.then(() => db2.loadDatabase())
		.then(() => {
			expect(db2.getCollection("myColl").find()[0].name).toEqual("Hello World");
			return db2.deleteDatabase();
		})
		.then(() => {
			const ldx = new LokiIndexedAdapter("myTestApp");
			// Should be promised?
			ldx.getDatabaseList((result) => {
				expect(result.length).toEqual(0);
				done();
			});
		});
});
