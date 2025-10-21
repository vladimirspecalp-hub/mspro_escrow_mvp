import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Database (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/db/health (GET) - should return database health status', () => {
    return request(app.getHttpServer())
      .get('/db/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('database', 'postgresql');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('/db/stats (GET) - should return database statistics', () => {
    return request(app.getHttpServer())
      .get('/db/stats')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('users');
        expect(res.body).toHaveProperty('deals');
        expect(res.body).toHaveProperty('payments');
        expect(res.body).toHaveProperty('auditLogs');
        expect(typeof res.body.users).toBe('number');
        expect(typeof res.body.deals).toBe('number');
        expect(typeof res.body.payments).toBe('number');
        expect(typeof res.body.auditLogs).toBe('number');
      });
  });
});
