import React, { useCallback } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import Encoding from 'encoding-japanese';

function UploadScreen({ onFileUpload }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      alert('ファイルを選択してください。');
      return;
    }

    const file = acceptedFiles[0];

    // Shift-JISで読み込んでパース
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Shift-JISでデコード
        const arrayBuffer = e.target.result;
        const decoder = new TextDecoder('shift-jis');
        const text = decoder.decode(arrayBuffer);

        Papa.parse(text, {
          header: true, // ヘッダーを読み込む
          skipEmptyLines: true, // 空行を無視
          complete: (results) => {
            // カラム名が想定通りかチェック (簡易)
            const expectedHeaders = ['商品管理番号（商品URL）', 'PC用販売説明文', 'スマートフォン用商品説明文'];
            const actualHeaders = results.meta.fields;
            const headersMatch = expectedHeaders.every(header => actualHeaders.includes(header));

            if (!headersMatch) {
              alert(`CSVのヘッダーが正しくありません。\n必要なヘッダー: ${expectedHeaders.join(', ')}\n実際のヘッダー: ${actualHeaders.join(', ')}`);
              return;
            }

            // データ形式をチェック (簡易)
            const isValidData = results.data.every(row =>
              row['商品管理番号（商品URL）'] && row['PC用販売説明文'] !== undefined && row['スマートフォン用商品説明文'] !== undefined
            );

            if (!isValidData) {
              alert('CSVのデータ形式が正しくありません。商品管理番号（商品URL）、PC用販売説明文、スマートフォン用商品説明文の各列が存在し、データが含まれているか確認してください。');
              console.error("Invalid CSV data structure:", results.data);
              return;
            }

            // カラム名変換マッピング
            const columnMap = {
              '商品管理番号（商品URL）': '商品ID',
              'PC用販売説明文': 'PCデザインHTML',
              'スマートフォン用商品説明文': 'SPデザインHTML'
            };

            // カラム名を変換した新しいデータ配列を作成
            const mappedData = results.data.map(row => {
              const newRow = {};
              Object.keys(columnMap).forEach(origKey => {
                newRow[columnMap[origKey]] = row[origKey];
              });
              return newRow;
            });

            onFileUpload(mappedData);
          },
          error: (error) => {
            alert(`CSVパースエラー: ${error.message}`);
            console.error("CSV parse error:", error);
          }
        });
      } catch (err) {
        alert('Shift-JISデコードエラー: ' + err.message);
        console.error('Shift-JIS decode error:', err);
      }
    };
    reader.onerror = (err) => {
      alert('ファイル読み込みエラー: ' + err.message);
      console.error('File read error:', err);
    };
    reader.readAsArrayBuffer(file);
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
        'text/csv': ['.csv'],
    }
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 3,
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Typography variant="h4" gutterBottom>
        HTMLデザインプレビューツール
      </Typography>
      <Typography variant="body1">
        このツールは、楽天の商品CSVファイルをアップロードすることで、各商品のデザインをプレビューできます。
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        CSVファイルはブラウザ（Chorme, Edge）内で完結し、どこかにアップロードされることはありません。
      </Typography>
       <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        CSVファイルの形式:
        最初の行はヘッダーとし、必ず以下のカラム名を含めてください。<br/>
        商品管理番号（商品URL）, PC用販売説明文, スマートフォン用商品説明文<br/>
        他のカラムはあってもなくても影響しません。
      </Typography>
      <Paper
        {...getRootProps()}
        elevation={3}
        sx={{
          padding: 4,
          border: '2px dashed #cccccc',
          backgroundColor: isDragActive ? '#e0e0e0' : '#fafafa',
          cursor: 'pointer',
          width: '80%',
          maxWidth: 500,
          transition: 'background-color 0.3s ease',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <Typography>ここにファイルをドロップ...</Typography>
        ) : (
          <>
            <Typography gutterBottom>
              CSVファイルをここにドラッグ＆ドロップ
            </Typography>
            <Typography variant="body2" color="textSecondary">
              またはクリックしてファイルを選択
            </Typography>
          </>
        )}
      </Paper>
      <Button
        variant="contained"
        sx={{ mt: 3 }}
        onClick={() => document.querySelector('input[type="file"]').click()} // fallback for button click
      >
        ファイルを選択
      </Button>
      <Button
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={() => {
          const sampleData = [
            ['商品管理番号（商品URL）', 'PC用販売説明文', 'スマートフォン用商品説明文'],
            ['12345', '<html><body>PC用説明文サンプル1</body></html>', '<html><body>SP用説明文サンプル1</body></html>'],
            ['67890', '<html><body>PC用説明文サンプル2</body></html>', '<html><body>SP用説明文サンプル2</body></html>'],
          ];
          const csvContent = sampleData.map(e => e.join(',')).join('\n');
          // Shift-JISにエンコード
          const sjisArray = Encoding.convert(csvContent, {
            to: 'SJIS',
            type: 'array',
          });
          const uint8Array = new Uint8Array(sjisArray);
          const blob = new Blob([uint8Array], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'sample.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
      >
        サンプルCSVをダウンロード
      </Button>
    </Box>
  );
}

export default UploadScreen;
