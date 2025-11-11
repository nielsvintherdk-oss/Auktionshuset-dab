export interface SerializablePhoto {
  name: string;
  type: string;
  dataUrl: string;
}

export interface AuctionLot {
  id: string;
  lotNumber: string;
  photos: File[];
  title: string;
  description: string;
  category: string[];
  auctionType: string[];
  condition: string;
  companyName: string;
  location: {
    street: string;
    postalCode: string;
    city: string;
  };
  minimumPrice: number | '';
  auctionEndDate: string;
  auctionEndTime: string;
  appraiser: string;
  shippingAvailable: boolean;
  forkliftAvailable: boolean;
  palletLifterAvailable: boolean;
  notes?: string;
}

export interface SerializableRegistrationFormData {
    formData: Omit<AuctionLot, 'id' | 'lotNumber' | 'auctionType' | 'location' | 'companyName' | 'appraiser' | 'photos'> & { photos: SerializablePhoto[] };
    auctionInfo: {
        type: string[];
        location: { street: string; postalCode: string; city: string; };
        companyName: string;
    };
}


export interface Task {
    id: string;
    description: string;
    location: string;
    date: string;
    time: string;
    appraiser: string;
}