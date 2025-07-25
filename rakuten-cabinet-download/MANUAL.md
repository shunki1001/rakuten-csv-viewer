# 楽天Cabinetダウンローダー アプリケーションマニュアル

## 1. 概要

このアプリケーションは、楽天Cabinetに保存されているフォルダやファイルを一括でダウンロードするためのツールです。必要な認証情報を入力することで、Cabinet内のディレクトリ構造をツリー形式で表示し、選択した複数のディレクトリをまとめてZIPファイルとしてダウンロードできます。

## 2. 主な機能

- **ディレクトリ一覧の取得**: 楽天RMSの認証情報を用いて、Cabinet内の全ディレクトリのリストを取得します。
- **ツリー形式での表示**: 取得したディレクトリを階層構造で分かりやすく表示します。
- **フォルダの選択**: ダウンロードしたいフォルダをチェックボックスで選択します。親フォルダを選択すると、その配下にあるすべての子フォルダも自動的に選択されます。
- **検索機能**: フォルダ名やパスの一部を入力して、目的のフォルダを素早く見つけることができます。
- **一括ダウンロード**: 選択したすべてのフォルダを1つのZIPファイルにまとめてダウンロードします。

## 3. ご利用前の準備

このツールを使用するには、楽天が提供する以下の認証情報が必要です。

- **Service Secret**
- **License Key**

これらの情報は、楽天の管理画面（RMS）から取得してください。

## 4. 操作手順

このアプリケーションは、3つの簡単なステップで操作が完了します。

### Step 1: 認証情報を入力

![Step 1](https://i.imgur.com/step1_image.png) <!-- 画像はダミーです -->

1.  **Service Secret**: テキストボックスにあなたの「Service Secret」を入力します。
2.  **License Key**: テキストボックスにあなたの「License Key」を入力します。（入力した文字は表示されません）
3.  **ディレクトリ一覧を取得**: 2つのキーを入力したら、このボタンをクリックします。
    -   認証が成功すると、ボタンの下にStep 2の「ディレクトリ選択」エリアが表示されます。
    -   認証に失敗した場合や情報の取得に失敗した場合は、エラーメッセージが表示されます。キーが正しいか再度確認してください。

### Step 2: ディレクトリを選択

![Step 2](https://i.imgur.com/step2_image.png) <!-- 画像はダミーです -->

1.  **ディレクトリの検索**:
    -   一覧の上部にある検索ボックスにキーワードを入力すると、フォルダパスにそのキーワードが含まれるものだけが絞り込み表示されます。
2.  **ディレクトリの選択**:
    -   ダウンロードしたいディレクトリの左側にあるチェックボックスをオンにします。
    -   フォルダ名の左にある `>` アイコンをクリックすると、そのフォルダの配下にあるサブフォルダを展開／格納できます。
    -   親フォルダを選択すると、その中にあるすべての子フォルダ・孫フォルダが自動的に選択状態になります。

### Step 3: ダウンロードを実行

![Step 3](https://i.imgur.com/step3_image.png) <!-- 画像はダミーです -->

1.  **利用規約の同意**:
    -   ダウンロードを実行する前に、[利用規約](https://www.f-brains.tokyo/wp/rakuten-tools-terms/)をお読みいただき、内容に同意の上でチェックボックスをオンにしてください。
    -   同意いただけない場合、ダウンロードボタンは有効になりません。
2.  **ダウンロードボタン**:
    -   ダウンロードしたいフォルダを1つ以上選択し、利用規約に同意すると、このボタンが有効になります。
    -   ボタンには、現在選択されているディレクトリの総数が表示されます。
    -   ボタンをクリックすると、サーバ側で選択されたファイルのZIP圧縮が開始されます。処理中は「Zipファイル作成中...」というメッセージが表示されます。
    -   処理が完了すると、自動的にダウンロードが開始されるか、ダウンロード用のリンクが新しいタブで開かれます。

## 5. エラーが発生した場合

- **「ディレクトリの取得に失敗しました」**: Step 1で入力した `Service Secret` または `License Key` が間違っている可能性があります。正しい情報を入力し直してください。
- **「ダウンロードファイルの作成に失敗しました」**: サーバ側で問題が発生した可能性があります。時間をおいて再度試すか、開発者にお問い合わせください。

エラーが発生した場合は、画面上部に赤色の背景でエラー内容が表示されます。
