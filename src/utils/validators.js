const Joi = require('joi');

const websiteBulkSchema = Joi.object({
  urls: Joi.array().items(Joi.string().uri()).required()
});

const createJobSchema = Joi.object({
  name: Joi.string().required(),
  messageTemplate: Joi.string().required(),
  fields: Joi.object().optional(),
  websiteIds: Joi.array().items(Joi.string()).required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().optional()
});

module.exports = { websiteBulkSchema, createJobSchema, paginationSchema };