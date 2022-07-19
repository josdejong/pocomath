import assert from 'assert'
import PocomathInstance from '../PocomathInstance.mjs'

describe('PocomathInstance', () => {
   it('creates an instance that can define typed-functions', () => {
      const pi = new PocomathInstance('dummy')
      pi.install({'add': {'any,any': [[], (a,b) => a+b]}})
      assert.strictEqual(pi.add(2,2), 4)
      assert.strictEqual(pi.add('Kilroy', 17), 'Kilroy17')
      assert.strictEqual(pi.add(1, undefined), NaN)
      assert.throws(() => pi.add(1), TypeError)
   })
})
