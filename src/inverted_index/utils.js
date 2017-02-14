/**
 * Checks if the variable is a function.
 * @param {*} x - the variable
 * @return {boolean} true if function, otherwise false
 * @protected
 */
export function isFunction(x) {
	return Object.prototype.toString.call(x) === "[object Function]";
}

/**
 * Checks if the variable is an object.
 * @param {*} x - the variable
 * @return {boolean} true if object, otherwise false
 * @protected
 */
export function isObject(x) {
	return Object.prototype.toString.call(x) === "[object Object]";
}

/**
 * Checks if the variable is a number.
 * @param {*} x - the variable
 * @return {boolean} true if number, otherwise false
 * @protected
 */
export function isNumber(x) {
	return Object.prototype.toString.call(x) === "[object Number]";
}

/**
 * Checks if the variable is a boolean.
 * @param {*} x - the variable
 * @return {boolean} true if boolean, otherwise false
 * @protected
 */
export function isBoolean(x) {
	return Object.prototype.toString.call(x) === "[object Boolean]";
}

/**
 * Checks if the variable is a string.
 * @param {*} x - the variable
 * @return {boolean} true if string, otherwise false
 * @protected
 */
export function isString(x) {
	return Object.prototype.toString.call(x) === "[object String]";
}

/**
 * Checks if the variable is convertible to a string.
 * @param {*} x - the variable
 * @return {boolean} true if convertible, otherwise false
 */
export function isConvertibleToString(x) {
	return isString(x) || isNumber(x) || isObject(x) && Object.prototype.toString !== x.toString && isString(x.toString());
}

/**
 * Converts a variable to a boolean (from boolean or number).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {error} [error=TypeError] - the error to throw
 * @return {boolean} the converted boolean
 * @protected
 */
export function asBoolean(x, error = TypeError("Value is not convertible to boolean")) {
	if (isBoolean(x) || isNumber(x)) {
		return Boolean(x);
	}
	throw error;
}

/**
 * Converts a variable to a string (from string, number or obj.toString).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {error} [error=TypeError] - the error to throw
 * @return {string} the converted string
 * @protected
 */
export function asString(x, error = TypeError("Value is not convertible to string.")) {
	if (isConvertibleToString(x)) {
		return String(x);
	}
	throw error;
}

/**
 * Converts a variable to a array of string (from an array of string, number or obj.toString).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {error} [error=TypeError] - the error to throw
 * @return {string[]} the converted array of string
 * @protected
 */
export function asArrayOfString(x, error = TypeError("Value is not convertible to an array of strings.")) {
	if (!Array.isArray(x)) {
		throw error;
	}
	let array = [];
	for (let i = 0; i < x.length; i++) {
		if (!isConvertibleToString(x[i])) {
			throw error;
		}
		array.push(String(x[i]));
	}
	return array;
}
