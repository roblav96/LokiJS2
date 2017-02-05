export function isFunction(x) {
	return Object.prototype.toString.call(x) === "[object Function]";
}

export function isObject(x) {
	return Object.prototype.toString.call(x) === "[object Object]";
}

export function isNumber(x) {
	return Object.prototype.toString.call(x) === "[object Number]";
}

export function isBoolean(x) {
	return Object.prototype.toString.call(x) === "[object Boolean]";
}

export function isString(x) {
	return Object.prototype.toString.call(x) === "[object String]";
}

export function isConvertibleToString(x) {
	return isString(x) || isNumber(x) || isObject(x) && isString(x.toString());
}

export function asBoolean(x, error = TypeError("Value is not convertible to boolean")) {
	if (isBoolean(x) || isNumber(x)) {
		return Boolean(x);
	}
	throw error;
}

export function asString(x, error = TypeError("Value is not convertible to string.")) {
	if (isConvertibleToString(x)) {
		return String(x);
	}
	throw error;
}

export function asArrayOfString(x, copy = false, error = TypeError("Value is not convertible to an array of strings.")) {
	if (!Array.isArray(x)) {
		throw error;
	}
	if (copy) {
		let array = [];
		for (let i = 0; i < x.length; i++) {
			if (!isConvertibleToString(x[i])) {
				throw error;
			}
			array.push(String(x[i]));
		}
		return array;
	}
	for (let i = 0; i < x.length; i++) {
		if (!isConvertibleToString(x[i])) {
			throw error;
		}
	}
	return x;
}
