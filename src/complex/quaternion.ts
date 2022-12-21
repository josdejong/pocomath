import { Complex } from "./interfaces"
import { ComplexFn } from "./complex"

export type QuaternionFn<T> = (r: T, i: T, j: T, k: T) => Complex<Complex<T>>

export const quaternion = {
    'infer': function <T>({ complex, quat }: {
        complex: ComplexFn<T>,
        quat: ComplexFn<Complex<T>>
    }): QuaternionFn<T> {
        return (r: T, i: T, j: T, k: T) => {
            return quat(complex(r, j), complex(i, k))
        }
    }
}
