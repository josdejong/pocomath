# About the TypeScript experiment

Explanation:

1. The code doesn't actually work: the magic `infer` is not implemented. Making `infer` work requires a TypeScript plugin that can turn TS into the pocomath syntax (string). 
2. Have a look at the `*.ts` files, which have been put alongside the original `*.mjs` files
3. This approach does not need any advanced TypeScript techniques: it only needs basic types with generics. No magic. No need for `Dispatcher` and `Dependency<...>` techniques. This will play 100% nice when integrating with other math libraries that use TypeScript. A new developer will directly understand how to implement a new function for mathjs.
4. The solution is DRY I think: no duplicate type definitions or something like that.
5. The producer (function implementation) and consumer (dependency injection) side are neatly separated via a shared interface. You can split the source code in multiple independent repositories (like per data type and per category)
6. There is a collection of centrally defined, generic interfaces in `interfaces/arithmetic.ts`. Each data type (`number`, `bigint`, etc) _can_ provide an implementation for these interfaces.
7. Have a look at `number/add.ts` and `bigint/add.ts` to see how a function for a specific type is implemented, based on the `Abs<T>` interface. 
8. Have a look at `generic/abs.ts` to see how a generic function is implemented which has generic dependencies. This function does not know whether there actually is an implementation for the dependencies, and whether this is generic or a specific data type. And it does not need to know.
9. Have a look at `bigint/quotient.ts`, this is a `bigint` implementation, which deppends on a function `sign: Sign<bigint>`. The function `quotient` does not know whether `sign` is a generic or `bigint` implementation (actually it is generic), and it doesn't need to know.

Thoughts:

1. The function `number/add.ts` currently defines `export type AddNumber = Add<number>`. A consumer _can_ use this interface: that will guarentee that there is an implementation for this specific data type `number`. But I'm not sure if this is needed at all in practice: consumers do not need to know how the dependencies are implemented? Maybe we only need to do that when implementing a function for which there is no interface defined under the central `/interfaces/*` section, like `/complex/arg.ts` and `/complex/isReal.ts`.
2.  The construction with an object having an `infer`:

    ```ts
    export const add = {
      'infer': (): AddNumber => (a, b) => a + b
    }
    ```
    feels like a neeless object, and if you want to describe two signatures, you have a naming confict. How to go about that?

3. I'm not entirly sure yet what is handy for defining multiple signatures, like in  `complex/complex.ts`. How to define them, and how to define their TypeScript interface?
4. We should come up with a good naming convention to deal with conflicting type names for the data type `Complex` vs the function `complex: (re: T, im: T) => Complex<T>`. Maybe we should name all function types with an `*Fn` suffix or so, like `AddFn`, `MultiplyFn`, `ComplexFn`, etc.

