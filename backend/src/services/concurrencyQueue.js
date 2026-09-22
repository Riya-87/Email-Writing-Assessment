/**
 * Concurrency Limiter and In-Memory FIFO Queue
 *
 * Protects third-party AI APIs (Google Gemini) and the Node.js event loop
 * from sudden burst traffic (e.g., up to 1,000 concurrent candidate submissions).
 * Enforces a bounded concurrency limit and maximum queue depth with timeouts,
 * ensuring system stability without requiring external infrastructure (Redis/Kafka).
 */

export class ConcurrencyQueue {
  /**
   * @param {Object} options
   * @param {number} [options.concurrency=8] - Maximum concurrent evaluations in flight
   * @param {number} [options.maxQueueSize=250] - Maximum tasks waiting in queue before rejection
   * @param {number} [options.queueTimeoutMs=35000] - Max time a task can wait in queue before timing out
   */
  constructor({ concurrency = 8, maxQueueSize = 250, queueTimeoutMs = 35000 } = {}) {
    this.concurrency = concurrency;
    this.maxQueueSize = maxQueueSize;
    this.queueTimeoutMs = queueTimeoutMs;
    this.activeCount = 0;
    this.queue = [];
    this.metrics = {
      totalQueued: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalRejected: 0
    };
  }

  /**
   * Enqueue an async task function to be executed when concurrency permits.
   *
   * @template T
   * @param {() => Promise<T>} taskFn - Asynchronous task returning a Promise
   * @returns {Promise<T>}
   */
  enqueue(taskFn) {
    if (this.queue.length >= this.maxQueueSize) {
      this.metrics.totalRejected++;
      const error = new Error('Assessment evaluation service is currently handling high volume. Please retry in a few seconds.');
      error.statusCode = 429;
      error.code = 'QUEUE_CAPACITY_EXCEEDED';
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      let timer = null;

      const item = {
        taskFn,
        resolve,
        reject,
        timer: null
      };

      if (this.queueTimeoutMs > 0) {
        item.timer = setTimeout(() => {
          // Remove from queue if still pending
          const index = this.queue.indexOf(item);
          if (index !== -1) {
            this.queue.splice(index, 1);
            this.metrics.totalRejected++;
            const timeoutError = new Error('Evaluation request timed out while waiting in processing queue.');
            timeoutError.statusCode = 504;
            timeoutError.code = 'QUEUE_TIMEOUT';
            reject(timeoutError);
          }
        }, this.queueTimeoutMs);
      }

      this.queue.push(item);
      this.metrics.totalQueued++;
      this._processNext();
    });
  }

  /**
   * Internal scheduler to dispatch pending tasks up to the concurrency limit.
   * @private
   */
  _processNext() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    if (item.timer) {
      clearTimeout(item.timer);
    }

    this.activeCount++;

    Promise.resolve()
      .then(() => item.taskFn())
      .then(
        (result) => {
          this.metrics.totalCompleted++;
          item.resolve(result);
        },
        (error) => {
          this.metrics.totalFailed++;
          item.reject(error);
        }
      )
      .finally(() => {
        this.activeCount--;
        this._processNext();
      });
  }

  /**
   * Get live queue status metrics.
   */
  getStatus() {
    return {
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      concurrencyLimit: this.concurrency,
      ...this.metrics
    };
  }

  /**
   * Clear all queued items (used during graceful shutdown or tests).
   */
  clear() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item.timer) clearTimeout(item.timer);
      const err = new Error('Server shutting down; queued task canceled.');
      err.statusCode = 503;
      err.code = 'SERVER_SHUTDOWN';
      item.reject(err);
    }
  }
}

// Default singleton instance configured for Render and Gemini throughput
export const evaluationQueue = new ConcurrencyQueue({
  concurrency: 8,
  maxQueueSize: 250,
  queueTimeoutMs: 35000
});
