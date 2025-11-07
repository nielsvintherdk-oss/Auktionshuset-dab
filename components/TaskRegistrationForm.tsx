import React, { useState } from 'react';
import { Task } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { SparklesIcon, SpinnerIcon } from './icons';
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
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingTask, setIsGeneratingTask] = useState(false);

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

    const handleGenerateTask = async () => {
        if (!aiPrompt) {
            alert("Beskriv venligst opgaven i tekstfeltet.");
            return;
        }
        setIsGeneratingTask(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const systemInstruction = `You are an assistant that extracts task details from unstructured text and returns them as a JSON object. Today's date is ${new Date().toISOString().split('T')[0]}. Convert relative dates (e.g., 'tomorrow', 'next friday') to absolute YYYY-MM-DD format. Convert times to HH:MM format. The user is Danish, so interpret dates and days of the week in Danish (e.g., 'i morgen', 'fredag'). If information is missing, use an empty string for the value. The final 'description' field in the JSON should be a concise summary of the task itself, extracted from the user's prompt.`;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: aiPrompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING, description: "A concise summary of the task to be performed." },
                            location: { type: Type.STRING, description: "The location where the task takes place." },
                            date: { type: Type.STRING, description: "The date of the task in YYYY-MM-DD format." },
                            time: { type: Type.STRING, description: "The time of the task in HH:MM format." },
                        },
                        required: ["description", "location", "date", "time"],
                    }
                }
            });
    
            const taskDetails = JSON.parse(response.text);
            
            setFormData({
                description: taskDetails.description || '',
                location: taskDetails.location || '',
                date: taskDetails.date || '',
                time: taskDetails.time || '',
            });
            
            setShowAIAssistant(false);
            setAiPrompt('');
    
        } catch (error) {
            console.error("Error generating task details:", error);
            alert("Kunne ikke generere opgavedetaljer. Prøv venligst igen.");
        } finally {
            setIsGeneratingTask(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="border-t pt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Registrer Ny Opgave</h2>
                    <Button
                        type="button"
                        onClick={() => setShowAIAssistant(!showAIAssistant)}
                        title="Brug AI til at udfylde formularen fra tekst"
                        className="flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] transition-colors"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        AI Assistent
                    </Button>
                </div>

                {showAIAssistant && (
                    <div className="p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg">
                        <label htmlFor="ai-prompt" className="block text-base font-medium text-gray-700">Beskriv opgaven med dine egne ord</label>
                        <textarea
                            id="ai-prompt"
                            rows={3}
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                            placeholder="F.eks. 'Husk at vurdere entreprenørmaskiner hos Hansen & Søn på Fabriksvej 10 i Odense på fredag kl 10:30'"
                        />
                        <div className="mt-3 text-right">
                            <Button
                                type="button"
                                onClick={handleGenerateTask}
                                disabled={isGeneratingTask || !aiPrompt}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isGeneratingTask ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                                {isGeneratingTask ? 'Genererer...' : 'Udfyld Formular'}
                            </Button>
                        </div>
                    </div>
                )}
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
