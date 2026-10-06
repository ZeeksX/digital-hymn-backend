import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { HymnModel } from '../src/modules/hymns/hymn.model';
import { SEED_HYMNS } from '../src/scripts/seed-data';

const app = createApp();

describe('Recently Viewed & Suggestions Endpoints', () => {
  let authCookie: string[];

  beforeEach(async () => {
    for (const h of SEED_HYMNS.slice(0, 3)) {
      await HymnModel.create(h);
    }

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'History User',
      email: 'history@example.com',
      password: 'StrongPassword123!',
    });
    authCookie = res.headers['set-cookie'];
  });

  describe('Recently Viewed', () => {
    it('should record hymn viewing and list it in recently viewed', async () => {
      const recordRes = await request(app)
        .post('/api/v1/users/me/recently-viewed/1')
        .set('Cookie', authCookie);

      expect(recordRes.status).toBe(201);
      expect(recordRes.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/v1/users/me/recently-viewed')
        .set('Cookie', authCookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].hymn.number).toBe(1);
    });

    it('should update recency when same hymn is viewed again without creating duplicates', async () => {
      await request(app)
        .post('/api/v1/users/me/recently-viewed/1')
        .set('Cookie', authCookie);

      await request(app)
        .post('/api/v1/users/me/recently-viewed/1')
        .set('Cookie', authCookie);

      const listRes = await request(app)
        .get('/api/v1/users/me/recently-viewed')
        .set('Cookie', authCookie);

      expect(listRes.body.data).toHaveLength(1);
    });
  });

  describe('Hymn Suggestions', () => {
    const validSuggestion = {
      title: 'Guide Me, O Thou Great Jehovah',
      author: 'William Williams',
      category: 'Prayer',
      lyrics: 'Guide me, O Thou great Jehovah, pilgrim through this barren land...',
      submittedBy: 'Esther',
      email: 'esther@example.com',
    };

    it('should accept hymn suggestions from guests', async () => {
      const res = await request(app)
        .post('/api/v1/hymn-suggestions')
        .send(validSuggestion);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(validSuggestion.title);
      expect(res.body.data.status).toBe('pending');
    });

    it('should accept hymn suggestions from authenticated users and link them', async () => {
      const res = await request(app)
        .post('/api/v1/hymn-suggestions')
        .set('Cookie', authCookie)
        .send(validSuggestion);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
    });

    it('should reject hymn suggestions with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/hymn-suggestions')
        .send({ title: 'Short' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
