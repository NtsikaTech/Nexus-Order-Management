import request from 'supertest';
import app from '../src/app';

describe('Auth Endpoints', () => {
  it('should return 400 for missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
}); 