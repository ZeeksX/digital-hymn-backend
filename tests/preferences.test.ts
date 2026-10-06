import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('User Preferences Endpoints', () => {
  let authCookie: string[];

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Prefs User',
      email: 'prefs@example.com',
      password: 'StrongPassword123!',
    });
    authCookie = res.headers['set-cookie'];
  });

  it('should get default preferences for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/users/me/preferences')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('system');
    expect(res.body.data.defaultTextSize).toBe('md');
    expect(res.body.data.rememberRecentlyViewed).toBe(true);
  });

  it('should update preferences with valid values', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/preferences')
      .set('Cookie', authCookie)
      .send({
        theme: 'dark',
        defaultTextSize: 'lg',
        serifLyrics: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('dark');
    expect(res.body.data.defaultTextSize).toBe('lg');
    expect(res.body.data.serifLyrics).toBe(true);
  });

  it('should reject unrecognized preference keys (prevent mass assignment)', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/preferences')
      .set('Cookie', authCookie)
      .send({
        theme: 'dark',
        isAdmin: true, // Malicious / unrecognized property
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid enum values for theme', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/preferences')
      .set('Cookie', authCookie)
      .send({
        theme: 'neon-purple',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
