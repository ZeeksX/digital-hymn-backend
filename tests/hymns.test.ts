import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { HymnModel } from '../src/modules/hymns/hymn.model';
import { CategoryModel } from '../src/modules/categories/category.model';
import { SEED_CATEGORIES, SEED_HYMNS } from '../src/scripts/seed-data';

const app = createApp();

describe('Hymns & Categories Endpoints', () => {
  beforeEach(async () => {
    // Seed sample categories & hymns for testing
    for (const cat of SEED_CATEGORIES.slice(0, 5)) {
      await CategoryModel.create(cat);
    }
    for (const hymn of SEED_HYMNS.slice(0, 15)) {
      await HymnModel.create(hymn);
    }
  });

  it('should list hymns with consistent pagination structure', async () => {
    const res = await request(app).get('/api/v1/hymns?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.total).toBe(15);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.pagination.hasNextPage).toBe(true);
    expect(res.body.pagination.hasPreviousPage).toBe(false);
  });

  it('should search hymns by keyword in title or lyrics', async () => {
    const res = await request(app).get('/api/v1/hymns?search=Grace');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const found = res.body.data.some((h: any) => h.title.includes('Grace'));
    expect(found).toBe(true);
  });

  it('should search hymns by hymn number', async () => {
    const res = await request(app).get('/api/v1/hymns?search=1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((h: any) => h.number === 1)).toBe(true);
  });

  it('should filter hymns by category', async () => {
    const res = await request(app).get('/api/v1/hymns?category=Praise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((h: any) => h.category.toLowerCase() === 'praise')).toBe(true);
  });

  it('should sort hymns descending by number', async () => {
    const res = await request(app).get('/api/v1/hymns?sort=-number&limit=3');

    expect(res.status).toBe(200);
    expect(res.body.data[0].number).toBeGreaterThan(res.body.data[1].number);
  });

  it('should get a single hymn by its hymn number', async () => {
    const res = await request(app).get('/api/v1/hymns/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.number).toBe(1);
    expect(res.body.data.title).toBe('Amazing Grace');
    expect(res.body.data.verses).toBeDefined();
  });

  it('should return 404 for nonexistent hymn identifier', async () => {
    const res = await request(app).get('/api/v1/hymns/9999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should reject invalid pagination parameters (e.g. limit > 100)', async () => {
    const res = await request(app).get('/api/v1/hymns?limit=9999');

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should list categories with dynamic hymn counts', async () => {
    const res = await request(app).get('/api/v1/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].hymnCount).toBeDefined();
  });

  it('should fetch hymns by category slug', async () => {
    const res = await request(app).get('/api/v1/categories/praise/hymns');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((h: any) => h.category.toLowerCase() === 'praise')).toBe(true);
  });
});
