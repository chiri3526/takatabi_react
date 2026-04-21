# takatabi

Astroで静的生成する旅行ブログです。記事はmicroCMSからビルド時に取得し、環境変数がない場合は `src/articles/*.json` のローカル記事を使います。

## Commands

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用に `dist/` へビルド
- `npm run preview` - ビルド結果をローカル確認

## Environment

正式に使用する環境変数は次の2つです。

- `MICROCMS_SERVICE_DOMAIN`
- `MICROCMS_API_KEY`

APIキーはクライアントへ公開しないでください。Netlifyではビルド環境変数として設定します。

## Security Notes

- CMS本文は `sanitize-html` による許可リスト方式でサニタイズしてから `set:html` に渡します。
- Netlify CMSの `/admin` は廃止済みです。Netlify Identity / Git Gateway を過去に有効化していた場合は、本番サイト側でも無効化し、不要な招待ユーザーを削除してください。
- CSPはまず `Content-Security-Policy-Report-Only` として導入しています。違反レポートを確認し、必要な外部ドメインだけに整理できたら `Content-Security-Policy` へ昇格してください。
