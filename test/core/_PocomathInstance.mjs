import assert from 'assert'
import PocomathInstance from '../../src/core/PocomathInstance.mjs'

const pi = new PocomathInstance('dummy')
describe('PocomathInstance', () => {
   it('creates an instance that can define typed-functions', () => {
      pi.install({add: {'any,any': [[], (a,b) => a+b]}})
      assert.strictEqual(pi.add(2,2), 4)
      assert.strictEqual(pi.add('Kilroy', 17), 'Kilroy17')
      assert.strictEqual(pi.add(1, undefined), NaN)
      assert.throws(() => pi.add(1), TypeError)
   })

   it('reserves certain function names', () => {
      assert.throws(
         () => pi.install({install: {any: [[], x => x]}}), SyntaxError)
      assert.throws(
         () => pi.install({_foo: {any: [[], x => x]}}), SyntaxError)
   })

})
