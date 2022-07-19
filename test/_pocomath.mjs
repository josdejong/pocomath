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

   it('can be extended', () => {
      math.install({'add': {
         '...string': [[], addends => addends.reduce((x,y) => x+y, '')]
      }})
      assert.strictEqual(math.add('Kilroy',' is here'), 'Kilroy is here')
   })

   it('handles complex numbers', () => {
      const norm13 = {re: 2, im: 3}
      assert.deepStrictEqual(math.complex(2,3), norm13)
      assert.deepStrictEqual(math.complex(2), math.complex(2,0))
      assert.deepStrictEqual(math.add(2, math.complex(0,3)), norm13)
   })
})
