import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Pause, Settings2 } from 'lucide-react';
export function MarkdownCopyDesk({ content }) {
    const scrollRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(0.5); // px per frame
    useEffect(() => {
        let animationFrameId;
        if (autoScroll && scrollRef.current) {
            const scroll = () => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop += scrollSpeed;
                }
                animationFrameId = requestAnimationFrame(scroll);
            };
            animationFrameId = requestAnimationFrame(scroll);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [autoScroll, scrollSpeed]);
    return (<div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-[var(--shadow-ultimate)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/50">
        <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Read-Along Script</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-muted-foreground"/>
            <input type="range" min="0.2" max="3" step="0.2" value={scrollSpeed} onChange={(e) => setScrollSpeed(Number(e.target.value))} className="w-24 accent-primary cursor-pointer"/>
          </div>
          <button onClick={() => setAutoScroll(!autoScroll)} className={`p-1.5 rounded flex items-center justify-center transition-colors ${autoScroll ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted-foreground/20'}`} title={autoScroll ? "Pause Auto-scroll" : "Start Auto-scroll"}>
            {autoScroll ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
          </button>
        </div>
      </div>

      {/* Markdown Canvas */}
      <div ref={scrollRef} className="flex-1 p-6 md:p-10 overflow-y-auto prose prose-invert max-w-none text-xl leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h1: ({ node, ...props }) => <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8 mt-12 first:mt-0" {...props}/>,
            h2: ({ node, ...props }) => <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6 mt-10" {...props}/>,
            h3: ({ node, ...props }) => <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4 mt-8" {...props}/>,
            strong: ({ node, ...props }) => <strong className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 uppercase tracking-wide border border-primary/20" {...props}/>,
            blockquote: ({ node, ...props }) => (<blockquote className="border-l-4 border-primary bg-primary/5 pl-6 py-4 my-6 rounded-r-lg italic text-muted-foreground text-2xl shadow-inner" {...props}/>),
            p: ({ node, ...props }) => <p className="mb-6 text-muted-foreground" {...props}/>,
        }}>
          {content}
        </ReactMarkdown>
      </div>
    </div>);
}
