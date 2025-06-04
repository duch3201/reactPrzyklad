import { useEffect, useState } from "react";
import SlideTextOnly from './slideComponents/slideTextOnly'
import SlideTextAndCodeOnly from './slideComponents/slideTextAndCodeOnly'
import SlideNormal from './slideComponents/slideNormal'

export default function SlideRenderer({courseId, currentSlide}) {
  const [slide, setSlide] = useState(null);
  const [error, setError] = useState(null);
  const [slideType, setSlideType] = useState(null);

  useEffect(() => {
    const fetchSlide = async () => {
      try {
        // setLoading(true);
        // setError(null);
        const response = await fetch(`http://192.168.0.22:3000/courses/${courseId}/slides/${currentSlide}`);
        
        if (!response.ok) throw new Error(`Failed to fetch slide: ${response.status} ${response.statusText}`);
        const data = await response.json();
        
        console.log(data)
        setSlideType(data.slideType)
        setSlide(data);
      } catch (err) {
        console.error("Error fetching slide:", err);
        setError(err.message);
      }
    }; 
    
    fetchSlide();    
  }, [courseId, currentSlide])
    
  if (!slide) return <p>Loading...</p>;
  if (error && !slide) return <div className="error">Błąd: {error}</div>;


  return (
    <div>
      {/* <h3>{slide.title}</h3> */}
      {slideType == "Text" && <SlideTextOnly slide={slide} />}
      {slideType == "TextAndCodeOnly" && <SlideTextAndCodeOnly slide={slide} />}
      {slideType == "normal" && <SlideNormal slide={slide} />}
      {/* <p>{JSON.stringify(slide)}</p> */}
    </div>
  );

}