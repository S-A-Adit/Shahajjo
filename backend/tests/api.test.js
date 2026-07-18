const request = require('supertest');
const app = require('../server');
const { resetDb, registerUser, loginUser } = require('./utils');

/** Helper to extract cookie header for subsequent requests */
function extractCookies(res) {
  return res.headers['set-cookie'];
}

/** Helper to perform an authenticated request with cookies */
function authRequest(agent, method, url, cookies, body = null) {
  let req = agent[method](url).set('Cookie', cookies);
  if (body) req = req.send(body);
  return req;
}

describe('Backend Integration Flow', () => {
  beforeAll(async () => {
    await resetDb();
  });

  let customerCookies, workerCookies;
  let jobId, notificationId;

  test('Register Customer', async () => {
    const res = await registerUser({
      name: 'Alice',
      phone: '5550001',
      password: 'secret123',
      user_type: 'Customer',
      latitude: 40.0,
      longitude: -74.0,
    });
    expect(res.message).toBe('User registered successfully');
  });

  test('Login Customer', async () => {
    const { body, cookies } = await loginUser({ phone: '5550001', password: 'secret123' });
    expect(body.message).toBe('Logged in successfully');
    customerCookies = cookies;
    expect(customerCookies).toBeDefined();
  });

  test('Create Job Request', async () => {
    const res = await request(app)
      .post('/customer/jobs')
      .set('Cookie', customerCookies)
      .send({
        service_type: 'Cleaning',
        latitude: 40.001,
        longitude: -74.001,
        scheduled_time: '2026-07-05T10:00:00Z',
        description: 'Apartment cleaning',
      });
    expect(res.status).toBe(201);
    expect(res.body.jobId).toBeDefined();
    jobId = res.body.jobId;
  });

  test('Register Worker', async () => {
    const res = await registerUser({
      name: 'Bob',
      phone: '5550002',
      password: 'workerpwd',
      user_type: 'Worker',
      service_type: 'Cleaning',
      experience_years: 2,
      hourly_rate: 20,
      latitude: 40.002,
      longitude: -74.002,
    });
    expect(res.message).toBe('User registered successfully');
  });

  test('Login Worker', async () => {
    const { body, cookies } = await loginUser({ phone: '5550002', password: 'workerpwd' });
    expect(body.message).toBe('Logged in successfully');
    workerCookies = cookies;
    expect(workerCookies).toBeDefined();
  });

  test('Set Worker Availability', async () => {
    const res = await request(app)
      .post('/worker/availability')
      .set('Cookie', workerCookies)
      .send({ availability: true });
    expect(res.status).toBe(200);
  });

  test('Trigger Matching Engine', async () => {
    const res = await request(app)
      .post(`/customer/match/${jobId}`)
      .set('Cookie', customerCookies)
      .send();
    expect(res.status).toBe(200);
    expect(res.body.matchedCount).toBeGreaterThan(0);
  });

  test('Worker Receives Notification', async () => {
    const res = await request(app)
      .get('/worker/notifications')
      .set('Cookie', workerCookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const notif = res.body[0];
    notificationId = notif.id;
    expect(notif.message).toBeDefined();
  });

  test('Worker Accepts Notification', async () => {
    const res = await request(app)
      .post(`/worker/notifications/${notificationId}/accept`)
      .set('Cookie', workerCookies)
      .send();
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/accepted/);
  });

  test('Verify Booking Appears in Worker My Jobs', async () => {
    const res = await request(app)
      .get('/worker/my-jobs')
      .set('Cookie', workerCookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const job = res.body[0];
    expect(job.job_request_id).toBe(jobId);
  });

  test('Customer Rates Worker Booking', async () => {
    // Get booking ID first
    const bookingsRes = await request(app)
      .get('/customer/bookings')
      .set('Cookie', customerCookies);
    const bookingId = bookingsRes.body[0].id;

    const rateRes = await request(app)
      .post(`/customer/bookings/${bookingId}/rate`)
      .set('Cookie', customerCookies)
      .send({ rating: 5, comment: 'Excellent helper!' });
    expect(rateRes.status).toBe(201);
    expect(rateRes.body.message).toMatch(/submitted/);
  });

  test('Worker Ratings Profile and Summary Check', async () => {
    const res = await request(app)
      .get('/worker/ratings')
      .set('Cookie', workerCookies);
    expect(res.status).toBe(200);
    expect(res.body.avgRating).toBe(5);
    expect(res.body.totalReviews).toBe(1);
    expect(res.body.reviews[0].comment).toBe('Excellent helper!');
  });

  test('Customer Cancels Active Job Request', async () => {
    // Create new job
    const newJobRes = await request(app)
      .post('/customer/jobs')
      .set('Cookie', customerCookies)
      .send({
        service_type: 'Cook',
        latitude: 40.001,
        longitude: -74.001,
        scheduled_time: '2026-07-06T12:00:00Z',
        description: 'Need a cook',
      });
    const cancelJobId = newJobRes.body.jobId;

    const cancelRes = await request(app)
      .post(`/customer/cancel/${cancelJobId}`)
      .set('Cookie', customerCookies)
      .send();
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.message).toMatch(/cancelled/);
  });
});
