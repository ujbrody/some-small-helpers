function _mapObject(obj: any, mapper: (val: any) => any, predicate?: (val: any) => boolean): any {

  if (obj === null || obj === undefined) return obj;

  if ((typeof obj === typeof 'string' || Object.keys(obj).length === 0) && !Array.isArray(obj)) {
    if (!predicate || predicate(obj)) return mapper(obj);

    return obj;
  }

  const res = _.mapValues(obj, (o) => _mapObject(o, mapper, predicate));

  if (Array.isArray(obj)) return Object.values(res);

  return res;
}

/**
 * Makes a deep mapping of properties in an object, or cells in array based on a mapper function.
 * Using a predicate, it is possible to make sure the mapping is only applied on certain type of properties
 * @param obj The object which properties to map
 * @param mapper The mapping function to affect on each property
 * @param predicate A function to determine if to apply the mapper on a property
 */
export default function mapObject(obj: any, mapper: (val: any) => any, predicate?: (val: any) => boolean): any {

  if (obj === null || obj === undefined) return obj;

  if (Object.keys(obj).length === 0 && !Array.isArray(obj)) return obj;

  return _mapObject(obj, mapper, predicate);
}
