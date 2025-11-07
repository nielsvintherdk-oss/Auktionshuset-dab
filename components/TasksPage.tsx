
import React from 'react';
import { Task } from '../types';
import TaskRegistrationForm from './TaskRegistrationForm';
import TaskList from './TaskList';

interface TasksPageProps {
    tasks: Task[];
    completedTasks: Task[];
    onRegisterTask: (task: Omit<Task, 'id' | 'appraiser'>) => void;
    onCompleteTask: (taskId: string) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ tasks, completedTasks, onRegisterTask, onCompleteTask }) => {
    return (
        <div className="space-y-8">
            <TaskList 
                tasks={tasks}
                title="Kommende Opgaver"
                onCompleteTask={onCompleteTask}
            />
            <TaskList
                tasks={completedTasks}
                title="Færdige Opgaver"
                isCompletedList={true}
            />
            <TaskRegistrationForm onRegister={onRegisterTask} />
        </div>
    );
};

export default TasksPage;