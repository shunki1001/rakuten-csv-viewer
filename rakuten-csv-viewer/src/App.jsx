import React, { useState, useMemo } from 'react';
import { Container, Box, Typography } from '@mui/material';
import UploadScreen from './components/UploadScreen';
import MainLayout from './components/MainLayout';

function App() {
  const [csvData, setCsvData] = useState(null); // CSVパース後のデータ
  const [selectedProductId, setSelectedProductId] = useState(null); // 選択中の商品ID
  const [viewMode, setViewMode] = useState('pc'); // 'pc' or 'sp'

  // 選択中の商品のデータを取得
  const selectedProductData = useMemo(() => {
    if (!csvData || !selectedProductId) return null;
    return csvData.find(item => item.商品ID === selectedProductId);
  }, [csvData, selectedProductId]);

  const handleFileUpload = (data) => {
    setCsvData(data);
    // ファイルアップロード後、最初のアイテムをデフォルトで選択することも可能
    if (data && data.length > 0) {
      setSelectedProductId(data[0].商品ID);
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProductId(productId);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
      {csvData ? (
        <MainLayout
          csvData={csvData}
          selectedProductData={selectedProductData}
          viewMode={viewMode}
          onProductSelect={handleProductSelect}
          onViewModeChange={handleViewModeChange}
        />
      ) : (
        <UploadScreen onFileUpload={handleFileUpload} />
      )}
    </Container>
  );
}

export default App;