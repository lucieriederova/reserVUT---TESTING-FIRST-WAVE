/**
 * Express query params can be a single string or an array (e.g. `?x=1&x=2`).
 * Normalizes to a single value, taking the first when an array is given.
 */
export function toSingleParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
