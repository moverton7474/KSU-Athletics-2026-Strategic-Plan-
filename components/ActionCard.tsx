
import React, { useState } from 'react';
import { User, AlertCircle, Clock, Edit2, X, Check } from 'lucide-react';
import { ActionItem } from '../types';

interface ActionCardProps {
  action: ActionItem;
  onUpdate?: (updated: ActionItem) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<ActionItem>(action);

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

  const handleSave = () => {
    if (onUpdate) onUpdate(editedItem);
    setIsEditing(false);
  };

  return (
    <>
      <div className="group bg-white p-5 border border-gray-100 rounded-2xl hover:border-yellow-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-50 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-yellow-500 hover:text-black transition-all"
        >
          <Edit2 size={14} />
        </button>

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

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300">
            <div className="bg-black text-white px-8 py-6 flex justify-between items-center border-b-4 border-yellow-500">
              <h3 className="text-xl font-black uppercase tracking-tighter">Edit Tactical Priority</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Objective</label>
                <input 
                  type="text" 
                  value={editedItem.task}
                  onChange={e => setEditedItem({...editedItem, task: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-xl px-4 py-3 font-bold outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Owner</label>
                  <input 
                    type="text" 
                    value={editedItem.owner}
                    onChange={e => setEditedItem({...editedItem, owner: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-xl px-4 py-3 font-bold outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Priority</label>
                  <select 
                    value={editedItem.priority}
                    onChange={e => setEditedItem({...editedItem, priority: e.target.value as any})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-xl px-4 py-3 font-bold outline-none transition-all appearance-none"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Implementation Status</label>
                <input 
                  type="text" 
                  value={editedItem.status}
                  onChange={e => setEditedItem({...editedItem, status: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-xl px-4 py-3 font-bold outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-500 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:bg-gray-900 transition-all"
              >
                <Check size={16} className="text-yellow-500" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionCard;
