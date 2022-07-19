import assert from 'assert'
import math from '../pocomath.mjs'

describe('The default full pocomath instance "math"', () => {
   it('can subtract numbers', () => {
      assert.strictEqual(math.subtract(12, 5), 7)
   })

   it('can add numbers', () => {
      assert.strictEqual(math.add(3, 4), 7)
      assert.strictEqual(math.add(1.5, 2.5, 3.5), 7.5)
      assert.strictEqual(math.add(Infinity), Infinity)
   })

   it('can negate numbers', () => {
      assert.strictEqual(math.negate(-1), 1)
      assert.strictEqual(math.add(10, math.negate(3)), 7)
   })
})
