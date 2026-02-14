
import React from 'react';
import { User, AlertCircle, Clock } from 'lucide-react';
import { ActionItem } from '../types';

interface ActionCardProps {
  action: ActionItem;
}

const ActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500 text-white shadow-red-100';
      case 'High':
        return 'bg-yellow-500 text-black shadow-yellow-100';
      default:
        return 'bg-blue-600 text-white shadow-blue-100';
    }
  };

  return (
    <div className="group bg-white p-5 border border-gray-100 rounded-2xl hover:border-yellow-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-2">
             <div className={`h-2 w-2 rounded-full ${action.priority === 'Critical' ? 'animate-pulse bg-red-500' : 'bg-gray-300'}`}></div>
             <h4 className="text-lg font-extrabold text-gray-900 group-hover:text-black transition-colors">
               {action.task}
             </h4>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <User className="w-4 h-4 mr-2 text-yellow-600" />
              <span className="font-bold">{action.owner}</span>
            </div>
            <div className="flex items-center text-gray-500 italic bg-white px-3 py-1.5 rounded-full border border-gray-100">
              <AlertCircle className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-xs">Source: {action.source}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-3 shrink-0 w-full sm:w-auto">
          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg ${getPriorityStyles(action.priority)}`}>
            {action.priority}
          </span>
          <div className="flex items-center text-gray-500 text-xs font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-full justify-end">
            <Clock className="w-3 h-3 mr-2" />
            {action.status}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCard;
