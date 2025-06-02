import { useState } from 'react'
import './CourseShelf.css'
import CourseBox from './CourseBox'

export default function CourseShelf({coursesData}) {
    return (
        <div id="CourseShelf">
            {coursesData.map((course, index) => {
                return <CourseBox key={index} title={course.title} desc={course.description} tags={course.tags} />
            })}
        </div>
    )
    
}