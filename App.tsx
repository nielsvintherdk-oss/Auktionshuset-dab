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

// --- Type Definitions for Persistence ---
interface SerializablePhoto {
  name: string;
  type: string;
  dataUrl: string;
}

interface SerializableAuctionLot extends Omit<AuctionLot, 'photos'> {
  photos: SerializablePhoto[];
}

// --- Helper Functions for File Conversion ---
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const dataUrlToFile = (dataUrl: string, filename: string, fileType: string): File => {
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: fileType});
};

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lots');
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [lotToEdit, setLotToEdit] = useState<AuctionLot | null>(null);
  const [selectedLot, setSelectedLot] = useState<AuctionLot | null>(null);
  const [auctionInfo, setAuctionInfo] = useState<{ type: string[]; location: string; companyName: string }>({ type: [], location: '', companyName: '' });
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [locationDateTimeCache, setLocationDateTimeCache] = useState<Record<string, { endDate: string; endTime: string }>>({});
  const [catalogNumberMap, setCatalogNumberMap] = useState<Record<string, number>>({});
  const [nextCatalogNumber, setNextCatalogNumber] = useState<number>(100);
  
  const [loginStep, setLoginStep] = useState<'user_select' | 'pin_entry'>('user_select');
  const [userForPin, setUserForPin] = useState<string>('');
  
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
    }
  }, []);
  
  // Load lots from localStorage on initial mount
  useEffect(() => {
    try {
      const storedLotsJSON = localStorage.getItem('auctionLots');
      if (storedLotsJSON) {
        const storedLots: SerializableAuctionLot[] = JSON.parse(storedLotsJSON);
        const hydratedLots: AuctionLot[] = storedLots.map(lot => ({
          ...lot,
          photos: lot.photos.map(p => dataUrlToFile(p.dataUrl, p.name, p.type))
        }));
        setLots(hydratedLots);
      }
    } catch (e) {
      console.error("Failed to load or parse lots from localStorage", e);
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
          localStorage.setItem('auctionLots', JSON.stringify(serializableLots));
      } catch (e) {
          console.error("Failed to save lots to localStorage", e);
      }
    };
    
    // This logic ensures we save changes, including deleting the last lot,
    // but we don't overwrite existing storage with an empty array on initial load.
    const hasBeenInitialized = lots.length > 0 || localStorage.getItem('auctionLots') !== null;
    if (hasBeenInitialized) {
        saveLots();
    }
  }, [lots]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Stash the event so it can be triggered later, but only if not already in standalone mode.
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setInstallPromptEvent(e);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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

  // Filter data based on the current user
  const filteredLots = lots.filter(lot => lot.appraiser === currentUser);
  const filteredTasks = tasks.filter(task => task.appraiser === currentUser);
  const filteredCompletedTasks = completedTasks.filter(task => task.appraiser === currentUser);

  const stats = {
    lots: filteredLots.length,
    aktiveOpgaver: filteredTasks.length,
    faerdige: filteredCompletedTasks.length,
  };

  const handleRegisterLot = (lotDetails: Omit<AuctionLot, 'id' | 'lotNumber' | 'auctionType' | 'location' | 'companyName' | 'appraiser'>) => {
    if (!currentUser) {
      alert("Fejl: Ingen bruger er logget ind.");
      return;
    }
    
    let catalogNumber: number;
    if (catalogNumberMap[auctionInfo.location]) {
        catalogNumber = catalogNumberMap[auctionInfo.location];
    } else {
        catalogNumber = nextCatalogNumber;
        setCatalogNumberMap(prev => ({ ...prev, [auctionInfo.location]: catalogNumber }));
        setNextCatalogNumber(prev => prev + 1);
    }
    
    const lotsForThisCatalog = lots.filter(lot => lot.location === auctionInfo.location);

    const lotLNumbers = lotsForThisCatalog.map(lot => {
        const match = lot.lotNumber.match(/L(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    });

    const newLNumber = (lotLNumbers.length > 0 ? Math.max(...lotLNumbers) : 0) + 1;
    
    const newLotNumberString = `DAB${catalogNumber} L${newLNumber}`;

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

    // Cache the date and time for the current location
    setLocationDateTimeCache(prev => ({
      ...prev,
      [newLot.location]: {
        endDate: newLot.auctionEndDate,
        endTime: newLot.auctionEndTime
      }
    }));
  };

  const handleUpdateLot = (updatedLot: AuctionLot) => {
    setLots(prevLots => prevLots.map(lot => (lot.id === updatedLot.id ? updatedLot : lot)));
    setLotToEdit(null); // Exit edit mode
    alert('Lot er blevet opdateret!');
  };

  const handleDeleteLot = (lotId: string) => {
    if (window.confirm('Er du sikker på, at du vil slette dette lot? Handlingen kan ikke fortrydes.')) {
      setLots(prevLots => prevLots.filter(lot => lot.id !== lotId));
      setSelectedLot(null); // Ensure modal closes if open
    }
  };
  
  const handleCopyLot = (lotId: string) => {
    if (!currentUser) {
      alert("Fejl: Ingen bruger er logget ind.");
      return;
    }

    const sourceLot = lots.find(l => l.id === lotId);
    if (!sourceLot) {
      console.error("Lot to copy not found");
      alert("Fejl: Kunne ikke finde det lot, der skulle kopieres.");
      return;
    }

    let catalogNumber: number;
    if (catalogNumberMap[sourceLot.location]) {
        catalogNumber = catalogNumberMap[sourceLot.location];
    } else {
        const newCatalogNumber = nextCatalogNumber;
        setCatalogNumberMap(prev => ({ ...prev, [sourceLot.location]: newCatalogNumber }));
        setNextCatalogNumber(prev => prev + 1);
        catalogNumber = newCatalogNumber;
    }
    
    const lotsForThisCatalog = lots.filter(lot => lot.location === sourceLot.location);
    const lotLNumbers = lotsForThisCatalog.map(lot => {
        const match = lot.lotNumber.match(/L(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    });
    const newLNumber = (lotLNumbers.length > 0 ? Math.max(...lotLNumbers) : 0) + 1;
    const newLotNumberString = `DAB${catalogNumber} L${newLNumber}`;

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
  };

  const handleStartEdit = (lot: AuctionLot) => {
    setSelectedLot(null); // Close modal
    setLotToEdit(lot);    // Open edit form
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
    // Clear authentication and session data from localStorage
    localStorage.removeItem('currentUser');

    // Reset all relevant state to initial values for a clean logout
    setCurrentUser(null);
    setUserForPin('');
    setLoginStep('user_select');
    setActiveTab('lots');
    setLotToEdit(null);
    setSelectedLot(null);
    setAuctionInfo({ type: [], location: '', companyName: '' });
    // Note: We don't clear `lots`, `tasks`, `completedTasks` as they represent
    // the total data in the app, which is filtered by user. They will be
    // empty for the logged-out view. Caches like `locationDateTimeCache`
    // can also persist.
  };

  if (!currentUser) {
    if (loginStep === 'user_select') {
      return <LoginScreen onUserSelect={handleUserSelect} />;
    }
    if (loginStep === 'pin_entry') {
      return <PinScreen userName={userForPin} onSuccess={handlePinSuccess} onCancel={handlePinCancel} />;
    }
    // Fallback in case of an unexpected state
    return <LoginScreen onUserSelect={handleUserSelect} />;
  }

  return (
    <div className="bg-[#C00000] min-h-screen flex flex-col font-sans relative">
      <Header onInstallClick={handleInstallClick} showInstallButton={!!installPromptEvent} />
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          {activeTab === 'lots' && (
            <div className="space-y-8">
              <LotList 
                lots={filteredLots} 
                onLotSelect={setSelectedLot} 
                onDeleteLot={handleDeleteLot}
                onCopyLot={handleCopyLot}
                currentUser={currentUser} 
              />
              <RegistrationForm 
                onRegister={handleRegisterLot}
                onUpdate={handleUpdateLot}
                lotToEdit={lotToEdit}
                onCancelEdit={handleCancelEdit}
                auctionInfo={auctionInfo}
                setAuctionInfo={setAuctionInfo}
                locationDateTimeCache={locationDateTimeCache}
              />
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
          {activeTab === 'handbook' && <HandbookPage />}
          
          {activeTab !== 'handbook' && (
            <div className="mt-12 text-center">
                <Button
                onClick={handleLogout}
                className="px-8 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
                >
                Forside
                </Button>
            </div>
          )}
        </div>
      </main>
      <StatusBar stats={stats} setActiveTab={setActiveTab} />

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