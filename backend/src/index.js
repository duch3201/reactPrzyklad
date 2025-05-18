const express = require('express');
const Redis = require('redis');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
let redisClient;
async function connectRedis() {
    redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
}

// Configure CORS
const corsOptions = {
  origin: '*', // Replace with your React app's origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies, authorization headers, etc.
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false, 
    
});
app.use(limiter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Get slide by index
app.get('/getSlide/:id', async (req, res) => {
  try {
    const slideIndex = parseInt(req.params.id);
    if (isNaN(slideIndex)) {
      return res.status(400).json({ error: 'Invalid slide ID' });
    }

    // Try to get from cache first
    const cacheKey = `slide:${slideIndex}`;
    const cachedSlide = await redisClient.get(cacheKey);
    if (cachedSlide) {
      return res.json(JSON.parse(cachedSlide));
    }

    // Read all slides
    const data = await fs.readFile(path.join(__dirname, '../slideData.json'), 'utf8');
    const slides = JSON.parse(data);

    // Get slide by index
    if (slideIndex < 0 || slideIndex >= slides.length) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    const slide = slides[slideIndex];
    slide.totalSlides = slides.length; // Include total count for convenience

    // Cache the result
    await redisClient.set(cacheKey, JSON.stringify(slide), {
      EX: 3600,
    });

    res.json(slide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get total number of slides
app.get('/getSlide/count', async (req, res) => {
  try {
    // Try to get from cache first
    const cachedCount = await redisClient.get('slides:count');
    if (cachedCount) {
      return res.json({ count: parseInt(cachedCount) });
    }

    const data = await fs.readFile(path.join(__dirname, '../slideData.json'), 'utf8');
    const slides = JSON.parse(data);
    const count = slides.length;

    // Cache the result
    await redisClient.set('slides:count', count.toString(), {
      EX: 3600,
    });

    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function startServer() {
    try {
        await connectRedis();
        console.log('Connected to Redis');
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    if (redisClient) {
        await redisClient.quit();
    }
    console.log('Server shutting down');
    process.exit(0);
});

module.exports = app;