const http = require('http');
const fetch = require('node-fetch');

(async ()=>{
  try{
    // Login as admin
    const loginRes = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ identifier: 'shahinsha', password: 'shaahnc' }) });
    const login = await loginRes.json();
    if (!loginRes.ok) { console.error('Login failed', login); process.exit(1); }
    const token = login.token || login.data && login.data.token || login.token;
    console.log('Got token:', !!token);

    const headers = { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` };

    // Departments: create -> get -> delete
    const deptId = 'TMP' + Date.now();
    let resp = await fetch('http://localhost:3000/api/departments', { method: 'POST', headers, body: JSON.stringify({ D_No: deptId, Name: 'Temp Dept', Location: 'Test' }) });
    console.log('Create dept status', resp.status);
    resp = await fetch(`http://localhost:3000/api/departments/${deptId}`, { headers });
    console.log('Get dept status', resp.status, await resp.json());
    resp = await fetch(`http://localhost:3000/api/departments/${deptId}`, { method: 'DELETE', headers });
    console.log('Delete dept status', resp.status, await resp.json());

    // Projects: create -> get -> delete
    const projId = 'TP' + Date.now();
    resp = await fetch('http://localhost:3000/api/projects', { method: 'POST', headers, body: JSON.stringify({ P_No: projId, Name: 'Temp Project' }) });
    console.log('Create project status', resp.status, await resp.json());
    resp = await fetch(`http://localhost:3000/api/projects/${projId}`, { headers });
    console.log('Get project status', resp.status, await resp.json());
    resp = await fetch(`http://localhost:3000/api/projects/${projId}`, { method: 'DELETE', headers });
    console.log('Delete project status', resp.status, await resp.json());

    // Dependent for admin (Id 1)
    resp = await fetch('http://localhost:3000/api/dependents', { method: 'POST', headers, body: JSON.stringify({ Employee_Id: 1, D_name: 'Temp Dep', Gender: 'Other', Relationship: 'Test' }) });
    console.log('Create dependent status', resp.status, await resp.json());
    // find created dependent
    resp = await fetch('http://localhost:3000/api/dependents', { headers });
    const deps = await resp.json();
    console.log('Dependents count:', deps.data ? deps.data.length : 'N/A');

    console.log('All test flows executed');
    process.exit(0);
  }catch(e){ console.error('Error', e); process.exit(1); }
})();