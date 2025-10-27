const buildPaginatedQuery = ({ page = 1, limit = 10, sort = { createdAt: -1 } }) => {
  const normalizedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const normalizedPage = Math.max(parseInt(page) || 1, 1);
  
  return {
    skip: (normalizedPage - 1) * normalizedLimit,
    limit: normalizedLimit,
    sort
  };
};

module.exports = { buildPaginatedQuery };