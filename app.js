const express = require('express');
const path = require('path');
const app = express();

// Add this to parse JSON bodies (if not already present)
app.use(express.json());

// Serve React static files
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// Mount the FFB Reupload router
const ffbReuploadRoutes = require('./modules/ffb-reupload/ffb.routes');
app.use('/api/ffb-reupload', ffbReuploadRoutes);

// Mount the SPLIT SO  router
const splitSORoutes = require('./modules/split-so/split.routes');
app.use('/api/split-so', splitSORoutes);

// Catch-all: send React index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

module.exports = app;