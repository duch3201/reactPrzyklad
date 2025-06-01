const express = require('express');
const Redis = require('redis');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { dataQuery } = require('../utils/dataQuery');

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
const jsonData = {}
// Configure CORS
const corsOptions = {
  origin: '*',  
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false, 
    
});
app.use(limiter);

app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'UP' });
});

app.get('/courses', async (req, res) => {
  try {
    const courses = await dataQuery.getAllCourses();
    return res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/courses/:courseId', async (req, res) => {
  try {
    const course = await dataQuery.getCourse(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (req.query.metadataonly) {
      // console.log(slide)
      const newCourse = {
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        tags: course.tags,
        slides:[]
      }

      console.log(newCourse)

      course.slides.forEach(slide => {
        const newSlide = {
          id:slide.id,
          title:slide.title,
          doesContainComponent:slide.doesContainComponent,
          isTextAndCodeOnlySlide:slide.isTextAndCodeOnlySlide
        }
        newCourse['slides'].push(newSlide)
      });

      return res.json(newCourse)
    }
    return res.json(course);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
});

app.get('/courses/:courseId/slides/:slideId', async (req, res) => {
  try {
    const slide = await dataQuery.getSlide(req.params.courseId, req.params.slideId);
    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }
    if (req.query.metadataonly) {
      // console.log(slide)
      const newSlide = {
        id: slide.id,
        title: slide.title,
        doesContainComponent: slide.doesContainComponent,
        isTextAndCodeOnlySlide: slide.isTextAndCodeOnlySlide
      }

      return res.json(newSlide)
    }
    return res.json(slide);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch slide' });
  }
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

    return res.json(slide);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({ count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function startServer() {
  try {
    // Use DataQuery to load all data
    await dataQuery.loadData();
    
    // Store in global jsonData variable for backward compatibility
    Object.assign(jsonData, await dataQuery.getAllData());

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