import assert from 'assert'
import PocomathInstance from '../src/core/PocomathInstance.mjs'
import math from '../src/pocomath.mjs'

describe('The default full pocomath instance "math"', () => {
   it('has no unexpected undefined types', () => {
      const undef = math.undefinedTypes()
      if (undef.length) {
         console.log('NOTE: Found undefined types', undef)
      }
      assert.strictEqual(undef.length, 1) // Mentioning 'Fraction' but not using
   })

   it('has a built-in typeOf operator', () => {
      assert.strictEqual(math.typeOf(42), 'NumInt')
      assert.strictEqual(math.typeOf(-1.5), 'number')
      assert.strictEqual(math.typeOf(-42n), 'bigint')
      assert.strictEqual(math.typeOf(undefined), 'undefined')
      assert.strictEqual(math.typeOf({re: 15n, im: -2n}), 'Complex<bigint>')
      assert.strictEqual(math.typeOf({re: 6.28, im: 2.72}), 'Complex<number>')
   })

   it('can determine the return types of operations', () => {
      assert.strictEqual(math.returnTypeOf('negate', 'number'), 'number')
      assert.strictEqual(math.returnTypeOf('negate', 'NumInt'), 'NumInt')
      math.negate(math.complex(1.2, 2.8)) // TODO: make this call unnecessary
      assert.strictEqual(
         math.returnTypeOf('negate', 'Complex<number>'), 'Complex<number>')
      assert.strictEqual(math.returnTypeOf('add', 'number,number'), 'number')
      assert.strictEqual(math.returnTypeOf('add', 'NumInt,NumInt'), 'NumInt')
      assert.strictEqual(math.returnTypeOf('add', 'NumInt,number'), 'number')
      assert.strictEqual(math.returnTypeOf('add', 'number,NumInt'), 'number')
      assert.deepStrictEqual(  // TODO: ditto
         math.add(3, math.complex(2.5, 1)), math.complex(5.5, 1))
      assert.strictEqual(
         math.returnTypeOf('add', 'Complex<number>,NumInt'), 'Complex<number>')
      // The following is not actually what we want, but the Pocomath type
      // language isn't powerful enough at this point to capture the true
      // return type:
      assert.strictEqual(
         math.returnTypeOf('add', 'number,NumInt,Complex<number>'), 'any')
      assert.strictEqual(
         math.returnTypeOf('chain', 'bigint'), 'Chain<bigint>')
      assert.strictEqual(
         math.returnTypeOf('returnTypeOf', 'string,string'), 'string')
      assert.strictEqual(
         math.returnTypeOf('conjugate', 'bigint'), 'bigint')
      assert.strictEqual(
         math.returnTypeOf('gcd', 'bigint,bigint'), 'bigint')
      math.identity(math.fraction(3,5)) // TODO: ditto
      assert.strictEqual(math.returnTypeOf('identity', 'Fraction'), 'Fraction')
      assert.strictEqual(
         math.returnTypeOf('quotient', 'bigint,bigint'), 'bigint')
      math.abs(math.complex(2,1)) //TODO: ditto
      assert.strictEqual(
         math.returnTypeOf('abs','Complex<NumInt>'), 'number')
      math.multiply(math.quaternion(1,1,1,1), math.quaternion(1,-1,1,-1)) // dit
      const quatType = math.returnTypeOf(
         'quaternion', 'NumInt,NumInt,NumInt,NumInt')
      assert.strictEqual(quatType, 'Complex<Complex<NumInt>>')
      assert.strictEqual(
         math.returnTypeOf('multiply', quatType + ',' + quatType), quatType)
      assert.strictEqual(math.returnTypeOf('isZero', 'NumInt'), 'boolean')
      assert.strictEqual(
         math.returnTypeOf('roundquotient', 'NumInt,number'), 'NumInt')
      assert.strictEqual(
         math.returnTypeOf('factorial', 'NumInt'), 'bigint')
   })

   it('can subtract numbers', () => {
      assert.strictEqual(math.subtract(12, 5), 7)
      assert.throws(() => math.subtract(3n, 1.5), 'TypeError')
   })

   it('can add numbers', () => {
      assert.strictEqual(math.add(3, 4), 7)
      assert.strictEqual(math.add(1.5, 2.5, 3.5), 7.5)
      assert.strictEqual(math.add(Infinity), Infinity)
      assert.throws(() => math.add(3n, -1.5), TypeError)
   })

   it('can negate numbers', () => {
      assert.strictEqual(math.negate(-1), 1)
      assert.strictEqual(math.add(10, math.negate(3)), 7)
   })

   it('can be extended', () => {
      const stretch = PocomathInstance.merge(math) // clone to not pollute math
      stretch.installType('stringK', {
         test: s => typeof s === 'string' && s.charAt(0) === 'K',
         before: ['string']
      })
      stretch.install({
         add: {
            '...stringK': () => addends => addends.reduce((x,y) => x+y, '')
         },
      })
      assert.strictEqual(stretch.add('Kilroy','K is here'), 'KilroyK is here')
   })

   it('handles complex numbers', () => {
      const norm13 = {re: 2, im: 3}
      assert.deepStrictEqual(math.complex(2,3), norm13)
      assert.deepStrictEqual(math.complex(2), math.complex(2,0))
      assert.deepStrictEqual(math.add(2, math.complex(0,3)), norm13)
      assert.deepStrictEqual(
         math.subtract(math.complex(1,1), math.complex(2,-2)),
         math.complex(-1,3))
      assert.strictEqual(math.negate(math.complex(3, 8)).im, -8)
      assert.deepStrictEqual(
         math.subtract(16, math.add(3, math.complex(0,4), 2)),
         math.complex(11, -4))
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

   it('creates chains', () => {
      const mychain = math.chain(7).negate()
      assert.strictEqual(mychain.value, -7)
      mychain.add(23).sqrt().lcm(10)
      assert.strictEqual(mychain.value, 20)
      assert.strictEqual(math.mean(3,4,5), 4)
      assert.throws(() => math.chain(3).mean(4,5), /chain function.*split/)
      assert.throws(() => math.chain(3).foo(), /Unknown operation/)
   })

   it('calls plain factorial function', () => {
      assert.strictEqual(math.factorial(4), 24n)
      assert.strictEqual(math.factorial(7n), 5040n)
   })

   it('calculates binomial coefficients', () => {
      assert.strictEqual(math.choose(6, 3), 20)
      assert.strictEqual(math.choose(21n, 2n), 210n)
   })

   it('calculates multi-way gcds and lcms', () => {
      assert.strictEqual(math.gcd(30,105,42), 3)
      const gaussianLCM = math.lcm(
         math.complex(2n,1n), math.complex(1n,1n), math.complex(0n,1n))
      assert.strictEqual(math.associate(gaussianLCM, math.complex(1n,3n)), true)
   })

})
