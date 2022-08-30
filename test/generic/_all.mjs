import assert from 'assert'
import math from '../../src/pocomath.mjs'

describe('generic', () => {
   it('calculates mean', () => {
      assert.strictEqual(math.mean(1,2.5,3.25,4.75), 2.875)
      assert.strictEqual(
         math.returnTypeOf('mean', 'number,number,number,number'),
         'number'
      )
   })
   it('compares things', () => {
      assert.strictEqual(math.larger(7n, 3n), true)
      assert.strictEqual(
         math.returnTypeOf('larger', 'bigint,bigint'), 'boolean')
      assert.strictEqual(math.smallerEq(7.2, 3), false)
      assert.strictEqual(
         math.returnTypeOf('smallerEq', 'number,NumInt'), 'boolean')
   })
})
