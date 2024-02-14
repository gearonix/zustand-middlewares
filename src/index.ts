import { create }                 from 'zustand'
import { Mutate }                 from 'zustand'
import { StateCreator }           from 'zustand'
import { StoreApi }               from 'zustand'
import { StoreMutatorIdentifier } from 'zustand'
import { UseBoundStore }          from 'zustand'

type TupleToUnion<T extends unknown[]> = T[number]

type AnyMiddleware = (
  initializer: StateCreator<any, any, any, any>,
  options?: any
) => StateCreator<any, any, any, any>

type SerializeMiddlewareKeys<
  M extends AnyMiddleware[],
  Result extends [StoreMutatorIdentifier, never][] = []
> = M extends [
  infer First extends AnyMiddleware,
  ...infer Rest extends AnyMiddleware[]
]
  ? First extends <
      T,
      Mps extends [StoreMutatorIdentifier, unknown][] = [],
      Mcs extends [StoreMutatorIdentifier, unknown][] = []
    >(
      initializer: StateCreator<
        T,
        [...Mps, [infer MutatorValue extends StoreMutatorIdentifier, never]],
        Mcs
      >,
      options?: Record<string, unknown>
    ) => StateCreator<T, Mps, [[StoreMutatorIdentifier, never], ...Mcs]>
    ? SerializeMiddlewareKeys<Rest, [...Result, [MutatorValue, never]]>
    : never
  : Result

type Reverse<T extends unknown[], R extends unknown[] = []> = T extends [
  infer S,
  ...infer Rest
]
  ? Reverse<Rest, [S, ...R]>
  : R

type InferOptions<
  M extends AnyMiddleware,
  Target extends unknown[] = [
    M,
    M extends (initializer: any, options: infer Options) => any
      ? unknown extends Options
        ? never
        : NonNullable<Options> extends object
        ? Partial<NonNullable<Options>>
        : never
      : never
  ]
> = Target[1] extends never ? M : Target

type ExtractMiddlewares<T extends MiddlewareOrOptions[]> = {
  [K in keyof T]: ExtractMiddleware<T[K]>
}

type ExtractMiddleware<
  T extends MiddlewareOrOptions,
  R = T extends [AnyMiddleware, unknown] ? T[0] : T
> = R extends AnyMiddleware ? R : never

type WrongOptionsException<T extends string> =
  `${T}: middleware has no options, or the options given are incorrect.`

type ExtractMiddlewareName<
  M extends AnyMiddleware,
  Serialized extends [
    StoreMutatorIdentifier,
    never
  ][] = SerializeMiddlewareKeys<[M]>
> = Serialized[0] extends [infer Property extends string, ...infer _]
  ? Property extends `zustand/${infer Scope}`
    ? Scope
    : never
  : never

type PrintErrorMessage<
  M extends MiddlewareOrOptions,
  Extracted extends AnyMiddleware = ExtractMiddleware<M>,
  Serialized extends [
    StoreMutatorIdentifier,
    never
  ][] = SerializeMiddlewareKeys<[Extracted]>
> = Serialized[0] extends [infer Property extends string, ...infer _]
  ? WrongOptionsException<Property>
  : never

type HasCorrectMiddlewareOptions<M extends MiddlewareOrOptions[]> = Extract<
  TupleToUnion<{
    [K in keyof M]: M[K] extends AnyMiddleware
      ? true
      : M[K] extends InferOptions<ExtractMiddleware<M[K]>>
      ? true
      : PrintErrorMessage<M[K]>
  }>,
  string
>

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

type MiddlewareOrOptions = AnyMiddleware | [AnyMiddleware, unknown]

interface CreateWithMiddlewares<M extends AnyMiddleware[]> {
  <
    T,
    Mos extends [StoreMutatorIdentifier, unknown][] = Reverse<
      SerializeMiddlewareKeys<M>
    >
  >(
    initializer: StateCreator<T, [], Mos>
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <T>(): <
    Mos extends [StoreMutatorIdentifier, unknown][] = Reverse<
      SerializeMiddlewareKeys<M>
    >
  >(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <
    T,
    Mos extends [StoreMutatorIdentifier, unknown][] = Reverse<
      SerializeMiddlewareKeys<M>
    >
  >(
    initializer: DeepPartial<MakeMiddlewareOptionsRecord<M>> & {
      impl: StateCreator<T, [], Mos>
    }
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <T>(): <
    Mos extends [StoreMutatorIdentifier, unknown][] = Reverse<
      SerializeMiddlewareKeys<M>
    >
  >(
    initializer: DeepPartial<MakeMiddlewareOptionsRecord<M>> & {
      impl: StateCreator<T, [], Mos>
    }
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <T>(
    middlewareOptions?: DeepPartial<MakeMiddlewareOptionsRecord<M>>
  ): <
    Mos extends [StoreMutatorIdentifier, unknown][] = Reverse<
      SerializeMiddlewareKeys<M>
    >
  >(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
}

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

type Cast<X, Y> = X extends Y ? X : Y

type FromEntries<T> = T extends [infer Key, any][]
  ? { [K in Cast<Key, string>]: Extract<ArrayElement<T>, [K, any]>[1] }
  : { [key in string]: any }

type MakeMiddlewareOptionsRecord<M extends AnyMiddleware[]> = FromEntries<{
  [K in keyof M]: InferOptions<M[K]> extends AnyMiddleware
    ? never
    : InferOptions<M[K]> extends [infer _, infer Options]
    ? [ExtractMiddlewareName<M[K]>, Options]
    : never
}>

interface CreateInstance {
  <
    Raw extends MiddlewareOrOptions[],
    MaybeError = HasCorrectMiddlewareOptions<Raw>
  >(
    ...middlewares: Raw
  ): [MaybeError] extends [never]
    ? CreateWithMiddlewares<ExtractMiddlewares<Raw>>
    : MaybeError
}

const configureImpl = <T>(
  middlewares: any[],
  creator: StateCreator<T, [], []>
) => {
  return create<T>(
    middlewares.reduceRight<any>((acc, curr) => {
      return curr(acc)
    }, creator)
  )
}

export const configure = (<M extends unknown[]>(...middlewares: M) =>
  <T>(creator: StateCreator<T, [], []>) =>
    configureImpl(middlewares, creator)) as CreateInstance
