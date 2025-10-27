const { v4: uuidv4 } = require('uuid');
const { withRequestId } = require('../libs/logger');

const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.locals.requestId = id;
  res.setHeader('x-request-id', id);
  
  withRequestId(id, () => next());
};

module.exports = { requestId };