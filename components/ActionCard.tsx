
import React from 'react';
import { User, AlertCircle, Clock, Calendar, ShieldCheck, Target } from 'lucide-react';
import { ActionItem } from '../types';

interface ActionCardProps {
  action: ActionItem;
}

const ActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500 text-white shadow-red-100';
      case 'High': return 'bg-yellow-500 text-black shadow-yellow-100';
      default: return 'bg-blue-600 text-white shadow-blue-100';
    }
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-yellow-600 bg-yellow-50 border-yellow-100';
  };

  return (
    <div className="group bg-white p-5 border border-gray-100 rounded-3xl hover:border-yellow-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 space-y-3 w-full">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
               <div className={`h-2.5 w-2.5 rounded-full ${action.priority === 'Critical' ? 'animate-pulse bg-red-500' : 'bg-gray-300'}`}></div>
               <h4 className="text-lg font-black text-black tracking-tight group-hover:text-yellow-600 transition-colors">
                 {action.task}
               </h4>
            </div>
            {/* Phase 2: AI Alignment Badge */}
            {action.alignmentScore !== undefined && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getAlignmentColor(action.alignmentScore)}`}>
                <ShieldCheck size={10} />
                <span>Aligned {action.alignmentScore}%</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <User className="w-3.5 h-3.5 mr-2 text-yellow-600" />
              <span className="font-black text-[10px] uppercase tracking-widest">{action.owner}</span>
            </div>
            {action.deadline && (
              <div className="flex items-center text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                <Calendar className="w-3.5 h-3.5 mr-2" />
                <span className="font-black text-[10px] uppercase tracking-widest">Due: {action.deadline}</span>
              </div>
            )}
            <div className="flex items-center text-gray-500 italic bg-white px-3 py-1.5 rounded-full border border-gray-100">
              <AlertCircle className="w-3.5 h-3.5 mr-2 text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Source: {action.source}</span>
            </div>
          </div>

          {action.strategicRationale && (
            <div className="bg-gray-50/80 p-3 rounded-2xl border border-dashed border-gray-200">
               <div className="flex items-center space-x-2 mb-1">
                  <Target size={10} className="text-gray-400" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Strategic Rationale</span>
               </div>
               <p className="text-[10px] text-gray-600 leading-tight font-medium">
                 {action.strategicRationale}
               </p>
            </div>
          )}

          {action.progress !== undefined && (
            <div className="w-full pt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Completion</span>
                <span className="text-[9px] font-black text-black">{action.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${action.progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end space-y-3 shrink-0 w-full sm:w-auto">
          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg ${getPriorityStyles(action.priority)}`}>
            {action.priority}
          </span>
          <div className="flex items-center text-gray-500 text-[10px] font-black uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 w-full justify-end">
            <Clock className="w-3 h-3 mr-2" />
            {action.status}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCard;
