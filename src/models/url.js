const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  creatorIp: String,
  visitorIps: [{
    ip: String,
    date: Date,
    FP_Short: [{
      webGL: String,
      canvas: String,
      audio: String,
      clientRects: String
    }],
    FP_Complete: [{
      userAgent: String,
      webGL: String,
      canvas: String,
      audio: String,
      clientRects: String,
      timezone: String,
      localTime: String,
      systemTime: String,
      languages: String,
      browserFeatures: {
        javascript: String,
        flash: String,
        activeX: String,
        java: String,
        cookies: String
      },
      browserDetails: {
        browser: String,
        platform: String
      },
      cookies: [{
        name: String,
        value: String
      }]
    }]
  }],
  createdAt: Date,
  Creator_FP_Short: {
    webGL: String,
    canvas: String,
    audio: String,
    clientRects: String
  },
  Creator_FP_Complete: {
    userAgent: String,
    webGL: String,
    canvas: String,
    audio: String,
    clientRects: String,
    timezone: String,
    localTime: String,
    systemTime: String,
    languages: String,
    browserFeatures: {
      javascript: String,
      flash: String,
      activeX: String,
      java: String,
      cookies: String
    },
    browserDetails: {
      browser: String,
      platform: String
    },
    cookies: [{
      name: String,
      value: String
    }]
  }
});

module.exports = mongoose.model('Url', urlSchema);
