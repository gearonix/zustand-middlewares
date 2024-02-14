/* eslint-disable @typescript-eslint/no-explicit-any */

import { merge } from 'ts-deepmerge'
import {
  create as _create,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  UseBoundStore
} from 'zustand'
import {
  AnyObj,
  DeepPartial,
  FromEntries,
  hasOwn,
  isFunction,
  isNil,
  isObject,
  isTruthy,
  omit,
  Reverse,
  TupleToUnion
} from './shared'

type AnyStateCreator = StateCreator<any, any, any, any>

type AnyMiddleware = (
  initializer: AnyStateCreator,
  options?: any
) => AnyStateCreator

type MiddlewareAndOptions = [AnyMiddleware, unknown]
type MiddlewareOrOptions = AnyMiddleware | MiddlewareAndOptions

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

type MakeMiddlewareOptionsRecord<M extends AnyMiddleware[]> = FromEntries<{
  [K in keyof M]: InferOptions<M[K]> extends AnyMiddleware
    ? never
    : InferOptions<M[K]> extends [infer _, infer Options]
      ? [ExtractMiddlewareName<M[K]>, Options]
      : never
}>

interface Configure {
  <
    Raw extends MiddlewareOrOptions[],
    MaybeError = HasCorrectMiddlewareOptions<Raw>
  >(
    ...middlewares: Raw
  ): [MaybeError] extends [never]
    ? CreateWithMiddlewares<ExtractMiddlewares<Raw>>
    : MaybeError
}

const isOptionsWithCreator = (
  raw: unknown
): raw is AnyObj & { impl: AnyStateCreator } =>
  isObject(raw) && hasOwn(raw, 'impl')

const isOptionsWithoutCreator = (raw: unknown): raw is Omit<AnyObj, 'impl'> =>
  isObject(raw) && !hasOwn(raw, 'impl')

function extractMiddlewareAndOptions(
  middlewareOrOpts: MiddlewareOrOptions
): MiddlewareAndOptions {
  if (isFunction(middlewareOrOpts)) {
    return [middlewareOrOpts, null]
  }

  return middlewareOrOpts
}

function pipeMiddlewares(
  options: AnyObj,
  middlewares: MiddlewareAndOptions[],
  creator: AnyStateCreator
) {
  return _create(
    middlewares.reduceRight(
      (acc, [middleware]) => middleware(acc, options[middleware.name]),
      creator
    )
  )
}

export const configure = ((...rawMiddlewares: MiddlewareOrOptions[]) => {
  const middlewares = rawMiddlewares
    .filter(isTruthy)
    .map(extractMiddlewareAndOptions)

  let options = middlewares.reduce<AnyObj>((acc, [middleware, options]) => {
    if (isObject(options)) {
      acc[middleware.name] = options
    }

    return acc
  }, {})

  function createPipe(raw: unknown) {
    if (isFunction(raw)) {
      return pipeMiddlewares(options, middlewares, raw)
    }

    if (isOptionsWithCreator(raw)) {
      options = merge(options, omit(raw, 'impl'))

      return pipeMiddlewares(options, middlewares, raw.impl)
    }
  }

  return (raw: unknown) => {
    if (isNil(raw)) {
      return createPipe
    }

    if (isOptionsWithoutCreator(raw)) {
      options = merge(options, raw)

      return createPipe
    }

    return createPipe(raw)
  }
}) as Configure
