const Website = require('../../models/Website');

const normalizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch {
    throw new Error('Invalid URL');
  }
};

const bulkInsert = async (urls) => {
  const normalized = [...new Set(urls.map(normalizeUrl))];
  const existing = await Website.find({ url: { $in: normalized } }).select('url');
  const existingUrls = new Set(existing.map(w => w.url));
  
  const newUrls = normalized.filter(url => !existingUrls.has(url));
  const inserted = await Website.insertMany(newUrls.map(url => ({ url })));
  
  return { inserted: inserted.length, duplicates: normalized.length - newUrls.length };
};

const list = async ({ page = 1, limit = 10, search, label }) => {
  const query = {};
  if (search) query.$or = [{ url: new RegExp(search, 'i') }, { host: new RegExp(search, 'i') }];
  if (label) query.labels = label;
  
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Website.find(query).skip(skip).limit(limit),
    Website.countDocuments(query)
  ]);
  
  return { data, total, page, limit };
};

module.exports = { normalizeUrl, bulkInsert, list };