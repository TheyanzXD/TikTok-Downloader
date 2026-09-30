const path = require("path");
const express = require("express");
const { handleDownload, handleProxy, handleHealth } = require("./lib/handlers");

const app = express();
const publicPath = path.join(__dirname);

app.use(express.json({ limit: "1mb" }));

// Explicit MIME type middleware for static assets (ensures .css is text/css)
app.use((req, res, next) => {
  if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  } else if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
  next();
});

// API Routes
app.all("/api/download", handleDownload);
app.all("/api/proxy", handleProxy);
app.all("/api/health", handleHealth);

// Serve static files (index.html, style.css, script.js, assets)
app.use(express.static(publicPath, { extensions: ["html"] }));

// Fallback to index.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server Express (Node.js) aktif di http://localhost:${PORT}`));
}

module.exports = app;
