import React, { useEffect, useRef, useState } from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

declare global {
  interface Window {
    renderMathInElement: (element: HTMLElement, options: any) => void;
    katex: any;
  }
}

const MathRenderer: React.FC<MathRendererProps> = ({ content = "", className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLibAvailable, setIsLibAvailable] = useState(false);

  // Poll for KaTeX availability
  useEffect(() => {
    if (window.renderMathInElement && window.katex) {
      setIsLibAvailable(true);
    } else {
      const interval = setInterval(() => {
        if (window.renderMathInElement && window.katex) {
          setIsLibAvailable(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Format content: minimal markdown processing for bolding
  const processContent = (text: string) => {
    // Basic bold replacement **text** -> <b>text</b>
    // We do this carefully to not break LaTeX
    // A safer way is to rely on KaTeX's auto-render to ignore HTML tags, 
    // but usually, simple text replacement is risky if it hits LaTeX.
    // For now, we will just pass text through but ensure cleaning of specific artifacts.
    return text.replace(/\\\[/g, '$$$').replace(/\\\]/g, '$$$').replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  };

  useEffect(() => {
    if (isLibAvailable && containerRef.current) {
      // Small timeout to ensure DOM painting of new content happens before KaTeX runs
      const timer = setTimeout(() => {
        if (containerRef.current) {
           try {
            window.renderMathInElement(containerRef.current, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false },
                { left: "\\[", right: "\\]", display: true }
              ],
              throwOnError: false,
              trust: true,
              strict: false,
            });
          } catch (error) {
            console.error("KaTeX rendering failed:", error);
          }
        }
      }, 50); 
      return () => clearTimeout(timer);
    }
  }, [content, isLibAvailable]);

  return (
    <div 
      ref={containerRef} 
      className={`math-content font-serif text-lg leading-relaxed whitespace-pre-wrap ${className}`}
    >
      {processContent(content)}
    </div>
  );
};

export default MathRenderer;