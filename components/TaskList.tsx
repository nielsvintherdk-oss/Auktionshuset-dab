import React from 'react';
import { Task } from '../types';
import { CalendarIcon, LocationMarkerIcon, CheckboxIcon } from './icons';
import Button from './Button';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  isCompletedList?: boolean;
  onCompleteTask?: (taskId: string) => void;
}

const formatDate = (dateString: string, timeString: string) => {
  const date = new Date(`${dateString}T${timeString}`);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('da-DK', options).format(date);
};


const TaskCard: React.FC<{ task: Task; isCompleted?: boolean; onComplete?: (taskId: string) => void; }> = ({ task, isCompleted, onComplete }) => {
  return (
    <li className={`flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 ${isCompleted ? 'bg-gray-50' : ''}`}>
      <div className={`flex-shrink-0 rounded-lg p-3 flex flex-col items-center justify-center w-full sm:w-24 text-center ${isCompleted ? 'bg-gray-300 text-gray-600' : 'bg-[#C00000] text-white'}`}>
         <span className="font-bold text-lg">{new Date(task.date).toLocaleDateString('da-DK', { day: '2-digit' })}</span>
         <span className="text-sm uppercase">{new Date(task.date).toLocaleDateString('da-DK', { month: 'short' })}</span>
      </div>
      <div className="flex-grow">
        <p className={`font-semibold text-lg ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{task.description}</p>
        <div className={`flex items-center text-base mt-1 ${isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
          <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{formatDate(task.date, task.time)}</span>
        </div>
        <div className={`flex items-center text-base mt-1 ${isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
          <LocationMarkerIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{task.location}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Registreret af: {task.appraiser}</p>
      </div>
      {!isCompleted && onComplete && (
        <div className="ml-0 sm:ml-4 self-end sm:self-center flex-shrink-0">
          <Button
            onClick={() => onComplete(task.id)}
            className="flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            title="Markér opgaven som færdig"
          >
            <CheckboxIcon className="w-4 h-4 mr-1.5" />
            Færdig
          </Button>
        </div>
      )}
    </li>
  );
};


const TaskList: React.FC<TaskListProps> = ({ tasks, title = 'Kommende Opgaver', isCompletedList, onCompleteTask }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      {tasks.length === 0 ? (
        <div className={`text-center py-4 px-4 border rounded-md ${isCompletedList ? 'border-gray-200 bg-gray-50 text-gray-600' : 'border-[#C00000] bg-[#C00000] text-white'}`}>
          <p>Der er ingen {isCompletedList ? 'færdige' : 'kommende'} opgaver.</p>
          {!isCompletedList && <p className="text-base text-white/80 mt-1">Nye opgaver vil blive vist her, efter du har registreret dem.</p>}
        </div>
      ) : (
        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              isCompleted={isCompletedList}
              onComplete={onCompleteTask}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;