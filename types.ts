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
  location: string;
  minimumPrice: number | '';
  auctionEndDate: string;
  auctionEndTime: string;
  appraiser: string;
}

export interface Task {
    id: string;
    description: string;
    location: string;
    date: string;
    time: string;
    appraiser: string;
}