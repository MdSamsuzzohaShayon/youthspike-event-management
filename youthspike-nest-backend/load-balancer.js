// load-balancer.js
const http = require('http');
const httpProxy = require('http-proxy');
const { URL } = require('url');
const crypto = require('crypto');

// Backend targets
const targets = [
  new URL('http://localhost:4001'),
  new URL('http://localhost:4002'),
  new URL('http://localhost:4003'),
];

// Hash IP to always choose the same target
function getTargetByIP(ip) {
  const hash = crypto.createHash('md5').update(ip).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % targets.length;
  return targets[index];
}

// Create proxy server
const proxy = httpProxy.createProxyServer({
  ws: true,
  xfwd: true, // Adds X-Forwarded-For headers
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
  }
  res.end('Bad Gateway');
});

// HTTP request handler
const server = http.createServer((req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const target = getTargetByIP(ip);

  console.log(`[HTTP] ${ip} -> ${target.href}`);

  proxy.web(req, res, {
    target: target.href,
    changeOrigin: true,
  });
});

// WebSocket upgrade handler
server.on('upgrade', (req, socket, head) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const target = getTargetByIP(ip);

  console.log(`[WebSocket] ${ip} -> ${target.href}`);

  proxy.ws(req, socket, head, {
    target: target.href,
    changeOrigin: true,
  });
});

server.listen(4000, () => {
  console.log('🚀 Stateless load balancer running on http://localhost:4000');
});
