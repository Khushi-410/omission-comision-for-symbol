import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = ({ onCompare }) => {
  const [original, setOriginal] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    if (!original || !error) {
      alert('Please upload both images');
      return;
    }

    const formData = new FormData();
    formData.append('original', original);
    formData.append('error', error);

    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/compare', formData);
      onCompare(res.data);
    } catch (err) {
      alert('Error comparing images');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-x-4 gap-y-4 mb-4">
        <div className="w-full md:w-auto">
          <label className="block text-xl font-semibold text-gray-700 mb-1">Reference Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setOriginal(e.target.files[0])}
            className="block w-full text-base text-gray-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-base file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div className="w-full md:w-auto">
          <label className="block text-xl font-semibold text-gray-700 mb-1">Measured Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setError(e.target.files[0])}
            className="block w-full text-base text-gray-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-base file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      </div>

      <div className="flex">
        <button
          onClick={handleCompare}
          disabled={isLoading}
          className={`px-6 py-2 text-base font-semibold rounded text-white ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Assessing' : 'Assess'}
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;
