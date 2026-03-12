# 旅遊共用表

提供旅伴出發與住宿資訊的簡易網站，支援管理者與一般登錄者權限、旅遊代碼管理與軟刪除。

## 功能概覽
- 管理者/一般登錄者登入
- 管理者可管理旅遊代碼（新增/編輯/刪除/開啟或關閉）
- 旅遊列表新增/編輯/刪除（一般登錄者不可刪除）
- 轉機資訊可新增多筆
- 軟刪除欄位 `is_destroyed`

## 環境需求
- Node.js 22+
- Supabase Postgres

## 初始化資料庫
1. 在 Supabase SQL Editor 執行 `supabase_schema.sql`
2. 完成後，設定專案環境變數 `DATABASE_URL` 與 `AUTH_SECRET`

## 開發啟動
```bash
npm install
npm run dev
```

瀏覽 `http://localhost:3000`。

## 環境變數
請在 `.env.local` 設定：
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.your-project.supabase.co:5432/postgres
AUTH_SECRET=replace-with-a-long-random-string
```

## 初始化帳號
第一次開啟網站會導向 `/setup`，建立管理者帳號與一般登錄者共用密碼。

## 部署
推薦使用 Vercel 部署，並設定 `DATABASE_URL` 與 `AUTH_SECRET` 環境變數。
