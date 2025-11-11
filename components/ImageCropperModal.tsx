import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, {
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import Button from './Button';

interface ImageCropperModalProps {
  photo: File;
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
}

// Function to generate the cropped image file from the canvas
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  originalFile: File
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2d context from canvas'));
      return;
    }

    ctx.imageSmoothingQuality = 'high';

    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const newFileName = `cropped_${originalFile.name}`;
        resolve(new File([blob], newFileName, { type: originalFile.type }));
      },
      originalFile.type,
      0.95 // High quality for formats like JPEG
    );
  });
}


const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ photo, onSave, onCancel }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);

    // Cleanup function to revoke the object URL
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photo]);


  const handleSaveCrop = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedFile = await getCroppedImg(
          imgRef.current,
          completedCrop,
          photo
        );
        onSave(croppedFile);
      } catch (e) {
        console.error('Error cropping image:', e);
        alert('Kunne ikke beskære billedet. Prøv igen.');
      }
    }
  };
  
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Set a default centered crop for better UX and stability
    setCrop({
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex justify-center items-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Beskær Billede</h2>
        </div>
        <div className="p-4 flex-grow overflow-y-auto flex items-center justify-center bg-gray-100">
           {photoUrl && <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              minWidth={100}
              minHeight={100}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={photoUrl}
                onLoad={onImageLoad}
                style={{ maxHeight: '80vh' }}
              />
            </ReactCrop>}
        </div>
        <div className="flex-shrink-0 bg-gray-50 p-4 border-t flex justify-end items-center space-x-3">
          <Button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000]"
          >
            Annuller
          </Button>
          <Button
            onClick={handleSaveCrop}
            disabled={!completedCrop?.width || !completedCrop?.height}
            className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#C00000] hover:bg-[#A00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C00000] disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            Gem beskæring
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;