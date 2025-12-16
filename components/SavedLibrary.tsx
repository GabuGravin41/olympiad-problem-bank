import React, { useState } from 'react';
import { Problem, ProblemStatus } from '../types';
import ProblemCard from './ProblemCard';
import { Download, FileJson, FileText, Share2, ClipboardList, CheckCircle2, Clock, Archive } from 'lucide-react';

interface SavedLibraryProps {
  problems: Problem[];
  onDelete: (id: string) => void;
  onEdit: (problem: Problem) => void;
  onViewSolution: (problem: Problem) => void;
  onStatusChange?: (id: string, status: ProblemStatus) => void;
}

const SavedLibrary: React.FC<SavedLibraryProps> = ({ problems, onDelete, onEdit, onViewSolution, onStatusChange }) => {
  // We need local state if onStatusChange isn't provided (though App should handle it ideally)
  // For this demo, we assume App handles persistence, but we need drag state.
  
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const exportJSON = () => {
    const dataStr = JSON.stringify(problems, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'olympiad-forge-library.json');
    linkElement.click();
  };

  const columns = [
      { id: ProblemStatus.DRAFT, title: 'Draft', icon: Clock, color: 'bg-slate-100 border-slate-200' },
      { id: ProblemStatus.REFINING, title: 'Refining', icon: ClipboardList, color: 'bg-blue-50 border-blue-100' },
      { id: ProblemStatus.VERIFIED, title: 'Verified', icon: CheckCircle2, color: 'bg-green-50 border-green-100' },
      { id: ProblemStatus.SHORTLIST, title: 'Shortlist Ready', icon: Archive, color: 'bg-purple-50 border-purple-100' }
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedId(id);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, status: ProblemStatus) => {
      e.preventDefault();
      if (draggedId && onStatusChange) {
          onStatusChange(draggedId, status);
      }
      setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-slate-900 font-serif">Workflow Board</h2>
        <div className="flex items-center space-x-2">
             <button onClick={exportJSON} className="flex items-center px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 transition-colors">
                <FileJson size={16} className="mr-2" /> Backup JSON
             </button>
        </div>
      </div>

      <div className="flex-grow overflow-x-auto pb-4">
          <div className="flex gap-6 h-full min-w-[1000px]">
              {columns.map(col => (
                  <div 
                    key={col.id} 
                    className={`flex-1 flex flex-col rounded-xl border ${col.color} p-3 min-w-[300px] transition-colors ${draggedId ? 'bg-opacity-70' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                      <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="font-bold text-slate-700 flex items-center">
                              <col.icon size={18} className="mr-2 opacity-70"/> 
                              {col.title}
                          </h3>
                          <span className="bg-white/50 text-slate-500 text-xs px-2 py-1 rounded-full font-mono">
                              {problems.filter(p => (p.status || ProblemStatus.DRAFT) === col.id).length}
                          </span>
                      </div>
                      
                      <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar">
                          {problems.filter(p => (p.status || ProblemStatus.DRAFT) === col.id).map(problem => (
                              <div 
                                key={problem.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, problem.id)}
                                className="cursor-move transform transition-transform active:scale-[0.98]"
                              >
                                  <ProblemCard 
                                    problem={problem} 
                                    onDelete={onDelete} 
                                    onEdit={onEdit} 
                                    onViewSolution={onViewSolution}
                                  />
                              </div>
                          ))}
                          {problems.filter(p => (p.status || ProblemStatus.DRAFT) === col.id).length === 0 && (
                              <div className="h-32 border-2 border-dashed border-slate-300/50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                                  Drop here
                              </div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default SavedLibrary;