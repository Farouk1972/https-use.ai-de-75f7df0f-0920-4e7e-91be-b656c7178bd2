const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-lesson',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`BODY: ${body.substring(0, 100)}`); });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write('{"test": 1'); // INVALID JSON
req.end();
