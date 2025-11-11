import React from 'react';
import { AuctionLot } from '../types';
import { LocationMarkerIcon } from './icons';
import Button from './Button';

interface OverviewPageProps {
    lots: AuctionLot[];
    currentUser: string | null;
    onSelectCatalog: (catalogId: string) => void;
}

interface CatalogGroup {
    location: AuctionLot['location'];
    companyName: string;
    catalogId: string;
    lots: AuctionLot[];
}

const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
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

const OverviewPage: React.FC<OverviewPageProps> = ({ lots, currentUser, onSelectCatalog }) => {
    if (!currentUser) {
        return (
             <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="font-semibold text-gray-700">Kunne ikke indlæse bruger.</p>
            </div>
        );
    }

    const todaysLots = lots.filter(lot => {
        if (lot.appraiser !== currentUser) return false;
        // Robustly parse date from ID: "YYYY-MM-DDTHH:mm:ss.sssZ-RANDOM"
        const dateString = lot.id.substring(0, lot.id.lastIndexOf('-'));
        const lotDate = new Date(dateString);
        return !isNaN(lotDate.getTime()) && isToday(lotDate);
    });

    const groupedByLocation = todaysLots.reduce((acc, lot) => {
        const locationKey = JSON.stringify(lot.location);
        if (!acc[locationKey]) {
            acc[locationKey] = {
                location: lot.location,
                companyName: lot.companyName,
                catalogId: lot.lotNumber.split(' L')[0],
                lots: []
            };
        }
        acc[locationKey].lots.push(lot);
        return acc;
    }, {} as Record<string, CatalogGroup>);

    const catalogs: CatalogGroup[] = Object.values(groupedByLocation);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center bg-white p-6 rounded-xl shadow-sm">
                <h1 className="text-3xl font-bold text-gray-800">Dagens Oversigt</h1>
                <p className="mt-2 text-lg text-gray-600">
                    Kataloger du har arbejdet på i dag, {new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}.
                </p>
            </div>

            {catalogs.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                    <p className="font-semibold text-gray-700">Ingen aktivitet i dag.</p>
                    <p className="text-gray-500 mt-1">Nye lots du registrerer i dag vil blive vist her.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {catalogs.map(catalog => (
                        <Button 
                            key={catalog.catalogId}
                            onClick={() => onSelectCatalog(catalog.catalogId)}
                            className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-[#C00000]/50 hover:-translate-y-1"
                        >
                            <h2 className="text-xl font-bold text-gray-800">{catalog.companyName || 'Unavngivet Katalog'}</h2>
            
                            <div className="border-b my-2"></div>

                            <div className="flex justify-between items-center mt-2">
                                <div>
                                    <p className="text-sm text-gray-500">Katalog ID</p>
                                    <p className="font-semibold text-base"><FormattedLotNumber lotNumber={catalog.catalogId} /></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Antal Lots i Dag</p>
                                    <p className="font-bold text-lg text-gray-800">{catalog.lots.length}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center text-base text-gray-600 mt-2">
                                <LocationMarkerIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                                <span>{`${catalog.location.street}, ${catalog.location.postalCode} ${catalog.location.city}`}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OverviewPage;