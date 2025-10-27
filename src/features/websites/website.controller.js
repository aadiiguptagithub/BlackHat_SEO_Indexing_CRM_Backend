const { websiteBulkSchema, paginationSchema } = require('../../utils/validators');
const { success, error, paginated } = require('../../utils/http');
const websiteService = require('./website.service');
const Website = require('../../models/Website');

const bulkUpload = async (req, res, next) => {
  try {
    const { error: validationError, value } = websiteBulkSchema.validate(req.body);
    if (validationError) return error(res, validationError.details[0].message, 400);
    
    const result = await websiteService.bulkInsert(value.urls);
    success(res, result, 'Bulk upload completed');
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { error: validationError, value } = paginationSchema.validate(req.query);
    if (validationError) return error(res, validationError.details[0].message, 400);
    
    const result = await websiteService.list({ ...value, search: req.query.search, label: req.query.label });
    paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await Website.findByIdAndDelete(req.params.id);
    success(res, null, 'Website deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { bulkUpload, list, remove };