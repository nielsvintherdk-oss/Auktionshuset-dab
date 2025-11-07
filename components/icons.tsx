
import React from 'react';

interface IconProps {
  className?: string;
}

export const CubeIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 16.5c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5v-12c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5v12zm-3-9.5h-4.5v4.5h4.5v-4.5zm-6 0h-4.5v4.5h4.5v-4.5zm0 6h-4.5v4.5h4.5v-4.5z" />
  </svg>
);

export const CheckboxIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

export const CameraIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.4 11.2l-2.4-2.4L6 9.8l3.4 3.4 5.6-5.6 1.4 1.4-7 7z" clipRule="evenodd" fillRule="evenodd"></path>
    <path d="M4 4h3l2-2h6l2 2h3v16H4V4zm8 14c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3.5a.75.75 0 01.75.75V6h1.75a.75.75 0 010 1.5H10.75V9.25a.75.75 0 01-1.5 0V7.5H7.5a.75.75 0 010-1.5H9.25V4.25A.75.75 0 0110 3.5zM3.5 10a.75.75 0 01.75-.75H6V7.5a.75.75 0 011.5 0v1.75H9.25a.75.75 0 010 1.5H7.5v1.75a.75.75 0 01-1.5 0V10.75H4.25a.75.75 0 01-.75-.75zm10.25.75a.75.75 0 00-1.5 0v1.75h-1.75a.75.75 0 000 1.5h1.75v1.75a.75.75 0 001.5 0v-1.75h1.75a.75.75 0 000-1.5h-1.75V10.75z" clipRule="evenodd" />
    </svg>
);

export const SpinnerIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c0-.414.336-.75.75-.75h10.5a.75.75 0 01.75.75v1.25a.75.75 0 01-.75-.75H5.5a.75.75 0 01-.75-.75V7.5z" clipRule="evenodd" />
    </svg>
);
  
export const LocationMarkerIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.69 18.23a.75.75 0 01.62 0l6.25-3.5A.75.75 0 0017 14V6a.75.75 0 00-.75-.75h-2.5a.75.75 0 000 1.5h2.5V13.5l-5.5 3.1-5.5-3.1V6.5h2.5a.75.75 0 000-1.5H3.75A.75.75 0 003 6v8a.75.75 0 00.44.68l6.25 3.5z" clipRule="evenodd" />
      <path d="M10 2a4 4 0 100 8 4 4 0 000-8zm0 1.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
    </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
);

export const XIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const BookIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.255A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292V4.533Z" />
    <path d="M12.75 20.292A8.987 8.987 0 0 1 18 18c1.052 0 2.062.18 3 .512V4.262A9.707 9.707 0 0 0 18 3.75c-2.305 0-4.408.867-6 2.292v14.25Z" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>
);