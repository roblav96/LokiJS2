/*
 * From MihaiValentin/lunr-languages.
 * Last update from 04/16/2017 - 19af41fb9bd644d9081ad274f96f700b21464290
 */
export function generateTrimmer(wordCharacters) {
	const regex = new RegExp("^[^" + wordCharacters + "]+|[^" + wordCharacters + "]+$", "g");
	return (token) => token.replace(regex, '');
}

export function generateStopWordFilter(stopWords) {
	const words = new Set(stopWords);
	return (token) => words.has(token) ? "" : token;
}

export class Among {
	constructor(s, substring_i, result, method) {
		this.toCharArray = function (s) {
			let sLength = s.length, charArr = new Array(sLength);
			for (let i = 0; i < sLength; i++)
				charArr[i] = s.charCodeAt(i);
			return charArr;
		};

		if ((!s && s !== "") || (!substring_i && (substring_i !== 0)) || !result)
			throw ("Bad Among initialisation: s:" + s + ", substring_i: "
			+ substring_i + ", result: " + result);
		this.s_size = s.length;
		this.s = this.toCharArray(s);
		this.substring_i = substring_i;
		this.result = result;
		this.method = method;
	}
}

export class SnowballProgram {

	constructor() {
		this.current = null;
		this.bra = 0;
		this.ket = 0;
		this.limit = 0;
		this.cursor = 0;
		this.limit_backward = 0;
	}

	setCurrent(word) {
		this.current = word;
		this.cursor = 0;
		this.limit = word.length;
		this.limit_backward = 0;
		this.bra = this.cursor;
		this.ket = this.limit;
	}

	getCurrent() {
		let result = this.current;
		this.current = null;
		return result;
	}

	in_grouping(s, min, max) {
		if (this.cursor < this.limit) {
			let ch = this.current.charCodeAt(this.cursor);
			if (ch <= max && ch >= min) {
				ch -= min;
				if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
					this.cursor++;
					return true;
				}
			}
		}
		return false;
	}

	in_grouping_b(s, min, max) {
		if (this.cursor > this.limit_backward) {
			let ch = this.current.charCodeAt(this.cursor - 1);
			if (ch <= max && ch >= min) {
				ch -= min;
				if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
					this.cursor--;
					return true;
				}
			}
		}
		return false;
	}

	out_grouping(s, min, max) {
		if (this.cursor < this.limit) {
			let ch = this.current.charCodeAt(this.cursor);
			if (ch > max || ch < min) {
				this.cursor++;
				return true;
			}
			ch -= min;
			if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
				this.cursor++;
				return true;
			}
		}
		return false;
	}

	out_grouping_b(s, min, max) {
		if (this.cursor > this.limit_backward) {
			let ch = this.current.charCodeAt(this.cursor - 1);
			if (ch > max || ch < min) {
				this.cursor--;
				return true;
			}
			ch -= min;
			if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
				this.cursor--;
				return true;
			}
		}
		return false;
	}

	eq_s(s_size, s) {
		if (this.limit - this.cursor < s_size)
			return false;
		for (let i = 0; i < s_size; i++)
			if (this.current.charCodeAt(this.cursor + i) !== s.charCodeAt(i))
				return false;
		this.cursor += s_size;
		return true;
	}

	eq_s_b(s_size, s) {
		if (this.cursor - this.limit_backward < s_size)
			return false;
		for (let i = 0; i < s_size; i++)
			if (this.current.charCodeAt(this.cursor - s_size + i) !== s.charCodeAt(i))
				return false;
		this.cursor -= s_size;
		return true;
	}

	find_among(v, v_size) {
		let i = 0, j = v_size, c = this.cursor, l = this.limit, common_i = 0, common_j = 0, first_key_inspected = false;
		while (true) {
			let k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
				? common_i
				: common_j, w = v[k];
			for (let i2 = common; i2 < w.s_size; i2++) {
				if (c + common === l) {
					diff = -1;
					break;
				}
				diff = this.current.charCodeAt(c + common) - w.s[i2];
				if (diff)
					break;
				common++;
			}
			if (diff < 0) {
				j = k;
				common_j = common;
			} else {
				i = k;
				common_i = common;
			}
			if (j - i <= 1) {
				if (i > 0 || j === i || first_key_inspected)
					break;
				first_key_inspected = true;
			}
		}
		while (true) {
			let w = v[i];
			if (common_i >= w.s_size) {
				this.cursor = c + w.s_size;
				if (!w.method)
					return w.result;
				let res = w.method();
				this.cursor = c + w.s_size;
				if (res)
					return w.result;
			}
			i = w.substring_i;
			if (i < 0)
				return 0;
		}
	}

	find_among_b(v, v_size) {
		let i = 0, j = v_size, c = this.cursor, lb = this.limit_backward, common_i = 0, common_j = 0,
			first_key_inspected = false;
		while (true) {
			let k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
				? common_i
				: common_j, w = v[k];
			for (let i2 = w.s_size - 1 - common; i2 >= 0; i2--) {
				if (c - common === lb) {
					diff = -1;
					break;
				}
				diff = this.current.charCodeAt(c - 1 - common) - w.s[i2];
				if (diff)
					break;
				common++;
			}
			if (diff < 0) {
				j = k;
				common_j = common;
			} else {
				i = k;
				common_i = common;
			}
			if (j - i <= 1) {
				if (i > 0 || j === i || first_key_inspected)
					break;
				first_key_inspected = true;
			}
		}
		while (true) {
			let w = v[i];
			if (common_i >= w.s_size) {
				this.cursor = c - w.s_size;
				if (!w.method)
					return w.result;
				let res = w.method();
				this.cursor = c - w.s_size;
				if (res)
					return w.result;
			}
			i = w.substring_i;
			if (i < 0)
				return 0;
		}
	}

	replace_s(c_bra, c_ket, s) {
		let adjustment = s.length - (c_ket - c_bra), left = this.current
			.substring(0, c_bra), right = this.current.substring(c_ket);
		this.current = left + s + right;
		this.limit += adjustment;
		if (this.cursor >= c_ket)
			this.cursor += adjustment;
		else if (this.cursor > c_bra)
			this.cursor = c_bra;
		return adjustment;
	}

	slice_check() {
		if (this.bra < 0 || this.bra > this.ket || this.ket > this.limit
			|| this.limit > this.current.length)
			throw ("faulty slice operation");
	}

	slice_from(s) {
		this.slice_check();
		this.replace_s(this.bra, this.ket, s);
	}

	slice_del() {
		this.slice_from("");
	}

	insert(c_bra, c_ket, s) {
		let adjustment = this.replace_s(c_bra, c_ket, s);
		if (c_bra <= this.bra)
			this.bra += adjustment;
		if (c_bra <= this.ket)
			this.ket += adjustment;
	}

	slice_to() {
		this.slice_check();
		return this.current.substring(this.bra, this.ket);
	}

	eq_v_b(s) {
		return this.eq_s_b(s.length, s);
	}
}
