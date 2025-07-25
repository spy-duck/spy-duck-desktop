/**
 * Takes a Promise and returns its result, delaying it until the nearest multiple of the given time.
 *
 * @template T The type of the value that the input Promise resolves to.
 * @param {Promise<T>} promise The original Promise whose result needs to be returned.
 * @param {number} intervalMs The time interval in milliseconds to which the Promise's execution time should be rounded.
 * @returns {Promise<T>} A new Promise that will resolve with the result of the original Promise after the rounded time.
 */
export function intervalPromise<T>(
  promise: Promise<T>,
  intervalMs: number,
): Promise<T> {
  if (intervalMs <= 0) {
    throw new Error("The time interval must be a positive number.");
  }

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    promise
      .then((result: T) => {
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        const roundedTime = Math.ceil(elapsedTime / intervalMs) * intervalMs;
        const delay = roundedTime - elapsedTime;

        const finalDelay = Math.max(0, delay);

        setTimeout(() => {
          resolve(result);
        }, finalDelay);
      })
      .catch(reject);
  });
}
