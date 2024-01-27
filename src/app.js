/*********************************************************************************/
/******************************* Url Shortener ***********************************/
/*********************************************************************************/

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// const rateLimit = require('express-rate-limit'); // Added for rate limiting

dotenv.config();

const Url = require('./models/url');
const app = express();

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

app.use(express.static('pub'));
app.use(bodyParser.json());

// Rate limiting middleware
// const limiter = rateLimit({
  // windowMs: 1 * 60 * 1000, // 1 minute
  // max: 5, // limit each IP to 5 requests per minute
// });
// app.use(limiter);

// Blacklist
const blacklist = [
  '/',
  '/imprint',
  '/shorten',
  'process-fp',
  'undefined',
  'favicon.ico'
];

function mergeCookies(req, existingObject) {
  // Parse cookies from request headers
  const cookies = req.headers.cookie;
  if (!cookies) return existingObject;

  const parsedCookies = cookies.split(';').map(cookie => {
      const parts = cookie.split('=');
      return {
          name: parts[0].trim(),
          value: parts[1].trim()
      };
  });

  // Merge parsed cookies into the existing object
  existingObject.fp.cookies = existingObject.fp.cookies.concat(parsedCookies);
  return existingObject;
}

// Generate random shortUrl
function generateShortUrl() {
  return Math.random().toString(36).substring(2, 8);
}

// Find URL in DB
async function findUrlInDB(shortUrl) {
  try {
    console.log('Searching for shortUrl:', shortUrl);
    return await Url.findOne({ "shortUrl": shortUrl });
  } catch (err) {
    console.log('DB Error:', err);
    return null;
  }
}

// URL forwarding with fingerprinting page
app.use('/:shortUrl', async (req, res, next) => {
  const { shortUrl } = req.params;

  if (blacklist.includes("/" + shortUrl)) {
    return next();
  }

  const existingUrl = await findUrlInDB(shortUrl);
  if (existingUrl) {
    // Read the HTML file
    fs.readFile(path.join(__dirname, 'template', 'forwarder.html'), 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server Error');
      }

      const updatedHtml = data.replace('{{shortUrl}}', shortUrl);

      res.send(updatedHtml);
    });
  } else {
    next(); // Proceed to 404 or other handling
  }
});

// URL shortening logic
app.post('/shorten', async (req, res) => {
  let { originalUrl, fp } = req.body;
  const creatorIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  if (!originalUrl || originalUrl.indexOf('ldkn.in') != -1) {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  if (fp) fp = mergeCookies(req, fp);
  
  // Validate URL and add https:// if missing
  if (!originalUrl.match(/^(https?:\/\/)/)) {
    originalUrl = 'https://' + originalUrl;
  }

  let shortUrl;
  do {
    shortUrl = generateShortUrl();
  } while (await findUrlInDB(shortUrl));

  // Construct FP_Short and FP_Complete objects
  const Creator_FP_Short = {
    webGL: fp.webGL,
    canvas: fp.canvas,
    audio: fp.audio,
    clientRects: fp.clientRects
  };

  const Creator_FP_Complete = {
    ...fp,
    ipAddress: creatorIp,
    dateTime: new Date().toISOString()
  };

  const urlData = new Url({
    originalUrl,
    shortUrl,
    creatorIp,
    createdAt: new Date(),
    Creator_FP_Short,
    Creator_FP_Complete
  });

  await urlData.save();

  res.json({ shortUrl });
});


// Endpoint to process fingerprint data and redirect
app.post('/process-fp', async (req, res) => {
  let { shortUrl, fp } = req.body;
  const visitorIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (fp) fp = mergeCookies(req, fp);

  const existingUrl = await findUrlInDB(shortUrl);
  if (existingUrl) {
    const visitorData = {
      ip: visitorIp,
      date: new Date(),
      FP_Short: {
        webGL: fp.webGL,
        canvas: fp.canvas,
        audio: fp.audio,
        clientRects: fp.clientRects
      },
      FP_Complete: {
        ...fp,
        ipAddress: visitorIp,
        dateTime: new Date().toISOString()
      }
    };

    existingUrl.visitorIps.push(visitorData);
    await existingUrl.save();
    res.json({ redirectUrl: existingUrl.originalUrl });
  } else {
    res.status(404).json({ message: 'Short URL not found' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/template/index.html');
});

app.get('/imprint', (req, res) => {
  res.sendFile(__dirname + '/template/imprint.html');
});

// Catch-all route for invalid URLs
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});