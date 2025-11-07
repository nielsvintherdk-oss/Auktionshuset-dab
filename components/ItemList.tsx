import React, { useState, useEffect } from 'react';
import { AuctionLot } from '../types';
import { ClockIcon, LocationMarkerIcon, SpinnerIcon } from './icons';
import Button, { playClickSound } from './Button';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

interface LotListProps {
  lots: AuctionLot[];
  onLotSelect: (lot: AuctionLot) => void;
  onDeleteLot: (lotId: string) => void;
  onCopyLot: (lotId: string) => void;
  currentUser: string;
}

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
    playClickSound();
    onLotSelect(lot);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSelect();
    }
  };

  return (
    <li 
      className="bg-white border border-gray-200 rounded-lg shadow-sm flex items-start sm:items-center space-x-4 p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[#C00000]/30 relative"
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Rediger Lot nummer ${lot.lotNumber}: ${lot.title}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={lot.title} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-gray-100 flex-shrink-0" />
      ) : (
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex-shrink-0"></div>
      )}
      <div className="flex-grow">
        <h3 className="font-bold text-xl text-gray-800">
          <span className="text-[#C00000]">Lot #{lot.lotNumber}:</span> {lot.title}
        </h3>
        {lot.companyName && <p className="text-base text-gray-700 font-semibold">{lot.companyName}</p>}
        <div className="flex items-center text-base text-gray-500 mt-1">
          <LocationMarkerIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
          <span>{lot.location}</span>
        </div>
        <p className="text-sm text-gray-500 font-medium mt-1">{lot.auctionType.join(', ')}</p>
        <p className="text-base text-gray-600">{lot.category.join(', ')} - {lot.condition}</p>
         <div className="flex items-center text-base text-gray-500 mt-1">
            <ClockIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
            <span>Slutter: {formatAuctionEnd(lot.auctionEndDate, lot.auctionEndTime)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Registreret af: {lot.appraiser}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-semibold text-gray-900">
          {lot.minimumPrice ? `${Number(lot.minimumPrice).toLocaleString('da-DK')} kr.` : 'Ikke fastsat'}
        </p>
        <p className="text-sm text-gray-500">Mindstepris</p>
        <div className="mt-4 flex items-center justify-end space-x-2">
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    onCopyLot(lot.id);
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="Kopiér lot"
            >
                Kopiér
            </Button>
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLot(lot.id);
                }}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
                Slet
            </Button>
        </div>
      </div>
    </li>
  );
};


const LotList: React.FC<LotListProps> = ({ lots, onLotSelect, onDeleteLot, onCopyLot, currentUser }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generateCSVContent = () => {
    const headers = [
      "Lot #", "Titel", "Firma", "Beskrivelse", "Kategorier", "Auktionstyper", "Stand",
      "Auktions adresse", "Mindstepris (kr.)",
      "Auktion slutter (dato)", "Auktion slutter (kl.)", "Billeder", "Vurderingskonsulent"
    ];

    const escapeCSV = (field: any): string => {
        if (field === null || field === undefined || field === '') {
            return '';
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
        escapeCSV(lot.category.join(', ')),
        escapeCSV(lot.auctionType.join(', ')),
        escapeCSV(lot.condition),
        escapeCSV(lot.location),
        escapeCSV(lot.minimumPrice),
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

        const addDetailLine = (label: string, value: string, spacingAfter: number = 3) => {
            if (!value) return;
            const lineHeight = doc.getFontSize() * 0.35;
            doc.setFont('helvetica', 'bold');
            const labelWidth = doc.getTextWidth(`${label}: `);
            doc.setFont('helvetica', 'normal');

            const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth);
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
        const titleLines = doc.splitTextToSize(`Lot #${lot.lotNumber}: ${lot.title}`, contentWidth);
        checkPageBreak(titleLines.length * doc.getFontSize() * 0.35);
        doc.text(titleLines, margin, yPos);
        yPos += titleLines.length * doc.getFontSize() * 0.35 + 5;
        
        doc.setFontSize(11);
        addDetailLine('Firma', lot.companyName);
        addDetailLine('Auktions adresse', lot.location);
        addDetailLine('Auktionstyper', lot.auctionType.join(', '));
        addDetailLine('Kategorier', lot.category.join(', '));
        addDetailLine('Stand', lot.condition);
        addDetailLine('Mindstepris', lot.minimumPrice ? `${Number(lot.minimumPrice).toLocaleString('da-DK')} kr.` : 'Ikke fastsat');
        addDetailLine('Slutter', formatAuctionEnd(lot.auctionEndDate, lot.auctionEndTime));
        addDetailLine('Vurderingskonsulent', lot.appraiser, 6);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Registrerede Lots ({lots.length})</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportCSV}
            disabled={isZipping || isGeneratingPDF}
            className="w-full sm:w-auto flex-1 justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            Eksporter CSV
          </Button>
          <Button
            onClick={handleExportZIP}
            disabled={isZipping || isGeneratingPDF}
            className="w-full sm:w-auto flex-1 justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center"
          >
            {isZipping ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
            {isZipping ? 'Pakker ZIP...' : 'Eksporter ZIP'}
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF || isZipping}
            className="w-full sm:w-auto flex-1 justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] text-base disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center"
          >
            {isGeneratingPDF ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
            {isGeneratingPDF ? 'Genererer PDF...' : 'Eksporter PDF'}
          </Button>
        </div>
      </div>
      
      {lots.length === 0 ? (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="font-semibold text-gray-700">Ingen lots er registreret endnu.</p>
          <p className="text-gray-500 mt-1">Brug formularen nedenfor til at registrere dit første lot.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {lots.map(lot => (
            <LotCard key={lot.id} lot={lot} onLotSelect={onLotSelect} onDeleteLot={onDeleteLot} onCopyLot={onCopyLot} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default LotList;