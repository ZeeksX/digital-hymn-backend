import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Security & Infrastructure', () => {
  it('should return JSON 404 for nonexistent routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent-endpoint');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should serve lightweight health check without exposing secrets', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.uptime).toBeDefined();
    expect(res.body.secrets).toBeUndefined();
    expect(res.body.env).toBeUndefined();
  });

  it('should serve Swagger OpenAPI spec as valid JSON', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('Digital Hymn Book REST API');
  });

  it('should include HTTP security headers via Helmet', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
