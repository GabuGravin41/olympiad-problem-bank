import React from 'react';
import { Problem } from '../types';
import MathRenderer from './MathRenderer';
import { Trash2, Edit3, BookOpen, Share2 } from 'lucide-react';

interface ProblemCardProps {
  problem: Problem;
  onDelete: (id: string) => void;
  onEdit: (problem: Problem) => void;
  onViewSolution: (problem: Problem) => void;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ problem, onDelete, onEdit, onViewSolution }) => {
  const handleShare = () => {
    const json = JSON.stringify([problem]);
    const b64 = btoa(encodeURIComponent(json));
    const url = `${window.location.origin}${window.location.pathname}?data=${b64}`;
    navigator.clipboard.writeText(url);
    alert("Shareable link copied to clipboard!");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col group relative hover:border-indigo-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="w-full">
           <div className="flex flex-wrap gap-1 mb-2">
                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-sm 
                    ${problem.topic === 'Algebra' ? 'bg-red-50 text-red-700' : 
                    problem.topic === 'Geometry' ? 'bg-green-50 text-green-700' :
                    problem.topic === 'Combinatorics' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-blue-50 text-blue-700'
                    }`}>
                    {problem.topic}
                </span>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-sm bg-slate-100 text-slate-600">
                    {problem.difficulty}
                </span>
           </div>
          <h3 className="text-base font-bold text-slate-900 font-serif leading-tight line-clamp-2">{problem.title}</h3>
        </div>
      </div>
      
      <div className="mb-4 max-h-32 overflow-hidden relative">
        <div className="text-xs text-slate-600">
            <MathRenderer content={problem.statement} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
         <span className="text-[10px] text-slate-400">{new Date(problem.created).toLocaleDateString()}</span>
         <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleShare} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Share Link">
                <Share2 size={14} />
            </button>
            <button onClick={() => onViewSolution(problem)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View Full">
                <BookOpen size={14} />
            </button>
            <button onClick={() => onEdit(problem)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                <Edit3 size={14} />
            </button>
            <button onClick={() => onDelete(problem.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                <Trash2 size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;