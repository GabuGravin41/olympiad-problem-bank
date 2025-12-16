import React, { useEffect, useRef } from 'react';

interface GeometryVisualizerProps {
  code: string;
}

declare global {
  interface Window {
    JXG: any;
  }
}

const GeometryVisualizer: React.FC<GeometryVisualizerProps> = ({ code }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);

  useEffect(() => {
    if (!window.JXG || !boxRef.current) return;

    // Cleanup previous board
    if (boardRef.current) {
      window.JXG.JSXGraph.freeBoard(boardRef.current);
    }

    const id = "jxgbox-" + Math.random().toString(36).substr(2, 9);
    boxRef.current.id = id;

    // Initialize Board
    try {
      const board = window.JXG.JSXGraph.initBoard(id, { 
        boundingbox: [-5, 5, 5, -5], 
        axis: false,
        grid: false,
        showNavigation: true,
        keepaspectratio: true
      });
      boardRef.current = board;

      // Execute the AI-generated code
      // We wrap in a function to isolate scope slightly, though it runs in global context effectively
      // This is "unsafe" in a public web app, but acceptable for a local tool for power users.
      const runCode = new Function('board', 'JXG', code);
      runCode(board, window.JXG);

    } catch (e) {
      console.error("JSXGraph Error:", e);
    }

    return () => {
      if (boardRef.current) {
        window.JXG.JSXGraph.freeBoard(boardRef.current);
      }
    };
  }, [code]);

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={boxRef} 
        className="jxgbox w-full h-[400px] border border-slate-200 rounded-lg bg-white shadow-inner" 
        style={{ width: '100%', height: '400px' }}
      ></div>
      <p className="text-xs text-slate-400 mt-2">Interactive Diagram (Drag points to test stability)</p>
    </div>
  );
};

export default GeometryVisualizer;