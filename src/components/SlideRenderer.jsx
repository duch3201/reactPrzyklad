import { useEffect, useState } from "react";

export default function SlideRenderer({courseId, currentSlide}) {
    const [slide, setSlide] = useState(null);

    useEffect(() => {
        console.log("kurwa")

        const fetchSlide = async () => {
            try {
                // setLoading(true);
                // setError(null);

                const response = await fetch(`http://192.168.0.22:3000/courses/${courseId}/slides/${currentSlide}`);
                
                if (!response.ok) throw new Error(`Failed to fetch slide: ${response.status} ${response.statusText}`);
                const data = await response.json();
                
                if (data.totalSlides && totalSlides === 0) {
                    setTotalSlides(data.totalSlides);
                }
                
                console.log(data)

                setSlide(data);
            } catch (err) {
                console.error("Error fetching slide:", err);
                // setError(err.message);
            }
        }; 
        
        fetchSlide();    
    }, [])
    
    if (!slide) return <p>Loading...</p>;

  return (
    <div>
      <h3>{slide.title}</h3>
    </div>
  );

}