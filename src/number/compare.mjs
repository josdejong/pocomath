import Returns from '../core/Returns.mjs'

/* Lifted from mathjs/src/utils/number.js */
/**
 * Minimum number added to one that makes the result different than one
 */
export const DBL_EPSILON = Number.EPSILON || 2.2204460492503130808472633361816E-16

/**
 * Compares two floating point numbers.
 * @param {number} x          First value to compare
 * @param {number} y          Second value to compare
 * @param {number} [epsilon]  The maximum relative difference between x and y
 *                            If epsilon is undefined or null, the function will
 *                            test whether x and y are exactly equal.
 * @return {boolean} whether the two numbers are nearly equal
*/
function nearlyEqual (x, y, epsilon) {
  // if epsilon is null or undefined, test whether x and y are exactly equal
  if (epsilon === null || epsilon === undefined) {
    return x === y
  }

  if (x === y) {
    return true
  }

  // NaN
  if (isNaN(x) || isNaN(y)) {
    return false
  }

  // at this point x and y should be finite
  if (isFinite(x) && isFinite(y)) {
    // check numbers are very close, needed when comparing numbers near zero
    const diff = Math.abs(x - y)
    if (diff < DBL_EPSILON) {
      return true
    } else {
      // use relative error
      return diff <= Math.max(Math.abs(x), Math.abs(y)) * epsilon
    }
  }

  // Infinite and Number or negative Infinite and positive Infinite cases
  return false
}
/* End of copied section */

export const compare = {
  'number,number': ({
    config
  }) => Returns(
    'NumInt', (x,y) => nearlyEqual(x, y, config.epsilon) ? 0 : (x > y ? 1 : -1))
}
