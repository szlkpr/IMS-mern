import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function BarcodeScanner({ isOpen, onClose, onDetected }) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [useCamera, setUseCamera] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera stream
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(t('barcodeScanner.cameraAccessError'));
      setUseCamera(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Simulate barcode detection (in a real app, you'd use a barcode library like QuaggaJS or ZXing)
  const simulateBarcodeDetection = () => {
    // This would be replaced with actual barcode detection logic
    const simulatedBarcode = Math.random().toString(36).substr(2, 12).toUpperCase();
    onDetected(simulatedBarcode);
  };

  // Handle manual barcode entry
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onDetected(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  // Auto-detect barcode length and trigger search
  useEffect(() => {
    if (manualBarcode.length >= 8 && manualBarcode.length <= 14) {
      // Common barcode lengths (EAN, UPC, etc.)
      const timer = setTimeout(() => {
        if (manualBarcode.trim()) {
          onDetected(manualBarcode.trim());
          setManualBarcode('');
        }
      }, 800); // Wait 800ms after user stops typing

      return () => clearTimeout(timer);
    }
  }, [manualBarcode, onDetected]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (isOpen && useCamera) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, useCamera]);

  // Close modal and cleanup
  const handleClose = () => {
    stopCamera();
    setError('');
    setManualBarcode('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('barcodeScanner.title')}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="mb-4">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setUseCamera(true)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                useCamera
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('barcodeScanner.cameraScanner')}
            </button>
            <button
              onClick={() => setUseCamera(false)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !useCamera
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('barcodeScanner.manualEntry')}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {useCamera ? (
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg object-cover"
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-red-500 w-48 h-32 rounded-lg opacity-75"></div>
                </div>
              )}
            </div>

            {/* Camera Instructions */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                {t('barcodeScanner.cameraInstructions')}
              </p>
              
              {/* Simulate Detection Button (for demo purposes) */}
              <button
                onClick={simulateBarcodeDetection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('barcodeScanner.simulateDetection')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Manual Entry Form */}
            <form onSubmit={handleManualSubmit}>
              <div>
                <label htmlFor="manualBarcode" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('barcodeScanner.enterBarcodeManually')}
                </label>
                <input
                  type="text"
                  id="manualBarcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder={t('barcodeScanner.scanOrTypePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {t('barcodeScanner.searchProduct')}
                </button>
              </div>
            </form>

            {/* Manual Entry Instructions */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('barcodeScanner.manualInstructions')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {t('barcodeScanner.autoSearchInfo')}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {isScanning ? t('barcodeScanner.cameraActive') : t('barcodeScanner.cameraInactive')}
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}