const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

beforeAll(async () => {
  const initSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');
  await pool.query(initSql);
  await pool.query('TRUNCATE instruments RESTART IDENTITY');
});

afterAll(async () => {
  await pool.end();
});

describe('GET /health', () => {
  it('reports a healthy DB connection', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Instruments CRUD', () => {
  let createdId;

  it('creates an instrument', async () => {
    const res = await request(app).post('/api/instruments').send({
      name: 'pH Meter',
      serial_number: 'PH-2024-001',
      location: 'QC Lab 1',
      calibration_interval_days: 180,
      last_calibrated_at: '2026-01-15',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.serial_number).toBe('PH-2024-001');
    createdId = res.body.data.id;
  });

  it('rejects a duplicate serial number with 409', async () => {
    const res = await request(app).post('/api/instruments').send({
      name: 'pH Meter Copy',
      serial_number: 'PH-2024-001',
      location: 'QC Lab 2',
      last_calibrated_at: '2026-01-15',
    });
    expect(res.status).toBe(409);
  });

  it('rejects missing required fields with 400', async () => {
    const res = await request(app).post('/api/instruments').send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('lists instruments with a computed status', async () => {
    const res = await request(app).get('/api/instruments');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(['COMPLIANT', 'DUE_SOON', 'OVERDUE']).toContain(res.body.data[0].status);
  });

  it('updates an instrument', async () => {
    const res = await request(app)
      .put(`/api/instruments/${createdId}`)
      .send({ location: 'QC Lab 3' });
    expect(res.status).toBe(200);
    expect(res.body.data.location).toBe('QC Lab 3');
  });

  it('deletes an instrument', async () => {
    const res = await request(app).delete(`/api/instruments/${createdId}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for a missing instrument', async () => {
    const res = await request(app).get(`/api/instruments/${createdId}`);
    expect(res.status).toBe(404);
  });
});
