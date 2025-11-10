// test-server.js - ES MODULES VERSION
import express from 'express';

const app = express();

// Minimal CORS - allow all origins for testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    message: 'Test server working!', 
    timestamp: new Date().toISOString(),
    server: 'Test Server (ES Modules)'
  });
});

const PORT = 4000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🔧 TEST Server running on http://${HOST}:${PORT}`);
  console.log(`• Local:  http://localhost:${PORT}/health`);
  console.log(`• Network: http://10.91.73.120:${PORT}/health`);
  console.log('Press Ctrl+C to stop');
});