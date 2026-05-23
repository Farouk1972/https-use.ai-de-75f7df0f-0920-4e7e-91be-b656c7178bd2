const express = require('express');
const { createServer } = require('vite');
const http = require('http');

async function test() {
  const app = express();
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  
  // NOTE: no app.post defined!
  
  app.use(vite.middlewares);
  const server = app.listen(3002, () => {
    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path: '/api/generate-lesson',
      method: 'POST'
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', body.substring(0, 100));
        server.close();
        process.exit(0);
      });
    });
    req.end();
  });
}
test();
