// Minimal centralized error handling middleware used by index.js
export function notFound(req, res, next) {
  res.status(404);
  // respond with JSON for API paths, HTML for normal requests
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    return res.json({ success: false, message: `Not Found - ${req.originalUrl}` });
  }
  // fallback
  res.type("txt").send("Not Found");
}

export function errorHandler(err, req, res, next) {
  console.error("ERROR HANDLER:", err && err.stack ? err.stack : err);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status);
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    return res.json({
      success: false,
      message: err.message || "Internal Server Error",
      // expose stack in non-production only
      ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    });
  }
  res.type("txt").send(err.message || "Internal Server Error");
}