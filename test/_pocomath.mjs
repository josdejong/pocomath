import assert from 'assert'
import math from '../src/pocomath.mjs'

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
      assert.deepStrictEqual(
         math.subtract(16, math.add(3, math.complex(0,4), 2)),
         math.complex(11, -4))
      assert.strictEqual(math.negate(math.complex(3, 8)).im, -8)
   })

   it('handles bigints', () => {
      assert.strictEqual(math.negate(5n), -5n)
      assert.strictEqual(math.subtract(12n, 5n), 7n)
      assert.strictEqual(math.add(15n, 25n, 35n), 75n)
      assert.strictEqual(math.add(10n, math.negate(3n)), 7n)
   })

   it('handles Gaussian integers', () => {
      const norm13n = {re: 2n, im: 3n}
      assert.deepStrictEqual(math.complex(2n,3n), norm13n)
      assert.deepStrictEqual(math.complex(2n), math.complex(2n, 0n))
      assert.deepStrictEqual(math.add(2n, math.complex(0n, 3n)), norm13n)
      assert.deepStrictEqual(
         math.subtract(16n, math.add(3n, math.complex(0n,4n), 2n)),
         math.complex(11n, -4n))
      assert.strictEqual(math.negate(math.complex(3n, 8n)).im, -8n)
   })
})
