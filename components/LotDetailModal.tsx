import React, { useEffect, useState } from 'react';
import { AuctionLot } from '../types';
import { ClockIcon, LocationMarkerIcon, XIcon, TruckIcon, NoTruckIcon, ForkliftIcon, NoForkliftIcon, PalletLifterIcon, NoPalletLifterIcon } from './icons';
import Button, { playCloseModalSound } from './Button';

interface LotDetailModalProps {
  lot: AuctionLot;
  onClose: () => void;
  onEdit: (lot: AuctionLot) => void;
  onDelete: (lotId: string) => void;
  onCopy: (lotId: string) => void;
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

const LogisticsIcons: React.FC<{ lot: AuctionLot, className?: string }> = ({ lot, className }) => (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div title={lot.shippingAvailable ? "Forsendelse tilgængelig" : "Forsendelse ikke tilgængelig"}>
        {lot.shippingAvailable 
            ? <TruckIcon className="w-10 h-10 text-green-600"/> 
            : <NoTruckIcon className="w-10 h-10" />}
      </div>
      <div title={lot.forkliftAvailable ? "Gaffeltruck til rådighed" : "Gaffeltruck ikke til rådighed"}>
        {lot.forkliftAvailable 
            ? <ForkliftIcon className="w-10 h-10 text-gray-700" /> 
            : <NoForkliftIcon className="w-10 h-10" />}
      </div>
      <div title={lot.palletLifterAvailable ? "Palleløfter til rådighed" : "Palleløfter ikke til rådighed"}>
      {lot.palletLifterAvailable 
        ? <PalletLifterIcon className="w-10 h-10 text-green-600" /> 
        : <NoPalletLifterIcon className="w-10 h-10" />}
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


const LotDetailModal: React.FC<LotDetailModalProps> = ({ lot, onClose, onEdit, onDelete, onCopy }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const urls = lot.photos.map(photo => URL.createObjectURL(photo));
        setImageUrls(urls);
        if (urls.length > 0) {
            setActiveImageUrl(urls[0]);
        }

        document.body.style.overflow = 'hidden';

        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
            setActiveImageUrl(null);
            document.body.style.overflow = 'unset';
        };
    }, [lot.photos]);

    const handleClose = () => {
      playCloseModalSound();
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
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-stone-100 p-4 flex justify-between items-center rounded-t-xl border-b">
            <h2 className="text-xl font-bold text-gray-800">
                <FormattedLotNumber lotNumber={lot.lotNumber} />: {lot.title}
            </h2>
            <Button onClick={handleClose} className="text-gray-500 hover:text-gray-800">
                <XIcon className="w-6 h-6" />
            </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
            {/* Photos */}
            {imageUrls.length > 0 && activeImageUrl && (
                <div className="space-y-3">
                    {/* Main Image View */}
                    <div className="bg-stone-200 rounded-lg flex justify-center items-center p-2 min-h-[20rem]">
                        <img
                            src={activeImageUrl}
                            alt={`Forstørret billede af ${lot.title}`}
                            className="max-w-full max-h-80 object-contain rounded"
                        />
                    </div>
                    {/* Thumbnails */}
                    {imageUrls.length > 1 && (
                         <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {imageUrls.map((url, index) => (
                                <Button
                                    key={index}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImageUrl(url);
                                    }}
                                    className={`relative w-full aspect-square rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] p-0 ${activeImageUrl === url ? 'border-[#C00000]' : 'border-transparent'} hover:border-[#C00000]/50 transition`}
                                    aria-label={`Vis billede ${index + 1}`}
                                >
                                    <img
                                        src={url}
                                        alt={`Thumbnail ${index + 1} af ${lot.title}`}
                                        className="w-full h-full object-cover"
                                    />
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Logistics */}
            <div className="py-3 flex justify-center">
                <LogisticsIcons lot={lot} />
            </div>

            {/* Core Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                <div>
                    <p className="text-sm font-medium text-gray-500">Auktionsoverskrift</p>
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
                <span>{formatLocation(lot.location)}</span>
                </div>
                <div className="flex items-center text-base text-gray-700">
                <ClockIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                <span>Slutter: {formatAuctionEnd(lot.auctionEndDate, lot.auctionEndTime)}</span>
                </div>
            </div>
            
            {/* Description */}
            <div>
                <p className="text-sm font-medium text-gray-500">Overordnet Beskrivelse</p>
                <p className="text-base text-gray-800 whitespace-pre-wrap">{lot.description || 'Ingen overordnet beskrivelse.'}</p>
            </div>

            {/* Notes */}
            {lot.notes && (
                <div>
                    <p className="text-sm font-medium text-gray-500">Interne Noter</p>
                    <p className="text-base text-gray-800 whitespace-pre-wrap bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-1">{lot.notes}</p>
                </div>
            )}
            
            <p className="text-xs text-gray-400 pt-4 border-t">Registreret af: {lot.appraiser}</p>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-stone-100 p-4 border-t flex justify-between items-center rounded-b-xl">
            <div>
                <Button
                    sound="delete"
                    onClick={handleDelete}
                    className="px-4 py-2 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Slet
                </Button>
            </div>
            <div className="flex items-center space-x-3">
                 <Button
                    onClick={handleCopy}
                    className="px-4 py-2 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
                >
                    Kopiér
                </Button>
                <Button
                    onClick={() => onEdit(lot)}
                    className="px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
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