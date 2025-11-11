import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Nav, { ActiveTab } from './components/Nav';
import RegistrationForm from './components/RegistrationForm';
import StatusBar from './components/StatusBar';
import LotList from './components/ItemList';
import TasksPage from './components/TasksPage';
import { AuctionLot, Task } from './types';
import LoginScreen from './components/LoginScreen';
import LotDetailModal from './components/LotDetailModal';
import HandbookPage from './components/HandbookPage';
import PinScreen from './components/PinScreen';
import Button from './components/Button';
import { INITIAL_APPRAISERS, Appraiser } from './components/constants';
import ContactsPage from './components/ContactsPage';
import OverviewPage from './components/OverviewPage';
import AiToolsPage from './components/AiToolsPage';
import SettingsPage from './components/SettingsPage';
import { fileToDataUrl, dataUrlToFile } from './utils/fileUtils'; // Import from utils

// --- Type Definitions for Persistence ---
interface SerializablePhoto {
  name: string;
  type: string;
  dataUrl: string;
}

interface SerializableAuctionLot extends Omit<AuctionLot, 'photos'> {
  photos: SerializablePhoto[];
}

const STORAGE_QUOTA = 5 * 1024 * 1024; // 5 MB
const STARTING_CATALOG_NUMBER = 7800;

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lots');
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [lotToEdit, setLotToEdit] = useState<AuctionLot | null>(null);
  const [selectedLot, setSelectedLot] = useState<AuctionLot | null>(null);
  const [auctionInfo, setAuctionInfo] = useState<{ type: string[]; location: { street: string; postalCode: string; city: string; }; companyName: string }>({ type: [], location: { street: '', postalCode: '', city: '' }, companyName: '' });
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [locationDateTimeCache, setLocationDateTimeCache] = useState<Record<string, { endDate: string; endTime: string }>>({});
  const [locationToCatalogIdMap, setLocationToCatalogIdMap] = useState<Record<string, string>>({});
  const [nextCatalogNumbers, setNextCatalogNumbers] = useState<Record<string, number>>({});
  const [catalogFilter, setCatalogFilter] = useState<string | null>(null);
  const [showRegistrationInCatalogView, setShowRegistrationInCatalogView] = useState(false);
  
  const [loginStep, setLoginStep] = useState<'user_select' | 'pin_entry'>('user_select');
  const [userForPin, setUserForPin] = useState<string>('');
  
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [storageUsage, setStorageUsage] = useState(0);
  
  const [isMuted, setIsMuted] = useState(() => {
    try {
        return localStorage.getItem('isMuted') === 'true';
    } catch {
        return false;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem('isMuted', JSON.stringify(isMuted));
    } catch (e) {
        console.error("Could not save mute state to localStorage", e);
    }
  }, [isMuted]);

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      const userIsValid = INITIAL_APPRAISERS.some(appraiser => appraiser.name === loggedInUser);
      if (userIsValid) {
        setCurrentUser(loggedInUser);
      } else {
        console.warn(`Stored user "${loggedInUser}" is invalid. Forcing logout.`);
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setUserForPin('');
        setLoginStep('user_select');
      }
    }
  }, []);

  // Load lots from localStorage on initial mount
  useEffect(() => {
    try {
      const storedLotsJSON = localStorage.getItem('auctionLots');
      if (storedLotsJSON) {
        setStorageUsage(storedLotsJSON.length * 2);

        const storedLots: SerializableAuctionLot[] = JSON.parse(storedLotsJSON);
        const hydratedLots: AuctionLot[] = storedLots.map(lot => ({
          ...lot,
          photos: lot.photos.map(p => dataUrlToFile(p.dataUrl, p.name, p.type))
        }));
        setLots(hydratedLots);

        // --- Rebuild Catalog Numbering System ---
        const storedCountersJSON = localStorage.getItem('nextCatalogNumbers');
        let counters: Record<string, number> = storedCountersJSON ? JSON.parse(storedCountersJSON) : {};
        
        const newLocationToCatalogIdMap: Record<string, string> = {}; // Maps locationKey to full catalog ID like 'A017800'
        const maxNumbersFound: Record<string, number> = {}; // Maps username to the max number found

        hydratedLots.forEach(lot => {
            const appraiserName = lot.appraiser;
            const locationKey = `${appraiserName}::${JSON.stringify(lot.location)}`;
            const user = INITIAL_APPRAISERS.find(a => a.name === appraiserName);
            
            let num: number | null = null;
            let fullCatalogId: string | null = null;
            
            const catalogPart = lot.lotNumber.split(' L')[0];

            // Try parsing new format first (e.g., A017800)
            if (user) {
                const newFormatRegex = new RegExp(`^A${user.prefix}(\\d{4,})`);
                const newMatch = catalogPart.match(newFormatRegex);
                if (newMatch) {
                    num = parseInt(newMatch[1], 10);
                    fullCatalogId = catalogPart;
                }
            }
            
            // If not new format, try parsing old format (e.g., ANV7800)
            if (num === null) {
                const oldFormatRegex = /^A[A-ZÆØÅ]+(\d{4,})/;
                const oldMatch = catalogPart.match(oldFormatRegex);
                if (oldMatch) {
                    num = parseInt(oldMatch[1], 10);
                    fullCatalogId = catalogPart;
                }
            }
            
            if (num !== null && appraiserName) {
                if (fullCatalogId && !newLocationToCatalogIdMap[locationKey]) {
                    newLocationToCatalogIdMap[locationKey] = fullCatalogId;
                }
                if (!maxNumbersFound[appraiserName] || num > maxNumbersFound[appraiserName]) {
                    maxNumbersFound[appraiserName] = num;
                }
            }
        });
        
        // The highest number found in lots is the source of truth, add 1 for the next number.
        for (const userName in maxNumbersFound) {
            const nextNum = maxNumbersFound[userName] + 1;
            counters[userName] = Math.max(counters[userName] || 0, nextNum);
        }

        // Ensure all known appraisers have a counter and it's at least the starting number
        INITIAL_APPRAISERS.forEach(appraiser => {
          if (!counters[appraiser.name] || counters[appraiser.name] < STARTING_CATALOG_NUMBER) {
            counters[appraiser.name] = STARTING_CATALOG_NUMBER;
          }
        });

        setLocationToCatalogIdMap(newLocationToCatalogIdMap);
        setNextCatalogNumbers(counters);
      }
    } catch (e) {
      console.error("Failed to load or parse data from localStorage", e);
    }
  }, []);

  // Save lots to localStorage whenever they change
  useEffect(() => {
    const saveLots = async () => {
      try {
          const serializableLots: SerializableAuctionLot[] = await Promise.all(
              lots.map(async (lot) => {
                  const serializablePhotos: SerializablePhoto[] = await Promise.all(
                      lot.photos.map(async (photo) => ({
                          name: photo.name,
                          type: photo.type,
                          dataUrl: await fileToDataUrl(photo)
                      }))
                  );
                  return { ...lot, photos: serializablePhotos };
              })
          );
          const serializableLotsJSON = JSON.stringify(serializableLots);
          localStorage.setItem('auctionLots', serializableLotsJSON);
          setStorageUsage(serializableLotsJSON.length * 2);
      } catch (e) {
          console.error("Failed to save lots to localStorage", e);
      }
    };
    
    const hasBeenInitialized = lots.length > 0 || localStorage.getItem('auctionLots') !== null;
    if (hasBeenInitialized) {
        saveLots();
    }
  }, [lots]);

  // Save the catalog number counters whenever they change
  useEffect(() => {
    try {
        if (Object.keys(nextCatalogNumbers).length > 0) {
            localStorage.setItem('nextCatalogNumbers', JSON.stringify(nextCatalogNumbers));
        }
    } catch (e) {
        console.error("Failed to save catalog number counters", e);
    }
  }, [nextCatalogNumbers]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setInstallPromptEvent(e);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallPrompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  useEffect(() => {
    try {
      const storedCompletedTasks = localStorage.getItem('completedTasks');
      if (storedCompletedTasks) {
        setCompletedTasks(JSON.parse(storedCompletedTasks));
      }
    } catch (e) {
      console.error("Failed to parse completed tasks from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (completedTasks.length > 0 || localStorage.getItem('completedTasks')) {
      localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }
  }, [completedTasks]);

  useEffect(() => {
    // Clear the catalog filter if the user navigates away from the lots tab.
    if (activeTab !== 'lots') {
      setCatalogFilter(null);
    }
  }, [activeTab]);

  const handleInstallClick = () => {
    if (!installPromptEvent) {
      alert('Installationsprompten er ikke tilgængelig. Prøv at installere manuelt via browserens menu (Føj til hjemmeskrm).');
      return;
    }
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setInstallPromptEvent(null);
    });
  };

  const allUserLots = lots.filter(lot => lot.appraiser === currentUser);
  let displayedLots = allUserLots;
  if (catalogFilter) {
    displayedLots = allUserLots.filter(lot => lot.lotNumber.startsWith(`${catalogFilter} `));
  }

  const filteredTasks = tasks.filter(task => task.appraiser === currentUser);
  const filteredCompletedTasks = completedTasks.filter(task => task.appraiser === currentUser);

  const stats = {
    lots: allUserLots.length,
    aktiveOpgaver: filteredTasks.length,
    faerdige: filteredCompletedTasks.length,
  };

  const handleRegisterLot = (lotDetails: Omit<AuctionLot, 'id' | 'lotNumber' | 'auctionType' | 'location' | 'companyName' | 'appraiser'>) => {
    if (!currentUser) {
      alert("Fejl: Ingen bruger er logget ind.");
      return;
    }

    const user = INITIAL_APPRAISERS.find(a => a.name === currentUser);
    if (!user) {
        alert("Fejl: Kunne ikke finde brugeroplysninger med prefix. Kontakt support.");
        return;
    }
    const userPrefix = user.prefix;
    
    const locationKey = `${currentUser}::${JSON.stringify(auctionInfo.location)}`;
    let catalogId: string;

    if (locationToCatalogIdMap[locationKey]) {
        catalogId = locationToCatalogIdMap[locationKey];
    } else {
        const number = nextCatalogNumbers[currentUser] || STARTING_CATALOG_NUMBER;
        catalogId = `A${userPrefix}${number}`;
        setLocationToCatalogIdMap(prev => ({ ...prev, [locationKey]: catalogId }));
        setNextCatalogNumbers(prev => ({ ...prev, [currentUser]: number + 1 }));
    }
    
    const lotsForThisCatalog = lots.filter(lot => lot.lotNumber.startsWith(`${catalogId} `));
    const lotLNumbers = lotsForThisCatalog.map(lot => {
        const match = lot.lotNumber.match(/L(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    });

    const newLNumber = (lotLNumbers.length > 0 ? Math.max(...lotLNumbers) : 0) + 1;
    const newLotNumberString = `${catalogId} L${newLNumber}`;

    const newLot: AuctionLot = {
      ...lotDetails,
      auctionType: auctionInfo.type,
      location: auctionInfo.location,
      companyName: auctionInfo.companyName,
      appraiser: currentUser,
      id: `${new Date().toISOString()}-${Math.random()}`,
      lotNumber: newLotNumberString,
    };
    setLots(prev => [newLot, ...prev]);

    // Use a location-only key for caching date/time, as this should be consistent for a location regardless of user
    const dateTimeCacheKey = JSON.stringify(auctionInfo.location);
    setLocationDateTimeCache(prev => ({
      ...prev,
      [dateTimeCacheKey]: {
        endDate: newLot.auctionEndDate,
        endTime: newLot.auctionEndTime
      }
    }));
    if (catalogFilter) {
      setShowRegistrationInCatalogView(false);
    }
  };

  const handleUpdateLot = (updatedLot: AuctionLot) => {
    setLots(prevLots => prevLots.map(lot => (lot.id === updatedLot.id ? updatedLot : lot)));
    setLotToEdit(null);
    alert('Lot er blevet opdateret!');
    if (catalogFilter) {
      setShowRegistrationInCatalogView(false);
    }
  };

  const handleDeleteLot = (lotId: string) => {
    if (window.confirm('Er du sikker på, at du vil slette dette lot? Handlingen kan ikke fortrydes.')) {
      setLots(prevLots => prevLots.filter(lot => lot.id !== lotId));
      setSelectedLot(null);
    }
  };
  
  const handleCopyLot = (lotId: string) => {
    const sourceLot = lots.find(l => l.id === lotId);
    if (!sourceLot || !currentUser) {
      alert("Fejl: Kunne ikke kopiere lot.");
      return;
    }

    const catalogIdMatch = sourceLot.lotNumber.match(/^(A.*?)\sL\d+$/);
    if (!catalogIdMatch) {
        alert("Fejl: Kunne ikke bestemme katalog-ID for kopiering.");
        return;
    }
    const catalogId = catalogIdMatch[1];
    
    const lotsForThisCatalog = lots.filter(lot => lot.lotNumber.startsWith(`${catalogId} `));
    const lotLNumbers = lotsForThisCatalog.map(lot => {
        const match = lot.lotNumber.match(/L(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    });
    const newLNumber = (lotLNumbers.length > 0 ? Math.max(...lotLNumbers) : 0) + 1;
    const newLotNumberString = `${catalogId} L${newLNumber}`;

    const newLot: AuctionLot = {
      ...sourceLot,
      id: `${new Date().toISOString()}-${Math.random()}`,
      lotNumber: newLotNumberString,
    };

    setLots(prev => [newLot, ...prev]);
    alert('Lot er blevet kopieret!');
  };

  const handleCancelEdit = () => {
    setLotToEdit(null);
    if (catalogFilter) {
      setShowRegistrationInCatalogView(false);
    }
  };

  const handleStartEdit = (lot: AuctionLot) => {
    setSelectedLot(null);
    setLotToEdit(lot);
  };

  const handleRegisterTask = (taskDetails: Omit<Task, 'id' | 'appraiser'>) => {
    if (!currentUser) {
        alert("Fejl: Ingen bruger er logget ind.");
        return;
    }
    const newTask: Task = {
      ...taskDetails,
      appraiser: currentUser,
      id: new Date().toISOString(),
    };
    setTasks(prev => 
      [...prev, newTask].sort((a, b) => 
        new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
      )
    );
  };

  const handleCompleteTask = (taskId: string) => {
    const taskToComplete = tasks.find(t => t.id === taskId);
    if (taskToComplete) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setCompletedTasks(prev => 
        [...prev, taskToComplete].sort((a, b) => 
          new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()
        )
      );
    }
  };
  
  const handleUserSelect = (name: string) => {
    setUserForPin(name);
    setLoginStep('pin_entry');
  };

  const handlePinSuccess = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem('currentUser', name);
  };
  
  const handlePinCancel = () => {
    setUserForPin('');
    setLoginStep('user_select');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    // FIX: Clear unsaved form draft on logout to prevent data leakage between user sessions.
    localStorage.removeItem('unsavedLotFormData');
    setCurrentUser(null);
    setUserForPin('');
    setLoginStep('user_select');
    setActiveTab('lots');
    setLotToEdit(null);
    setSelectedLot(null);
    setAuctionInfo({ type: [], location: { street: '', postalCode: '', city: '' }, companyName: '' });
  };

  const handleSelectCatalog = (catalogId: string) => {
    setCatalogFilter(catalogId);
    setActiveTab('lots');
    setShowRegistrationInCatalogView(false);
  };

  if (!currentUser) {
    if (loginStep === 'user_select') {
      return <LoginScreen appraisers={INITIAL_APPRAISERS} onUserSelect={handleUserSelect} />;
    }
    if (loginStep === 'pin_entry') {
      return <PinScreen userName={userForPin} onSuccess={handlePinSuccess} onCancel={handlePinCancel} appraisers={INITIAL_APPRAISERS} />;
    }
    return <LoginScreen appraisers={INITIAL_APPRAISERS} onUserSelect={handleUserSelect} />;
  }

  return (
    <div className="bg-[#D3B69F] min-h-screen flex flex-col font-sans relative">
      <Header 
        onInstallClick={handleInstallClick} 
        showInstallButton={!!installPromptEvent}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-stone-50 p-6 rounded-xl shadow-md">
          {activeTab === 'lots' && (
            <div className="space-y-8">
              <LotList 
                lots={displayedLots} 
                onLotSelect={setSelectedLot} 
                onDeleteLot={handleDeleteLot}
                onCopyLot={handleCopyLot}
                currentUser={currentUser}
                activeFilter={catalogFilter}
                onClearFilter={() => setCatalogFilter(null)}
              />
              {!catalogFilter || lotToEdit || showRegistrationInCatalogView ? (
                <RegistrationForm
                  onRegister={handleRegisterLot}
                  onUpdate={handleUpdateLot}
                  lotToEdit={lotToEdit}
                  onCancelEdit={handleCancelEdit}
                  auctionInfo={auctionInfo}
                  setAuctionInfo={setAuctionInfo}
                  locationDateTimeCache={locationDateTimeCache}
                />
              ) : (
                <div className="text-center mt-8">
                  <Button
                    onClick={() => setShowRegistrationInCatalogView(true)}
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
                  >
                    Tilføj Nyt Lot til Katalog
                  </Button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'opgaver' && (
            <TasksPage 
              tasks={filteredTasks}
              completedTasks={filteredCompletedTasks}
              onRegisterTask={handleRegisterTask}
              onCompleteTask={handleCompleteTask}
            />
          )}
          {activeTab === 'oversigt' && <OverviewPage lots={lots} currentUser={currentUser} onSelectCatalog={handleSelectCatalog} />}
          {activeTab === 'handbook' && <HandbookPage />}
          {activeTab === 'kontakter' && <ContactsPage />}
          {activeTab === 'ai_tools' && <AiToolsPage />}
          {activeTab === 'settings' && <SettingsPage />}
          
          {activeTab !== 'handbook' && activeTab !== 'kontakter' && activeTab !== 'ai_tools' && activeTab !== 'settings' && (
            <div className="mt-12 text-center">
                <Button
                onClick={handleLogout}
                className="px-8 py-2 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
                >
                Forside
                </Button>
            </div>
          )}
        </div>
      </main>
      <StatusBar stats={stats} setActiveTab={setActiveTab} storageUsage={storageUsage} storageQuota={STORAGE_QUOTA} />

      {selectedLot && (
        <LotDetailModal
          lot={selectedLot}
          onClose={() => setSelectedLot(null)}
          onEdit={handleStartEdit}
          onDelete={handleDeleteLot}
          onCopy={handleCopyLot}
        />
      )}
    </div>
  );
}

export default App;