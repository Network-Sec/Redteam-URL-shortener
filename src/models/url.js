const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  creatorIp: String,
  visitorIps: [{
    ip: String,
    date: Date
  }],
  createdAt: Date
});

module.exports = mongoose.model('Url', urlSchema);
