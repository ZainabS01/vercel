// This file will be used by Vercel to handle API routes
const express = require('express');
const path = require('path');
const app = express();

// Import your backend routes
const apiRoutes = require('../routes');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Serve static files from the Vite build
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

module.exports = app;
