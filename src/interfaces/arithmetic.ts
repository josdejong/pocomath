export type Abs<T> = (x: T) => T
export type Add<T> = (x: T, y: T) => T
export type Compare<T> = (x: T, y: T) => T
export type Divide<T> = (x: T, y: T) => T
export type Equal<T> = (x: T, y: T) => boolean
export type Subtract<T> = (x: T, y: T) => T
export type Mean<T> = (...values: T[]) => T
export type Multiply<T> = (x: T, y: T) => T
export type Negate<T> = (x: T) => T
export type Sign<T> = (x: T) => T
export type Smaller<T> = (x: T, y: T) => T
export type Sum<T> = (...values: T[]) => T  // TODO: rename to Add<T>, replacing that one?
export type Sqrt<T> = (x: T, y: T) => T
export type Square<T> = (x: T) => T
export type Quotient<T> = (n: T, d: T) => T
export type Zero<T> = (x: T) => T
