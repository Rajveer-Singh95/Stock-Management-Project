function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
