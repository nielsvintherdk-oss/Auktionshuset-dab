import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import Button from './Button';
import { CameraIcon, ImageIcon, SpinnerIcon, XIcon, HashtagIcon, CubeTransparentIcon, ScaleIcon, TagIcon } from './icons';
import { fileToBase64Part, compressImage } from '../utils/fileUtils'; // Import from utils

type AiTool = 'count' | 'volume' | 'weight' | 'value';

interface AiToolInfo {
    key: AiTool;
    label: string;
    prompt: string;
    icon: React.FC<{className?: string}>;
    resultPrefix: string;
}

const AI_TOOLS: AiToolInfo[] = [
    {
        key: 'count',
        label: 'Tæl Antal',
        prompt: 'Baseret på billedet, tæl antallet af de primære, adskilte emner. Svar kort og præcist. Hvis du ikke kan give et præcist tal, giv et fornuftigt estimat med "Ca. " foran.',
        icon: HashtagIcon,
        resultPrefix: 'Antal',
    },
    {
        key: 'volume',
        label: 'Vurder Volumen',
        prompt: 'Baseret på billedet, estimer den samlede volumen af emne(t/erne) i kubikmeter (m³). Brug eventuelle genkendelige objekter i billedet som skala. Svar kun i formatet "Ca. X m³".',
        icon: CubeTransparentIcon,
        resultPrefix: 'Volumen',
    },
    {
        key: 'weight',
        label: 'Vurder Vægt',
        prompt: 'Baseret på billedet, estimer den samlede vægt af emne(t/erne) i kilogram (kg). Overvej de sandsynlige materialer. Brug eventuelle genkendelige objekter i billedet som skala. Svar kun i formatet "Ca. X kg".',
        icon: ScaleIcon,
        resultPrefix: 'Vægt',
    },
    {
        key: 'value',
        label: 'Vurder Værdi',
        prompt: 'Baseret på billedet, estimer en realistisk salgsværdi på auktion for emne(t/erne) i Danske Kroner (DKK). Overvej faktorer som stand, alder og materiale. Svar kun i formatet "Estimeret værdi: X DKK".',
        icon: TagIcon,
        resultPrefix: 'Værdi',
    },
];

const AiToolsPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processingTool, setProcessingTool] = useState<AiTool | null>(null);
    const [results, setResults] = useState<Partial<Record<AiTool, string>>>({});
    const [error, setError] = useState<string | null>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const isProcessing = processingTool !== null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setError(null);
            setResults({});
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Vælg venligst en billedfil.');
                setSelectedFile(null);
                setPreviewUrl(null);
                return;
            }
            // Clear previous preview URL if any
            if (previewUrl) URL.revokeObjectURL(previewUrl);

            try {
                const compressedFile = await compressImage(file);
                setSelectedFile(compressedFile);
                setPreviewUrl(URL.createObjectURL(compressedFile));
            } catch (err) {
                console.error("Error compressing image:", err);
                setError("Kunne ikke komprimere billedet.");
                setSelectedFile(null);
                setPreviewUrl(null);
            }
        }
    };

    const triggerCameraInput = () => {
        cameraInputRef.current?.click();
    };

    const triggerGalleryInput = () => {
        galleryInputRef.current?.click();
    };

    const handleClearImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        setResults({});
        setError(null);
        setProcessingTool(null);
    };

    const runAiTool = useCallback(async (tool: AiToolInfo) => {
        if (!selectedFile) {
            setError('Vælg venligst et billede først.');
            return;
        }
        setProcessingTool(tool.key);
        setError(null);
        try {
            if (!process.env.API_KEY) {
                throw new Error("API-nøglen (API_KEY) mangler. Sørg for at den er konfigureret korrekt i dit hosting-miljø.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = await fileToBase64Part(selectedFile);

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: tool.prompt }] },
            });
            
            setResults(prev => ({ ...prev, [tool.key]: response.text.trim() }));

        } catch (err) {
            console.error(`Error running AI tool (${tool.label}):`, err);
            const message = err instanceof Error ? err.message : "Der opstod en fejl.";
            setError(`Kunne ikke køre værktøjet "${tool.label}": ${message}`);
        } finally {
            setProcessingTool(null);
        }
    }, [selectedFile]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">AI Redskaber</h1>
                <p className="mt-2 text-lg text-gray-600">Brug AI til at analysere billeder og få hurtige vurderinger.</p>
            </div>

            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Upload eller Tag Billede</h3>
                <div className="space-y-4">
                    {previewUrl ? (
                        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-2">
                            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                            <Button
                                onClick={handleClearImage}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-black/80 transition-colors"
                                aria-label="Fjern billede"
                            >
                                <XIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                                type="button"
                                onClick={triggerCameraInput}
                                disabled={isProcessing}
                                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base disabled:bg-gray-200 disabled:cursor-not-allowed"
                            >
                                <CameraIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Tag Foto
                            </Button>
                            <Button
                                type="button"
                                onClick={triggerGalleryInput}
                                disabled={isProcessing}
                                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base disabled:bg-gray-200 disabled:cursor-not-allowed"
                            >
                                <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Upload Billede
                            </Button>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                    />
                    <input
                        type="file"
                        ref={galleryInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
            </div>

            {selectedFile && (
                <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Vælg AI Værktøj</h3>
                    {error && (
                        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            <p className="font-medium">Fejl: {error}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {AI_TOOLS.map(tool => (
                            <Button
                                key={tool.key}
                                onClick={() => runAiTool(tool)}
                                disabled={isProcessing}
                                className={`flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm transition-all duration-200 ${
                                    isProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                    'bg-stone-50 hover:bg-gray-100 text-gray-700 hover:border-[#C00000]/50'
                                }`}
                            >
                                {processingTool === tool.key ? (
                                    <SpinnerIcon className="w-8 h-8 text-[#C00000] animate-spin mb-2" />
                                ) : (
                                    <tool.icon className="w-8 h-8 text-[#C00000] mb-2" />
                                )}
                                <span className="font-semibold text-base">{tool.label}</span>
                                {results[tool.key] && (
                                    <p className="mt-2 text-sm text-gray-600 font-bold text-center">
                                        {tool.resultPrefix}: <span className="text-gray-900">{results[tool.key]}</span>
                                    </p>
                                )}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            
            {!selectedFile && (
                 <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-white animate-fade-in">
                    <p className="font-semibold text-gray-700">Ingen billede valgt.</p>
                    <p className="text-gray-500 mt-1">Vælg et billede for at aktivere AI-værktøjerne.</p>
                </div>
            )}
        </div>
    );
};

export default AiToolsPage;