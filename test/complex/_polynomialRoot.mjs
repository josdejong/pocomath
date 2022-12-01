import assert from 'assert'
import * as approx from '../../tools/approx.mjs'
import math from '../../src/pocomath.mjs'

describe('polynomialRoot', () => {
   it('should solve a linear equation with real coefficients', function () {
      assert.deepEqual(math.polynomialRoot(6, 3), math.tuple(-2))
      assert.deepEqual(
         math.polynomialRoot(math.complex(-3, 2), 2),
         math.tuple(math.complex(1.5, -1)))
      assert.deepEqual(
         math.polynomialRoot(math.complex(3, 1), math.complex(-1, -1)),
         math.tuple(math.complex(2, -1)))
   })
   // Should be safe now to capture the functions:
   const complex = math.complex
   const pRoot = math.polynomialRoot
   const tup = math.tuple
   it('should solve a quadratic equation with a double root', function () {
      assert.deepEqual(pRoot(4, 4, 1), tup(-2))
      assert.deepEqual(
         pRoot(complex(0, 2), complex(2, 2), 1), tup(complex(-1, -1)))
   })
   it('should solve a quadratic with two distinct roots', function () {
      assert.deepEqual(pRoot(-3, 2, 1), tup(1, -3))
      assert.deepEqual(pRoot(-2, 0, 1), tup(math.sqrt(2), -math.sqrt(2)))
      assert.deepEqual(
         pRoot(4, 2, 1),
         tup(complex(-1, math.sqrt(3)), complex(-1, -math.sqrt(3))))
      assert.deepEqual(
         pRoot(complex(3, 1), -3, 1), tup(complex(1, 1), complex(2, -1)))
   })
   it('should solve a cubic with a triple root', function () {
      assert.deepEqual(pRoot(8, 12, 6, 1), tup(-2))
      assert.deepEqual(
         pRoot(complex(-2, 11), complex(9, -12), complex(-6, 3), 1),
         tup(complex(2, -1)))
   })
   it('should solve a cubic with one simple and one double root', function () {
      assert.deepEqual(pRoot(4, 0, -3, 1), tup(-1, 2))
      assert.deepEqual(
         pRoot(complex(9, 9), complex(15, 6), complex(7, 1), 1),
         tup(complex(-1, -1), -3))
      assert.deepEqual(
         pRoot(complex(0, 6), complex(6, 8), complex(5, 2), 1),
         tup(-3, complex(-1, -1)))
      assert.deepEqual(
         pRoot(complex(2, 6), complex(8, 6), complex(5, 1), 1),
         tup(complex(-3, 1), complex(-1, -1)))
   })
   it('should solve a cubic with three distinct roots', function () {
      approx.deepEqual(pRoot(6, 11, 6, 1), tup(-3, -1, -2))
      approx.deepEqual(
         pRoot(-1, -2, 0, 1),
         tup(-1, (1 + math.sqrt(5)) / 2, (1 - math.sqrt(5)) / 2))
      approx.deepEqual(
         pRoot(1, 1, 1, 1),
         tup(-1, complex(0, -1), complex(0, 1)))
      approx.deepEqual(
         pRoot(complex(0, -10), complex(8, 12), complex(-6, -3), 1),
         tup(complex(1, 1), complex(3, 1), complex(2, 1)))
   })
})
