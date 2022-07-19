import assert from 'assert'
import math from '../pocomath.mjs'

describe('The default full pocomath instance "math"', () => {
   it('can add numbers', () => {
      assert.strictEqual(math.add(3, 4), 7)
      assert.strictEqual(math.add(1.5, 2.5, 3.5), 7.5)
      assert.strictEqual(math.add(Infinity), Infinity)
   })
})
