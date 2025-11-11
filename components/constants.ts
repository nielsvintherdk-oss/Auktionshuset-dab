export interface Appraiser {
  name: string;
  prefix: string; // Using string for leading zeros
  email: string;
}

export const INITIAL_APPRAISERS: Appraiser[] = [
  { name: 'Tom Christensen', prefix: '01', email: 'tom@auktionshuset.dk' },
  { name: 'Asbjørn Korsholm', prefix: '02', email: 'asbjorn@auktionshuset.dk' },
  { name: 'Daniel Rosendal Duus', prefix: '03', email: 'daniel@auktionshuset.dk' },
  { name: 'Niels Vinther ?', prefix: '04', email: '' },
  { name: 'Gæst', prefix: '05', email: '' },
];