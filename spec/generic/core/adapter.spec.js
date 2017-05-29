/* global describe, it, expect */
import {Loki} from '../../../src/core/loki';

describe('testing persistence adapter', () => {

	it('standard env adapter', done => {
		const db = new Loki();

		db.initializePersistence()
			.then(() => {
				db.addCollection("myColl").insert({name: "Hello World"});
				db.saveDatabase().then(() => {
					const db2 = new Loki();
					return db2.initializePersistence()
						.then(() => {
							return db2.loadDatabase()
								.then(() => {
									expect(db2.getCollection("myColl").find()[0].name).toEqual("Hello World");
								});
						});
				})
			})
			.then(() => {
				const db3 = new Loki("other");
				return db3.initializePersistence()
					.then(() => {
						return db3.loadDatabase()
							.then(() => {
								expect(false).toEqual(true);
								done();
							}, () => {
								expect(true).toEqual(true);
								done();
							});
					});
			});
	});
});
