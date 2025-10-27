const success = (res, data, message, code = 200) => {
  const response = { success: true, data };
  if (message) response.message = message;
  res.status(code).json(response);
};

const error = (res, message, code = 500, errors) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  res.status(code).json(response);
};

const paginated = (res, data, { page, limit, total }) => {
  res.json({ success: true, data, pagination: { page, limit, total } });
};

module.exports = { success, error, paginated };
