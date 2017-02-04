/* global describe, it, expect */
import {InvertedIndex} from '../../../src/inverted_index/inverted_index';

describe('inverted index', function () {

	let ii = new InvertedIndex("chat");

	// TODO: Better run value check.

	let field1 = "Hello world, how are you today?!";
	let field2 = "Well done world...";
	let field3 = "I am good, and you?";
	let field4 = "Now again inside today! You...";
	let field5 = "Good bye NO! for all worlds...";

	it ('get', function (done) {
		expect(ii.documentCount).toBeNumber();
		expect(ii.documentStore).toBeObject();
		expect(ii.totalFieldLength).toBeNumber();
		expect(ii.fieldName).toBeString();
		expect(ii.tokenizer).toBeObject();
		expect(ii.root).toBeObject();

		done();
	});

	it('insert', function (done) {
		ii.insert(field1, 1);
		expect(() =>ii.insert(field2, 1)).toThrowErrorOfType("Error");
		ii.insert(field3, 2);

		ii.tokenizer.add("bad_tokenizer", function (tokens) {
			return [""];
		});
		ii.insert(field4, 3);
		ii.tokenizer.remove("bad_tokenizer");
		ii.insert(field4, 4, 2);
		ii.insert(field5, 5, 2);

		done();
	});

	it('remove', function (done) {
		ii.remove(1);
		ii.remove(4);
		ii.remove(15);

		done();
	});

	it('getTermIndex', function (done) {
		expect(InvertedIndex.getTermIndex("you", ii.root)).not.toBe(null);
		expect(InvertedIndex.getTermIndex("ayou", ii.root, 1)).not.toBe(null);
		expect(InvertedIndex.getTermIndex("you", ii.root, 10)).toBe(null);
		expect(InvertedIndex.getTermIndex("xyz1234", ii.root)).toBe(null);

		done();
	});

	it('getNextTermIndex', function (done) {
		InvertedIndex.getNextTermIndex(ii.root);
		let idx = InvertedIndex.getTermIndex("you", ii.root);
		expect(InvertedIndex.getNextTermIndex(idx)).not.toBe(null);

		done();
	});

	it('extendTermIndex', function (done) {
		expect(InvertedIndex.extendTermIndex(ii.root)).toBeArray();

		done();
	});

	it('serialize', function (done) {
		let ii1 = new InvertedIndex("chat");
		ii1.insert(field1, 1);
		ii1.insert(field2, 2, 2.5);
		ii1.insert(field3, 3, 0.5);

		let ii2 = new InvertedIndex("chat");
		ii2.insert(field1, 1);
		ii2.insert(field2, 2, 2.5);
		ii2.insert(field3, 3, 0.5);
		ii2.insert(field4, 4);

		let ii3 = new InvertedIndex("chat");
		ii3.loadJSON(JSON.parse(JSON.stringify(ii2)));

		expect(JSON.stringify(ii3)).toEqual(JSON.stringify(ii2));
		ii2.remove(4);
		ii3.remove(4);
		expect(JSON.stringify(ii2)).toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).toEqual(JSON.stringify(ii2));

		ii2.remove(1);
		ii3.remove(2);
		expect(JSON.stringify(ii2)).not.toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).not.toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).not.toEqual(JSON.stringify(ii2));

		ii1.remove(1);
		ii1.remove(2);
		ii2.remove(2);
		ii3.remove(1);
		expect(JSON.stringify(ii2)).toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).toEqual(JSON.stringify(ii2));

		ii2.loadJSON(JSON.parse(JSON.stringify(ii1)));
		expect(JSON.stringify(ii2)).toEqual(JSON.stringify(ii1));

		ii1.insert(field5, 5);
		expect(JSON.stringify(ii2)).not.toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).not.toEqual(JSON.stringify(ii1));

		ii1.remove(5);
		expect(JSON.stringify(ii2)).toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).toEqual(JSON.stringify(ii1));
		expect(JSON.stringify(ii3)).toEqual(JSON.stringify(ii2));

		done();
	});
});