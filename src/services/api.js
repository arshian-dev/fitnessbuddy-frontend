const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  register: (name, email, role, coachCode) => 
    request('/auth/register', { method: 'POST', body: { name, email, role, coachCode } }),
  login: (email) => 
    request('/auth/login', { method: 'POST', body: { email } }),

  // Profiles & Onboarding
  saveProfile: (profileData) => 
    request('/profile', { method: 'POST', body: profileData }),
  getProfile: (userId) => 
    request(`/profile/${userId}`),

  // Checkins
  submitCheckin: (checkinData) => 
    request('/checkins', { method: 'POST', body: checkinData }),
  getCheckins: (userId) => 
    request(`/checkins/${userId}`),

  // Coach
  getRoster: (coachId) => 
    request(`/coach/roster?coachId=${coachId}`),
  removeClient: (userId) => 
    request(`/coach/clients/${userId}`, { method: 'DELETE' }),
  overridePlan: (userId, type, details) => 
    request('/plans/override', { method: 'POST', body: { userId, type, details } }),
  revertPlan: (userId) => 
    request('/plans/revert', { method: 'POST', body: { userId } }),
  resolveAlert: (alertId) => 
    request('/coach/resolve-alert', { method: 'POST', body: { alertId } }),
  getExercises: () => 
    request('/coach/exercises'),
  addExercise: (exerciseData) => 
    request('/coach/exercises', { method: 'POST', body: exerciseData }),
  getFoods: () => 
    request('/coach/foods'),
  addFood: (foodData) => 
    request('/coach/foods', { method: 'POST', body: foodData }),

  // Chat AI
  sendMessage: (userId, message) => request('/chat', { method: 'POST', body: { userId, message } }),
  sendCoachMessage: (coachId, message) => request('/chat/coach', { method: 'POST', body: { coachId, message } }),
  estimateMacros: (foodDescription) => request('/chat/estimate-macros', { method: 'POST', body: { foodDescription } }),
};
