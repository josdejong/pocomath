import { Compare, Sign, Zero } from '../interfaces/arithmetic'

export const sign = {
   'infer': function <T>({ compare, zero }: {
      compare: Compare<T>,
      zero: Zero<T>
   }): Sign<T> {
      return x => compare(x, zero())
   }
}
