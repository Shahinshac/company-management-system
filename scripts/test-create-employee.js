const fetch = require('node-fetch');
(async () => {
  const API = 'http://localhost:3000/api';
  try {
    // Login as admin
    const login = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ identifier: 'shahinsha', password: 'shaahnc' })
    });
    const loginData = await login.json();
    if (!login.ok) return console.error('Login failed', loginData);
    const token = loginData.token;

    // Create employee
    const username = 'testuser' + Math.floor(Math.random()*10000);
    const email = `${username}@example.com`;
    const resp = await fetch(`${API}/users`, {
      method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username, email, role: 'Employee' })
    });
    const data = await resp.json();
    console.log('Create status', resp.status, data);
  } catch (e) { console.error('Error', e); }
})();