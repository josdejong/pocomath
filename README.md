# pocomath

A little proof-of-concept for organizing mathjs by module inclusion, avoiding factory functions.

Note this project is package-managed by [pnpm](https://pnpm.io/). I do not expect that a clone can easily be manipulated with `npm`.

Defines a class PocomathInstance to embody independent instances of a mathjs-style CAS. Basically, it keeps track of a collection of implementations (in the sense of typed-function) for each of the functions to be used in the CAS, rather than just the finalized typed-functions. It also tracks the dependencies of each implementation (which must form a directed acyclic network). When a method is requested from the instance, it assembles the proper typed-function (and caches it, of course). Whenever an implementation is added to that function name or any of its dependencies, the previously assembled typed-function is discarded, so that a new one will be constructed on its next use.

Multiple different instances can coexist and have different collections of operations. Moreover, only the source files for the operations actually desired are ever visited in the import tree, so minimizing a bundle for a specific subset of operations should be quite straightforward.

Hopefully the test cases, especially `test/_pocomath.mjs` and `test/custom.js`, will show off these aspects in action.

Note that 'subtract' is implemented as a 'generic' operation, that depends only on the 'add' and 'negate' operations (and so doesn't care what types it is operating on). Although it would not be the computationally fastest in a production instance, for the sake of demonstration 'divide' and 'sign' are also so defined.

Furthermore, note that 'Complex' is implemented in a way that doesn't care about the types of the real and imaginary components, so with the 'bigint' type defined here as well, we obtain Gaussian integers for free.

This core could be extended with many more operations, and more types could be defined, and additional sub-bundles like `number/all.mjs` or clever conditional loaders like `complex/extendToComplex.mjs` could be defined.

Also see the comments for the public member functions of
`core/PocomathInstance.mjs` for further details on the structure and API of this
scheme for organizing a CAS.

Hopefully this shows promise. It is an evolution of the concept first prototyped in [picomath](https://code.studioinfinity.org/glen/picomath). However, picomath depended on typed-function allowing mutable function entities, which turned out not to be performant. Pocomath, on the other hand, uses typed-function v3 as it stands, although it does suggest that it would be helpful to extend typed-function with subtypes, and it could even be reasonable to move the dependency tracking into typed-function itself (given that typed-function already supports self-dependencies, it would not be difficult to extend that to inter-dependencies between different typed-functions).

Note that Pocomath allows one implementation to depend just on a specific signature of another function, for efficiency's sake (if for example 'bar(Matrix)' knows it will only call 'foo(Matrix)', it avoids another type-dispatch). That capability is used in sqrt, for example.

Pocomath also lazily reloads operations that depend on the config when that changes, and if an operation has a signature mentioning an undefined type, that signature is ignored until the type is installed, at which point the function lazily redefines itself to use the additional signature.

Pocomath now also allows template operations and template types, also built on top of typed-function (but candidates for integration therein). This is used to make many operations more specific, implement a type-homogeneous Tuple type, and make Complex numbers be type-homogeneous (which it seems like it always should be). One of the cutest consequences of this approach is that with careful definitions of the `Complex<T>` templates, one gets a working quaternion data type absolutely for free as `Complex<Complex<number>>` (and integral quaternions as `Complex<Complex<bigint>>`, etc.)

It also now has a facility to adapt a third-party numeric class as a type in Pocomath, see `src/generic/all.mjs` and `src/generic/Types/adapted.mjs`, which it uses by way of example to incorporate fraction.js Fraction objects into Pocomath.