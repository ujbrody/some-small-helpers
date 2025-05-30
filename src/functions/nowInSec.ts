/**
 * A wrapper around Date.getTime() method which returns the number value of Date.now() in seconds instead of milliseconds.
 * The function also allows for optional offset argument that adds or subtracts a certain number of seconds from the expected value
 * @param {number} offset How many seconds to add or remove from this moment's number value
 * @returns A number representing the current universal timestamp in seconds (not milliseconds as default for Date)
 */
export function nowInSec(offset = 0) {

  return Math.floor(Date.now() / 1000) + offset;
}
