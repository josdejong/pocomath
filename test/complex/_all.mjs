import assert from 'assert'
import math from '../../src/pocomath.mjs'
import PocomathInstance from '../../src/core/PocomathInstance.mjs'
import * as complexSqrt from '../../src/complex/sqrt.mjs'

describe('complex', () => {
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

})
