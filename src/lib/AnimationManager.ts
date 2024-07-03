// import { AnimationPromise } from "./AnimationPromise";

// export class AnimationManager {
//   private queues: AnimationPromise[][] = [];

//   async enqueue(animation: AnimationPromise): Promise<void> {
//     if (this.queues.length === 0) {
//       this.queues.push([]);
//     }
//     const queue = this.queues[this.queues.length - 1];
//     queue.push(animation);
//     if (queue.length >= 2) {
//       await queue[queue.length - 2].promise;
//     }
//     animation.start();
//     await animation.promise;
//     queue.shift();
//     if (queue.length === 0) {
//       this.queues.pop();
//     }
//   }

//   async startImmediately(animation: AnimationPromise): Promise<void> {
//     this.queues.push([]);
//     await this.enqueue(animation);
//   }

//   /**
//    * Queues an animation to be played after the previous animations have
//    * finished.
//    * @returns A promise that resolves when the animation is finished.
//    */
//   async queue(animation: AnimationPromise): Promise<void> {
//     this.queues[this.queues.length - 1].push(animation);
//     await this.lastPromise;
//     if (animation.canceled) {
//       return;
//     }
//     this.lastPromise = animation.start();
//     return this.lastPromise;
//   }

//   /**
//    * Queues an animation to be played after the previous animations have
//    * finished, but cancels any animations with the given label.
//    */
//   queueAndBumpNotIn(animation: AnimationPromise, whitelist: string[]): void {
//     const newAnimations: AnimationPromise[] = [];
//     for (const anim of this.animations) {
//       if (whitelist.includes(anim.label)) {
//         newAnimations.push(anim);
//       } else {
//         anim.cancel();
//       }
//     }
//     this.animations = newAnimations;
//     this.queue(animation);
//   }

//   /**
//    * Stops any animations with the given label and removes them from the queue.
//    */
//   cancel(label: string): void {
//     const newAnimations: AnimationPromise[] = [];
//     for (const anim of this.animations) {
//       if (anim.label === label) {
//         anim.cancel();
//       } else {
//         newAnimations.push(anim);
//       }
//     }
//     this.animations = newAnimations;
//   }

//   /**
//    * Stops all animations and clears the queue.
//    */
//   cancelAll(): void {
//     for (const anim of this.animations) {
//       anim.cancel();
//     }
//     this.animations = [];
//     this.lastPromise = Promise.resolve();
//   }
// }
