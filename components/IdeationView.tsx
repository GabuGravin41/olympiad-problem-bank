import React, { useState } from 'react';
import { Topic, Difficulty, Problem, ProblemStatus, StyleGuide } from '../types';
import { 
    generateProblemIdea, 
    generateProblemFromSketch, 
    refineProblem, 
    generateSolutionAndLean, 
    checkSimilars,
    stressTestProblem,
    generateGeometryDiagrams
} from '../services/geminiService';
import MathRenderer from './MathRenderer';
import GeometryVisualizer from './GeometryVisualizer';
import { Sparkles, RefreshCw, CheckCircle, PenTool, Lightbulb, Zap, AlertTriangle, Search, Copy, Save } from 'lucide-react';

interface IdeationViewProps {
  onSave: (problem: Problem) => void;
}

type Mode = 'generate' | 'sketch';

const IdeationView: React.FC<IdeationViewProps> = ({ onSave }) => {
  const [mode, setMode] = useState<Mode>('generate');
  
  // Generation State
  const [topic, setTopic] = useState<Topic>(Topic.NUMBER_THEORY);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [focusArea, setFocusArea] = useState('');
  const [styleGuide, setStyleGuide] = useState<StyleGuide>({ notation: '', geometryConvention: '' });
  
  // Sketch State
  const [userSketch, setUserSketch] = useState('');

  // Common State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProblemText, setCurrentProblemText] = useState('');
  
  // Details
  const [solution, setSolution] = useState('');
  const [leanCode, setLeanCode] = useState('');
  const [similars, setSimilars] = useState('');
  const [stressTest, setStressTest] = useState('');
  const [jsxGraphCode, setJsxGraphCode] = useState('');
  const [asymptoteCode, setAsymptoteCode] = useState('');

  const [activeTab, setActiveTab] = useState<'preview' | 'solution' | 'lean' | 'verification' | 'diagram'>('preview');
  const [refinementPrompt, setRefinementPrompt] = useState('');

  const resetOutputs = () => {
    setSolution('');
    setLeanCode('');
    setSimilars('');
    setStressTest('');
    setJsxGraphCode('');
    setAsymptoteCode('');
    setActiveTab('preview');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    resetOutputs();
    const text = await generateProblemIdea(topic, difficulty, focusArea, styleGuide);
    setCurrentProblemText(text);
    setIsGenerating(false);
  };

  const handleSketchProcess = async () => {
    if (!userSketch.trim()) return;
    setIsGenerating(true);
    resetOutputs();
    const text = await generateProblemFromSketch(userSketch, styleGuide);
    setCurrentProblemText(text);
    setIsGenerating(false);
  };

  const handleRefine = async () => {
    if (!currentProblemText || !refinementPrompt) return;
    setIsGenerating(true);
    const text = await refineProblem(currentProblemText, refinementPrompt);
    setCurrentProblemText(text);
    setRefinementPrompt('');
    setIsGenerating(false);
  };

  const handleGenerateDetails = async () => {
    setIsGenerating(true);
    const { solution: sol, lean } = await generateSolutionAndLean(currentProblemText);
    setSolution(sol);
    setLeanCode(lean);
    
    // Auto-generate diagrams if geometry
    if (topic === Topic.GEOMETRY || currentProblemText.toLowerCase().includes('triangle') || currentProblemText.toLowerCase().includes('circle')) {
        const { jsxGraph, asymptote } = await generateGeometryDiagrams(currentProblemText);
        setJsxGraphCode(jsxGraph);
        setAsymptoteCode(asymptote);
    }

    setIsGenerating(false);
    setActiveTab('solution');
  };

  const handleVerification = async () => {
      setIsGenerating(true);
      const sim = await checkSimilars(currentProblemText);
      const stress = await stressTestProblem(currentProblemText);
      setSimilars(sim);
      setStressTest(stress);
      setIsGenerating(false);
      setActiveTab('verification');
  };

  const handleSave = () => {
    const titleMatch = currentProblemText.match(/\*\*Title\*\*:\s*(.*)/);
    const title = titleMatch ? titleMatch[1] : `${mode === 'generate' ? topic : 'Custom'} Problem`;

    const newProblem: Problem = {
      id: Date.now().toString(),
      title,
      statement: currentProblemText,
      topic: mode === 'generate' ? topic : Topic.ALGEBRA, 
      difficulty: mode === 'generate' ? difficulty : Difficulty.MEDIUM,
      status: ProblemStatus.DRAFT,
      solution,
      leanCode,
      jsxGraphCode,
      asymptoteCode,
      similars,
      stressTest,
      created: Date.now(),
      tags: [mode]
    };
    onSave(newProblem);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 overflow-hidden">
      
      {/* LEFT COLUMN: Input & Controls (40%) */}
      <div className="lg:w-2/5 flex flex-col gap-4 overflow-y-auto pr-2">
        
        {/* Mode Switcher */}
        <div className="bg-white p-1 rounded-lg border border-slate-200 flex shadow-sm shrink-0">
             <button onClick={() => setMode('generate')} className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md ${mode === 'generate' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Sparkles size={16} className="mr-2"/> AI Generate
            </button>
            <button onClick={() => setMode('sketch')} className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md ${mode === 'sketch' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <PenTool size={16} className="mr-2"/> Draft Idea
            </button>
        </div>

        {/* Parameters / Inputs */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm shrink-0">
             {mode === 'generate' ? (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Topic</label>
                            <select value={topic} onChange={(e) => setTopic(e.target.value as Topic)} className="w-full mt-1 p-2 border rounded-md text-sm border-slate-300">
                                {Object.values(Topic).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Difficulty</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full mt-1 p-2 border rounded-md text-sm border-slate-300">
                                {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Focus (Optional)</label>
                        <input type="text" value={focusArea} onChange={(e) => setFocusArea(e.target.value)} placeholder="e.g. Cyclic Quads" className="w-full mt-1 p-2 border rounded-md text-sm border-slate-300" />
                    </div>
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-2 bg-indigo-600 text-white rounded-md font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
                        {isGenerating ? 'Forging...' : 'Generate Problem'}
                    </button>
                </div>
             ) : (
                <div className="space-y-3">
                    <textarea value={userSketch} onChange={(e) => setUserSketch(e.target.value)} placeholder="Describe your geometry config or algebra inequality..." className="w-full h-32 p-3 border rounded-md text-sm border-slate-300 focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={handleSketchProcess} disabled={isGenerating || !userSketch} className="w-full py-2 bg-amber-600 text-white rounded-md font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50">
                        {isGenerating ? 'Processing...' : 'Formalize & Expand'}
                    </button>
                </div>
             )}
        </div>

        {/* Style Guide Accordion (Simplified) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center"><PenTool className="w-4 h-4 mr-2"/> Style Preferences</h3>
            <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Notation (e.g. Cyclic Sums)" value={styleGuide.notation} onChange={e => setStyleGuide({...styleGuide, notation: e.target.value})} className="text-xs p-2 border border-slate-200 rounded"/>
                <input type="text" placeholder="Geo (e.g. Triangle ABC)" value={styleGuide.geometryConvention} onChange={e => setStyleGuide({...styleGuide, geometryConvention: e.target.value})} className="text-xs p-2 border border-slate-200 rounded"/>
            </div>
        </div>

        {/* Refinement */}
        {currentProblemText && (
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex-grow flex flex-col">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Refine</h3>
                <textarea value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} placeholder="Make it harder, change constants..." className="w-full flex-grow p-3 border rounded-md text-sm border-slate-300 mb-2 resize-none" />
                <button onClick={handleRefine} disabled={isGenerating} className="w-full py-2 border border-green-600 text-green-700 rounded-md font-medium text-sm hover:bg-green-50">Apply Refinement</button>
             </div>
        )}
      </div>

      {/* RIGHT COLUMN: Output & Workbench (60%) */}
      <div className="lg:w-3/5 bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
             <button onClick={() => setActiveTab('preview')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'preview' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Problem</button>
             <button onClick={() => setActiveTab('solution')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'solution' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Solution</button>
             <button onClick={() => setActiveTab('verification')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'verification' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Verify</button>
             {(jsxGraphCode || topic === Topic.GEOMETRY) && (
                 <button onClick={() => setActiveTab('diagram')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'diagram' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Diagram</button>
             )}
             <button onClick={() => setActiveTab('lean')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'lean' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Lean 4</button>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-6 bg-slate-50/30 relative">
            {!currentProblemText && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <Zap className="w-12 h-12 mb-4 text-slate-200"/>
                    <p>Forge output will appear here</p>
                </div>
            )}

            {currentProblemText && activeTab === 'preview' && (
                <div className="prose prose-slate max-w-none">
                    <MathRenderer content={currentProblemText} />
                    <div className="mt-8 flex justify-center gap-4">
                        {!solution && (
                             <button onClick={handleGenerateDetails} className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm hover:bg-slate-700 shadow flex items-center">
                                <CheckCircle size={16} className="mr-2"/> Generate Solution
                             </button>
                        )}
                        {!similars && (
                             <button onClick={handleVerification} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-full text-sm hover:bg-slate-50 shadow flex items-center">
                                <Search size={16} className="mr-2"/> Verify & Check
                             </button>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'solution' && (
                <div className="prose prose-slate max-w-none">
                     {solution ? <MathRenderer content={solution}/> : <p className="text-slate-400 italic text-center mt-10">Solution not generated yet.</p>}
                </div>
            )}

            {activeTab === 'verification' && (
                <div className="space-y-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center"><AlertTriangle size={18} className="mr-2"/> Stress Test</h4>
                        {stressTest ? <MathRenderer content={stressTest}/> : <p className="text-sm text-yellow-700 italic">Analysis pending...</p>}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2 flex items-center"><Search size={18} className="mr-2"/> Similars Search</h4>
                        {similars ? <MathRenderer content={similars}/> : <p className="text-sm text-blue-700 italic">Search pending...</p>}
                    </div>
                    {!similars && <button onClick={handleVerification} className="text-indigo-600 underline text-sm">Run Verification Checks</button>}
                </div>
            )}

            {activeTab === 'diagram' && (
                <div className="h-full flex flex-col">
                    {jsxGraphCode ? (
                        <>
                            <GeometryVisualizer code={jsxGraphCode} />
                            {asymptoteCode && (
                                <div className="mt-6">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Asymptote Code (For Export)</h4>
                                    <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto border border-slate-200">{asymptoteCode}</pre>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-slate-400 mt-10">
                            <p>No diagram available.</p>
                            <button onClick={handleGenerateDetails} className="text-indigo-600 underline">Generate Solution & Diagrams</button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'lean' && (
                leanCode ? (
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-auto h-full border border-slate-700 shadow-inner"><code>{leanCode}</code></pre>
                ) : <p className="text-slate-400 italic text-center mt-10">Lean code not generated.</p>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
             <button onClick={() => {navigator.clipboard.writeText(currentProblemText)}} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-md text-sm hover:bg-slate-50 flex items-center">
                 <Copy size={16} className="mr-2"/> Copy TeX
             </button>
             <button onClick={handleSave} disabled={!currentProblemText} className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center disabled:opacity-50">
                 <Save size={16} className="mr-2"/> Save to Library
             </button>
        </div>
      </div>

    </div>
  );
};

export default IdeationView;