import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import Markdown from 'react-markdown'
import './slideNormal.css'
import ErrorBoundary from '../../ErrorBoundary';



export default function SlideNormal({slide}) {
    const containerRef = useRef(null);
    const [editorHeight, setEditorHeight] = useState(400);

    const [count, setCount] = useState(0);
    const [text, setText] = useState('');
    const [items, setItems] = useState([]);
    const [input, setInput] = useState('');
    
    useEffect(() => {
        const updateEditorHeight = () => {
            if (containerRef.current) {
                const editorContainerHeight = containerRef.current.clientHeight;
                const availableHeight = Math.max(200, editorContainerHeight - 200);
                setEditorHeight(availableHeight)
            }
        }

        updateEditorHeight()
        window.addEventListener('resize', updateEditorHeight);
        return () => {
            window.removeEventListener('resize', updateEditorHeight);
        };
    }, [])


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
        <div id="normalSlide">
            <div id="normalSlideSidebar" ref={containerRef}>
                <Markdown>{slide.explanation}</Markdown>
                <Editor
                key={slide.id}
                height={`${editorHeight}px`}
                defaultLanguage="javascript"
                theme="vs-dark"
                defaultValue={slide.code}
                options={{ minimap: { enabled: false }, fontSize: 16 }}
                />
            </div>
            <div id="liveExample">
                <ErrorBoundary>
                    <DynamicComponent 
                        componentCode={slide.liveComponent}
                        props={componentProps}
                        />    
                </ErrorBoundary>
            </div>
        </div>
    )
}