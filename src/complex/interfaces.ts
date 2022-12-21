// FIXME: name conflict with Complex.mjs
export interface Complex<T> {
  re: T
  im: T
}

export type Quaternion<T> = Complex<Complex<T>>
