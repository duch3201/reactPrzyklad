import './CourseBox.css'

export default function CourseBox({title, desc, tags}) {

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
                <button><p>start</p></button>
            </div>
        </div>
    )
}