import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConcurrencyQueue } from '../src/services/concurrencyQueue.js';

describe('ConcurrencyQueue Service', () => {
  it('should enforce concurrency limits and execute all tasks', async () => {
    const queue = new ConcurrencyQueue({ concurrency: 2, maxQueueSize: 20 });
    let currentConcurrent = 0;
    let maxObservedConcurrent = 0;
    const completed = [];

    const createTask = (id, delayMs) => async () => {
      currentConcurrent++;
      if (currentConcurrent > maxObservedConcurrent) {
        maxObservedConcurrent = currentConcurrent;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      completed.push(id);
      currentConcurrent--;
      return id;
    };

    const promises = [
      queue.enqueue(createTask(1, 40)),
      queue.enqueue(createTask(2, 40)),
      queue.enqueue(createTask(3, 20)),
      queue.enqueue(createTask(4, 20))
    ];

    const results = await Promise.all(promises);

    assert.deepStrictEqual(results, [1, 2, 3, 4]);
    assert.strictEqual(maxObservedConcurrent, 2, 'Max concurrent executions should never exceed configured limit (2)');
    assert.strictEqual(completed.length, 4);
  });

  it('should isolate errors without halting subsequent queue tasks', async () => {
    const queue = new ConcurrencyQueue({ concurrency: 1, maxQueueSize: 10 });

    const failTask = async () => {
      throw new Error('Task failure');
    };

    const successTask = async () => 'success';

    const p1 = queue.enqueue(failTask).catch((err) => err.message);
    const p2 = queue.enqueue(successTask);

    const [res1, res2] = await Promise.all([p1, p2]);

    assert.strictEqual(res1, 'Task failure');
    assert.strictEqual(res2, 'success');
  });

  it('should reject tasks immediately when queue capacity is reached', async () => {
    const queue = new ConcurrencyQueue({ concurrency: 1, maxQueueSize: 2 });

    // Block the 1 active worker
    const slowTask = () => new Promise((resolve) => setTimeout(resolve, 100));

    // Fill the worker (1) and the queue (2)
    queue.enqueue(slowTask);
    queue.enqueue(slowTask);
    queue.enqueue(slowTask);

    // 4th task exceeds maxQueueSize (2 in queue)
    await assert.rejects(
      async () => {
        await queue.enqueue(slowTask);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 429);
        assert.strictEqual(err.code, 'QUEUE_CAPACITY_EXCEEDED');
        return true;
      }
    );
  });

  it('should timeout waiting task if it exceeds queueTimeoutMs', async () => {
    const queue = new ConcurrencyQueue({ concurrency: 1, maxQueueSize: 5, queueTimeoutMs: 50 });

    // Block worker for 150ms
    queue.enqueue(() => new Promise((resolve) => setTimeout(resolve, 150)));

    // Second task waits in queue; timeout is 50ms
    await assert.rejects(
      async () => {
        await queue.enqueue(async () => 'done');
      },
      (err) => {
        assert.strictEqual(err.statusCode, 504);
        assert.strictEqual(err.code, 'QUEUE_TIMEOUT');
        return true;
      }
    );
  });
});
