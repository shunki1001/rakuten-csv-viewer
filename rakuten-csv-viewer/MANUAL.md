
# 楽天CSVデザイン確認ツール アプリケーションマニュアル

## 1. 概要

このアプリケーションは、楽天の商品管理用CSVファイルをアップロードすることで、各商品に登録されている「PC用販売説明文」と「スマートフォン用商品説明文」のHTMLデザインをブラウザ上でプレビューするためのツールです。

アップロードされたファイルは、お使いのブラウザ内でのみ処理され、外部のサーバーに送信されることはありません。安心してご利用いただけます。

## 2. 主な機能

- **CSVファイルのアップロード**: ドラッグ＆ドロップまたはファイル選択ダイアログからCSVファイルを簡単にアップロードできます。
- **Shift-JIS自動デコード**: 楽天のCSVで標準的に使用されるShift-JIS形式の文字コードを自動で認識し、文字化けなく表示します。
- **商品一覧表示**: CSVファイルに含まれる商品が「商品ID」で一覧表示され、確認したい商品をすぐに選択できます。
- **PC・スマホ表示切替**: PC用とスマートフォン用のHTMLデザインをチェックボックス一つで切り替えてプレビューできます。
- **サンプルCSVの提供**: 正しいフォーマットのサンプルCSVファイルをダウンロードでき、迷うことなく利用を開始できます。

## 3. CSVファイルの要件

本ツールで正しくプレビューを行うには、アップロードするCSVファイルが以下の要件を満たしている必要があります。

- **ファイル形式**: CSV形式 (`.csv`)
- **文字コード**: Shift-JIS
- **ヘッダー行**: ファイルの1行目は、必ずカラム名が記載されたヘッダー行である必要があります。
- **必須カラム**: ヘッダー行には、必ず以下の3つのカラム名が含まれている必要があります。（カラムの順序や、これら以外のカラムの有無は問いません）
    1.  `商品管理番号（商品URL）`
    2.  `PC用販売説明文`
    3.  `スマートフォン用商品説明文`

要件を満たしたCSVのサンプルは、ツールのトップページからダウンロードできます。

## 4. 操作手順

### Step 1: CSVファイルをアップロード

![Upload Screen](https://i.imgur.com/upload_screen.png) <!-- 画像はダミーです -->

1.  画面中央の点線で囲まれたエリアに、対象のCSVファイルをドラッグ＆ドロップします。
2.  または、エリア内をクリックするか、「ファイルを選択」ボタンを押して、ファイル選択ダイアログからCSVファイルを選択します。
3.  ファイルが正常に読み込まれると、自動的にプレビュー画面に切り替わります。

-   **エラーが表示された場合**: CSVファイルが「3. CSVファイルの要件」を満たしているかご確認ください。
-   **サンプルが必要な場合**: 「サンプルCSVをダウンロード」ボタンから、正しい形式のCSVファイルを取得できます。

### Step 2: デザインをプレビュー

![Preview Screen](https://i.imgur.com/preview_screen.png) <!-- 画像はダミーです -->

プレビュー画面は、左側の「商品ID一覧」と右側の「コンテンツ表示」の2つのエリアに分かれています。

1.  **商品を選択する**:
    -   画面左側の「商品ID一覧」から、プレビューしたい商品のIDをクリックします。
    -   選択された商品は、背景色が水色に変わります。
2.  **デザインをプレビューする**:
    -   画面右側のエリアに、選択した商品の「PC用販売説明文」のHTMLがレンダリングされて表示されます。
3.  **スマートフォン表示に切り替える**:
    -   右側エリアの上部にある「SP デザインを表示」のチェックボックスをオンにします。
    -   プレビューが「スマートフォン用商品説明文」の内容に切り替わります。表示エリアの横幅もスマートフォンを想定したサイズに変わります。
4.  **別のファイルをアップロードする**:
    -   右側エリアの右上にある「アップロード画面に戻る」ボタンをクリックすると、Step 1のファイル選択画面に戻ります。

## 5. エラーと対処法

-   **「CSVのヘッダーが正しくありません」**: アップロードしたCSVファイルの1行目に、必須カラム（`商品管理番号（商品URL）`など）が含まれていません。ファイルの内容を確認してください。
-   **「CSVのデータ形式が正しくありません」**: 必須カラムは存在するものの、その中のデータが空になっている行があります。データが正しく入力されているか確認してください。
-   **「Shift-JISデコードエラー」**: ファイルがShift-JIS以外の文字コード（UTF-8など）で保存されている可能性があります。ファイルの文字コードを確認してください。
-   **「ファイル読み込みエラー」/「CSVパースエラー」**: ファイルが破損しているか、予期せぬ形式になっている可能性があります。別のファイルで試すか、ファイルの内容を確認してください。
