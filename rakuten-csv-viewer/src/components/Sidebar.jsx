import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

function Sidebar({ csvData, selectedProductId, onProductSelect }) {
  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto' }}>
       <Typography variant="h6" sx={{ padding: 2, bgcolor: '#e0e0e0' }}>
        商品ID一覧
      </Typography>
      <List>
        {csvData.map((item) => (
          <ListItem
            key={item.商品ID}
            disablePadding
            selected={item.商品ID === selectedProductId}
            sx={{ '&.Mui-selected': { bgcolor: 'lightblue' } }}
          >
            <ListItemButton onClick={() => onProductSelect(item.商品ID)}>
              <ListItemText primary={item.商品ID} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Sidebar;