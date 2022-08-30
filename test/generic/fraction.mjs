import assert from 'assert'
import math from '../../src/pocomath.mjs'
import Fraction from 'fraction.js/bigfraction.js'

describe('fraction', () => {
   const half = new Fraction(1/2)
   const tf = new Fraction(3, 4)
   let zero // will fill in during a test
   const one = new Fraction(1)

   it('supports typeOf', () => {
      assert.strictEqual(math.typeOf(half), 'Fraction')
   })

   it('can be built', () => {
      zero = math.fraction()
      assert.deepStrictEqual(zero, new Fraction(0))
      assert.deepStrictEqual(math.fraction(1/2), half)
      assert.strictEqual(math.fraction(half), half) // maybe it should be a clone?
      assert.strictEqual(math.fraction(9, 16).valueOf(), 9/16)
      assert.strictEqual(math.fraction(9n, 16n).valueOf(), 9/16)
   })

   it('has abs and sign', () => {
      assert.deepStrictEqual(math.abs(math.fraction('-1/2')), half)
      assert.deepStrictEqual(math.sign(math.negate(tf)), math.negate(one))
   })

   it('can add and multiply', () => {
      assert.strictEqual(math.add(half, 1).valueOf(), 1.5)
      assert.strictEqual(math.multiply(2, half).valueOf(), 1)
   })

   it('can subtract and divide', () => {
      assert.strictEqual(math.subtract(half,tf).valueOf(), -0.25)
      assert.strictEqual(math.divide(tf,half).valueOf(), 1.5)
   })

   it('computes mod', () => {
      assert.strictEqual(math.mod(tf, half).valueOf(), 0.25)
      assert.strictEqual(math.mod(tf, math.negate(half)).valueOf(), 0.25)
      assert.strictEqual(math.mod(math.negate(tf), half).valueOf(), 0.25)
      assert.strictEqual(
         math.mod(math.negate(tf), math.negate(half)).valueOf(),
         0.25)
      assert.deepStrictEqual(
         math.mod(math.fraction(-1, 3), half),
         math.fraction(1, 6))
   })

   it('supports conjugate', () => {
      assert.strictEqual(math.conjugate(half), half)
   })

   it('can compare fractions', () => {
      assert.deepStrictEqual(math.compare(tf, half), one)
      assert.strictEqual(math.equal(half, math.fraction("2/4")), true)
      assert.strictEqual(math.smaller(half, tf), true)
      assert.strictEqual(math.larger(half, tf), false)
      assert.strictEqual(math.smallerEq(tf, math.fraction(0.75)), true)
      assert.strictEqual(math.largerEq(tf, half), true)
      assert.strictEqual(math.unequal(half, tf), true)
      assert.strictEqual(math.isZero(math.zero(tf)), true)
      assert.strictEqual(math.isZero(half), false)
   })

   it('computes gcd and lcm', () => {
      assert.strictEqual(math.gcd(half,tf).valueOf(), 0.25)
      assert.strictEqual(math.lcm(half,tf).valueOf(), 1.5)
   })

   it('computes additive and multiplicative inverses', () => {
      assert.strictEqual(math.negate(half).valueOf(), -0.5)
      assert.deepStrictEqual(math.invert(tf), math.fraction('4/3'))
   })

   it('computes integer parts and quotients', () => {
      assert.deepStrictEqual(math.floor(tf), zero)
      assert.deepStrictEqual(math.round(tf), one)
      assert.deepStrictEqual(math.ceiling(half), one)
      assert.deepStrictEqual(math.quotient(tf, half), one)
      assert.deepStrictEqual(
         math.roundquotient(math.fraction(7/8), half),
         math.multiply(2,math.one(tf)))
   })

   it('has no sqrt (although that should be patched)', () => {
      assert.throws(() => math.sqrt(math.fraction(9/16)), TypeError)
   })

   it('but it can square', () => {
      assert.deepStrictEqual(math.square(tf), math.fraction(9/16))
   })

   it('knows the types of its operations', () => {
      assert.deepStrictEqual(
         math.returnTypeOf('ceiling', 'Fraction'), 'Fraction')
      assert.deepStrictEqual(
         math.returnTypeOf('multiply', 'Fraction,Fraction'), 'Fraction')
   })
})
