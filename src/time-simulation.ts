/**
 * Time simulation for accelerating or slowing down time
 */

export class TimeSimulation {
  constructor(
    private startTime: Date,
    private speedMultiplier: number
  ) {}

  /**
   * Get the simulated current time based on real elapsed time and speed multiplier
   */
  getSimulatedTime(): Date {
    const realNow = new Date();
    const elapsedRealTime = realNow.getTime() - this.startTime.getTime();
    const simulatedElapsedTime = elapsedRealTime * this.speedMultiplier;
    return new Date(this.startTime.getTime() + simulatedElapsedTime);
  }

  /**
   * Update the speed multiplier
   */
  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }
}
