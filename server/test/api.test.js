import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { paretoFrontier } from '../src/lib/optimizer.js';
import { calculateTransportEmissions } from '../src/lib/calculator.js';

let server;
let base;

before(async () => {
  server = createApp({ logging: false }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('transport emissions use per-passenger and per-vehicle factors', () => {
  assert.equal(calculateTransportEmissions(1000, 'train', 2), 64);
  // EV is shared: 4 people fit in one car
  assert.equal(calculateTransportEmissions(1000, 'ev', 4), 42);
});

test('pareto frontier removes dominated candidates', () => {
  const a = { carbon: 10, cost: 10, time: 10, comfort: 5 };
  const b = { carbon: 20, cost: 20, time: 20, comfort: 5 };
  const c = { carbon: 5, cost: 30, time: 10, comfort: 5 };
  assert.deepEqual(paretoFrontier([a, b, c]), [a, c]);
});

test('POST /plan returns three plans for a European rail route', async () => {
  const res = await post('/plan', {
    origin: 'paris',
    destination: 'Amsterdam',
    startDate: '2026-10-10',
    endDate: '2026-10-13',
    travelers: 1,
    budget: 1500,
  });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(data.totalDays, 4);
  assert.equal(data.plans.ecoChampion.mode, 'train');
  assert.equal(data.plans.fastest.days.length, 4);
  assert.ok(data.plans.ecoChampion.totalCarbonKg <= data.plans.fastest.totalCarbonKg);
  assert.ok(data.plans.balanced.explanation.summary.length > 0);
});

test('intercontinental routes fall back to flights', async () => {
  const res = await post('/plan', { origin: 'london', destination: 'tokyo', preferredModes: ['train'] });
  const { data } = await res.json();
  assert.equal(data.modeFallback, true);
  assert.equal(data.plans.ecoChampion.mode, 'flight');
});

test('POST /plan rejects unknown cities and same-city trips', async () => {
  assert.equal((await post('/plan', { origin: 'atlantis' })).status, 400);
  assert.equal((await post('/plan', { origin: 'paris', destination: 'paris' })).status, 400);
});

test('trips CRUD works against the in-memory store', async () => {
  const plan = await (await post('/plan', { origin: 'delhi', destination: 'jaipur' })).json();
  const created = await (await post('/trips', { result: plan.data, selectedPlan: 'ecoChampion' })).json();
  assert.match(created.data.passCode, /^ECO-[0-9A-F]{8}$/);

  const list = await (await fetch(`${base}/trips`)).json();
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].result, undefined);

  const byCode = await (await fetch(`${base}/trips/${created.data.passCode}`)).json();
  assert.equal(byCode.data._id, created.data._id);

  const del = await fetch(`${base}/trips/${created.data._id}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
});
