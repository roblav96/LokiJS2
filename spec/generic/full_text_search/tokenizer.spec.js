/* global describe, it, expect */
import {Tokenizer} from '../../../src/inverted_index/tokenizer';

describe('tokenizer', function () {

	function splitter() {
	}

	function f1(tokens) {
		return tokens;
	}

	function f2() {
	}

	function f3() {
	}

	function f4() {
	}

	function f5() {
	}

	it('splitter', function (done) {
		let tkz = new Tokenizer();

		expect(tkz.getSplitter()).toBeArray();
		expect(() => tkz.setSplitter(1, splitter)).not.toThrowErrorOfType('TypeError');
		expect(() => tkz.setSplitter(null, splitter)).toThrowErrorOfType('TypeError');
		expect(() => tkz.setSplitter("MySplitter", 1)).toThrowErrorOfType('TypeError');
		expect(() => tkz.setSplitter("", splitter)).toThrowErrorOfType('Error');
		tkz.setSplitter("MySplitter", splitter);
		expect(tkz.getSplitter()).toBeArray();

		done();
	});

	it('add, get', function (done) {
		let tkz = new Tokenizer();

		expect(() => tkz.add(1, f1)).not.toThrowErrorOfType('TypeError');
		expect(() => tkz.add(null, f1)).toThrowErrorOfType('TypeError');
		expect(() => tkz.add("f1", 1)).toThrowErrorOfType('TypeError');
		expect(() => tkz.add("", f1)).toThrowErrorOfType('Error');
		tkz.add("f1", f1);
		tkz.add("f2", f2);
		tkz.add("f1", f1);

		expect(() => tkz.get(1)).not.toThrowErrorOfType('TypeError');
		expect(() => tkz.get("f3")).toThrowErrorOfType('Error');
		expect(tkz.get("f1")).toBeArray();
		expect(tkz.get(f1)).toBeArray();

		done();
	});

	it('addBefore, addAfter', function (done) {
		let tkz = new Tokenizer();
		tkz.add("f2", f2);
		tkz.addBefore(f2, "f1", f1);
		tkz.addAfter(f2, "f3", f3);

		expect(() => tkz.addBefore(f3, 1, f5)).not.toThrowErrorOfType('TypeError');
		expect(() => tkz.addBefore(f3, "f4", 1)).toThrowErrorOfType('TypeError');
		expect(() => tkz.addBefore(f3, "", f4)).toThrowErrorOfType('Error');
		expect(() => tkz.addBefore(f4, "f1", f5)).toThrowErrorOfType('Error');
		expect(() => tkz.addBefore("f4", "f1", f5)).toThrowErrorOfType('Error');
		expect(() => tkz.addAfter(f3, 1, f5)).not.toThrowErrorOfType('TypeError');
		expect(() => tkz.addAfter(f3, "f4", 1)).toThrowErrorOfType('TypeError');
		expect(() => tkz.addAfter(f3, "", f4)).toThrowErrorOfType('Error');
		expect(() => tkz.addAfter(f4, "f5", f5)).toThrowErrorOfType('Error');
		expect(() => tkz.addAfter("f4", "f1", f5)).toThrowErrorOfType('Error');
		tkz.addAfter(f3, "f5", f5);
		tkz.addBefore("f5", "f4", f4);

		done();
	});

	it('remove, reset', function (done) {
		let tkz = new Tokenizer();
		tkz.add("f1", f1);
		tkz.add("f2", f2);
		tkz.add("f3", f3);
		tkz.setSplitter("MySplitter", splitter);

		expect(() => tkz.remove(1)).toThrowErrorOfType('Error');
		expect(() => tkz.remove(null)).toThrowErrorOfType('TypeError');
		expect(() => tkz.remove(f4)).toThrowErrorOfType('Error');
		expect(() => tkz.remove("f4")).toThrowErrorOfType('Error');
		tkz.resetSplitter();
		tkz.remove("f1");
		tkz.remove(f2);
		expect(() => tkz.remove(f1)).toThrowErrorOfType('Error');
		expect(() => tkz.remove("f2")).toThrowErrorOfType('Error');
		expect(tkz.get("f3")).toBeArray();
		tkz.reset();
		expect(() => tkz.remove("f3")).toThrowErrorOfType('Error');

		done();
	});

	it('tokenize', function (done) {
		let tkz = new Tokenizer();
		tkz.add("f1", f1);

		expect(tkz.tokenize("Hello world, how are you?!?")).toBeArray();

		done();
	});

	it('serialize from tokenizer', function (done) {
		let tkz = new Tokenizer();
		tkz.add("f1", f1);
		tkz.add("f2", f2);
		tkz.add("f3", f3);

		let serialized = tkz.toJSON();
		expect(() => Tokenizer.fromJSON(serialized, tkz)).not.toThrowAnyError();

		let tkz2 = new Tokenizer();
		tkz.remove("f1");
		expect(() => Tokenizer.fromJSON(serialized, tkz)).toThrowAnyError();

		tkz2.setSplitter("MySplitter", splitter);
		serialized = tkz2.toJSON();
		expect(() => Tokenizer.fromJSON(serialized, tkz)).toThrowAnyError();
		tkz.setSplitter("MySplitter", splitter);
		Tokenizer.fromJSON(serialized, tkz);

		done();
	});

	it('serialize from functions', function (done) {
		let tkz = new Tokenizer();
		tkz.add("f1", f1);
		tkz.add("f2", f2);
		tkz.add("f3", f3);

		let serialized = tkz.toJSON();
		let funcs = {
			splitters: {},
			tokenizers: {
				f1: f1,
				f2: f2,
				f3: f3
			}
		};

		expect(() => Tokenizer.fromJSON(serialized, funcs)).not.toThrowAnyError();

		let tkz2 = new Tokenizer();
		delete funcs.tokenizers.f1;
		expect(() => Tokenizer.fromJSON(serialized, funcs)).toThrowAnyError();

		tkz2.setSplitter("MySplitter", splitter);
		serialized = tkz2.toJSON();
		expect(() => Tokenizer.fromJSON(serialized, funcs)).toThrowAnyError();
		funcs.splitters["MySplitter"] = splitter;
		Tokenizer.fromJSON(serialized, funcs);

		done();
	});
});
