import React from "react";
import * as XLSX from "xlsx";

const ResultDisplay = ({ results }) => {
  // Convert hex image data back to bytes
  const hexToBytes = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  };

  // Create image URLs from the hex data
  const referenceImageData = results.reference_image
    ? URL.createObjectURL(
        new Blob([hexToBytes(results.reference_image)], {
          type: "image/jpeg",
        })
      )
    : null;

  const measuredImageData = results.measured_image
    ? URL.createObjectURL(
        new Blob([hexToBytes(results.measured_image)], {
          type: "image/jpeg",
        })
      )
    : null;


  const originalCounts = results.original_counts || {};
  const errorCounts = results.error_counts || {};

  const symbolLabels = Array.from(
    new Set([...Object.keys(originalCounts), ...Object.keys(errorCounts)])
  );

  const totalOriginal = Object.values(originalCounts).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalError = Object.values(errorCounts).reduce(
    (sum, val) => sum + val,
    0
  );

  const omissionDetails = symbolLabels
    .map((label) => {
      const omissionCount =
        (originalCounts[label] || 0) - (errorCounts[label] || 0);
      return omissionCount > 0 ? { label, count: omissionCount } : null;
    })
    .filter(Boolean);

  const commissionDetails = symbolLabels
    .map((label) => {
      const commissionCount =
        (errorCounts[label] || 0) - (originalCounts[label] || 0);
      return commissionCount > 0 ? { label, count: commissionCount } : null;
    })
    .filter(Boolean);

  const omissionSymbols = omissionDetails.reduce(
    (sum, item) => sum + item.count,
    0
  );
  const commissionSymbols = commissionDetails.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const omissionRate =
    totalOriginal > 0
      ? ((omissionSymbols / totalOriginal) * 100).toFixed(2)
      : "0.00";
  const commissionRate =totalOriginal > 0? ((commissionSymbols / totalOriginal) * 100).toFixed(2): "0.00";

  const handleSave = () => {

    if (referenceImageData) {
      const link = document.createElement("a");
      link.href = referenceImageData;
      link.download = "reference_image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Save the measured image
    if (measuredImageData) {
      const link = document.createElement("a");
      link.href = measuredImageData;
      link.download = "measured_image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  
    // Prepare Excel data (unchanged from your original code)
    const tableData = symbolLabels.map((label) => ({
      "Symbol Name": label,
      "Reference Image Count": originalCounts[label] || 0,
      "User Image Count": errorCounts[label] || 0,
      "Omission Count": (originalCounts[label] || 0) > (errorCounts[label] || 0)
        ? (originalCounts[label] || 0) - (errorCounts[label] || 0)
        : 0,
      "Commission Count": (errorCounts[label] || 0) > (originalCounts[label] || 0)
        ? (errorCounts[label] || 0) - (originalCounts[label] || 0)
        : 0,
    }));
  
    tableData.push({
      "Symbol Name": "Total",
      "Reference Image Count": totalOriginal,
      "User Image Count": totalError,
      "Omission Count": omissionSymbols,
      "Commission Count": commissionSymbols,
    });
  
    tableData.push({});
    tableData.push({ "Symbol Name": "Omission Rate (%)", "Reference Image Count": omissionRate });
    tableData.push({ "Symbol Name": "Commission Rate (%)", "Reference Image Count": commissionRate });
  
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  
    XLSX.writeFile(workbook, "results.xlsx");
  };

  return (
    <div className="mt-8 space-y-8">
       <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Images</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="overflow-auto">
            <h3 className="text-lg font-medium mb-2">Reference Image</h3>
            {referenceImageData ? (
              <img
                src={referenceImageData}
                alt="Reference image"
                className="max-w-full h-auto border border-gray-200 rounded"
              />
            ) : (
              <p className="text-gray-500">No reference image available</p>
            )}
          </div>
          <div className="overflow-auto">
            <h3 className="text-lg font-medium mb-2">Measured Image</h3>
            {measuredImageData ? (
              <img
                src={measuredImageData}
                alt="Measured image"
                className="max-w-full h-auto border border-gray-200 rounded"
              />
            ) : (
              <p className="text-gray-500">No measured image available</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Assessment Summary</h2>
        {results.differences.length === 0 ? (
          <p className="text-green-600">No errors found ✅</p>
        ) : (
          <div className="space-y-6">
            {/* First show the rates */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-red-100 rounded">
                <p className="text-lg font-bold text-red-700">Omission Rate</p>
                <p className="text-lg text-gray-600 font-semibold">
                  {omissionRate}% omission
                </p>
              </div>

              <div className="p-4 bg-blue-100 rounded">
                <p className="text-lg font-semibold text-blue-700">
                  Commission Rate
                </p>
                <p className="text-lg text-gray-600 font-semibold">
                  {commissionRate}% Comision 
                </p>
              </div>
            </div>

            {/* Then show the details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-red-50 rounded border border-red-100">
                <p className="text-lg font-semibold text-red-700">
                  Omission Symbols
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {" "}
                  Total {omissionSymbols} Symbols missing from the Refrence
                  Image
                </p>
                {omissionDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-700">Missing Symbols:</p>
                    <ul className="list-disc pl-5 text-sm">
                      {omissionDetails.map((item, index) => (
                        <li key={index}>
                          {item.label}: {item.count} missing
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded border border-blue-100">
                <p className="text-lg font-semibold text-blue-700">
                  Commission Symbols
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Total {commissionSymbols} Extra symbols are not in the Measured Image
                </p>
                {commissionDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-blue-700">Extra Symbols:</p>
                    <ul className="list-disc pl-5 text-sm">
                      {commissionDetails.map((item, index) => (
                        <li key={index}>
                          {item.label}: {item.count} extra
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Symbol Counts</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Refrence Image Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  User Image Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Omission Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Commission Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {symbolLabels.map((label) => {
                const original = originalCounts[label] || 0;
                const error = errorCounts[label] || 0;
                const omission = original > error ? original - error : 0;
                const commission = error > original ? error - original : 0;
                return (
                  <tr key={label}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {original}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center ">
                      {error}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 text-center">
                      {omission}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 text-center">
                      {commission}
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {totalOriginal}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {totalError}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-red-700 text-center">
                  {omissionSymbols}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-700 text-center">
                  {commissionSymbols}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Save Results
        </button>
      </div>
      
    </div>
  );
};

export default ResultDisplay;
