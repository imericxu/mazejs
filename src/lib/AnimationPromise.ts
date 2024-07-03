export class AnimationPromise {
  get promise(): Promise<void> {
    return this._promise;
  }

  private animationFrameId: number | null = null;
  private resolve: (() => void) | null = null;
  private _promise: Promise<void>;

  constructor(
    private callback: (elapsedMs: number, timeSinceStartMs: number) => void,
    private finishCondition: (timeSinceStartMs: number) => boolean,
    private fpsCap: number | null = null,
  ) {
    this._promise = new Promise<void>((resolve) => {
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
    this.animationFrameId = requestAnimationFrame((timeMs) => {
      const startMs: number = timeMs;
      let prevMs: number = startMs;

      const animate = (timeMs: number) => {
        const elapsedMs: number = timeMs - prevMs;
        const timeSinceStart: number = timeMs - startMs;
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
    if (this.resolve !== null) {
      this.resolve();
    }
  }
}
