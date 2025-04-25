import React, { useState } from 'react';
import ImageUpload from './components/ImageUplaod';
import ResultDisplay from './components/ResultDisplay';

function App() {
  const [results, setResults] = useState(null);

  const handleResults = (data) => {
    setResults(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Symbol Comparison Tool</h1>
          <p className="text-3xl text-gray-600">
            Upload two maps to compare their symbols and detect differences
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <ImageUpload onCompare={handleResults} />
        </div>
        
        {results && (
          <div className="bg-white p-6 rounded-lg shadow">
            <ResultDisplay results={results} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;