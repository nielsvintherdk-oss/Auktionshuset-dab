import React, { useState } from 'react';
import { handbookData } from './handbookData';
import Button from './Button';

const HandbookPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredData = handbookData.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">dab Håndbog</h1>
                <p className="mt-2 text-lg text-gray-600">Søg efter instruktioner, betingelser og vejledninger.</p>
            </div>

            {/* Search Bar */}
            <div className="sticky top-0 bg-white py-4 z-10">
                <input
                    type="search"
                    placeholder="Søg i håndbogen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#C00000] focus:border-[#C00000] transition"
                />
            </div>

            {/* Articles */}
            <div className="space-y-4">
                {filteredData.length > 0 ? (
                    filteredData.map(article => (
                        <div key={article.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <Button
                                onClick={() => toggleExpand(article.id)}
                                className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none"
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
                    <div className="text-center py-8 px-4 border border-gray-200 rounded-md bg-gray-50">
                        <p className="font-semibold text-gray-700">Ingen resultater fundet</p>
                        <p className="text-gray-500 mt-1">Prøv at justere din søgning.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HandbookPage;
