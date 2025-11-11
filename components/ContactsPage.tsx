import React from 'react';
import { locationContacts, colleagueContacts, LocationContact, ColleagueContact } from './contactData';

const ColleagueCard: React.FC<{ colleague: ColleagueContact }> = ({ colleague }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
    <h3 className="text-lg font-bold text-gray-800">{colleague.name}</h3>
    <p className="text-base text-gray-600">{colleague.role}</p>
    <div className="mt-2 space-y-1 text-base">
      <a 
        href={`tel:${colleague.phone.replace(/\s/g, '')}`} 
        className="text-[#C00000] hover:underline block transition-colors"
      >
        Tlf: {colleague.phone}
      </a>
      <a 
        href={`mailto:${colleague.email}`} 
        className="text-[#C00000] hover:underline block transition-colors"
      >
        E-mail: {colleague.email}
      </a>
    </div>
  </div>
);

const LocationCard: React.FC<{ location: LocationContact }> = ({ location }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
    <h3 className="text-lg font-bold text-gray-800">{location.name}</h3>
    <p className="text-base text-gray-600">{location.address}</p>
    <div className="mt-2 space-y-1 text-base">
      <a 
        href={`tel:${location.phone.replace(/\s/g, '')}`} 
        className="text-[#C00000] hover:underline block transition-colors"
      >
        Tlf: {location.phone}
      </a>
      <a 
        href={`mailto:${location.email}`} 
        className="text-[#C00000] hover:underline block transition-colors"
      >
        E-mail: {location.email}
      </a>
    </div>
  </div>
);

const ContactsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#C00000]">Lokationer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locationContacts.map(loc => <LocationCard key={loc.name} location={loc} />)}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#C00000]">Kollegaer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colleagueContacts.map(col => <ColleagueCard key={col.name} colleague={col} />)}
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;