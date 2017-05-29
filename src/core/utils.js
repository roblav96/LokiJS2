/**
 * Created by toni on 1/27/17.
 */
export const Utils = {
	copyProperties: function (src, dest) {
		let prop;
		for (prop in src) {
			dest[prop] = src[prop];
		}
	},
	// used to recursively scan hierarchical transform step object for param substitution
	resolveTransformObject: function (subObj, params, depth) {
		let prop, pname;

		if (typeof depth !== 'number') {
			depth = 0;
		}

		if (++depth >= 10) return subObj;

		for (prop in subObj) {
			if (typeof subObj[prop] === 'string' && subObj[prop].indexOf("[%lktxp]") === 0) {
				pname = subObj[prop].substring(8);
				if (params.hasOwnProperty(pname)) {
					subObj[prop] = params[pname];
				}
			} else if (typeof subObj[prop] === "object") {
				subObj[prop] = Utils.resolveTransformObject(subObj[prop], params, depth);
			}
		}

		return subObj;
	},
	// top level utility to resolve an entire (single) transform (array of steps) for parameter substitution
	resolveTransformParams: function (transform, params) {
		let idx;
		let clonedStep;
		const resolvedTransform = [];

		if (typeof params === 'undefined') return transform;

		// iterate all steps in the transform array
		for (idx = 0; idx < transform.length; idx++) {
			// clone transform so our scan and replace can operate directly on cloned transform
			clonedStep = JSON.parse(JSON.stringify(transform[idx]));
			resolvedTransform.push(Utils.resolveTransformObject(clonedStep, params));
		}

		return resolvedTransform;
	}
};
