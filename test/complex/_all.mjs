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
      assert.ok(math.equal(math.complex(3, 0), 3))
      assert.ok(math.equal(math.complex(3, 2), math.complex(3, 2)))
      assert.ok(!(math.equal(math.complex(45n, 3n), math.complex(45n, -3n))))
      assert.ok(!(math.equal(math.complex(45n, 3n), 45n)))
   })

   it('tests for reality', () => {
      assert.ok(math.isReal(math.complex(3, 0)))
      assert.ok(!(math.isReal(math.complex(3, 2))))
   })

   it('computes gcd', () => {
      assert.deepStrictEqual(
         math.gcd(math.complex(53n, 56n), math.complex(47n, -13n)),
         math.complex(4n, 5n))
      // And now works for NumInt, too!
      assert.deepStrictEqual(
         math.gcd(math.complex(53,56), math.complex(47, -13)),
         math.complex(4, 5))
      // But properly fails for general complex
      assert.throws(
         () => math.gcd(math.complex(5.3,5.6), math.complex(4.7, -1.3)),
         TypeError
      )
   })

   it('computes floor', () => {
      assert.deepStrictEqual(
         math.floor(math.complex(19, 22.7)),
         math.complex(19, 22))
      const gi = math.complex(-1n, 1n)
      assert.strictEqual(math.floor(gi), gi) // literally a no-op
   })

   it('performs rudimentary quaternion calculations', () => {
      const q0 = math.quaternion(1, 0, 1, 0)
      const q1 = math.quaternion(1, 0.5, 0.5, 0.75)
      assert.deepStrictEqual(
         q1,
         math.complex(math.complex(1, 0.5), math.complex(0.5, 0.75)))
      assert.deepStrictEqual(
         math.add(q0,q1),
         math.quaternion(2, 0.5, 1.5, 0.75))
      assert.deepStrictEqual(
         math.multiply(q0, q1),
         math.quaternion(0.5, 1.25, 1.5, 0.25))
      assert.deepStrictEqual(
         math.multiply(q0, math.quaternion(2, 1, 0.1, 0.1)),
         math.quaternion(1.9, 1.1, 2.1, -0.9))
      math.absquare(math.complex(1.25, 2.5)) //HACK: need absquare(Complex<number>)
      assert.strictEqual(math.abs(q0), Math.sqrt(2))
      assert.strictEqual(math.abs(q1), Math.sqrt(33)/4)
   })

})
