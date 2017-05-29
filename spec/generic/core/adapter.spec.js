/* global describe, it, expect */
import {Loki} from '../../../src/core/loki';

describe('testing persistence adapter', function () {

	it('standard env adapter', function (done) {
		const db = new Loki();

		db.initializePersistence()
			.then(() => {
				db.addCollection("myColl").insert({name: "Hello World"});
				db.saveDatabase().then(function () {
					const db2 = new Loki();
					return db2.initializePersistence()
						.then(() => {
							return db2.loadDatabase()
								.then(function () {
									expect(db2.getCollection("myColl").find()[0].name).toEqual("Hello World");
								});
						})
				})
			})
			.then(() => {
				const db3 = new Loki("other");
				return db3.initializePersistence()
					.then(() => {
						return db3.loadDatabase()
							.then(function () {
								expect(false).toEqual(true);
								done();
							}, function () {
								expect(true).toEqual(true);
								done();
							});
					});
			});
	});
});
