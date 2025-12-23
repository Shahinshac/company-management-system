const http = require('http');

function postLogin(identifier, password) {
  const data = JSON.stringify({ identifier, password });
  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log(`STATUS ${res.statusCode}`);
      try { console.log('RESPONSE', JSON.parse(body)); } catch (e) { console.log('RESPONSE', body); }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
  });

  req.write(data);
  req.end();
}

(async () => {
  console.log('Test 1: shahinsha / shaahnc');
  postLogin('shahinsha', 'shaahnc');
  // wait a bit between requests
  await new Promise(r => setTimeout(r, 1000));
  console.log('\nTest 2: john.smith@company.com / test123');
  postLogin('john.smith@company.com', 'test123');
})();