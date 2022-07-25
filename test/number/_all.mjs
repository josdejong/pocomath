import assert from 'assert'
import math from '../../src/pocomath.mjs'
import PocomathInstance from '../../src/core/PocomathInstance.mjs'
import * as numberSqrt from '../../src/number/sqrt.mjs'
import * as complex from '../../src/complex/all.mjs'
import * as numbers from '../../src/number/all.mjs'

describe('number', () => {
   it('supports sqrt', () => {
      assert.strictEqual(math.sqrt(4), 2)
      assert.strictEqual(math.sqrt(NaN), NaN)
      assert.strictEqual(math.sqrt(2.25), 1.5)
      assert.deepStrictEqual(math.sqrt(-9), math.complex(0, 3))
      math.config.predictable = true
      assert.strictEqual(math.sqrt(-9), NaN)
      math.config.predictable = false
      assert.deepStrictEqual(math.sqrt(-0.25), math.complex(0, 0.5))
   })

   it('supports sqrt by itself', () => {
      const no = new PocomathInstance('Numbers Only')
      no.install(numberSqrt)
      assert.strictEqual(no.sqrt(2.56), 1.6)
      assert.strictEqual(no.sqrt(-17), NaN)
      no.install(complex)
      no.install(numbers)
      assert.deepStrictEqual(no.sqrt(-16), no.complex(0,4))
   })

})
