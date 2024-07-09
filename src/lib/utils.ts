/** The return type of setTimeout depending on the environment. */
export type Timeout = ReturnType<typeof setTimeout>;

export type Direction = "up" | "down" | "left" | "right";

/**
 * Picks a random element from a set.
 *
 * Iterates through the set instead of converting it to an array.
 */
export function randomFromSet<T>(set: ReadonlySet<T>): T {
  if (set.size === 0) {
    throw Error("Cannot pick a random element from an empty set.");
  }
  const index: number = Math.floor(Math.random() * set.size);
  const it = set.keys();
  for (let i = 0; i < index; i++) {
    it.next();
  }
  return it.next().value;
}

/** Picks a random element from an array. */
export function randomFromArray<T>(arr: ReadonlyArray<T>): T {
  if (arr.length === 0) {
    throw Error("Cannot pick a random element from an empty array.");
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Quadratic ease out function.
 * @param elapsedMs - Elapsed time in milliseconds.
 * @param durationMs - Total duration in milliseconds.
 * @param startValue - Initial value.
 * @param valueChange - Change in value (target value - start value).
 */
export function easeOutQuad(
  elapsedMs: number,
  durationMs: number,
  startValue: number,
  valueChange: number,
) {
  // progress is a value between 0 and 1.
  const progress = Math.min(elapsedMs / durationMs, 1);
  return -valueChange * progress * (progress - 2) + startValue;
}

/** Clamps a value between a minimum and maximum (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Performs a deep comparison. */
export function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1) as (keyof T)[];
  const keys2 = Object.keys(obj2) as (keyof T)[];

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }

    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export function getIntFromForm(
  formEvent: Readonly<FormData>,
  key: string,
): number | null {
  const value = formEvent.get(key);
  if (value === null) return null;

  const intValue = parseInt(value.toString());
  if (isNaN(intValue)) return null;

  return intValue;
}

export function getFloatFromForm(
  formEvent: Readonly<FormData>,
  key: string,
): number | null {
  const value = formEvent.get(key);
  if (value === null) return null;

  const floatValue = parseFloat(value.toString());
  if (isNaN(floatValue)) return null;

  return floatValue;
}
