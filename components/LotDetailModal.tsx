import React, { useEffect, useState } from 'react';
import { AuctionLot } from '../types';
import { ClockIcon, LocationMarkerIcon, XIcon } from './icons';
import Button, { playClickSound } from './Button';

interface LotDetailModalProps {
  lot: AuctionLot;
  onClose: () => void;
  onEdit: (lot: AuctionLot) => void;
  onDelete: (lotId: string) => void;
  onCopy: (lotId: string) => void;
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

const LotDetailModal: React.FC<LotDetailModalProps> = ({ lot, onClose, onEdit, onDelete, onCopy }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    useEffect(() => {
        const urls = lot.photos.map(photo => URL.createObjectURL(photo));
        setImageUrls(urls);

        document.body.style.overflow = 'hidden';

        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
            document.body.style.overflow = 'unset';
        };
    }, [lot.photos]);

    const handleOverlayClose = () => {
      playClickSound();
      onClose();
    }

    const handleDelete = () => {
        onDelete(lot.id);
    };

    const handleCopy = () => {
        onCopy(lot.id);
        onClose(); // Close modal after copying
    };
    
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={handleOverlayClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white p-4 border-b flex justify-between items-center rounded-t-lg">
            <h2 className="text-xl font-bold text-gray-800">
                <span className="text-[#C00000]">Lot #{lot.lotNumber}:</span> {lot.title}
            </h2>
            <Button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <XIcon className="w-6 h-6" />
            </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
            {/* Photos */}
            {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                    <img 
                    key={index}
                    src={url} 
                    alt={`Photo ${index + 1} of ${lot.title}`}
                    className="w-full h-32 object-cover rounded-md" 
                    />
                ))}
                </div>
            )}

            {/* Core Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                <div>
                    <p className="text-sm font-medium text-gray-500">Firma</p>
                    <p className="text-base text-gray-900">{lot.companyName || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Mindstepris</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {lot.minimumPrice ? `${Number(lot.minimumPrice).toLocaleString('da-DK')} kr.` : 'Ikke fastsat'}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Auktionstype(r)</p>
                    <p className="text-base text-gray-900">{lot.auctionType.join(', ')}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Kategori(er)</p>
                    <p className="text-base text-gray-900">{lot.category.join(', ')}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Stand</p>
                    <p className="text-base text-gray-900">{lot.condition}</p>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center text-base text-gray-700">
                <LocationMarkerIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                <span>{lot.location}</span>
                </div>
                <div className="flex items-center text-base text-gray-700">
                <ClockIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                <span>Slutter: {formatAuctionEnd(lot.auctionEndDate, lot.auctionEndTime)}</span>
                </div>
            </div>

            {/* Description */}
            <div>
                <p className="text-sm font-medium text-gray-500">Beskrivelse</p>
                <p className="text-base text-gray-800 whitespace-pre-wrap">{lot.description || 'Ingen beskrivelse.'}</p>
            </div>
            
            <p className="text-xs text-gray-400 pt-4 border-t">Registreret af: {lot.appraiser}</p>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-gray-50 p-4 border-t flex justify-between items-center rounded-b-lg">
            <div>
                <Button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Slet
                </Button>
            </div>
            <div className="flex items-center space-x-3">
                 <Button
                    onClick={handleCopy}
                    className="px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
                >
                    Kopiér
                </Button>
                <Button
                    onClick={() => onEdit(lot)}
                    className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
                >
                    Rediger
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
export default LotDetailModal;