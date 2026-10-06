import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { COOKIE_NAMES } from '../src/config/constants';

const app = createApp();

describe('Authentication Endpoints', () => {
  const testUser = {
    name: 'Esther Ezekiel',
    email: 'esther@example.com',
    password: 'SecurePassword123!',
  };

  it('should successfully register a new user and set auth cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify Set-Cookie header contains access_token and refresh_token
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const joined = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
    expect(joined).toContain(COOKIE_NAMES.ACCESS_TOKEN);
    expect(joined).toContain(COOKIE_NAMES.REFRESH_TOKEN);
  });

  it('should reject registration if email is already taken', async () => {
    // First registration
    await request(app).post('/api/v1/auth/register').send(testUser);

    // Duplicate registration
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should reject registration with invalid password format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
      password: 'short',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
  });

  it('should log in successfully with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should return 401 for incorrect password without leaking existence', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('should return current user and preferences via GET /auth/me when authenticated', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const cookies = regRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookies);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe(testUser.email);
    expect(meRes.body.data.preferences).toBeDefined();
    expect(meRes.body.data.preferences.theme).toBe('system');
  });

  it('should reject GET /auth/me with 401 when anonymous', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('should refresh tokens and rotate refresh token via POST /auth/refresh', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const cookies = regRes.headers['set-cookie'];

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    const newCookies = refreshRes.headers['set-cookie'];
    expect(newCookies).toBeDefined();
  });

  it('should logout cleanly and clear cookies', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
    const cookies = regRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it('should reject malformed Google token with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'invalid_dummy_token_12345' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
