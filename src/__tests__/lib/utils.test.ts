import {
  clamp,
  deepEqual,
  easeOutQuad,
  randomFromArray,
  randomFromSet,
} from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("randomFromSet()", () => {
  it("should throw an error when the set is empty", () => {
    expect(() => randomFromSet(new Set())).toThrowError();
  });

  it("should work with a variety of sizes", () => {
    expect(randomFromSet(new Set([1]))).toBe(1);
    expect([1, 2]).toContain(randomFromSet(new Set([1, 2])));
    const list = Array.from({ length: 100 }, (_, i) => i);
    expect(list).toContain(randomFromSet(new Set(list)));
  });
});

describe("randomFromArray()", () => {
  it("should throw an error when the list is empty", () => {
    expect(() => randomFromArray([])).toThrowError();
  });

  it("should work with a variety of sizes", () => {
    expect(randomFromArray([1])).toBe(1);
    expect([1, 2]).toContain(randomFromArray([1, 2]));

    const list = Array.from({ length: 100 }, (_, i) => i);
    expect(list).toContain(randomFromArray(list));
  });
});

describe("easeOutQuad()", () => {
  it("should be bounded by the start and end values", () => {
    expect(easeOutQuad(0, 100, 0, 100)).toBe(0);
    expect(easeOutQuad(100, 100, 0, 100)).toBe(100);
    const val30 = easeOutQuad(30, 100, 0, 100);
    expect(val30).toBeGreaterThan(0);
    expect(val30).toBeLessThan(100);
  });

  it("shouldn't exceed the target value", () => {
    expect(easeOutQuad(150, 100, 0, 100)).toBe(100);
  });

  it("should be past the halfway point at 50% of the duration", () => {
    expect(easeOutQuad(50, 100, 0, 100)).toBeGreaterThan(50);
  });
});

describe("clamp()", () => {
  it("should return the value if it's within the range", () => {
    expect(clamp(0, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(100, 0, 100)).toBe(100);
  });

  it("should return the min value if the value is less than the min", () => {
    expect(clamp(-1, 0, 100)).toBe(0);
  });

  it("should return the max value if the value is greater than the max", () => {
    expect(clamp(101, 0, 100)).toBe(100);
  });
});

describe("deepEqual()", () => {
  it("should return true for equal objects", () => {
    expect(deepEqual({}, {})).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("should return false for unequal objects", () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
    expect(deepEqual({ a: 1 }, {})).toBe(false);
  });
});
