import React from 'react';

const ResultImage = ({ imageData, title }) => {
  if (!imageData) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="border rounded-lg overflow-hidden shadow-md">
        <img 
          src={`data:image/jpeg;base64,${imageData}`} 
          alt={title}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ResultImage;