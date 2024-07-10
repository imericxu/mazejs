/**
 * Added functionality on top of the native `requestAnimationFrame` API.
 *
 * - Removes the boilerplate of managing the animation frame ID.
 * - Resolves a promise when the animation finishes.
 * - Allows pausing and unpausing the animation.
 */
export class AnimationPromise {
  /** The ID of the current animation frame. */
  private animationFrameId: number | null = null;
  /** Resolves the exposed promise. */
  private resolve: (() => void) | null = null;
  /** Whether the animation is paused. */
  private paused: boolean = false;

  /** The promise that is resolved when the animation is finished. */
  readonly promise: Promise<void>;

  /**
   * @param callback Callback to be called on each animation frame (that isn't
   * skipped due to FPS cap).
   * @param finishCondition Callback to be called on each animation frame to
   * determine if the animation is finished.
   * @param fpsCap The maximum number of frames per second. If null, the
   * animation will run at the maximum frame rate.
   */
  constructor(
    private callback: (elapsedMs: number, timeSinceStartMs: number) => void,
    private finishCondition: (timeSinceStartMs: number) => boolean,
    private fpsCap: number | null = null,
  ) {
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
  }

  /**
   * Start the animation, resolving the promise when the animation is finished.
   *
   * The promise can also be resolved by calling the `cancel` method.
   */
  start() {
    const delayMs: number = this.fpsCap ? 1000 / this.fpsCap : 0;
    let pausedTimeMs: number = 0;

    this.animationFrameId = requestAnimationFrame((timeMs) => {
      const startMs: number = timeMs;
      let prevMs: number = startMs;

      const animate = (timeMs: number) => {
        const elapsedMs: number = timeMs - prevMs;
        if (this.paused) {
          pausedTimeMs += elapsedMs;
          prevMs = timeMs;
          this.animationFrameId = requestAnimationFrame(animate);
          return;
        }
        const timeSinceStart: number = timeMs - startMs - pausedTimeMs;
        if (this.finishCondition(timeSinceStart)) {
          this.resolve!();
          this.animationFrameId = null;
          return;
        }
        if (elapsedMs >= delayMs) {
          this.callback(elapsedMs, timeSinceStart);
          prevMs = timeMs;
        }
        this.animationFrameId = requestAnimationFrame(animate);
      };
      animate(timeMs);
    });
  }

  /**
   * Stops the animation and resolves the promise.
   */
  cancel(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resolve !== null) this.resolve();
  }

  /** Pauses the animation. */
  pause(): void {
    this.paused = true;
  }

  /** Unpauses the animation. */
  unpause(): void {
    this.paused = false;
  }
}
