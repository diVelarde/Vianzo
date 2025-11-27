export function notFound(req, res, next) {
  res.status(404).json({
    error: { message: 'Not Found', status: 404 }
  });
}

export function errorHandler(err, req, res, next) {
  // Log the error for debugging (server-side)
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || 'Internal Server Error';

  const payload = {
    error: {
      message,
      status
    }
  };

  // In non-production environments include stack for easier debugging
  if (process.env.NODE_ENV !== 'production') {
    payload.error.stack = err?.stack;
  }

  res.status(status).json(payload);
}