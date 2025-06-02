import React, { useState, useEffect } from 'react';
import { NavLink, useSearchParams } from "react-router";
import Editor from '@monaco-editor/react';
import SlideRenderer from './components/SlideRenderer'
import './SlideViewer.css';
import ErrorBoundary from './ErrorBoundary';

function App() {
  const [searchParams] = useSearchParams()
  // Function to get query parameters from URL
  const getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  console.log(searchParams.get('courseId'))
  const slideid = searchParams.get('slide') ?? '1';
  if (!searchParams.get('courseId')) {
    throw new Error("fuck")
  }

  const initialSlide = parseInt(searchParams.get('slide')) || 0;
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [courseMetadata, setCourseMetadata] = useState([]);
  const [input, setInput] = useState('');
  const [allSlides, setAllSlides] = useState(null);
  const [slide, setSlide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSlides, setTotalSlides] = useState(0);

  useEffect(() => {
    const fetchCourseMetadata = async () => {
      try {
        const response = await fetch(`http://192.168.0.22:3000/courses/${searchParams.get('courseId')}?metadataonly=true`);
        
        if (!response.ok) throw new Error(`Failed to fetch slide: ${response.status} ${response.statusText}`);

        setCourseMetadata(await response.json())
      } catch (err) {
        console.error("Error fetching slide:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      } 
    }

    const fetchSlide = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://192.168.0.22:3000/courses/${searchParams.get('courseId')}/slides/${currentSlide}`);
        
        if (!response.ok) throw new Error(`Failed to fetch slide: ${response.status} ${response.statusText}`);
        const data = await response.json();
        
        if (data.totalSlides && totalSlides === 0) {
          setTotalSlides(data.totalSlides);
        }
        
        setSlide(data);
      } catch (err) {
        console.error("Error fetching slide:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseMetadata();
    // fetchSlide();
  }, [currentSlide, totalSlides]);

  useEffect(() => {
    const fetchTotalSlides = async () => {
      try {
        const response = await fetch('http://localhost:3000/getSlide/count');
        if (!response.ok) {
          throw new Error(`Failed to fetch total slides: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setTotalSlides(data.count);
      } catch (err) {
        console.error("Error fetching total slides:", err);
        setError(err.message);
      }
    };
    
    // fetchTotalSlides();
  }, []);

  // useEffect(() => {
  //   const handleURLChange = () => {
  //     const slideParam = parseInt(searchParams.get('slide'));
  //     if (!isNaN(slideParam) && slideParam !== currentSlide) {
  //       setCurrentSlide(slideParam);
  //     }
  //   };

  //   window.addEventListener('popstate', handleURLChange);
  //   window.addEventListener('hashchange', handleURLChange);

  //   return () => {
  //     window.removeEventListener('popstate', handleURLChange);
  //     window.removeEventListener('hashchange', handleURLChange);
  //   };
  // }, [currentSlide]);

  const DynamicComponent = ({ componentCode, props }) => {
    if (!componentCode) return null;

    try {
      // Transform JSX code to JavaScript using Babel
      const transformedCode = Babel.transform(componentCode, {
        presets: ['react']
      }).code;

      // Create a React component from the transformed code
      // eslint-disable-next-line no-new-func
      const ComponentFunction = new Function('React', 'return ' + transformedCode)(React);
      const Component = ComponentFunction;

      return <Component {...props} />;
    } catch (err) {
      console.error("Error rendering dynamic component:", err);
      return <div className="error">Error rendering component: {err.message}</div>;
    }
  };

  // if (loading && !slide) {
  //   return <div className="loading">Ładowanie slajdu...</div>;
  // }

  // if (error && !slide) {
  //   return <div className="error">Błąd: {error}</div>;
  // }

  // if (!slide) {
  //   return <div className="error">Nie znaleziono slajdu</div>;
  // }

  const componentProps = {
    count,
    setCount,
    text,
    setText,
    items,
    setItems,
    input,
    setInput
  };

  return (
    <div className="">
      <header>
        <h2>Course Name</h2>
        <div id="slidesSwitcher">
          <ol type="1">
            {courseMetadata.slides?.map(slide => {
              return slide.id == searchParams.get("slide") ? 
                <li className='current' key={slide.id}>{slide.title}</li>
                :
                <li key={slide.id}><NavLink to={`/course?courseId=${searchParams.get("courseId")}&slide=${slide.id}`}>{slide.title}</NavLink></li>
            })}
          </ol>
        </div>
      </header>
      <main >
        <SlideRenderer key={slideid} slideId={slideid} courseId={searchParams.get("courseId")} currentSlide={slideid} />
      </main>
    </div>
  )

  // return (
  //   <div className="App layout">
  //     <div className="right-panel">
  //       <ErrorBoundary>
  //         <DynamicComponent 
  //           componentCode={slide.liveComponent}
  //           props={componentProps}
  //         />
  //       </ErrorBoundary>
  //     </div>
  //     <div className="left-panel">
  //       <div className="explanation">
  //         <h2>{slide.title}</h2>
  //         <p>{slide.explanation}</p>
  //       </div>
  //       <div className="code">
  //         <Editor
  //           key={slide.id}
  //           height="90vh"
  //           defaultLanguage="javascript"
  //           theme="vs-dark"
  //           defaultValue={slide.code}
  //           options={{ minimap: { enabled: false }, fontSize: 14 }}
  //         />
  //       </div>
  //     </div>
  //     {currentSlide > 0 && (
  //       <button className="nav left" onClick={() => setCurrentSlide(currentSlide - 1)}>
  //         ◀
  //       </button>
  //     )}
  //     {currentSlide < totalSlides - 1 && (
  //       <button className="nav right" onClick={() => setCurrentSlide(currentSlide + 1)}>
  //         ▶
  //       </button>
  //     )}
  //   </div>
  // );
}

export default App;