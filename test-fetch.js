const http = require('http');

http.get('http://localhost:5000/api/knowledge-topics/language', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('CONTENT-TYPE:', res.headers['content-type']);
    console.log('BODY HEAD:', data.slice(0, 100));
  });
}).on('error', err => console.error(err));
