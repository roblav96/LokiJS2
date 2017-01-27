/**
 * Created by toni on 1/27/17.
 */


/** Helper function for determining 'less-than' conditions for ops, sorting, and binary indices.
 *     In the future we might want $lt and $gt ops to use their own functionality/helper.
 *     Since binary indices on a property might need to index [12, NaN, new Date(), Infinity], we
 *     need this function (as well as gtHelper) to always ensure one value is LT, GT, or EQ to another.
 */
export function ltHelper(prop1, prop2, equal) {
	var cv1, cv2;

	// 'falsy' and Boolean handling
	if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
		if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
			if (equal) {
				return prop1 === prop2;
			} else {
				if (prop1) {
					return false;
				} else {
					return prop2;
				}
			}
		}

		if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
			return equal;
		}
		if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
			return true;
		}
	}

	if (prop1 === prop2) {
		return equal;
	}

	if (prop1 < prop2) {
		return true;
	}

	if (prop1 > prop2) {
		return false;
	}

	// not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
	cv1 = prop1.toString();
	cv2 = prop2.toString();

	if (cv1 == cv2) {
		return equal;
	}

	if (cv1 < cv2) {
		return true;
	}

	return false;
}

export function gtHelper(prop1, prop2, equal) {
	var cv1, cv2;

	// 'falsy' and Boolean handling
	if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
		if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
			if (equal) {
				return prop1 === prop2;
			} else {
				if (prop1) {
					return !prop2;
				} else {
					return false;
				}
			}
		}

		if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
			return equal;
		}
		if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
			return true;
		}
	}

	if (prop1 === prop2) {
		return equal;
	}

	if (prop1 > prop2) {
		return true;
	}

	if (prop1 < prop2) {
		return false;
	}

	// not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
	cv1 = prop1.toString();
	cv2 = prop2.toString();

	if (cv1 == cv2) {
		return equal;
	}

	if (cv1 > cv2) {
		return true;
	}

	return false;
}
