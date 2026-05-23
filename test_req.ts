import { request } from 'http';

const data = JSON.stringify({
  lesson_id: "test2",
  language: "French",
  level: "A1",
  title: "Greetings and Introductions"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-lesson',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body.substring(0, 500));
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
