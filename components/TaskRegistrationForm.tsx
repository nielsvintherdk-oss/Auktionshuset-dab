import React, { useState } from 'react';
import { Task } from '../types';
import Button from './Button';


interface TaskRegistrationFormProps {
    onRegister: (task: Omit<Task, 'id' | 'appraiser'>) => void;
}

const initialFormData = {
    description: '',
    location: '',
    date: '',
    time: ''
};

const TaskRegistrationForm: React.FC<TaskRegistrationFormProps> = ({ onRegister }) => {
    const [formData, setFormData] = useState(initialFormData);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRegister(formData);
        alert('Opgaven er blevet registreret!');
        setFormData(initialFormData);
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="border-t pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Registrer Ny Opgave</h2>
            </div>

            <div>
                <label htmlFor="description" className="block text-base font-medium text-gray-700">Opgavebeskrivelse *</label>
                <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                    placeholder="Beskriv opgaven..."
                    required
                />
            </div>

            <div>
                <label htmlFor="task-location" className="block text-base font-medium text-gray-700">Sted *</label>
                <input
                    type="text"
                    name="location"
                    id="task-location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                    placeholder="Adresse eller lokation..."
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="date" className="block text-base font-medium text-gray-700">Dato *</label>
                    <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="time" className="block text-base font-medium text-gray-700">Tidspunkt *</label>
                    <input
                        type="time"
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                        required
                    />
                </div>
            </div>

            <div className="pt-5">
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        sound="success"
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
                    >
                        Registrer Opgave
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default TaskRegistrationForm;