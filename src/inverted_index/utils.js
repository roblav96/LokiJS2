/**
 * Default function to check value.
 * @returns {boolean} - always returns true.
 */
function trueCheck(...args) {
	return true;
}

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

export function isUndefined(x) {
	return x === undefined;
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
	return isString(x) || isBoolean(x) || isNumber(x)
    || (isObject(x) && Object.prototype.toString !== x.toString && isString(x.toString()));
}

/**
 * Converts a value to a boolean (from boolean, number or true/false string).
 * Throws an error if not possible.
 * @param {*} x - the value
 * @param {Object} options - the options to configure to conversation
 * @param {Error} [options.error=TypeError] - the error to throw
 * @param {Function} options.check - the function to check the converted value for against
 * @param {Boolean} options.defaultValue* - the default value, if value is undefined (check not called)
 * @return {boolean} the converted boolean
 * @protected
 */
export function asBoolean(x, {
                            error = TypeError("Value is not convertible to a boolean."),
                            check = trueCheck,
                            defaultValue = undefined
                          } = {}) {
	if (isUndefined(x)) {
		if (!isUndefined(defaultValue)) {
			return defaultValue;
		}
		throw error;
	}
	if (isNumber(x)) {
		x = Boolean(x);
	} else if (isString(x)) {
		if (x === "true") {
			x = true;
		} else if (x === "false") {
			x = false;
		}
	}
	if (isBoolean(x) && check(x)) {
		return x;
	}
	throw error;
}

/**
 * Converts a value to a number (from boolean, numeric string or number).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {Object} options - the options to configure to conversation
 * @param {Error} [options.error=TypeError] - the error to throw
 * @param {Function} [options.check=] - the function to check the converted value for against
 * @param {Number} [options.defaultValue=] - the default value, if value is undefined (check not called)
 * @return {Number} the converted number
 * @protected
 */
export function asNumber(x, {
                           error = TypeError("Value is not convertible to a number."),
                           check = trueCheck,
                           defaultValue = undefined
                         } = {}) {
	if (isUndefined(x)) {
		if (!isUndefined(defaultValue)) {
			return defaultValue;
		}
		throw error;
	}
	x = Number(x);
	if (!isNaN(x) && check(x)) {
		return x;
	}
	throw error;
}

/**
 * Converts a value to a string (from string, number or obj.toString).
 * Throws an error if not possible.
 * @param {*} x - the value
 * @param {Object} options - the options to configure to conversation
 * @param {Error} [option.error=TypeError] - the error to throw
 * @param {Function} [options.check=] - the function to check the converted value for against
 * @param {String} [options.defaultValue=] - the default value, if value is undefined (check not called)
 * @return {String} the converted string
 * @protected
 */
export function asString(x, {
                           error = TypeError("Value is not convertible to string."),
                           check = trueCheck,
                           defaultValue = undefined
                         } = {}) {
	if (isUndefined(x)) {
		if (!isUndefined(defaultValue)) {
			return defaultValue;
		}
		throw error;
	}
	if (isConvertibleToString(x)) {
		x = String(x);
	}
	if (isString(x) && check(x)) {
		return x;
	}
	throw error;
}

/**
 * Converts a variable to a array of string (from an array of string, number or obj.toString).
 * Throws an error if not possible.
 * @param {*} x - the variable
 * @param {Object} options - the options to configure to conversation
 * @param {Error} [options.error=TypeError] - the error to throw
 * @param {Function} [options.check=] - the function to check the converted value for against
 * @param {String[]} options.defaultValue - the default value, if value is undefined (check not called)
 * @return {String[]} the converted array of string
 * @protected
 */
export function asArrayOfString(x, {
                                  error = TypeError("Value is not convertible to an array of strings."),
                                  check = trueCheck,
                                  defaultValue = undefined
                                } = {}) {
	if (isUndefined(x)) {
		if (!isUndefined(defaultValue)) {
			return defaultValue;
		}
		throw error;
	}
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
	if (check(array)) {
		return array;
	}
	throw error;
}
