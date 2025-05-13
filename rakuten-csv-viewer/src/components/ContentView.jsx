import React from 'react';
import { Box, Typography, FormControlLabel, Checkbox } from '@mui/material';

function ContentView({ selectedProductData, viewMode, onViewModeChange }) {
  if (!selectedProductData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6">商品IDを選択してください。</Typography>
      </Box>
    );
  }

  const htmlContent = viewMode === 'pc' ? selectedProductData.PCデザインHTML : selectedProductData.SPデザインHTML;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 固定表示のコントロールエリア */}
      <Box sx={{ padding: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
         <Typography variant="subtitle1">表示モード:</Typography>
         {/* <FormControlLabel
            control={
              <Checkbox
                checked={viewMode === 'pc'}
                onChange={() => onViewModeChange('pc')}
                name="pc-view"
              />
            }
            label="PC"
          />
           <FormControlLabel
            control={
              <Checkbox
                checked={viewMode === 'sp'}
                onChange={() => onViewModeChange('sp')}
                name="sp-view"
              />
            }
            label="SP"
          /> */}
           {/* Note: You might prefer a single toggle/switch */}
            {/* Example with one checkbox toggling SP: */}
           <FormControlLabel
                control={
                  <Checkbox
                    checked={viewMode === 'sp'}
                    onChange={(e) => onViewModeChange(e.target.checked ? 'sp' : 'pc')}
                    name="sp-toggle"
                  />
                }
                label="SP デザインを表示"
            />
      </Box>

      {/* iFrameエリア */}
      <Box sx={{ flexGrow: 1, border: 'none', width: '100%', height: 'calc(100% - 60px)', maxWidth: viewMode === 'pc' ? 1200 : 480}}> {/* Adjust height based on control height */}
        {/* iframeでHTMLを表示 */}
        <iframe
          srcDoc={htmlContent || '<html><body><p>デザインHTMLがありません。</p></body></html>'}
          title="Design Preview"
          style={{ width: '100%', height: '100%', border: 'none' }}
          // セキュリティのためのsandbox属性
          // 必要に応じて allow-scripts などを追加
          sandbox="allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-sequences allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        ></iframe>
      </Box>
    </Box>
  );
}

export default ContentView;