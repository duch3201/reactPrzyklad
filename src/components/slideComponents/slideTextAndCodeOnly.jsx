import Editor from '@monaco-editor/react';
import Markdown from 'react-markdown'

export default function SlideTextAndCodeOnly({slide}) {
    return (
        <div>
            <Markdown>{slide.explanation}</Markdown>
            <Editor
            key={slide.id}
            height="90vh"
            defaultLanguage="javascript"
            theme="vs-dark"
            defaultValue={slide.code}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
        </div>
    )
}