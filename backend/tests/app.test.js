import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('App & Route Endpoints', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('GET / should return 200 with API status message', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'Email Writing Assessment API is running');
  });

  it('GET /api/health should return 200 with health status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'Backend is running');
  });

  it('GET /non-existent-route should return 404 with ROUTE_NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/non-existent-route`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ROUTE_NOT_FOUND');
  });

  it('POST /api/submissions with missing body should return 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/submissions with invalid email should return 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-123',
        scenarioId: '507f1f77bcf86cd799439011',
        to: 'not-an-email',
        subject: 'Valid Subject',
        body: 'Valid email body text.'
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    assert.match(body.error.message, /recipient email/i);
  });

  it('POST /api/submissions with body > 100kb should return 413 Payload Too Large', async () => {
    const largeBody = 'x'.repeat(120 * 1024); // 120kb payload
    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-123',
        scenarioId: '507f1f77bcf86cd799439011',
        to: 'test@example.com',
        subject: 'Subject',
        body: largeBody
      })
    });
    assert.strictEqual(res.status, 413);
  });
});
