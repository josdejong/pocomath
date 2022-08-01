import assert from 'assert'
import math from '../../src/pocomath.mjs'
import PocomathInstance from '../../src/core/PocomathInstance.mjs'
import * as complexSqrt from '../../src/complex/sqrt.mjs'

describe('complex', () => {
   it('supports division', () => {
      assert.deepStrictEqual(
         math.divide(math.complex(3,2), math.complex(0,1)),
         math.complex(2,-3))
      const reciprocal = math.divide(1, math.complex(1,3))
      assert.strictEqual(reciprocal.re, 0.1)
      assert.ok(Math.abs(reciprocal.im + 0.3) < 1e-13)
   })

   it('supports sqrt', () => {
      assert.deepStrictEqual(math.sqrt(math.complex(1,0)), 1)
      assert.deepStrictEqual(
         math.sqrt(math.complex(0,1)),
         math.complex(math.sqrt(0.5), math.sqrt(0.5)))
      assert.deepStrictEqual(
         math.sqrt(math.complex(5, 12)),
         math.complex(3, 2))
      math.config.predictable = true
      assert.deepStrictEqual(math.sqrt(math.complex(1,0)), math.complex(1,0))
      assert.deepStrictEqual(
         math.sqrt(math.complex(0,1)),
         math.complex(math.sqrt(0.5), math.sqrt(0.5)))
      math.config.predictable = false
   })

   it('can bundle sqrt', async function () {
      const ms = new PocomathInstance('Minimal Sqrt')
      ms.install(complexSqrt)
      await ms.importDependencies(['number', 'complex'])
      assert.deepStrictEqual(
         ms.sqrt(math.complex(0, -1)),
         math.complex(ms.negate(ms.sqrt(0.5)), ms.sqrt(0.5)))
   })

   it('checks for equality', () => {
      assert.ok(math.equal(math.complex(3,0), 3))
      assert.ok(math.equal(math.complex(3,2), math.complex(3, 2)))
      assert.ok(!(math.equal(math.complex(45n, 3n), math.complex(45n, -3n))))
      assert.ok(!(math.equal(math.complex(45n, 3n), 45n)))
   })

   it('computes gcd', () => {
      assert.deepStrictEqual(
         math.gcd(math.complex(53n, 56n), math.complex(47n, -13n)),
         math.complex(4n, 5n))
   })

})
