const protectWorker = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'API key required' });
  }
  
  const allowedKeys = (process.env.WORKER_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  
  if (!allowedKeys.includes(apiKey)) {
    return res.status(401).json({ success: false, message: 'Invalid API key' });
  }
  
  req.worker = { key: apiKey };
  next();
};

module.exports = { protectWorker };