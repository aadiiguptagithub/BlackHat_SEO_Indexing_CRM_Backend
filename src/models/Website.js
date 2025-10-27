const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  host: String,
  path: String,
  labels: [String],
  createdBy: String
}, { timestamps: true });

websiteSchema.pre('save', function() {
  const urlObj = new URL(this.url);
  this.host = urlObj.hostname;
  this.path = urlObj.pathname;
});

websiteSchema.index({ host: 1 });

module.exports = mongoose.model('Website', websiteSchema);