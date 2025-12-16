import React, { useState, useEffect } from 'react';
import IdeationView from './components/IdeationView';
import SavedLibrary from './components/SavedLibrary';
import { Problem, ProblemStatus } from './types';
import { Hexagon, Layout, PlusCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'ideation' | 'library'>('ideation');
  
  // Initialize problems
  const [problems, setProblems] = useState<Problem[]>(() => {
    try {
        const saved = localStorage.getItem('olympiad-forge-problems');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  // URL Import Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
        try {
            const json = decodeURIComponent(atob(data));
            const importedProblems = JSON.parse(json);
            if (Array.isArray(importedProblems) && window.confirm(`Import ${importedProblems.length} shared problem(s)?`)) {
                // Deduplicate by ID
                setProblems(prev => {
                    const ids = new Set(prev.map(p => p.id));
                    const newOnes = importedProblems.filter((p: Problem) => !ids.has(p.id));
                    return [...newOnes, ...prev];
                });
                setCurrentView('library');
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            console.error("Import failed", e);
        }
    }
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem('olympiad-forge-problems', JSON.stringify(problems));
  }, [problems]);

  const handleSaveProblem = (problem: Problem) => {
    setProblems(prev => [problem, ...prev]);
    setCurrentView('library');
  };

  const handleDeleteProblem = (id: string) => {
    setProblems(prev => prev.filter(p => p.id !== id));
  };

  const handleEditProblem = (problem: Problem) => {
    alert("Copy text to 'Draft Idea' to refine.");
  };

  const handleStatusChange = (id: string, status: ProblemStatus) => {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleViewSolution = (problem: Problem) => {
      const win = window.open("", "_blank");
      if(win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${problem.title}</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
                    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
                    
                     <!-- JSXGraph -->
                    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css" />
                    <script type="text/javascript" charset="UTF-8" src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>

                    <style>
                        body { font-family: 'Georgia', serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #111; background: #fafafa; }
                        .paper { background: white; padding: 50px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                        h1 { border-bottom: 1px solid #ddd; padding-bottom: 20px; text-align: center; }
                        h2 { margin-top: 40px; color: #333; font-size: 1.2em; text-transform: uppercase; letter-spacing: 1px; }
                        .content { white-space: pre-wrap; }
                        pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; font-family: monospace; font-size: 0.9em; }
                        .jxgbox { width: 100%; height: 400px; margin: 20px 0; border: 1px solid #eee; }
                    </style>
                </head>
                <body>
                    <div class="paper">
                        <h1>${problem.title}</h1>
                        <div class="content">
                            <div>${problem.statement}</div>
                            
                            ${problem.jsxGraphCode ? `<div id="jxgbox" class="jxgbox"></div>
                            <script>
                                (function() {
                                    var board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-5, 5, 5, -5], axis:false, showNavigation:false});
                                    ${problem.jsxGraphCode}
                                })();
                            </script>` : ''}

                            <h2>Solution</h2>
                            <div>${problem.solution || "No solution generated."}</div>
                            
                            ${problem.leanCode ? `<h2>Lean 4 Formalization</h2><pre>${problem.leanCode}</pre>` : ''}
                            ${problem.similars ? `<h2>Similar Problems</h2><div>${problem.similars}</div>` : ''}
                        </div>
                    </div>
                    <script>
                        document.addEventListener("DOMContentLoaded", function() {
                            renderMathInElement(document.body, {
                                delimiters: [
                                    {left: "$$", right: "$$", display: true},
                                    {left: "$", right: "$", display: false}
                                ],
                                throwOnError: false
                            });
                        });
                    </script>
                </body>
            </html>
          `);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('ideation')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <Hexagon size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif">Olympiad Forge</h1>
          </div>
          
          <nav className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setCurrentView('ideation')}
              className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === 'ideation' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Forge
            </button>
            <button
              onClick={() => setCurrentView('library')}
              className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === 'library' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layout className="mr-2 h-4 w-4" />
              Library
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 w-full h-[calc(100vh-64px)] overflow-hidden">
        {currentView === 'ideation' ? (
          <IdeationView onSave={handleSaveProblem} />
        ) : (
          <SavedLibrary 
            problems={problems} 
            onDelete={handleDeleteProblem}
            onEdit={handleEditProblem}
            onViewSolution={handleViewSolution}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
    </div>
  );
};

export default App;