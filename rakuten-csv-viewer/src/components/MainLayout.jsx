import React from 'react';
import { Box, Grid } from '@mui/material';
import Sidebar from './Sidebar';
import ContentView from './ContentView';

function MainLayout({ csvData, selectedProductData, viewMode, onProductSelect, onViewModeChange, onBackToUpload }) {
  return (
    <Box sx={{ flexGrow: 1, height: '100%', display: 'flex' }}>
      <Grid container spacing={0} sx={{ height: '100%', width: '100%'}}>
        {/* Sidebar */}
        <Grid size={{ xs: 12, sm: 4, md:3 }} sx={{
          height: '100%',
          overflowY: 'auto',
          borderRight: '1px solid #e0e0e0',
          bgcolor: '#f8f8f8'
        }}>
          <Sidebar
            csvData={csvData}
            selectedProductId={selectedProductData?.商品ID}
            onProductSelect={onProductSelect}
          />
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, sm: 8, md:9 }} sx={{ height: '100%' }}>
          <ContentView
            selectedProductData={selectedProductData}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onBackToUpload={onBackToUpload}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default MainLayout;