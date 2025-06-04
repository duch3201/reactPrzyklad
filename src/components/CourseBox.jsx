import { NavLink } from "react-router";
import './CourseBox.css'

export default function CourseBox({title, desc, tags, courseId}) {
//http://192.168.0.22:5173/course?courseId=react-stage-1&slide=1
    return (
        <div id="CourseBox">
            <div>
                <h3>{title}</h3>
                <p>{desc}</p>
            </div>
            <div id="lowerCourseBox">
                <div id="tagslist">
                    {tags.map((tag, index) => {
                       return <p key={index}>{tag}</p>
                    })}
                </div>
                <NavLink to={`/course?courseId=${courseId}&slide=0`}><p>start</p></NavLink>
            </div>
        </div>
    )
}