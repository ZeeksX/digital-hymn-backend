import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { HymnModel } from '../src/modules/hymns/hymn.model';
import { SEED_HYMNS } from '../src/scripts/seed-data';

const app = createApp();

describe('Favorites Endpoints', () => {
  let authCookie: string[];

  beforeEach(async () => {
    // Seed hymn 1 & 2
    for (const h of SEED_HYMNS.slice(0, 3)) {
      await HymnModel.create(h);
    }

    // Register user
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Favorite User',
      email: 'favuser@example.com',
      password: 'StrongPassword123!',
    });
    authCookie = res.headers['set-cookie'];
  });

  it('should reject unauthenticated access to favorites', async () => {
    const res = await request(app).get('/api/v1/users/me/favorites');
    expect(res.status).toBe(401);
  });

  it('should add a hymn to user favorites', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/favorites/1')
      .set('Cookie', authCookie);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hymn).toBeDefined();
  });

  it('should reject duplicate favorite with 409 Conflict', async () => {
    // Add once
    await request(app)
      .post('/api/v1/users/me/favorites/1')
      .set('Cookie', authCookie);

    // Try adding again
    const res = await request(app)
      .post('/api/v1/users/me/favorites/1')
      .set('Cookie', authCookie);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should list all favorites for authenticated user', async () => {
    await request(app).post('/api/v1/users/me/favorites/1').set('Cookie', authCookie);
    await request(app).post('/api/v1/users/me/favorites/2').set('Cookie', authCookie);

    const res = await request(app)
      .get('/api/v1/users/me/favorites')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('should remove a hymn from favorites', async () => {
    await request(app).post('/api/v1/users/me/favorites/1').set('Cookie', authCookie);

    const deleteRes = await request(app)
      .delete('/api/v1/users/me/favorites/1')
      .set('Cookie', authCookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/users/me/favorites')
      .set('Cookie', authCookie);
    expect(listRes.body.data).toHaveLength(0);
  });
});
