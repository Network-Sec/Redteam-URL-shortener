/*********************************************************************************/
/******************************* Url Shortener ***********************************/
/*********************************************************************************/

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
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
];

// Generate random shortUrl
function generateShortUrl() {
  return Math.random().toString(36).substring(2, 8);
}

// Find URL in DB
async function findUrlInDB(shortUrl) {
  try {
    return await Url.findOne({ shortUrl });
  } catch (err) {
    console.log('DB Error:', err);
    return null;
  }
}

// URL shortening logic
app.post('/shorten', async (req, res) => {
  const originalUrl = req.body.url;
  const creatorIp = req.headers['x-forwarded-for'];

  let shortUrl;
  do {
    shortUrl = generateShortUrl();
  } while (await findUrlInDB(shortUrl));

  const urlData = new Url({
    originalUrl,
    shortUrl,
    creatorIp,
    createdAt: new Date(),
  });
  await urlData.save();

  res.json({ shortUrl });
});

// URL forwarding
app.use('/:shortUrl', async (req, res, next) => {
  const { shortUrl } = req.params;

  if (blacklist.includes("/" + shortUrl)) {
    return next();
  }

  const existingUrl = await findUrlInDB(shortUrl);
  if (existingUrl) {
    existingUrl.visitorIps.push({
      ip: req.headers['x-forwarded-for'],
      date: new Date(),
    });
    await existingUrl.save();

    var redirect_target = existingUrl.originalUrl;
    if (! redirect_target.startsWith("http")) {
        redirect_target = "https://" + redirect_target;
    }
    return res.redirect(redirect_target);
  }

  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/template/index.html');
});

app.get('/imprint', (req, res) => {
  res.sendFile(__dirname + '/template/imprint.html');
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});