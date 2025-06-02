import { useEffect, useState } from 'react'
import './App.css'
import CourseShelf from './components/CourseShelf'

export default function App() {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch('http://192.168.0.22:3000/courses');
                const data = await response.json();
                console.log(data);
                setCourses(data);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
            }
        };

        fetchCourses();
    }, []);

    return (
        <>
            <h1 id="heading">strona dla programistów</h1>
            {/* <p>this is a font test</p> */}
            <hr />
            <section id="section1">
                <span><h2>ReactJS</h2></span>
                <CourseShelf coursesData={courses}/>
            </section>
        </>
    )
}