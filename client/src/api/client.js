/** Thin wrapper around the EcoRoute REST API. */
const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned ${res.status}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json.data;
}

export const api = {
  cities: () => request('/cities'),
  factors: () => request('/factors'),
  plan: (params) => request('/plan', { method: 'POST', body: params }),
  carbon: (params) => request('/carbon', { method: 'POST', body: params }),
  trips: () => request('/trips'),
  trip: (id) => request(`/trips/${encodeURIComponent(id)}`),
  saveTrip: (payload) => request('/trips', { method: 'POST', body: payload }),
  updateTrip: (id, patch) => request(`/trips/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }),
  deleteTrip: (id) => request(`/trips/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
