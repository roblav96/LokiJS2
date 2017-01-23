/* global suite, benchmark, _ */
import getInstance from "../src/index";
import {Calculator} from "../src/calculator";

suite("getInstance", function () {
	benchmark("_.each", function () {
		getInstance();
	});

	benchmark("direct", function () {
		new Calculator();
	});
});

suite("Array iteration", function () {
	benchmark("_.each", function () {
		_.each([1, 2, 3], function (el) {
			return el;
		});
	});

	benchmark("native forEach", function () {
		[1, 2, 3].forEach(function (el) {
			return el;
		});
	});
});

suite("Plucking key names", function () {
	benchmark("_.keys", function () {
		_.keys({
			a: 1,
			b: 2,
			c: 3
		});
	});

	benchmark("Object.keys", function () {
		Object.keys({
			a: 1,
			b: 2,
			c: 3
		});
	});
});

