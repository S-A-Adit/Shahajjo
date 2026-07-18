const request = require('supertest');
const app = require('../server');

/** Reset the dev database */
async function resetDb() {
  await request(app).post('/reset').send();
}

/** Register a user (customer or worker) */
async function registerUser(user) {
  const res = await request(app).post('/auth/register').send(user);
  return res.body;
}

/** Login and obtain auth cookies */
async function loginUser(creds) {
  const res = await request(app).post('/auth/login').send(creds);
  const cookies = res.headers['set-cookie'];
  return { body: res.body, cookies };
}

module.exports = { resetDb, registerUser, loginUser };
