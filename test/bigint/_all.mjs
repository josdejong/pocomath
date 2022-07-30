import assert from 'assert'
import math from '../../src/pocomath.mjs'
import PocomathInstance from '../../src/core/PocomathInstance.mjs'
import * as bigintSqrt from '../../src/bigint/sqrt.mjs'
import * as complex from '../../src/complex/all.mjs'
import * as bigints from '../../src/bigint/all.mjs'

describe('bigint', () => {
   it('can divide', () => {
      assert.strictEqual(math.divide(15n, 5n), 3n)
      assert.strictEqual(math.divide(14n, 5n), undefined)
      math.config.predictable = true
      assert.strictEqual(math.divide(14n, 5n), 2n)
      assert.strictEqual(math.divide(-14n, 5n), -3n)
      assert.strictEqual(math.divide(14n, -5n), -3n)
      assert.strictEqual(math.divide(-14n, -5n), 2n)
      math.config.predictable = false
   })
 
   it('supports sqrt', () => {
      assert.strictEqual(math.sqrt(0n), 0n)
      assert.strictEqual(math.sqrt(4n), 2n)
      assert.strictEqual(math.sqrt(5n), undefined)
      assert.strictEqual(
         math.sqrt(82120471531550314555681345949499512621827274120673745141541602816614526075010755373654280259022317599142038423759320355177481886719814621305828811322920076213800348341464996337890625n),
         9062034624274524065844376014975805577107171799890766992670739972241112960081909332275390625n)
      assert.deepStrictEqual(math.sqrt(-9n), math.complex(0n, 3n))
      assert.deepStrictEqual(
         math.sqrt(math.complex(5n, 12n)),
         math.complex(3n, 2n))
      assert.deepStrictEqual(math.sqrt(math.complex(1n, 0n)), 1n)
      assert.deepStrictEqual(math.sqrt(math.complex(0n, 1n)), undefined)
      math.config.predictable = true
      assert.strictEqual(math.sqrt(-9n), -9n)
      assert.deepStrictEqual(
         math.sqrt(math.complex(1n, 0n)), math.complex(1n, 0n))
      assert.deepStrictEqual(
         math.sqrt(math.complex(0n, 1n)), math.complex(0n, 0n))
      assert.deepStrictEqual(
         math.sqrt(math.complex(0n, 2n)), math.complex(1n, 1n))
      math.config.predictable = false
      assert.deepStrictEqual(math.sqrt(-1024n), math.complex(0n, 32n))
   })

   it('supports sqrt by itself', () => {
      const bo = new PocomathInstance('BigInts Only')
      bo.install(bigintSqrt)
      assert.strictEqual(bo.sqrt(256n), 16n)
      assert.strictEqual(bo.sqrt(-17n), undefined)
      bo.install(complex)
      bo.install(bigints)
      assert.deepStrictEqual(bo.sqrt(-3249n), bo.complex(0n, 57n))
   })

   it('computes gcd', () => {
      assert.strictEqual(math.gcd(105n, 70n), 35n)
   })

   it('computes lcm', () => {
      assert.strictEqual(math.lcm(105n, 70n), 210n)
      assert.strictEqual(math.lcm(15n, 60n), 60n)
      assert.strictEqual(math.lcm(0n, 17n), 0n)
      assert.strictEqual(math.lcm(20n, 0n), 0n)
      assert.strictEqual(math.lcm(0n, 0n), 0n)
   })

})
