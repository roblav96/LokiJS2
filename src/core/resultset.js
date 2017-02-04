import {clone} from './clone';
import {Collection} from './collection';
import {Utils} from './utils';
import {ltHelper, gtHelper} from './helper';

/*
 'Utils' is not defined                 no-undef	(resolveTransformParams)
 'sortHelper' is not defined            no-undef
 'compoundeval' is not defined          no-undef
 'indexedOpsList' is not defined        no-undef
 'LokiOps' is not defined               no-undef
 'dotSubScan' is not defined            no-undef
 'clone' is not defined                 no-undef


 */

function containsCheckFn(a) {
	if (typeof a === 'string' || Array.isArray(a)) {
		return function(b) {
			return a.indexOf(b) !== -1;
		};
	} else if (typeof a === 'object' && a !== null) {
		return function(b) {
			return hasOwnProperty.call(a, b);
		};
	}
	return null;
}

function doQueryOp(val, op) {
	for (var p in op) {
		if (hasOwnProperty.call(op, p)) {
			return LokiOps[p](val, op[p]);
		}
	}
	return false;
}


export var LokiOps = {
	// comparison operators
	// a is the value in the collection
	// b is the query value
	$eq: function(a, b) {
		return a === b;
	},

	// abstract/loose equality
	$aeq: function(a, b) {
		return a == b;
	},

	$ne: function(a, b) {
		// ecma 5 safe test for NaN
		if (b !== b) {
			// ecma 5 test value is not NaN
			return (a === a);
		}

		return a !== b;
	},

	$dteq: function(a, b) {
		if (ltHelper(a, b, false)) {
			return false;
		}
		return !gtHelper(a, b, false);
	},

	$gt: function(a, b) {
		return gtHelper(a, b, false);
	},

	$gte: function(a, b) {
		return gtHelper(a, b, true);
	},

	$lt: function(a, b) {
		return ltHelper(a, b, false);
	},

	$lte: function(a, b) {
		return ltHelper(a, b, true);
	},

	// ex : coll.find({'orderCount': {$between: [10, 50]}});
	$between: function(a, vals) {
		if (a === undefined || a === null) return false;
		return (gtHelper(a, vals[0], true) && ltHelper(a, vals[1], true));
	},

	$in: function(a, b) {
		return b.indexOf(a) !== -1;
	},

	$nin: function(a, b) {
		return b.indexOf(a) === -1;
	},

	$keyin: function(a, b) {
		return a in b;
	},

	$nkeyin: function(a, b) {
		return !(a in b);
	},

	$definedin: function(a, b) {
		return b[a] !== undefined;
	},

	$undefinedin: function(a, b) {
		return b[a] === undefined;
	},

	$regex: function(a, b) {
		return b.test(a);
	},

	$containsString: function(a, b) {
		return (typeof a === 'string') && (a.indexOf(b) !== -1);
	},

	$containsNone: function(a, b) {
		return !LokiOps.$containsAny(a, b);
	},

	$containsAny: function(a, b) {
		var checkFn = containsCheckFn(a);
		if (checkFn !== null) {
			return (Array.isArray(b)) ? (b.some(checkFn)) : (checkFn(b));
		}
		return false;
	},

	$contains: function(a, b) {
		var checkFn = containsCheckFn(a);
		if (checkFn !== null) {
			return (Array.isArray(b)) ? (b.every(checkFn)) : (checkFn(b));
		}
		return false;
	},

	$type: function(a, b) {
		var type = typeof a;
		if (type === 'object') {
			if (Array.isArray(a)) {
				type = 'array';
			} else if (a instanceof Date) {
				type = 'date';
			}
		}
		return (typeof b !== 'object') ? (type === b) : doQueryOp(type, b);
	},

	$size: function(a, b) {
		if (Array.isArray(a)) {
			return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b);
		}
		return false;
	},

	$len: function(a, b) {
		if (typeof a === 'string') {
			return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b);
		}
		return false;
	},

	$where: function(a, b) {
		return b(a) === true;
	},

	// field-level logical operators
	// a is the value in the collection
	// b is the nested query operation (for '$not')
	//   or an array of nested query operations (for '$and' and '$or')
	$not: function(a, b) {
		return !doQueryOp(a, b);
	},

	$and: function(a, b) {
		for (var idx = 0, len = b.length; idx < len; idx += 1) {
			if (!doQueryOp(a, b[idx])) {
				return false;
			}
		}
		return true;
	},

	$or: function(a, b) {
		for (var idx = 0, len = b.length; idx < len; idx += 1) {
			if (doQueryOp(a, b[idx])) {
				return true;
			}
		}
		return false;
	}
};

// making indexing opt-in... our range function knows how to deal with these ops :
var indexedOpsList = ['$eq', '$aeq', '$dteq', '$gt', '$gte', '$lt', '$lte', '$in', '$between'];


function sortHelper(prop1, prop2, desc) {
	if (prop1 === prop2) {
		return 0;
	}

	if (ltHelper(prop1, prop2, false)) {
		return (desc) ? (1) : (-1);
	}

	if (gtHelper(prop1, prop2, false)) {
		return (desc) ? (-1) : (1);
	}

	// not lt, not gt so implied equality-- date compatible
	return 0;
}

/**
 * compoundeval() - helper function for compoundsort(), performing individual object comparisons
 *
 * @param {array} properties - array of property names, in order, by which to evaluate sort order
 * @param {object} obj1 - first object to compare
 * @param {object} obj2 - second object to compare
 * @returns {integer} 0, -1, or 1 to designate if identical (sortwise) or which should be first
 */
function compoundeval(properties, obj1, obj2) {
	var res = 0;
	var prop, field;
	for (var i = 0, len = properties.length; i < len; i++) {
		prop = properties[i];
		field = prop[0];
		res = sortHelper(obj1[field], obj2[field], prop[1]);
		if (res !== 0) {
			return res;
		}
	}
	return 0;
}


/**
 * dotSubScan - helper function used for dot notation queries.
 *
 * @param {object} root - object to traverse
 * @param {array} paths - array of properties to drill into
 * @param {function} fun - evaluation function to test with
 * @param {any} value - comparative value to also pass to (compare) fun
 * @param {number} poffset - index of the item in 'paths' to start the sub-scan from
 */
function dotSubScan(root, paths, fun, value, poffset) {
	var pathOffset = poffset || 0;
	var path = paths[pathOffset];
	if (root === undefined || root === null || !hasOwnProperty.call(root, path)) {
		return false;
	}

	var valueFound = false;
	var element = root[path];
	if (pathOffset + 1 >= paths.length) {
		// if we have already expanded out the dot notation,
		// then just evaluate the test function and value on the element
		valueFound = fun(element, value);
	} else if (Array.isArray(element)) {
		for (var index = 0, len = element.length; index < len; index += 1) {
			valueFound = dotSubScan(element[index], paths, fun, value, pathOffset + 1);
			if (valueFound === true) {
				break;
			}
		}
	} else {
		valueFound = dotSubScan(element, paths, fun, value, pathOffset + 1);
	}

	return valueFound;
}

/**
 * Resultset class allowing chainable queries.  Intended to be instanced internally.
 *    Collection.find(), Collection.where(), and Collection.chain() instantiate this.
 *
 * @example
 *    mycollection.chain()
 *      .find({ 'doors' : 4 })
 *      .where(function(obj) { return obj.name === 'Toyota' })
 *      .data();
 *
 * @constructor Resultset
 * @param {Collection} collection - The collection which this Resultset will query against.
 * @param {Object=} options - Object containing one or more options.
 * @param {string} options.queryObj - Optional mongo-style query object to initialize resultset with.
 * @param {function} options.queryFunc - Optional javascript filter function to initialize resultset with.
 * @param {bool} options.firstOnly - Optional boolean used by collection.findOne().
 */
export class Resultset {

	constructor(collection, options) {
		options = options || {};

		options.queryObj = options.queryObj || null;
		options.queryFunc = options.queryFunc || null;
		options.firstOnly = options.firstOnly || false;

		// retain reference to collection we are querying against
		this.collection = collection;

		// if chain() instantiates with null queryObj and queryFunc, so we will keep flag for later
		this.searchIsChained = (!options.queryObj && !options.queryFunc);
		this.filteredrows = [];
		this.filterInitialized = false;

		// if user supplied initial queryObj or queryFunc, apply it
		if (typeof(options.queryObj) !== "undefined" && options.queryObj !== null) {
			return this.find(options.queryObj, options.firstOnly);
		}
		if (typeof(options.queryFunc) !== "undefined" && options.queryFunc !== null) {
			return this.where(options.queryFunc);
		}

		// otherwise return unfiltered Resultset for future filtering
		return this;
	}

	/**
	 * reset() - Reset the resultset to its initial state.
	 *
	 * @returns {Resultset} Reference to this resultset, for future chain operations.
	 */
	reset() {
		if (this.filteredrows.length > 0) {
			this.filteredrows = [];
		}
		this.filterInitialized = false;
		return this;
	}

	/**
	 * toJSON() - Override of toJSON to avoid circular references
	 *
	 */
	toJSON() {
		var copy = this.copy();
		copy.collection = null;
		return copy;
	}

	/**
	 * Allows you to limit the number of documents passed to next chain operation.
	 *    A resultset copy() is made to avoid altering original resultset.
	 *
	 * @param {int} qty - The number of documents to return.
	 * @returns {Resultset} Returns a copy of the resultset, limited by qty, for subsequent chain ops.
	 * @memberof Resultset
	 */
	limit(qty) {
		// if this is chained resultset with no filters applied, we need to populate filteredrows first
		if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
			this.filteredrows = this.collection.prepareFullDocIndex();
		}

		var rscopy = new Resultset(this.collection);
		rscopy.filteredrows = this.filteredrows.slice(0, qty);
		rscopy.filterInitialized = true;
		return rscopy;
	}

	/**
	 * Used for skipping 'pos' number of documents in the resultset.
	 *
	 * @param {int} pos - Number of documents to skip; all preceding documents are filtered out.
	 * @returns {Resultset} Returns a copy of the resultset, containing docs starting at 'pos' for subsequent chain ops.
	 * @memberof Resultset
	 */
	offset(pos) {
		// if this is chained resultset with no filters applied, we need to populate filteredrows first
		if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
			this.filteredrows = this.collection.prepareFullDocIndex();
		}

		var rscopy = new Resultset(this.collection);
		rscopy.filteredrows = this.filteredrows.slice(pos);
		rscopy.filterInitialized = true;
		return rscopy;
	}

	/**
	 * copy() - To support reuse of resultset in branched query situations.
	 *
	 * @returns {Resultset} Returns a copy of the resultset (set) but the underlying document references will be the same.
	 * @memberof Resultset
	 */
	copy() {
		var result = new Resultset(this.collection);

		if (this.filteredrows.length > 0) {
			result.filteredrows = this.filteredrows.slice();
		}
		result.filterInitialized = this.filterInitialized;

		return result;
	}

	/**
	 * Alias of copy()
	 * @memberof Resultset
	 */
	branch() {
		return this.copy();
	}

	/**
	 * transform() - executes a named collection transform or raw array of transform steps against the resultset.
	 *
	 * @param transform {(string|array)} - name of collection transform or raw transform array
	 * @param parameters {object=} - (Optional) object property hash of parameters, if the transform requires them.
	 * @returns {Resultset} either (this) resultset or a clone of of this resultset (depending on steps)
	 * @memberof Resultset
	 */
	transform(transform, parameters) {
		var idx,
			step,
			rs = this;

		// if transform is name, then do lookup first
		if (typeof transform === 'string') {
			if (this.collection.transforms.hasOwnProperty(transform)) {
				transform = this.collection.transforms[transform];
			}
		}

		// either they passed in raw transform array or we looked it up, so process
		if (typeof transform !== 'object' || !Array.isArray(transform)) {
			throw new Error("Invalid transform");
		}

		if (typeof parameters !== 'undefined') {
			transform = Utils.resolveTransformParams(transform, parameters);
		}

		for (idx = 0; idx < transform.length; idx++) {
			step = transform[idx];

			switch (step.type) {
				case "find":
					rs.find(step.value);
					break;
				case "where":
					rs.where(step.value);
					break;
				case "simplesort":
					rs.simplesort(step.property, step.desc);
					break;
				case "compoundsort":
					rs.compoundsort(step.value);
					break;
				case "sort":
					rs.sort(step.value);
					break;
				case "limit":
					rs = rs.limit(step.value);
					break; // limit makes copy so update reference
				case "offset":
					rs = rs.offset(step.value);
					break; // offset makes copy so update reference
				case "map":
					rs = rs.map(step.value);
					break;
				case "eqJoin":
					rs = rs.eqJoin(step.joinData, step.leftJoinKey, step.rightJoinKey, step.mapFun);
					break;
				// following cases break chain by returning array data so make any of these last in transform steps
				case "mapReduce":
					rs = rs.mapReduce(step.mapFunction, step.reduceFunction);
					break;
				// following cases update documents in current filtered resultset (use carefully)
				case "update":
					rs.update(step.value);
					break;
				case "remove":
					rs.remove();
					break;
				default:
					break;
			}
		}

		return rs;
	}

	/**
	 * Instances a new anonymous collection with the documents contained in the current resultset.
	 *
	 * @param {object} collectionOptions - Options to pass to new anonymous collection construction.
	 * @returns {Collection} A reference to an anonymous collection initialized with resultset data().
	 * @memberof Resultset
	 */
	instance(collectionOptions) {
		var docs = this.data();
		var idx,
			doc;

		collectionOptions = collectionOptions || {};

		var instanceCollection = new Collection(collectionOptions);

		for (idx = 0; idx < docs.length; idx++) {
			if (this.collection.cloneObjects) {
				doc = docs[idx];
			} else {
				doc = clone(docs[idx], this.collection.cloneMethod);
			}

			delete doc.$loki;
			delete doc.meta;

			instanceCollection.insert(doc);
		}

		return instanceCollection;
	}

	/**
	 * User supplied compare function is provided two documents to compare. (chainable)
	 * @example
	 *    rslt.sort(function(obj1, obj2) {
	 *      if (obj1.name === obj2.name) return 0;
	 *      if (obj1.name > obj2.name) return 1;
	 *      if (obj1.name < obj2.name) return -1;
	 *    });
	 *
	 * @param {function} comparefun - A javascript compare function used for sorting.
	 * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
	 * @memberof Resultset
	 */
	sort(comparefun) {
		// if this is chained resultset with no filters applied, just we need to populate filteredrows first
		if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
			this.filteredrows = this.collection.prepareFullDocIndex();
		}

		var wrappedComparer =
			(function(userComparer, data) {
				return function(a, b) {
					return userComparer(data[a], data[b]);
				};
			})(comparefun, this.collection.data);

		this.filteredrows.sort(wrappedComparer);

		return this;
	}

	/**
	 * Simpler, loose evaluation for user to sort based on a property name. (chainable).
	 *    Sorting based on the same lt/gt helper functions used for binary indices.
	 *
	 * @param {string} propname - name of property to sort by.
	 * @param {bool=} isdesc - (Optional) If true, the property will be sorted in descending order
	 * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
	 * @memberof Resultset
	 */
	simplesort(propname, isdesc) {
		// if this is chained resultset with no filters applied, just we need to populate filteredrows first
		if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
			// if we have a binary index and no other filters applied, we can use that instead of sorting (again)
			if (this.collection.binaryIndices.hasOwnProperty(propname)) {
				// make sure index is up-to-date
				this.collection.ensureIndex(propname);
				// copy index values into filteredrows
				this.filteredrows = this.collection.binaryIndices[propname].values.slice(0);
				// we are done, return this (resultset) for further chain ops
				return this;
			}
			// otherwise initialize array for sort below
			else {
				this.filteredrows = this.collection.prepareFullDocIndex();
			}
		}

		if (typeof(isdesc) === 'undefined') {
			isdesc = false;
		}

		var wrappedComparer =
			(function(prop, desc, data) {
				return function(a, b) {
					return sortHelper(data[a][prop], data[b][prop], desc);
				};
			})(propname, isdesc, this.collection.data);

		this.filteredrows.sort(wrappedComparer);

		return this;
	}

	/**
	 * Allows sorting a resultset based on multiple columns.
	 * @example
	 * // to sort by age and then name (both ascending)
	 * rs.compoundsort(['age', 'name']);
	 * // to sort by age (ascending) and then by name (descending)
	 * rs.compoundsort(['age', ['name', true]);
	 *
	 * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
	 * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
	 * @memberof Resultset
	 */
	compoundsort(properties) {
		if (properties.length === 0) {
			throw new Error("Invalid call to compoundsort, need at least one property");
		}

		var prop;
		if (properties.length === 1) {
			prop = properties[0];
			if (Array.isArray(prop)) {
				return this.simplesort(prop[0], prop[1]);
			}
			return this.simplesort(prop, false);
		}

		// unify the structure of 'properties' to avoid checking it repeatedly while sorting
		for (var i = 0, len = properties.length; i < len; i += 1) {
			prop = properties[i];
			if (!Array.isArray(prop)) {
				properties[i] = [prop, false];
			}
		}

		// if this is chained resultset with no filters applied, just we need to populate filteredrows first
		if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
			this.filteredrows = this.collection.prepareFullDocIndex();
		}

		var wrappedComparer =
			(function(props, data) {
				return function(a, b) {
					return compoundeval(props, data[a], data[b]);
				};
			})(properties, this.collection.data);

		this.filteredrows.sort(wrappedComparer);

		return this;
	}

	/**
	 * findOr() - oversee the operation of OR'ed query expressions.
	 *    OR'ed expression evaluation runs each expression individually against the full collection,
	 *    and finally does a set OR on each expression's results.
	 *    Each evaluation can utilize a binary index to prevent multiple linear array scans.
	 *
	 * @param {array} expressionArray - array of expressions
	 * @returns {Resultset} this resultset for further chain ops.
	 */
	findOr(expressionArray) {
		var fr = null,
			fri = 0,
			frlen = 0,
			docset = [],
			idxset = [],
			idx = 0,
			origCount = this.count();

		// If filter is already initialized, then we query against only those items already in filter.
		// This means no index utilization for fields, so hopefully its filtered to a smallish filteredrows.
		for (var ei = 0, elen = expressionArray.length; ei < elen; ei++) {
			// we need to branch existing query to run each filter separately and combine results
			fr = this.branch().find(expressionArray[ei]).filteredrows;
			frlen = fr.length;
			// if the find operation did not reduce the initial set, then the initial set is the actual result
			if (frlen === origCount) {
				return this;
			}

			// add any document 'hits'
			for (fri = 0; fri < frlen; fri++) {
				idx = fr[fri];
				if (idxset[idx] === undefined) {
					idxset[idx] = true;
					docset.push(idx);
				}
			}
		}

		this.filteredrows = docset;
		this.filterInitialized = true;

		return this;
	}
	$or() {
		return this.findOr(...arguments);
	}

	/**
	 * findAnd() - oversee the operation of AND'ed query expressions.
	 *    AND'ed expression evaluation runs each expression progressively against the full collection,
	 *    internally utilizing existing chained resultset functionality.
	 *    Only the first filter can utilize a binary index.
	 *
	 * @param {array} expressionArray - array of expressions
	 * @returns {Resultset} this resultset for further chain ops.
	 */
	findAnd(expressionArray) {
		// we have already implementing method chaining in this (our Resultset class)
		// so lets just progressively apply user supplied and filters
		for (var i = 0, len = expressionArray.length; i < len; i++) {
			if (this.count() === 0) {
				return this;
			}
			this.find(expressionArray[i]);
		}
		return this;
	}

	$and() {
		return this.findAnd(...arguments);
	}

	/**
	 * Used for querying via a mongo-style query object.
	 *
	 * @param {object} query - A mongo-style query object used for filtering current results.
	 * @param {boolean=} firstOnly - (Optional) Used by collection.findOne()
	 * @returns {Resultset} this resultset for further chain ops.
	 * @memberof Resultset
	 */
	find(query, firstOnly) {
		if (this.collection.data.length === 0) {
			if (this.searchIsChained) {
				this.filteredrows = [];
				this.filterInitialized = true;
				return this;
			}
			return [];
		}

		var queryObject = query || 'getAll',
			p,
			property,
			queryObjectOp,
			operator,
			value,
			key,
			searchByIndex = false,
			result = [],
			index = null;

		// if this was note invoked via findOne()
		firstOnly = firstOnly || false;

		if (typeof queryObject === 'object') {
			for (p in queryObject) {
				if (hasOwnProperty.call(queryObject, p)) {
					property = p;
					queryObjectOp = queryObject[p];
					break;
				}
			}
		}

		// apply no filters if they want all
		if (!property || queryObject === 'getAll') {
			// coll.find(), coll.findOne(), coll.chain().find().data() all path here

			if (firstOnly) {
				return (this.collection.data.length > 0) ? this.collection.data[0] : null;
			}

			return (this.searchIsChained) ? (this) : (this.collection.data.slice());
		}

		// injecting $and and $or expression tree evaluation here.
		if (property === '$and' || property === '$or') {
			if (this.searchIsChained) {
				this[property](queryObjectOp);

				// for chained find with firstonly,
				if (firstOnly && this.filteredrows.length > 1) {
					this.filteredrows = this.filteredrows.slice(0, 1);
				}

				return this;
			} else {
				// our $and operation internally chains filters
				result = this.collection.chain()[property](queryObjectOp).data();

				// if this was coll.findOne() return first object or empty array if null
				// since this is invoked from a constructor we can't return null, so we will
				// make null in coll.findOne();
				if (firstOnly) {
					return (result.length === 0) ? ([]) : (result[0]);
				}

				// not first only return all results
				return result;
			}
		}

		// see if query object is in shorthand mode (assuming eq operator)
		if (queryObjectOp === null || (typeof queryObjectOp !== 'object' || queryObjectOp instanceof Date)) {
			operator = '$eq';
			value = queryObjectOp;
		} else if (typeof queryObjectOp === 'object') {
			for (key in queryObjectOp) {
				if (hasOwnProperty.call(queryObjectOp, key)) {
					operator = key;
					value = queryObjectOp[key];
					break;
				}
			}
		} else {
			throw new Error('Do not know what you want to do.');
		}

		// for regex ops, precompile
		if (operator === '$regex') {
			if (Array.isArray(value)) {
				value = new RegExp(value[0], value[1]);
			} else if (!(value instanceof RegExp)) {
				value = new RegExp(value);
			}
		}

		// if user is deep querying the object such as find('name.first': 'odin')
		var usingDotNotation = (property.indexOf('.') !== -1);

		// if an index exists for the property being queried against, use it
		// for now only enabling for non-chained query (who's set of docs matches index)
		// or chained queries where it is the first filter applied and prop is indexed
		var doIndexCheck = !usingDotNotation &&
			(!this.searchIsChained || !this.filterInitialized);

		if (doIndexCheck && this.collection.binaryIndices[property] &&
			indexedOpsList.indexOf(operator) !== -1) {
			// this is where our lazy index rebuilding will take place
			// basically we will leave all indexes dirty until we need them
			// so here we will rebuild only the index tied to this property
			// ensureIndex() will only rebuild if flagged as dirty since we are not passing force=true param
			if (this.collection.adaptiveBinaryIndices !== true) {
				this.collection.ensureIndex(property);
			}

			searchByIndex = true;
			index = this.collection.binaryIndices[property];
		}

		// the comparison function
		var fun = LokiOps[operator];

		// "shortcut" for collection data
		var t = this.collection.data;
		// filter data length
		var i = 0,
			len = 0;

		// Query executed differently depending on :
		//    - whether it is chained or not
		//    - whether the property being queried has an index defined
		//    - if chained, we handle first pass differently for initial filteredrows[] population
		//
		// For performance reasons, each case has its own if block to minimize in-loop calculations

		// If not a chained query, bypass filteredrows and work directly against data
		if (!this.searchIsChained) {
			if (!searchByIndex) {
				i = t.length;

				if (firstOnly) {
					if (usingDotNotation) {
						property = property.split('.');
						while (i--) {
							if (dotSubScan(t[i], property, fun, value)) {
								return (t[i]);
							}
						}
					} else {
						while (i--) {
							if (fun(t[i][property], value)) {
								return (t[i]);
							}
						}
					}

					return [];
				}

				// if using dot notation then treat property as keypath such as 'name.first'.
				// currently supporting dot notation for non-indexed conditions only
				if (usingDotNotation) {
					property = property.split('.');
					while (i--) {
						if (dotSubScan(t[i], property, fun, value)) {
							result.push(t[i]);
						}
					}
				} else {
					while (i--) {
						if (fun(t[i][property], value)) {
							result.push(t[i]);
						}
					}
				}
			} else {
				// searching by binary index via calculateRange() utility method
				var seg = this.collection.calculateRange(operator, property, value);

				// not chained so this 'find' was designated in Resultset constructor
				// so return object itself
				if (firstOnly) {
					if (seg[1] !== -1) {
						return t[index.values[seg[0]]];
					}
					return [];
				}

				if (operator !== '$in') {
					for (i = seg[0]; i <= seg[1]; i++) {
						result.push(t[index.values[i]]);
					}
				} else {
					for (i = 0, len = seg.length; i < len; i++) {
						result.push(t[index.values[seg[i]]]);
					}
				}
			}

			// not a chained query so return result as data[]
			return result;
		}


		// Otherwise this is a chained query
		// Chained queries now preserve results ordering at expense on slightly reduced unindexed performance

		var filter, rowIdx = 0;

		// If the filteredrows[] is already initialized, use it
		if (this.filterInitialized) {
			filter = this.filteredrows;
			len = filter.length;

			// currently supporting dot notation for non-indexed conditions only
			if (usingDotNotation) {
				property = property.split('.');
				for (i = 0; i < len; i++) {
					rowIdx = filter[i];
					if (dotSubScan(t[rowIdx], property, fun, value)) {
						result.push(rowIdx);
					}
				}
			} else {
				for (i = 0; i < len; i++) {
					rowIdx = filter[i];
					if (fun(t[rowIdx][property], value)) {
						result.push(rowIdx);
					}
				}
			}
		}
		// first chained query so work against data[] but put results in filteredrows
		else {
			// if not searching by index
			if (!searchByIndex) {
				len = t.length;

				if (usingDotNotation) {
					property = property.split('.');
					for (i = 0; i < len; i++) {
						if (dotSubScan(t[i], property, fun, value)) {
							result.push(i);
						}
					}
				} else {
					for (i = 0; i < len; i++) {
						if (fun(t[i][property], value)) {
							result.push(i);
						}
					}
				}
			} else {
				// search by index
				var segm = this.collection.calculateRange(operator, property, value);

				if (operator !== '$in') {
					for (i = segm[0]; i <= segm[1]; i++) {
						result.push(index.values[i]);
					}
				} else {
					for (i = 0, len = segm.length; i < len; i++) {
						result.push(index.values[segm[i]]);
					}
				}
			}

			this.filterInitialized = true; // next time work against filteredrows[]
		}

		this.filteredrows = result;
		return this;
	}


	/**
	 * where() - Used for filtering via a javascript filter function.
	 *
	 * @param {function} fun - A javascript function used for filtering current results by.
	 * @returns {Resultset} this resultset for further chain ops.
	 * @memberof Resultset
	 */
	where(fun) {
		var viewFunction,
			result = [];

		if ('function' === typeof fun) {
			viewFunction = fun;
		} else {
			throw new TypeError('Argument is not a stored view or a function');
		}
		try {
			// if not a chained query then run directly against data[] and return object []
			if (!this.searchIsChained) {
				var i = this.collection.data.length;

				while (i--) {
					if (viewFunction(this.collection.data[i]) === true) {
						result.push(this.collection.data[i]);
					}
				}

				// not a chained query so returning result as data[]
				return result;
			}
			// else chained query, so run against filteredrows
			else {
				// If the filteredrows[] is already initialized, use it
				if (this.filterInitialized) {
					var j = this.filteredrows.length;

					while (j--) {
						if (viewFunction(this.collection.data[this.filteredrows[j]]) === true) {
							result.push(this.filteredrows[j]);
						}
					}

					this.filteredrows = result;

					return this;
				}
				// otherwise this is initial chained op, work against data, push into filteredrows[]
				else {
					var k = this.collection.data.length;

					while (k--) {
						if (viewFunction(this.collection.data[k]) === true) {
							result.push(k);
						}
					}

					this.filteredrows = result;
					this.filterInitialized = true;

					return this;
				}
			}
		} catch (err) {
			throw err;
		}
	}

	/**
	 * count() - returns the number of documents in the resultset.
	 *
	 * @returns {number} The number of documents in the resultset.
	 * @memberof Resultset
	 */
	count() {
		if (this.searchIsChained && this.filterInitialized) {
			return this.filteredrows.length;
		}
		return this.collection.count();
	}

	/**
	 * Terminates the chain and returns array of filtered documents
	 *
	 * @param {object=} options - allows specifying 'forceClones' and 'forceCloneMethod' options.
	 * @param {boolean} options.forceClones - Allows forcing the return of cloned objects even when
	 *        the collection is not configured for clone object.
	 * @param {string} options.forceCloneMethod - Allows overriding the default or collection specified cloning method.
	 *        Possible values include 'parse-stringify', 'jquery-extend-deep', and 'shallow'
	 *
	 * @returns {array} Array of documents in the resultset
	 * @memberof Resultset
	 */
	data(options) {
		var result = [],
			data = this.collection.data,
			len,
			i,
			method;

		options = options || {};

		// if this is chained resultset with no filters applied, just return collection.data
		if (this.searchIsChained && !this.filterInitialized) {
			if (this.filteredrows.length === 0) {
				// determine whether we need to clone objects or not
				if (this.collection.cloneObjects || options.forceClones) {
					len = data.length;
					method = options.forceCloneMethod || this.collection.cloneMethod;

					for (i = 0; i < len; i++) {
						result.push(clone(data[i], method));
					}
					return result;
				}
				// otherwise we are not cloning so return sliced array with same object references
				else {
					return data.slice();
				}
			} else {
				// filteredrows must have been set manually, so use it
				this.filterInitialized = true;
			}
		}

		var fr = this.filteredrows;
		len = fr.length;

		if (this.collection.cloneObjects || options.forceClones) {
			method = options.forceCloneMethod || this.collection.cloneMethod;
			for (i = 0; i < len; i++) {
				result.push(clone(data[fr[i]], method));
			}
		} else {
			for (i = 0; i < len; i++) {
				result.push(data[fr[i]]);
			}
		}
		return result;
	}

	/**
	 * Used to run an update operation on all documents currently in the resultset.
	 *
	 * @param {function} updateFunction - User supplied updateFunction(obj) will be executed for each document object.
	 * @returns {Resultset} this resultset for further chain ops.
	 * @memberof Resultset
	 */
	update(updateFunction) {

		if (typeof(updateFunction) !== "function") {
			throw new TypeError('Argument is not a function');
		}

		// if this is chained resultset with no filters applied, we need to populate filteredrows first
		if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
			this.filteredrows = this.collection.prepareFullDocIndex();
		}

		var len = this.filteredrows.length,
			rcd = this.collection.data;

		for (var idx = 0; idx < len; idx++) {
			// pass in each document object currently in resultset to user supplied updateFunction
			updateFunction(rcd[this.filteredrows[idx]]);

			// notify collection we have changed this object so it can update meta and allow DynamicViews to re-evaluate
			this.collection.update(rcd[this.filteredrows[idx]]);
		}

		return this;
	}

	/**
	 * Removes all document objects which are currently in resultset from collection (as well as resultset)
	 *
	 * @returns {Resultset} this (empty) resultset for further chain ops.
	 * @memberof Resultset
	 */
	remove() {

		// if this is chained resultset with no filters applied, we need to populate filteredrows first
		if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
			this.filteredrows = this.collection.prepareFullDocIndex();
		}

		this.collection.remove(this.data());

		this.filteredrows = [];

		return this;
	}

	/**
	 * data transformation via user supplied functions
	 *
	 * @param {function} mapFunction - this function accepts a single document for you to transform and return
	 * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
	 * @returns {value} The output of your reduceFunction
	 * @memberof Resultset
	 */
	mapReduce(mapFunction, reduceFunction) {
		try {
			return reduceFunction(this.data().map(mapFunction));
		} catch (err) {
			throw err;
		}
	}

	/**
	 * eqJoin() - Left joining two sets of data. Join keys can be defined or calculated properties
	 * eqJoin expects the right join key values to be unique.  Otherwise left data will be joined on the last joinData object with that key
	 * @param {Array} joinData - Data array to join to.
	 * @param {(string|function)} leftJoinKey - Property name in this result set to join on or a function to produce a value to join on
	 * @param {(string|function)} rightJoinKey - Property name in the joinData to join on or a function to produce a value to join on
	 * @param {function=} mapFun - (Optional) A function that receives each matching pair and maps them into output objects - function(left,right){return joinedObject}
	 * @returns {Resultset} A resultset with data in the format [{left: leftObj, right: rightObj}]
	 * @memberof Resultset
	 */
	eqJoin(joinData, leftJoinKey, rightJoinKey, mapFun) {

		var leftData = [],
			leftDataLength,
			rightData = [],
			rightDataLength,
			key,
			result = [],
			leftKeyisFunction = typeof leftJoinKey === 'function',
			rightKeyisFunction = typeof rightJoinKey === 'function',
			joinMap = {};

		//get the left data
		leftData = this.data();
		leftDataLength = leftData.length;

		//get the right data
		if (joinData instanceof Resultset) {
			rightData = joinData.data();
		} else if (Array.isArray(joinData)) {
			rightData = joinData;
		} else {
			throw new TypeError('joinData needs to be an array or result set');
		}
		rightDataLength = rightData.length;

		//construct a lookup table

		for (var i = 0; i < rightDataLength; i++) {
			key = rightKeyisFunction ? rightJoinKey(rightData[i]) : rightData[i][rightJoinKey];
			joinMap[key] = rightData[i];
		}

		if (!mapFun) {
			mapFun = function(left, right) {
				return {
					left: left,
					right: right
				};
			};
		}

		//Run map function over each object in the resultset
		for (var j = 0; j < leftDataLength; j++) {
			key = leftKeyisFunction ? leftJoinKey(leftData[j]) : leftData[j][leftJoinKey];
			result.push(mapFun(leftData[j], joinMap[key] || {}));
		}

		//return return a new resultset with no filters
		this.collection = new Collection('joinData');
		this.collection.insert(result);
		this.filteredrows = [];
		this.filterInitialized = false;

		return this;
	}

	map(mapFun) {
		var data = this.data().map(mapFun);
		//return return a new resultset with no filters
		this.collection = new Collection('mappedData');
		this.collection.insert(data);
		this.filteredrows = [];
		this.filterInitialized = false;

		return this;
	}

}