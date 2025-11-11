import React, { useState, useRef, useEffect } from 'react';
import { AuctionLot, SerializableRegistrationFormData, SerializablePhoto } from '../types';
import { CameraIcon, SparklesIcon, SpinnerIcon, ImageIcon, CropIcon, TruckIcon, ForkliftIcon, PalletLifterIcon, LightBulbIcon, XIcon } from './icons';
import Button from './Button';
import { GoogleGenAI, Modality, Type, GenerateContentResponse, Part, InlineDataPart } from "@google/genai";
import ImageCropperModal from './ImageCropperModal';
import { fileToDataUrl, dataUrlToFile, base64ToFile, fileToBase64Part, compressImage, isInlineDataPart } from '../utils/fileUtils'; // Import from utils


interface RegistrationFormProps {
  onRegister: (lot: Omit<AuctionLot, 'id' | 'lotNumber' | 'auctionType' | 'location' | 'companyName' | 'appraiser'>) => void;
  onUpdate?: (lot: AuctionLot) => void;
  lotToEdit?: AuctionLot | null;
  onCancelEdit?: () => void;
  auctionInfo: { type: string[]; location: { street: string; postalCode: string; city: string; }; companyName: string; };
  setAuctionInfo: React.Dispatch<React.SetStateAction<{ type: string[]; location: { street: string; postalCode: string; city: string; }; companyName: string; }>>;
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
  shippingAvailable: false,
  forkliftAvailable: false,
  palletLifterAvailable: false,
  notes: '',
};

const FormattedLotNumber: React.FC<{ lotNumber: string }> = ({ lotNumber }) => {
    const match = lotNumber.match(/^(A)(\d{2})(.*)$/);
    if (!match) {
        return <span className="text-[#C00000]">{lotNumber}</span>;
    }
    return (
        <span className="text-[#C00000]">
            {match[1]}
            <span className="text-blue-600 font-bold">{match[2]}</span>
            {match[3]}
        </span>
    );
};
  
const Section: React.FC<{ title: string; children: React.ReactNode; isCollapsible?: boolean; isCollapsed?: boolean; onToggle?: () => void; }> = ({ title, children, isCollapsible, isCollapsed, onToggle }) => (
    <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
            {isCollapsible && (
                <Button type="button" onClick={onToggle} className="text-sm font-medium text-[#C00000] hover:text-red-800">
                    {isCollapsed ? 'Vis' : 'Skjul'}
                </Button>
            )}
        </div>
        {!isCollapsed && <div className="mt-4 space-y-6">{children}</div>}
    </div>
);

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, onUpdate, lotToEdit, onCancelEdit, auctionInfo, setAuctionInfo, locationDateTimeCache }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [isGeneratingMultiItemDetails, setIsGeneratingMultiItemDetails] = useState(false);
  const [isGeneratingValue, setIsGeneratingValue] = useState(false);
  const [enhancingPhotoIndex, setEnhancingPhotoIndex] = useState<number | null>(null);
  const [improvingPhotoIndex, setImprovingPhotoIndex] = useState<number | null>(null);
  const [croppingPhotoIndex, setCroppingPhotoIndex] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAuctionInfoCollapsed, setIsAuctionInfoCollapsed] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const postalCodeTimeoutRef = useRef<number | null>(null);
  const cityTimeoutRef = useRef<number | null>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  
  const isEditMode = !!lotToEdit;

  // --- Auto-save Draft Logic ---
  useEffect(() => {
    // Only auto-save for new lots, not when editing existing ones.
    if (isEditMode) {
      return;
    }

    if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(async () => {
        try {
            const serializablePhotos: SerializablePhoto[] = await Promise.all(
                formData.photos.map(async (photo) => ({
                    name: photo.name,
                    type: photo.type,
                    dataUrl: await fileToDataUrl(photo)
                }))
            );
            
            const draft: SerializableRegistrationFormData = {
                formData: { ...formData, photos: serializablePhotos },
                auctionInfo
            };

            localStorage.setItem('unsavedLotFormData', JSON.stringify(draft));
        } catch (e) {
            console.error("Failed to save draft", e);
        }
    }, 500); // Debounce save by 500ms

    return () => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
    };
  }, [formData, auctionInfo, isEditMode]);
  
  // --- Load Draft on Initial Mount ---
  useEffect(() => {
      try {
          const storedDraftJSON = localStorage.getItem('unsavedLotFormData');
          if (storedDraftJSON) {
              const storedDraft: SerializableRegistrationFormData = JSON.parse(storedDraftJSON);
              
              // Only restore if the draft contains meaningful data to avoid restoring an empty form
              const isMeaningfulDraft = 
                storedDraft.formData.title || 
                storedDraft.formData.description || 
                storedDraft.formData.photos.length > 0 || 
                storedDraft.auctionInfo.companyName ||
                (storedDraft.formData.notes && storedDraft.formData.notes.trim() !== '');

              if (isMeaningfulDraft) {
                const hydratedPhotos: File[] = storedDraft.formData.photos.map(p =>
                    dataUrlToFile(p.dataUrl, p.name, p.type)
                );
                
                const restoredFormData = { ...storedDraft.formData, photos: hydratedPhotos };
                
                setFormData(restoredFormData);
                setAuctionInfo(storedDraft.auctionInfo);
                
                // Removed alert as per user request: alert('Gendannede en ikke-gemt kladde.');
              } else {
                // Draft is empty/default, so remove it silently
                localStorage.removeItem('unsavedLotFormData');
              }
          }
      } catch (e) {
          console.error("Failed to load or parse draft from localStorage", e);
          // If parsing fails, remove the corrupt data
          localStorage.removeItem('unsavedLotFormData');
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount


  useEffect(() => {
    if (lotToEdit) {
      setIsAuctionInfoCollapsed(false); // Always expand when editing
      setFormData({
        photos: lotToEdit.photos,
        title: lotToEdit.title,
        description: lotToEdit.description,
        category: lotToEdit.category,
        condition: lotToEdit.condition,
        minimumPrice: lotToEdit.minimumPrice,
        auctionEndDate: lotToEdit.auctionEndDate,
        auctionEndTime: lotToEdit.auctionEndTime,
        shippingAvailable: lotToEdit.shippingAvailable ?? false,
        forkliftAvailable: lotToEdit.forkliftAvailable ?? false,
        palletLifterAvailable: lotToEdit.palletLifterAvailable ?? false,
        notes: lotToEdit.notes || '',
      });
      setAuctionInfo({
        type: lotToEdit.auctionType,
        location: lotToEdit.location,
        companyName: lotToEdit.companyName,
      });
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Don't reset if a draft has been loaded. The draft-loading useEffect handles this.
      // Resetting here would wipe the loaded draft.
    }
  }, [lotToEdit, setAuctionInfo]);

  useEffect(() => {
    if (isEditMode) return;
    
    // Use location-only key for date/time cache
    const dateTimeCacheKey = JSON.stringify(auctionInfo.location);
    const cachedDateTime = locationDateTimeCache[dateTimeCacheKey];
    
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

  useEffect(() => {
    if (postalCodeTimeoutRef.current) {
        clearTimeout(postalCodeTimeoutRef.current);
    }

    if (auctionInfo.location.postalCode.length === 4 && /^\d{4}$/.test(auctionInfo.location.postalCode)) {
        postalCodeTimeoutRef.current = window.setTimeout(async () => {
            try {
                const response = await fetch(`https://api.dataforsyningen.dk/postnumre/${auctionInfo.location.postalCode}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.navn && data.navn !== auctionInfo.location.city) {
                       setAuctionInfo(prev => ({ ...prev, location: { ...prev.location, city: data.navn } }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch city from postal code", error);
            }
        }, 300);
    }
    
    return () => {
        if (postalCodeTimeoutRef.current) {
            clearTimeout(postalCodeTimeoutRef.current);
        }
    }
  }, [auctionInfo.location.postalCode, auctionInfo.location.city, setAuctionInfo]);

  useEffect(() => {
    if (cityTimeoutRef.current) {
        clearTimeout(cityTimeoutRef.current);
    }

    if (auctionInfo.location.city.length > 2) {
         cityTimeoutRef.current = window.setTimeout(async () => {
            try {
                const response = await fetch(`https://api.dataforsyningen.dk/postnumre?navn=${encodeURIComponent(auctionInfo.location.city)}&struktur=flad`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0 && data[0].nr && data[0].nr !== auctionInfo.location.postalCode) {
                        setAuctionInfo(prev => ({ ...prev, location: { ...prev.location, postalCode: data[0].nr } }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch postal code from city", error);
            }
        }, 300);
    }
    
    return () => {
        if (cityTimeoutRef.current) {
            clearTimeout(cityTimeoutRef.current);
        }
    }
  }, [auctionInfo.location.city, auctionInfo.location.postalCode, setAuctionInfo]);


  const auctionTypes = ['Konkursauktion', 'Overskudsauktion', 'Flytteauktion', 'Dødsbo', 'Ophørsauktion'];
  const categories = ['Møbler', 'Maskiner', 'Værktøj', 'Elektronik', 'Antikviteter', 'Byggematerialer', 'Design & Kunst', 'Sport & Fritid'];
  const conditions = ['Ny', 'Brugt - som ny', 'Brugt - god stand', 'Brugt - slidt', 'Defekt'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAuctionInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'street' || name === 'postalCode' || name === 'city') {
        setAuctionInfo(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [name]: value,
            },
        }));
    } else {
        setAuctionInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      try {
        const files = Array.from(e.target.files);
        const compressedFilesPromises = files.map(file => {
          // Only compress files that are images
          if (file.type.startsWith('image/')) {
            return compressImage(file);
          }
          // Return non-image files as-is
          return Promise.resolve(file);
        });
        const compressedFiles = await Promise.all(compressedFilesPromises);
        setFormData(prev => ({ ...prev, photos: [...prev.photos, ...compressedFiles] }));
      } catch (error) {
        console.error("Error compressing images:", error);
        alert("Der opstod en fejl under komprimering af billeder. Prøv venligst igen.");
      } finally {
        setIsCompressing(false);
      }
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

  const handleSaveCrop = (croppedFile: File) => {
      if (croppingPhotoIndex !== null) {
        setFormData(prev => {
          const newPhotos = [...prev.photos];
          newPhotos[croppingPhotoIndex] = croppedFile;
          return { ...prev, photos: newPhotos };
        });
      }
      setCroppingPhotoIndex(null);
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
      // Clear the draft after successful submission
      localStorage.removeItem('unsavedLotFormData');
      setFormData(prev => ({
        ...initialFormData,
        // Preserve date and time from cache for the next lot
        auctionEndDate: prev.auctionEndDate,
        auctionEndTime: prev.auctionEndTime,
      }));
       if (!isEditMode) {
        setIsAuctionInfoCollapsed(true);
      }
    }
  };

  const handleGenerateDetails = async () => {
    if (formData.photos.length === 0) {
      alert("Tilføj venligst et billede først.");
      return;
    }

    setIsGeneratingDetails(true);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API-nøglen (API_KEY) mangler. Sørg for at den er konfigureret korrekt i dit hosting-miljø.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToBase64Part(formData.photos[0]);

      const textPart = {
        text: `Analysér billedet af emnet.
1. Generer en kort, præcis titel på dansk.
2. Generer en objektiv beskrivelse på dansk med fokus på emnets type, materiale og stand.
3. Vælg de mest passende kategorier (op to 3) fra denne liste: [${categories.map(c => `'${c}'`).join(', ')}].
4. Vurder emnets stand og vælg den mest passende fra denne liste: [${conditions.map(c => `'${c}'`).join(', ')}].
Svar kun med et JSON-objekt, der indeholder 'title', 'description', 'category' (som en liste af strenge) og 'condition'. Sørg for at 'title' og 'description' er på dansk. Udelad al anden tekst eller formatering.`
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
      
      const details: { title: string; description: string; category: string[]; condition: string; } = JSON.parse(response.text);
      setFormData(prev => ({ 
        ...prev, 
        title: details.title, 
        description: details.description,
        category: Array.isArray(details.category) ? details.category.filter((c: string) => categories.includes(c)) : [], // Ensure suggested categories are valid and it is an array
        condition: details.condition,
       }));

    } catch (error) {
      console.error("Error generating details:", error);
      const message = error instanceof Error ? error.message : "Kunne ikke generere detaljer. Prøv venligst igen.";
      alert(message);
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const handleGenerateMultiItemDetails = async () => {
    if (formData.photos.length === 0) {
        alert("Tilføj venligst et billede først.");
        return;
    }

    setIsGeneratingMultiItemDetails(true);
    try {
        if (!process.env.API_KEY) {
            throw new Error("API-nøglen (API_KEY) mangler. Sørg for at den er konfigureret korrekt i dit hosting-miljø.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToBase64Part(formData.photos[0]);

        const textPart = {
            text: `Analysér billedet. Identificer alle de primære, adskilte emner.
            1. Generer en overordnet, kort titel for hele lottet (samlingen af emner) på dansk.
            2. For hvert enkelt emne du identificerer, generer en kort, specifik titel og en kort beskrivelse på dansk.
            Svar kun med et JSON-objjekt. Objektet skal indeholde en 'lotTitle' (streng) og en 'items' (en liste af objekter). Hvert objekt i 'items'-listen skal have en 'itemTitle' (streng) og en 'itemDescription' (streng). Udelad al anden tekst eller formatering.`
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lotTitle: { type: Type.STRING, description: "En overordnet titel for alle emnerne i lottet." },
                        items: {
                            type: Type.ARRAY,
                            description: "En liste af de identificerede emner i billedet.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    itemTitle: { type: Type.STRING, description: "Den specifikke titel for et enkelt emne." },
                                    itemDescription: { type: Type.STRING, description: "En kort beskrivelse af det enkelte emne." },
                                },
                                required: ["itemTitle", "itemDescription"]
                            }
                        }
                    },
                    required: ["lotTitle", "items"],
                }
            }
        });

        const result: { lotTitle: string; items: { itemTitle: string; itemDescription: string }[] } = JSON.parse(response.text);
        
        const itemsAsText = result.items.map((item, index) => `${index + 1}. ${item.itemTitle}: ${item.itemDescription}`).join('\n');
        const fullDescription = itemsAsText;

        setFormData(prev => ({
            ...prev,
            title: result.lotTitle,
            description: prev.description ? `${prev.description}\n\n${fullDescription}` : fullDescription
        }));

    } catch (error) {
        console.error("Error generating multi-item details:", error);
        const message = error instanceof Error ? error.message : "Kunne ikke generere detaljer for flere varer. Prøv venligst igen.";
        alert(message);
    } finally {
        setIsGeneratingMultiItemDetails(false);
    }
  };
  
  const handleEnhancePhoto = async (index: number) => {
    setEnhancingPhotoIndex(index);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API-nøglen (API_KEY) mangler. Sørg for at den er konfigureret korrekt i dit hosting-miljø.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const originalFile = formData.photos[index];
      const imagePart = await fileToBase64Part(originalFile);

      const textPart = {
        text: "Fjern baggrunden fra billedet og erstat den med en neutral, professionel studiebaggrund. Sørg for at belysningen på objektet ser naturlig ud."
      };
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      let imageFound = false;
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (isInlineDataPart(part)) {
            // FIX: Explicitly cast `part` to `InlineDataPart` to ensure correct type narrowing.
            const inlineDataPart = part as InlineDataPart;
            const newFile = base64ToFile(
              inlineDataPart.inlineData.data,
              `enhanced_${originalFile.name}`,
              inlineDataPart.inlineData.mimeType,
            );

            setFormData(prev => {
              const newPhotos = [...prev.photos];
              newPhotos[index] = newFile;
              return { ...prev, photos: newPhotos };
            });
            imageFound = true;
            break;
          }
        }
      }

      if (!imageFound) {
        let textResponse = '';
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part && typeof part === 'object' && 'text' in part && typeof (part as any).text === 'string') {
                    textResponse = (part as any).text;
                    break;
                }
            }
        }

        if (textResponse) {
          throw new Error(
            `AI kunne ikke behandle billedet og returnerede en meddelelse: ${textResponse}`
          );
        } else {
          throw new Error('AI returnerede et uventet svar uden et billede.');
        }
      }
    } catch (error) {
      console.error("Error enhancing photo:", error);
      const message = error instanceof Error ? error.message : "Kunne ikke forbedre billedet. Prøv venligst igen.";
      alert(message);
    } finally {
      setEnhancingPhotoIndex(null);
    }
  };
  
  const handleImprovePhoto = async (index: number) => {
    setImprovingPhotoIndex(index);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API-nøglen (API_KEY) mangler.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const originalFile = formData.photos[index];
      const imagePart = await fileToBase64Part(originalFile);

      const textPart = {
        text: "Forbedr lys, farvebalance og skarphed i dette billede. Bevar den originale baggrund."
      };
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      let imageFound = false;
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (isInlineDataPart(part)) { 
            // FIX: Explicitly cast `part` to `InlineDataPart` to ensure correct type narrowing.
            const inlineDataPart = part as InlineDataPart;
            const newFile = base64ToFile(
              inlineDataPart.inlineData.data,
              `improved_${originalFile.name}`,
              inlineDataPart.inlineData.mimeType,
            );

            setFormData(prev => {
              const newPhotos = [...prev.photos];
              newPhotos[index] = newFile;
              return { ...prev, photos: newPhotos };
            });
            imageFound = true;
            break;
          }
        }
      }

      if (!imageFound) {
        let textResponse = '';
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part && typeof part === 'object' && 'text' in part && typeof (part as any).text === 'string') {
                    textResponse = (part as any).text;
                    break;
                }
            }
        }
        if (textResponse) {
          throw new Error(
            `AI kunne ikke behandle billedet og returnerede en meddelelse: ${textResponse}`
          );
        } else {
          throw new Error('AI returnerede et uventet svar uden et billede.');
        }
      }
    } catch (error) {
      console.error("Error improving photo:", error);
      const message = error instanceof Error ? error.message : "Kunne ikke forbedre billedet. Prøv venligst igen.";
      alert(message);
    } finally {
      setImprovingPhotoIndex(null);
    }
  };

  const handleGenerateValue = async () => {
    if (formData.photos.length === 0 || !formData.title) {
      alert("Tilføj venligst et billede og en titel først.");
      return;
    }

    setIsGeneratingValue(true);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API-nøglen (API_KEY) mangler. Sørg for at den er konfigureret korrekt i dit hosting-miljø.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToBase64Part(formData.photos[0]);

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
      const message = error instanceof Error ? error.message : "Kunne ikke generere værdi. Prøv venligst igen.";
      alert(message);
    } finally {
      setIsGeneratingValue(false);
    }
  };

  const anyAiProcessRunning = isGeneratingDetails || isGeneratingMultiItemDetails || isGeneratingValue;
  
  return (
    <>
    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
      <div className="border-t pt-8">
         <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? <>Rediger <FormattedLotNumber lotNumber={lotToEdit.lotNumber} /></> : 'Ny Lot'}
        </h2>
      </div>
      
      <Section 
        title="Auktionsoplysninger"
        isCollapsible={!isEditMode}
        isCollapsed={isAuctionInfoCollapsed}
        onToggle={() => setIsAuctionInfoCollapsed(prev => !prev)}
      >
          <div>
              <label className="block text-base font-medium text-gray-700">Auktionstype *</label>
                <div className="mt-2 space-y-2 border border-gray-300 p-3 rounded-lg">
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
            <label htmlFor="companyName" className="block text-base font-medium text-gray-700">Auktionsoverskrift</label>
            <input
              type="text"
              name="companyName"
              id="companyName"
              value={auctionInfo.companyName}
              onChange={handleAuctionInfoChange}
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
              placeholder="F.eks. Konkursbo efter Snedker Hansen A/S"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700">Auktionsadresse *</label>
            <div className="mt-1 space-y-2 border border-gray-300 p-3 rounded-lg">
                <input
                    type="text"
                    name="street"
                    id="street"
                    value={auctionInfo.location.street}
                    onChange={handleAuctionInfoChange}
                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                    placeholder="Vejnavn og nr."
                    required
                />
                <div className="grid grid-cols-2 gap-4">
                     <input
                        type="text"
                        name="postalCode"
                        id="postalCode"
                        value={auctionInfo.location.postalCode}
                        onChange={handleAuctionInfoChange}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                        placeholder="Postnr."
                        maxLength={4}
                        required
                    />
                    <input
                        type="text"
                        name="city"
                        id="city"
                        value={auctionInfo.location.city}
                        onChange={handleAuctionInfoChange}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                        placeholder="By"
                        required
                    />
                </div>
            </div>
          </div>
      </Section>
      
      <Section title="Lot Detaljer">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Fotos *</label>
            <div className="mt-1 p-4 bg-stone-100 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {formData.photos.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} className="relative group aspect-square">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="h-full w-full object-cover rounded-lg"
                    />
                    <div className="absolute top-0 right-0 -m-2 flex flex-col space-y-1">
                        <Button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="bg-[#C00000] text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold ring-2 ring-white hover:bg-[#A00000] transition-colors"
                          aria-label="Fjern billede"
                        >
                          &times;
                        </Button>
                    </div>

                    <div className="absolute bottom-1 right-1 flex space-x-1">
                        <Button
                          type="button"
                          onClick={() => setCroppingPhotoIndex(index)}
                          className="bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={enhancingPhotoIndex !== null || croppingPhotoIndex !== null || improvingPhotoIndex !== null || anyAiProcessRunning}
                          aria-label="Beskær billede"
                          title={enhancingPhotoIndex !== null || croppingPhotoIndex !== null || improvingPhotoIndex !== null || anyAiProcessRunning ? "Et andet værktøj er aktivt" : "Beskær billede"}
                        >
                          <CropIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleImprovePhoto(index)}
                          className="bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={enhancingPhotoIndex !== null || croppingPhotoIndex !== null || improvingPhotoIndex !== null || anyAiProcessRunning}
                          aria-label="Forbedr lys & farve med AI"
                          title={improvingPhotoIndex === index ? "Forbedrer billede..." : "Forbedr lys & farve med AI"}
                        >
                          {improvingPhotoIndex === index ? <SpinnerIcon className="w-4 h-4" /> : <LightBulbIcon className="w-4 h-4" />}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleEnhancePhoto(index)}
                          className="bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={enhancingPhotoIndex !== null || croppingPhotoIndex !== null || improvingPhotoIndex !== null || anyAiProcessRunning}
                          aria-label="Udskift baggrund med AI"
                          title={enhancingPhotoIndex === index ? "Udskifter baggrund..." : "Udskift baggrund med AI"}
                        >
                          {enhancingPhotoIndex === index ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  onClick={triggerCameraInput}
                  disabled={isCompressing}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base disabled:bg-gray-200 disabled:cursor-wait"
                >
                  {isCompressing ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <CameraIcon className="w-5 h-5 mr-2 text-gray-500" />}
                  {isCompressing ? 'Komprimerer...' : 'Tag Foto'}
                </Button>
                <Button
                  type="button"
                  onClick={triggerGalleryInput}
                  disabled={isCompressing}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base disabled:bg-gray-200 disabled:cursor-wait"
                >
                  {isCompressing ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />}
                  {isCompressing ? 'Komprimerer...' : 'Upload'}
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
            <label htmlFor="title" className="block text-base font-medium text-gray-700">Titel for Lottet *</label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
              placeholder="F.eks. Kontormøbler, Værktøjssæt, etc."
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="description" className="block text-base font-medium text-gray-700">Overordnet Beskrivelse</label>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleGenerateMultiItemDetails}
                        disabled={formData.photos.length === 0 || anyAiProcessRunning}
                        title={formData.photos.length === 0 ? "Tilføj et billede for at aktivere" : "Beskriv flere varer i billedet med AI"}
                        className="flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:focus:ring-offset-2 focus:ring-[#C00000] disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <SparklesIcon className="w-4 h-4 mr-1" />
                        {isGeneratingMultiItemDetails ? 'Beskriver...' : 'Beskriv Flere Varer'}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleGenerateDetails}
                        disabled={formData.photos.length === 0 || anyAiProcessRunning}
                        title={formData.photos.length === 0 ? "Tilføj et billede for at aktivere" : "Generer forslag til detaljer for én vare"}
                        className="flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <SparklesIcon className="w-4 h-4 mr-1" />
                        {isGeneratingDetails ? 'Genererer...' : 'Beskriv Én Vare'}
                    </Button>
                </div>
            </div>
            <textarea
              name="description"
              id="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
              placeholder="Samlet beskrivelse af lottet (valgfri)..."
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-base font-medium text-gray-700">Noter (internt brug)</label>
            <textarea
              name="notes"
              id="notes"
              rows={2}
              value={formData.notes || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
              placeholder="Interne noter om afhentning, nøgler, specielle forhold osv."
            />
          </div>
        
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700">Kategori *</label>
                  <div className="mt-2 space-y-2 border border-gray-300 p-3 rounded-lg max-h-32 overflow-y-auto">
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
                <div className="flex justify-between items-center mb-1">
                   <label htmlFor="condition" className="block text-base font-medium text-gray-700">Stand</label>
                </div>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#C00000] focus:border-[#C00000] rounded-lg"
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
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
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
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#C00000] focus:border-[#C00000] rounded-lg"
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
                  disabled={formData.photos.length === 0 || !formData.title || anyAiProcessRunning}
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#C00000] focus:border-[#C00000] text-base"
                placeholder="0"
              />
            </div>
      </Section>
      
      <Section title="Logistik & Afhentning">
        <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="shippingAvailable"
                  name="shippingAvailable"
                  type="checkbox"
                  checked={formData.shippingAvailable}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-[#C00000] focus:ring-[#C00000] border-gray-300 rounded"
                />
                <label htmlFor="shippingAvailable" className="ml-3 flex items-center text-base text-gray-700 cursor-pointer">
                  <TruckIcon className="w-8 h-8 mr-2 text-green-600" />
                  Forsendelse tilgængelig
                </label>
              </div>
               <div className="flex items-center">
                <input
                  id="forkliftAvailable"
                  name="forkliftAvailable"
                  type="checkbox"
                  checked={formData.forkliftAvailable}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-[#C00000] focus:ring-[#C00000] border-gray-300 rounded"
                />
                <label htmlFor="forkliftAvailable" className="ml-3 flex items-center text-base text-gray-700 cursor-pointer">
                  <ForkliftIcon className="w-8 h-8 mr-2 text-gray-700" />
                  Gaffeltruck til rådighed
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="palletLifterAvailable"
                  name="palletLifterAvailable"
                  type="checkbox"
                  checked={formData.palletLifterAvailable}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-[#C00000] focus:ring-[#C00000] border-gray-300 rounded"
                />
                <label htmlFor="palletLifterAvailable" className="ml-3 flex items-center text-base text-gray-700 cursor-pointer">
                  <PalletLifterIcon className="w-8 h-8 mr-2 text-green-600" />
                  Palleløfter til rådighed
                </label>
              </div>
            </div>
      </Section>
      
      <div className="pt-5">
        <div className="flex justify-end">
         {isEditMode && (
            <Button
              type="button"
              onClick={onCancelEdit}
              className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuller
            </Button>
          )}
          <Button
            type="submit"
            sound="success"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
          >
            {isEditMode ? 'Gem Ændringer' : 'Registrer Lot'}
          </Button>
        </div>
      </div>
    </form>
    {croppingPhotoIndex !== null && (
        <ImageCropperModal
            photo={formData.photos[croppingPhotoIndex]}
            onSave={handleSaveCrop}
            onCancel={() => setCroppingPhotoIndex(null)}
        />
    )}
    </>
  );
};

export default RegistrationForm;