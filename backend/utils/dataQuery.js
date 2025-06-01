const fs = require('fs').promises;
const path = require('path');

class DataQuery {
  constructor(basePath = '/home/shadow/reactshoff/backend') {
    this.basePath = basePath;
    this.jsonData = {};
    this.isLoaded = false;
  }

  // Load all course and slide data (similar to startServer logic)
  async loadData() {
    try {
      // Load courses data
      const coursesDataPath = path.join(this.basePath, 'coursesData.json');
      let coursesData = await fs.readFile(coursesDataPath, 'utf8');
      coursesData = JSON.parse(coursesData);
      
      // Initialize the combined JSON data object
      const combinedData = {};
      
      // Load slide data for each course
      for (const [courseKey, courseInfo] of Object.entries(coursesData)) {
        try {
          // Load the slide data file for this course
          const slideDataPath = path.join(this.basePath, courseInfo.slideData);
          const slideDataRaw = await fs.readFile(slideDataPath, 'utf8');
          const slideData = JSON.parse(slideDataRaw);
          
          // Combine course info with its slide data
          combinedData[courseKey] = {
            ...courseInfo,
            slides: slideData
          };
          
          console.log(`DataQuery: Loaded course: ${courseInfo.title} with ${slideData.length} slides`);
        } catch (slideError) {
          console.error(`DataQuery: Failed to load slide data for course ${courseKey}:`, slideError);
          // Store course info without slides if slide data fails to load
          combinedData[courseKey] = {
            ...courseInfo,
            slides: []
          };
        }
      }
      
      // Store in instance variable
      this.jsonData = combinedData;
      this.isLoaded = true;
      
      console.log('DataQuery: All course data loaded successfully:', Object.keys(this.jsonData));
      return this.jsonData;
    } catch (error) {
      console.error('DataQuery: Failed to load data:', error);
      throw error;
    }
  }

  // Ensure data is loaded before querying
  async ensureLoaded() {
    if (!this.isLoaded) {
      await this.loadData();
    }
  }

  // Get all courses
  async getAllCourses() {
    await this.ensureLoaded();
    return Object.entries(this.jsonData).map(([key, course]) => ({
      key,
      ...course
    }));
  }

  // Get course by key or courseId
  async getCourse(identifier) {
    await this.ensureLoaded();
    
    // Try by key first
    if (this.jsonData[identifier]) {
      return { key: identifier, ...this.jsonData[identifier] };
    }
    
    // Try by courseId
    const courseEntry = Object.entries(this.jsonData).find(([key, course]) => 
      course.courseId === identifier
    );
    
    return courseEntry ? { key: courseEntry[0], ...courseEntry[1] } : null;
  }

  // Get all slides for a course
  async getSlidesByCourse(courseIdentifier) {
    const course = await this.getCourse(courseIdentifier);
    // console.log("---1")
    // console.log(course)
    // console.log("1---")
    return course ? course.slides : null;
  }

  // Get specific slide by course and slide ID
  async getSlide(courseIdentifier, slideId) {
    const slides = await this.getSlidesByCourse(courseIdentifier);
    // console.log("---2")
    // console.log(slides)
    // console.log("2---")
    if (!slides) return null;
    
    return slides.find(slide => slide.id === slideId);
  }

  // Get slide by index within a course
  async getSlideByIndex(courseIdentifier, index) {
    const slides = await this.getSlidesByCourse(courseIdentifier);
    if (!slides || index < 0 || index >= slides.length) return null;
    
    const slide = slides[index];
    return {
      ...slide,
      slideIndex: index,
      totalSlides: slides.length
    };
  }

  // Search courses by tag
  async getCoursesByTag(tag) {
    const courses = await this.getAllCourses();
    return courses.filter(course => 
      course.tags && course.tags.includes(tag)
    );
  }

  // Search slides by title across all courses
  async searchSlidesByTitle(searchTerm) {
    await this.ensureLoaded();
    const results = [];
    
    for (const [courseKey, course] of Object.entries(this.jsonData)) {
      const matchingSlides = course.slides.filter(slide => 
        slide.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      matchingSlides.forEach(slide => {
        results.push({
          course: { key: courseKey, ...course },
          slide: slide
        });
      });
    }
    
    return results;
  }

  // Get slides with components
  async getSlidesWithComponents(courseIdentifier) {
    const slides = await this.getSlidesByCourse(courseIdentifier);
    if (!slides) return null;
    
    return slides.filter(slide => slide.doesContainComponent === true);
  }

  // Get text-only slides
  async getTextOnlySlides(courseIdentifier) {
    const slides = await this.getSlidesByCourse(courseIdentifier);
    if (!slides) return null;
    
    return slides.filter(slide => slide.isTextOnlySlide === "true");
  }

  // Get course statistics
  async getCourseStats(courseIdentifier) {
    const slides = await this.getSlidesByCourse(courseIdentifier);
    if (!slides) return null;
    
    return {
      totalSlides: slides.length,
      slidesWithComponents: slides.filter(s => s.doesContainComponent === true).length,
      textOnlySlides: slides.filter(s => s.isTextOnlySlide === "true").length,
      interactiveSlides: slides.filter(s => s.liveComponent).length
    };
  }

  // Get all data (useful for debugging or full access)
  async getAllData() {
    await this.ensureLoaded();
    return this.jsonData;
  }

  // Reload data (useful for development)
  async reload() {
    this.isLoaded = false;
    this.jsonData = {};
    return await this.loadData();
  }
}

// Export singleton instance and class
const dataQuery = new DataQuery();

module.exports = {
  DataQuery,
  dataQuery
};
