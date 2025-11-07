import React, { useState, useRef, useEffect } from 'react';
import { AuctionLot } from '../types';
import { CameraIcon, SparklesIcon, SpinnerIcon, ImageIcon } from './icons';
import Button from './Button';
import { GoogleGenAI, Modality, Type } from "@google/genai";

interface RegistrationFormProps {
  onRegister: (lot: Omit<AuctionLot, 'id' | 'lotNumber' | 'auctionType' | 'location' | 'companyName' | 'appraiser'>) => void;
  onUpdate?: (lot: AuctionLot) => void;
  lotToEdit?: AuctionLot | null;
  onCancelEdit?: () => void;
  auctionInfo: { type: string[]; location: string; companyName: string; };
  setAuctionInfo: React.Dispatch<React.SetStateAction<{ type: string[]; location: string; companyName: string; }>>;
  locationDateTimeCache: Record<string, { endDate: string; endTime: string }>;
}

const getDefaultAuctionEnd = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return {
        defaultDate: `${year}-${month}-${day}`,
        defaultTime: '12:00',
    };
};

const { defaultDate, defaultTime } = getDefaultAuctionEnd();

const initialFormData: Omit<AuctionLot, 'id' | 'lotNumber' | 'auctionType' | 'location' | 'companyName' | 'appraiser'> = {
  photos: [],
  title: '',
  description: '',
  category: [],
  condition: '',
  minimumPrice: '',
  auctionEndDate: defaultDate,
  auctionEndTime: defaultTime,
};

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string; } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      if (base64Data) {
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

function base64ToFile(base64: string, filename: string, mimeType: string): File {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
}


const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, onUpdate, lotToEdit, onCancelEdit, auctionInfo, setAuctionInfo, locationDateTimeCache }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [isGeneratingValue, setIsGeneratingValue] = useState(false);
  const [enhancingPhotoIndex, setEnhancingPhotoIndex] = useState<number | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const isEditMode = !!lotToEdit;

  useEffect(() => {
    if (lotToEdit) {
      setFormData({
        photos: lotToEdit.photos,
        title: lotToEdit.title,
        description: lotToEdit.description,
        category: lotToEdit.category,
        condition: lotToEdit.condition,
        minimumPrice: lotToEdit.minimumPrice,
        auctionEndDate: lotToEdit.auctionEndDate,
        auctionEndTime: lotToEdit.auctionEndTime,
      });
      setAuctionInfo({
        type: lotToEdit.auctionType,
        location: lotToEdit.location,
        companyName: lotToEdit.companyName,
      });
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setFormData(initialFormData);
    }
  }, [lotToEdit, setAuctionInfo]);

  useEffect(() => {
    if (isEditMode || !auctionInfo.location) return;

    const cachedDateTime = locationDateTimeCache[auctionInfo.location];
    if (cachedDateTime) {
        setFormData(prev => ({
            ...prev,
            auctionEndDate: cachedDateTime.endDate,
            auctionEndTime: cachedDateTime.endTime,
        }));
    } else {
        // When switching to a new location with no cache, set default date/time
        const { defaultDate, defaultTime } = getDefaultAuctionEnd();
        setFormData(prev => ({
            ...prev,
            auctionEndDate: defaultDate,
            auctionEndTime: defaultTime,
        }));
    }
  }, [auctionInfo.location, locationDateTimeCache, isEditMode]);


  const auctionTypes = ['Konkursauktion', 'Overskudsauktion', 'Flytteauktion', 'Dødsbo', 'Ophørsauktion'];
  const categories = ['Møbler', 'Maskiner', 'Værktøj', 'Elektronik', 'Antikviteter', 'Byggematerialer', 'Design & Kunst', 'Sport & Fritid'];
  const conditions = ['Ny', 'Brugt - som ny', 'Brugt - god stand', 'Brugt - slidt', 'Defekt'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAuctionInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuctionInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAuctionTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setAuctionInfo(prev => {
      const currentTypes = prev.type;
      if (checked) {
        return { ...prev, type: [...currentTypes, value] };
      } else {
        return { ...prev, type: currentTypes.filter(t => t !== value) };
      }
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentCategories = prev.category;
      if (checked) {
        return { ...prev, category: [...currentCategories, value] };
      } else {
        return { ...prev, category: currentCategories.filter(cat => cat !== value) };
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...Array.from(e.target.files!)] }));
    }
  };

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const triggerGalleryInput = () => {
    galleryInputRef.current?.click();
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (auctionInfo.type.length === 0) {
      alert("Vælg venligst mindst én auktionstype.");
      return;
    }
    if (formData.category.length === 0) {
      alert("Vælg venligst mindst én kategori.");
      return;
    }
    
    if (isEditMode && onUpdate && lotToEdit) {
      const updatedLot: AuctionLot = {
        ...lotToEdit, // a lot of existing data like id and lotNumber
        ...formData, // all the form field data
        auctionType: auctionInfo.type,
        location: auctionInfo.location,
        companyName: auctionInfo.companyName,
      };
      onUpdate(updatedLot);
    } else {
      onRegister(formData);
      alert('Lot er blevet registreret!');
      setFormData(prev => ({
        ...initialFormData,
        // Preserve date and time from cache for the next lot
        auctionEndDate: prev.auctionEndDate,
        auctionEndTime: prev.auctionEndTime,
      }));
    }
  };

  const handleGenerateDetails = async () => {
    if (formData.photos.length === 0) {
      alert("Tilføj venligst et billede først.");
      return;
    }

    setIsGeneratingDetails(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToGenerativePart(formData.photos[0]);

      const textPart = {
        text: `Analysér billedet af emnet.
1. Generer en kort, præcis titel.
2. Generer en objektiv beskrivelse med fokus på emnets type, materiale og stand.
3. Vælg de mest passende kategorier (op til 3) fra denne liste: [${categories.map(c => `'${c}'`).join(', ')}].
4. Vurder emnets stand og vælg den mest passende fra denne liste: [${conditions.map(c => `'${c}'`).join(', ')}].
Svar kun med et JSON-objekt, der indeholder 'title', 'description', 'category' (som en liste af strenge) og 'condition'. Udelad al anden tekst eller formatering.`
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Kort, præcis titel for emnet." },
              description: { type: Type.STRING, description: "Objektiv beskrivelse af emnet, med fokus på type, materiale og stand." },
              category: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: `Foreslåede kategorier fra listen: ${categories.join(', ')}` 
              },
              condition: { type: Type.STRING, description: `Foreslået stand fra listen: ${conditions.join(', ')}` },
            },
            required: ["title", "description", "category", "condition"],
          }
        }
      });
      
      const details = JSON.parse(response.text);
      setFormData(prev => ({ 
        ...prev, 
        title: details.title, 
        description: details.description,
        category: details.category.filter((c: string) => categories.includes(c)), // Ensure suggested categories are valid
        condition: details.condition,
       }));

    } catch (error) {
      console.error("Error generating details:", error);
      alert("Kunne ikke generere detaljer. Prøv venligst igen.");
    } finally {
      setIsGeneratingDetails(false);
    }
  };
  
  const handleEnhancePhoto = async (index: number) => {
    setEnhancingPhotoIndex(index);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const originalFile = formData.photos[index];
      const imagePart = await fileToGenerativePart(originalFile);

      const textPart = {
        text: "Fjern baggrunden fra billedet og erstat den med en neutral, professionel studiebaggrund. Sørg for at belysningen på objektet ser naturlig ud."
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const newFile = base64ToFile(base64ImageBytes, `enhanced_${originalFile.name}`, originalFile.type);
            
            setFormData(prev => {
              const newPhotos = [...prev.photos];
              newPhotos[index] = newFile;
              return { ...prev, photos: newPhotos };
            });
          }
        }
      }

    } catch (error) {
      console.error("Error enhancing photo:", error);
      alert("Kunne ikke forbedre billedet. Prøv venligst igen.");
    } finally {
      setEnhancingPhotoIndex(null);
    }
  };
  
  const handleGenerateValue = async () => {
    if (formData.photos.length === 0 || !formData.title) {
      alert("Tilføj venligst et billede og en titel først.");
      return;
    }

    setIsGeneratingValue(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToGenerativePart(formData.photos[0]);

      const textPart = {
        text: `Baseret på billedet og informationen, estimer en realistisk salgsværdi i danske kroner (DKK). Overvej faktorer som stand, alder og materiale. Svar kun med tallet, uden valutasymbol eller tekst.
        Titel: ${formData.title}
        Beskrivelse: ${formData.description}
        Stand: ${formData.condition}`
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });
      
      const valueText = response.text.trim().replace(/\D/g, ''); // Remove non-digit characters
      const value = parseInt(valueText, 10);

      if (!isNaN(value)) {
        setFormData(prev => ({ ...prev, minimumPrice: value }));
      } else {
        throw new Error("AI returned a non-numeric value.");
      }

    } catch (error) {
      console.error("Error generating value:", error);
      alert("Kunne ikke generere værdi. Prøv venligst igen.");
    } finally {
      setIsGeneratingValue(false);
    }
  };

  return (
    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
      <div className="border-t pt-8">
         <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? `Rediger Lot #${lotToEdit.lotNumber}` : 'Ny Lot'}
        </h2>
        {!isEditMode && <p className="text-sm text-gray-500">Start med at vælge auktionstype og adresse. Disse gemmes til næste lot.</p>}
      </div>

      <div>
          <label className="block text-base font-medium text-gray-700">Auktionstype *</label>
            <div className="mt-2 space-y-2 border border-gray-300 p-3 rounded-md">
              {auctionTypes.map(type => (
                <div key={type} className="flex items-center">
                  <input
                    id={`type-${type}`}
                    name="auctionType"
                    type="checkbox"
                    value={type}
                    checked={auctionInfo.type.includes(type)}
                    onChange={handleAuctionTypeChange}
                    className="h-4 w-4 text-[#C00000] focus:ring-[#C00000] border-gray-300 rounded"
                  />
                  <label htmlFor={`type-${type}`} className="ml-3 text-base text-gray-700">
                    {type}
                  </label>
                </div>
              ))}
            </div>
      </div>
      
      <div>
        <label htmlFor="companyName" className="block text-base font-medium text-gray-700">Firma</label>
        <input
          type="text"
          name="companyName"
          id="companyName"
          value={auctionInfo.companyName}
          onChange={handleAuctionInfoChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
          placeholder="Evt. firmanavn..."
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-base font-medium text-gray-700">Auktions adresse *</label>
        <input
          type="text"
          name="location"
          id="location"
          value={auctionInfo.location}
          onChange={handleAuctionInfoChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
          placeholder="Auktionens adresse..."
          required
        />
      </div>
      
      <div>
        <label className="block text-base font-medium text-gray-700 mb-1">Tilføj Fotos</label>
        <div className="mt-1 p-4 bg-[#C00000] rounded-md">
          <div className="flex flex-wrap gap-4 mb-4">
            {formData.photos.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="h-24 w-24 object-cover rounded-md"
                />
                <Button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-[#C00000] text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold ring-2 ring-white hover:bg-[#A00000] transition-colors"
                  aria-label="Fjern billede"
                >
                  &times;
                </Button>
                 <Button
                  type="button"
                  onClick={() => handleEnhancePhoto(index)}
                  className="absolute bottom-1 right-1 bg-[#C00000] text-white p-1.5 rounded-full hover:bg-[#A00000] transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                  disabled={enhancingPhotoIndex !== null}
                  aria-label="Forbedr billede med AI"
                  title={enhancingPhotoIndex !== null ? "En billedforbedring er i gang..." : "Forbedr billede med AI"}
                >
                  {enhancingPhotoIndex === index ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              onClick={triggerCameraInput}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base"
            >
              <CameraIcon className="w-5 h-5 mr-2 text-gray-500" />
              Tag Foto
            </Button>
            <Button
              type="button"
              onClick={triggerGalleryInput}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base"
            >
              <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
              Upload
            </Button>
          </div>
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            capture="environment"
            multiple
          />
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            multiple
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="title" className="block text-base font-medium text-gray-700">Titel *</label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleInputChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
          placeholder="F.eks. Møbel, maskine, værktøj..."
          required
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="description" className="block text-base font-medium text-gray-700">Beskrivelse</label>
          <Button
            type="button"
            onClick={handleGenerateDetails}
            disabled={formData.photos.length === 0 || isGeneratingDetails}
            title={formData.photos.length === 0 ? "Tilføj et billede for at aktivere" : "Generer forslag til detaljer"}
            className="flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-4 h-4 mr-1" />
            {isGeneratingDetails ? 'Genererer...' : 'Generer Detaljer med AI'}
          </Button>
        </div>
        <textarea
          name="description"
          id="description"
          rows={4}
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
          placeholder="Detaljeret beskrivelse af emnet..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-base font-medium text-gray-700">Kategori *</label>
            <div className="mt-2 space-y-2 border border-gray-300 p-3 rounded-md max-h-32 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat} className="flex items-center">
                  <input
                    id={`cat-${cat}`}
                    name="category"
                    type="checkbox"
                    value={cat}
                    checked={formData.category.includes(cat)}
                    onChange={handleCategoryChange}
                    className="h-4 w-4 text-[#C00000] focus:ring-[#C00000] border-gray-300 rounded"
                  />
                  <label htmlFor={`cat-${cat}`} className="ml-3 text-base text-gray-700">
                    {cat}
                  </label>
                </div>
              ))}
            </div>
        </div>
        <div>
          <label htmlFor="condition" className="block text-base font-medium text-gray-700">Stand</label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#C00000] focus:border-[#C00000] rounded-md"
          >
            <option value="">Vælg stand</option>
            {conditions.map(con => <option key={con} value={con}>{con}</option>)}
          </select>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="auctionEndDate" className="block text-base font-medium text-gray-700">Auktion slutter (dato) *</label>
          <input
            type="date"
            name="auctionEndDate"
            id="auctionEndDate"
            value={formData.auctionEndDate}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
            required
          />
        </div>
        <div>
          <label htmlFor="auctionEndTime" className="block text-base font-medium text-gray-700">Auktion slutter (kl.) *</label>
          <select
            id="auctionEndTime"
            name="auctionEndTime"
            value={formData.auctionEndTime}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#C00000] focus:border-[#C00000] rounded-md"
            required
          >
            <option value="">Vælg tidspunkt</option>
            {Array.from({ length: 24 }, (_, i) => {
              const hour = i.toString().padStart(2, '0');
              return `${hour}:00`;
            }).map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="minimumPrice" className="block text-base font-medium text-gray-700">Mindstepris (kr.)</label>
           <Button
            type="button"
            onClick={handleGenerateValue}
            disabled={formData.photos.length === 0 || !formData.title || isGeneratingValue}
            title={formData.photos.length === 0 || !formData.title ? "Tilføj et billede og en titel for at aktivere" : "Foreslå en estimeret værdi"}
            className="flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-4 h-4 mr-1" />
            {isGeneratingValue ? 'Genererer...' : 'AI estimeret værdi'}
          </Button>
        </div>
        <input
          type="number"
          name="minimumPrice"
          id="minimumPrice"
          value={formData.minimumPrice}
          onChange={handleInputChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
          placeholder="0"
        />
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
         {isEditMode && (
            <Button
              type="button"
              onClick={onCancelEdit}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuller
            </Button>
          )}
          <Button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
          >
            {isEditMode ? 'Gem Ændringer' : 'Registrer Lot'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default RegistrationForm;