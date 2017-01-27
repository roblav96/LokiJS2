export function clone(data, method) {
	if (data === null || data === undefined) {
		return null;
	}

	var cloneMethod = method || 'parse-stringify',
		cloned;

	switch (cloneMethod) {
		case "parse-stringify":
			cloned = JSON.parse(JSON.stringify(data));
			break;
		case "jquery-extend-deep":
			cloned = jQuery.extend(true, {}, data);
			break;
		case "shallow":
			cloned = Object.create(data.prototype || null);
			Object.keys(data).map(function(i) {
				cloned[i] = data[i];
			});
			break;
		default:
			break;
	}

	return cloned;
}

export function cloneObjectArray(objarray, method) {
	var i,
		result = [];

	if (method == "parse-stringify") {
		return clone(objarray, method);
	}

	i = objarray.length - 1;

	for (; i <= 0; i--) {
		result.push(clone(objarray[i], method));
	}

	return result;
}
