import React, { useState, useEffect, useRef } from 'react';
import { AuctionLot } from '../types';
import { ClockIcon, LocationMarkerIcon, SpinnerIcon, TruckIcon, NoTruckIcon, ForkliftIcon, NoForkliftIcon, PalletLifterIcon, NoPalletLifterIcon, ChevronDownIcon, XIcon } from './icons';
import Button, { playOpenModalSound } from './Button';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

interface LotListProps {
  lots: AuctionLot[];
  onLotSelect: (lot: AuctionLot) => void;
  onDeleteLot: (lotId: string) => void;
  onCopyLot: (lotId: string) => void;
  currentUser: string;
  activeFilter: string | null;
  onClearFilter: () => void;
}

const formatLocation = (location: AuctionLot['location']) => {
  if (!location || !location.street) return 'Ukendt lokation';
  return `${location.street}, ${location.postalCode} ${location.city}`;
};

const formatAuctionEnd = (dateString: string, timeString: string) => {
  if (!dateString || !timeString) return 'Ikke fastsat';
  const date = new Date(`${dateString}T${timeString}`);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat('da-DK', options).format(date);
};

const LogisticsIcons: React.FC<{ lot: AuctionLot }> = ({ lot }) => (
    // FIX: Replaced invalid `title` prop on icons with a wrapper `div` that has a `title` attribute for tooltips.
    <div className="flex items-center space-x-2">
      <div title={lot.shippingAvailable ? "Forsendelse tilgængelig" : "Forsendelse ikke tilgængelig"}>
        {lot.shippingAvailable
          ? <TruckIcon className="w-7 h-7 text-green-600"/>
          : <NoTruckIcon className="w-7 h-7" />}
      </div>
      <div title={lot.forkliftAvailable ? "Gaffeltruck til rådighed" : "Gaffeltruck ikke til rådighed"}>
        {lot.forkliftAvailable
          ? <ForkliftIcon className="w-7 h-7 text-gray-700" />
          : <NoForkliftIcon className="w-7 h-7" />}
      </div>
      <div title={lot.palletLifterAvailable ? "Palleløfter til rådighed" : "Palleløfter ikke til rådighed"}>
        {lot.palletLifterAvailable
          ? <PalletLifterIcon className="w-7 h-7 text-green-600" />
          : <NoPalletLifterIcon className="w-7 h-7" />}
      </div>
    </div>
);

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


const LotCard: React.FC<{ lot: AuctionLot; onLotSelect: (lot: AuctionLot) => void; onDeleteLot: (lotId: string) => void; onCopyLot: (lotId: string) => void; }> = ({ lot, onLotSelect, onDeleteLot, onCopyLot }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (lot.photos.length > 0 && lot.photos[0]) {
      url = URL.createObjectURL(lot.photos[0]);
      setImageUrl(url);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [lot.photos]);

  const handleSelect = () => {
    playOpenModalSound();
    onLotSelect(lot);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSelect();
    }
  };

  return (
    <li 
      className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-start space-x-4 p-4 pb-12 sm:pb-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-[#C00000]/50 hover:-translate-y-1 relative"
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Rediger Lot nummer ${lot.lotNumber}: ${lot.title}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={lot.title} className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg bg-stone-200 flex-shrink-0" />
      ) : (
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-stone-200 rounded-lg flex-shrink-0"></div>
      )}
      <div className="flex-grow mt-2 sm:mt-0">
        <h3 className="font-bold text-lg text-gray-900 leading-tight">
          <FormattedLotNumber lotNumber={lot.lotNumber} />: {lot.title}
        </h3>
        {lot.companyName && <p className="text-base text-gray-800 font-semibold">{lot.companyName}</p>}
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <LocationMarkerIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
          <span>{formatLocation(lot.location)}</span>
        </div>
         <div className="flex items-center text-sm text-gray-500 mt-1">
            <ClockIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
            <span>Slutter: {formatAuctionEnd(lot.auctionEndDate, lot.auctionEndTime)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Registreret af: {lot.appraiser}</p>
      </div>
      <div className="w-full sm:w-auto text-right flex-shrink-0 flex flex-row sm:flex-col items-end justify-between h-full mt-3 sm:mt-0">
         <div>
            <p className="text-lg font-semibold text-gray-900">
              {lot.minimumPrice ? `${Number(lot.minimumPrice).toLocaleString('da-DK')} kr.` : 'Ikke fastsat'}
            </p>
            <p className="text-sm text-gray-500">Mindstepris</p>
        </div>
        <div className="mt-2">
            <LogisticsIcons lot={lot} />
        </div>
      </div>
       <div className="absolute bottom-2 right-2 flex items-center justify-end space-x-2">
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    onCopyLot(lot.id);
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="Kopiér lot"
            >
                Kopiér
            </Button>
            <Button
                sound="delete"
                onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLot(lot.id);
                }}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
                Slet
            </Button>
        </div>
    </li>
  );
};


const LotList: React.FC<LotListProps> = ({ lots, onLotSelect, onDeleteLot, onCopyLot, currentUser, activeFilter, onClearFilter }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateCSVContent = () => {
    const headers = [
      "Lot Nr.", "Titel", "Auktionsoverskrift", "Beskrivelse", "Noter", "Kategorier", "Auktionstyper", "Stand",
      "Auktionsadresse", "Mindstepris (kr.)", "Forsendelse tilgængelig", "Gaffeltruck til rådighed", "Palleløfter til rådighed",
      "Auktion slutter (dato)", "Auktion slutter (kl.)", "Billeder", "Vurderingskonsulent"
    ];

    const escapeCSV = (field: any): string => {
        if (field === null || field === undefined || field === '') {
            return '';
        }
        if (typeof field === 'boolean') {
            return field ? 'Ja' : 'Nej';
        }
        const str = String(field);
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = lots.map(lot => [
        escapeCSV(lot.lotNumber),
        escapeCSV(lot.title),
        escapeCSV(lot.companyName),
        escapeCSV(lot.description),
        escapeCSV(lot.notes),
        escapeCSV(lot.category.join(', ')),
        escapeCSV(lot.auctionType.join(', ')),
        escapeCSV(lot.condition),
        escapeCSV(formatLocation(lot.location)),
        escapeCSV(lot.minimumPrice),
        escapeCSV(lot.shippingAvailable),
        escapeCSV(lot.forkliftAvailable),
        escapeCSV(lot.palletLifterAvailable),
        escapeCSV(lot.auctionEndDate),
        escapeCSV(lot.auctionEndTime),
        escapeCSV(lot.photos.map(p => p.name).join(', ')),
        escapeCSV(lot.appraiser)
      ].join(';'));
      
    return [headers.join(';'), ...csvRows].join('\n');
  };

  const handleExportCSV = () => {
    if (lots.length === 0) {
      alert("Der er ingen lots at eksportere.");
      return;
    }

    const csvContent = generateCSVContent();
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "auktions_lots.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleExportZIP = async () => {
    if (lots.length === 0) {
      alert("Der er ingen lots at eksportere.");
      return;
    }

    setIsZipping(true);
    setIsExportMenuOpen(false);

    try {
      const zip = new JSZip();

      // 1. Generate and add CSV
      const csvContent = generateCSVContent();
      zip.file("auktions_lots.csv", `\uFEFF${csvContent}`);

      // 2. Add images
      const imagesFolder = zip.folder("billeder");
      if (imagesFolder) {
        for (const lot of lots) {
            const lotFolder = imagesFolder.folder(`lot_${lot.lotNumber}`);
            if (lotFolder) {
                for (let i = 0; i < lot.photos.length; i++) {
                    const photo = lot.photos[i];
                    // Sanitize filename just in case, though modern browsers handle most things
                    const safeFilename = photo.name.replace(/[\\/*?:"<>|]/g, '');
                    lotFolder.file(safeFilename, photo);
                }
            }
        }
      }

      // 3. Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(zipBlob);
      link.setAttribute("href", url);
      link.setAttribute("download", "auktion_export.zip");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error creating ZIP file:", error);
      alert("Der opstod en fejl under oprettelse af ZIP-filen.");
    } finally {
      setIsZipping(false);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleExportPDF = async () => {
    if (lots.length === 0) {
      alert("Der er ingen lots at eksportere.");
      return;
    }

    setIsGeneratingPDF(true);
    setIsExportMenuOpen(false);

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const margin = 15;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;

      for (let i = 0; i < lots.length; i++) {
        const lot = lots[i];
        if (i > 0) {
          doc.addPage();
        }
        let yPos = margin;

        const checkPageBreak = (neededHeight: number) => {
            if (yPos + neededHeight > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }
        };

        const addDetailLine = (label: string, value: string | boolean, spacingAfter: number = 3) => {
            if (value === '' || value === undefined || value === null) return;
            
            let displayValue = typeof value === 'boolean' ? (value ? 'Ja' : 'Nej') : value;

            const lineHeight = doc.getFontSize() * 0.35;
            doc.setFont('helvetica', 'bold');
            const labelWidth = doc.getTextWidth(`${label}: `);
            doc.setFont('helvetica', 'normal');

            const valueLines = doc.splitTextToSize(displayValue, contentWidth - labelWidth);
            checkPageBreak(valueLines.length * lineHeight);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(valueLines, margin + labelWidth, yPos);
            yPos += valueLines.length * lineHeight + spacingAfter;
        };

        // --- LOT DETAILS ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(`${lot.lotNumber}: ${lot.title}`, contentWidth);
        checkPageBreak(titleLines.length * doc.getFontSize() * 0.35);
        doc.text(titleLines, margin, yPos);
        yPos += titleLines.length * doc.getFontSize() * 0.35 + 5;
        
        doc.setFontSize(11);
        addDetailLine('Auktionsoverskrift', lot.companyName);
        addDetailLine('Auktionsadresse', formatLocation(lot.location));
        addDetailLine('Auktionstyper', lot.auctionType.join(', '));
        addDetailLine('Kategorier', lot.category.join(', '));
        addDetailLine('Stand', lot.condition);
        addDetailLine('Mindstepris', lot.minimumPrice ? `${Number(lot.minimumPrice).toLocaleString('da-DK')} kr.` : 'Ikke fastsat');
        addDetailLine('Slutter', formatAuctionEnd(lot.auctionEndDate, lot.auctionEndTime));
        addDetailLine('Vurderingskonsulent', lot.appraiser, 6);
        
        // Logistics
        addDetailLine('Forsendelse tilgængelig', lot.shippingAvailable);
        addDetailLine('Gaffeltruck til rådighed', lot.forkliftAvailable);
        addDetailLine('Palleløfter til rådighed', lot.palletLifterAvailable, 6);
        
        addDetailLine('Beskrivelse', lot.description, 6);


        // --- IMAGES ---
        if (lot.photos.length > 0) {
            yPos += 4;
            doc.setFont('helvetica', 'bold');
            checkPageBreak(10);
            doc.text('Billeder:', margin, yPos);
            yPos += (doc.getFontSize() * 0.35) + 4;

            const imageRowHeight = 60;
            const imagesPerRow = 3;
            const imageGutter = 4;
            const imageWidth = (contentWidth - (imageGutter * (imagesPerRow - 1))) / imagesPerRow;
            
            let currentX = margin;

            for (const [index, photo] of lot.photos.entries()) {
                if (index > 0 && index % imagesPerRow === 0) {
                    yPos += imageRowHeight + imageGutter;
                    currentX = margin;
                }
                
                checkPageBreak(imageRowHeight + imageGutter);

                try {
                    const dataUrl = await fileToDataUrl(photo);
                    const props = doc.getImageProperties(dataUrl);
                    const aspectRatio = props.width / props.height;
                    const calculatedHeight = imageWidth / aspectRatio;
                    const finalHeight = Math.min(calculatedHeight, imageRowHeight);
                    const finalWidth = finalHeight * aspectRatio;
                    const xOffset = (imageWidth - finalWidth) / 2;

                    doc.addImage(dataUrl, photo.type.split('/')[1].toUpperCase(), currentX + xOffset, yPos, finalWidth, finalHeight);
                } catch (e) {
                    console.error("Could not add image to PDF:", e);
                    doc.rect(currentX, yPos, imageWidth, imageRowHeight);
                    doc.text("Billede fejl", currentX + 5, yPos + 10);
                }
                
                currentX += imageWidth + imageGutter;
            }
        }
      }

      doc.save("auktion_export.pdf");

    } catch (error) {
      console.error("Error creating PDF file:", error);
      alert("Der opstod en fejl under oprettelse af PDF-filen.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const groupedLots = lots.reduce((acc, lot) => {
    const groupKey = lot.companyName || 'Unavngivet Katalog';
    if (!acc[groupKey]) {
        acc[groupKey] = [];
    }
    acc[groupKey].push(lot);
    return acc;
  }, {} as Record<string, AuctionLot[]>);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Registrerede Lots ({lots.length})</h2>
        <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
          <Button
            onClick={() => setIsExportMenuOpen(prev => !prev)}
            className="w-full sm:w-auto justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base flex items-center"
          >
            Eksporter
            <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" />
          </Button>

          {isExportMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-30">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button
                  onClick={() => { handleExportCSV(); setIsExportMenuOpen(false); }}
                  disabled={isZipping || isGeneratingPDF}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  Eksporter CSV
                </button>
                <button
                  onClick={handleExportZIP}
                  disabled={isZipping || isGeneratingPDF}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  {isZipping ? <SpinnerIcon className="w-4 h-4 mr-2 inline" /> : null}
                  {isZipping ? 'Pakker ZIP...' : 'Eksporter ZIP'}
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isGeneratingPDF || isZipping}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  {isGeneratingPDF ? <SpinnerIcon className="w-4 h-4 mr-2 inline" /> : null}
                  {isGeneratingPDF ? 'Genererer PDF...' : 'Eksporter PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {activeFilter && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 animate-fade-in">
          <p className="text-red-800 text-sm">
            Filter aktivt: Viser kun lots fra katalog <span className="font-bold">{activeFilter}</span>
          </p>
          <Button
            onClick={onClearFilter}
            className="flex-shrink-0 flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
          >
            <XIcon className="w-4 h-4 mr-1" />
            Nulstil Filter
          </Button>
        </div>
      )}

      {lots.length === 0 ? (
        <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg bg-stone-100">
          {activeFilter ? (
            <>
              <p className="font-semibold text-gray-700 text-sm">Ingen lots fundet for dette katalog.</p>
              <p className="text-gray-500 mt-1 text-sm">Dette katalog har ingen registrerede lots, eller de er blevet slettet.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-700 text-sm">Ingen lots er registreret endnu.</p>
              <p className="text-gray-500 mt-1 text-sm">Brug formularen nedenfor til at registrere dit første lot.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
            {Object.entries(groupedLots).map(([groupTitle, lotGroup]) => (
                <div key={groupTitle}>
                    <h3 className="text-lg font-semibold text-white mb-2 bg-[#A78969] p-2 rounded-lg">
                        Katalog: {groupTitle}
                    </h3>
                    <ul className="space-y-4">
                        {Array.isArray(lotGroup) && lotGroup.map(lot => (
                            <LotCard key={lot.id} lot={lot} onLotSelect={onLotSelect} onDeleteLot={onDeleteLot} onCopyLot={onCopyLot} />
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default LotList;