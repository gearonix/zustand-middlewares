// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyKey = keyof any
export type AnyObj = Record<AnyKey, unknown>

export type Nil = null | undefined
export type Falsy = false | null | undefined | void | 0 | ''

export type TupleToUnion<T extends unknown[]> = T[number]

export type Reverse<T extends unknown[], R extends unknown[] = []> = T extends [
  infer S,
  ...infer Rest
]
  ? Reverse<Rest, [S, ...R]>
  : R

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

type Cast<X, Y> = X extends Y ? X : Y

export type FromEntries<T> = T extends [infer Key, unknown][]
  ? { [K in Cast<Key, string>]: Extract<ArrayElement<T>, [K, unknown]>[1] }
  : { [key in string]: unknown }

/**
 * some helpers are taken from
 * https://github.com/secundant/neodx/tree/main/libs/std
 */

export const hasOwn = Object.hasOwn as TypedObjectHasOwn
export const entries = Object.entries as TypedObjectEntries

interface TypedObjectHasOwn {
  <Key extends keyof T, T extends Record<AnyKey, unknown>>(
    target: T,
    key: Key
  ): target is T & {
    [K in Key]-?: Exclude<T[K], undefined | void | never>
  }
  <Key extends AnyKey, T extends Record<AnyKey, unknown>>(
    target: T,
    key: Key
  ): key is Key & keyof T
}

export type ObjectEntry<T> = {
  [Key in Extract<keyof T, string>]: [Key, Exclude<T[Key], undefined>]
}[Extract<keyof T, string>]

export interface TypedObjectEntries {
  <T>(target: T): ObjectEntry<T>[]
}

// guards
export const isFunction = (
  value: unknown
): value is (...args: any[]) => unknown => typeof value === 'function'

export const isNil = (target: unknown): target is Nil => target == null

export const isObject = (target: unknown): target is AnyObj =>
  typeof target === 'object' && target !== null

export const isTruthy = Boolean as unknown as <T>(
  value: T | Falsy
) => value is T

// helpers
export function filterObject<T>(
  record: T,
  fn: <K extends Extract<keyof T, string>>(value: T[K], key: K) => boolean
) {
  return Object.fromEntries(
    entries(record).filter(([key, value]) => fn(value, key))
  ) as T
}

export const omit = <T>(target: T, keyToRemove: keyof T) =>
  filterObject(target, (value, key) => key !== keyToRemove) as T
