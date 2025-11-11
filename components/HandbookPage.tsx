import React, { useState } from 'react';
import { handbookData } from './handbookData';
import Button from './Button';
import { GoogleGenAI } from '@google/genai';
import { SpinnerIcon } from './icons';

const HandbookPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);

    const filteredData = handbookData.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedId(prevId => (prevId === id ? null : id));
    };

    const handleAiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        setAiAnswer(null);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API-nøglen (API_KEY) mangler.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const handbookContext = handbookData.map(article => `## ${article.title}\n${article.content}`).join('\n\n---\n\n');
            const prompt = `Du er en hjælpsom assistent for Auktionshuset dab. Baseret på indholdet i den følgende håndbog, bedes du besvare brugerens spørgsmål. Dit svar skal være kortfattet og præcist. Hvis det er relevant, skal du nævne titlen på det afsnit i håndbogen, som dit svar er baseret på.\n\nHåndbogens Indhold:\n${handbookContext}\n\nBrugerens Spørgsmål: "${searchTerm}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAiAnswer(response.text);

        } catch (error) {
            console.error("Error with AI search:", error);
            const message = error instanceof Error ? error.message : "Der opstod en fejl under AI-søgningen. Prøv venligst igen.";
            setAiAnswer(`**Fejl:** ${message}`);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">dab Håndbog</h1>
                <p className="mt-2 text-lg text-gray-600">Søg efter instruktioner, betingelser og vejledninger.</p>
            </div>

            {/* Search Bar */}
            <div className="sticky top-20 bg-white/80 backdrop-blur-sm py-4 z-10 rounded-xl">
                 <form onSubmit={handleAiSearch} className="flex gap-2">
                    <input
                        type="search"
                        placeholder="Stil et spørgsmål til håndbogen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#C00000] focus:border-[#C00000] transition"
                    />
                    <Button
                        type="submit"
                        disabled={isSearching || !searchTerm.trim()}
                        className="px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSearching ? <SpinnerIcon className="w-5 h-5" /> : 'Søg'}
                    </Button>
                </form>
            </div>

            {/* AI Answer Section */}
            {isSearching && (
                 <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg animate-pulse">
                    <p className="font-semibold text-gray-700">AI tænker...</p>
                    <p className="text-gray-500 mt-1">Søger efter det bedste svar i håndbogen.</p>
                </div>
            )}
            {aiAnswer && (
                 <div className="p-4 bg-red-50 border border-[#C00000]/30 rounded-xl animate-fade-in">
                    <h3 className="text-lg font-bold text-[#C00000]">AI Svar</h3>
                    <p className="mt-2 text-gray-800 whitespace-pre-line leading-relaxed">{aiAnswer}</p>
                 </div>
            )}

            {/* Articles */}
            <div className="space-y-4">
                {filteredData.length > 0 ? (
                    filteredData.map(article => (
                        <div key={article.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <Button
                                onClick={() => toggleExpand(article.id)}
                                className="w-full flex justify-between items-center p-4 text-left bg-stone-100 hover:bg-stone-200 focus:outline-none"
                                aria-expanded={expandedId === article.id}
                                aria-controls={`content-${article.id}`}
                            >
                                <h2 className="text-lg font-semibold text-gray-800">{article.title}</h2>
                                <svg
                                    className={`w-6 h-6 transform transition-transform text-gray-500 ${expandedId === article.id ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Button>
                            {expandedId === article.id && (
                                <div id={`content-${article.id}`} className="p-4 bg-white">
                                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{article.content}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 px-4 border border-gray-200 rounded-lg bg-stone-100">
                        <p className="font-semibold text-gray-700">Ingen resultater fundet</p>
                        <p className="text-gray-500 mt-1">Prøv at justere din søgning.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HandbookPage;