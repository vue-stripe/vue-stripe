import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Props objects from `defineProps` type every optional prop as `T | undefined`, but
 * component props declared as `prop?: T` reject an explicit `undefined` under
 * `exactOptionalPropertyTypes`. At runtime Vue already treats an `undefined` prop
 * like an omitted one, so this narrows the type only and returns the same object.
 */
export type Forwardable<T> = { [K in keyof T]?: Exclude<T[K], undefined> }

export function forwardable<T extends object>(props: T): Forwardable<T> {
  return props
}
