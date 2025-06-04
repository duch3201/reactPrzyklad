import Markdown from 'react-markdown'

export default function SlideTextOnly({slide}) {
    return (
        <div>
            {/* <p>{JSON.stringify(slide)}</p> */}
            <Markdown>{slide.explanation}</Markdown>
        </div>
    )
}