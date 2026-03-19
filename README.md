# 陪伴en旅行紀錄

提供旅伴出發與住宿資訊的簡易網站，支援管理者與一般登錄者權限、旅遊代碼管理與軟刪除。

## 功能概覽
- 管理者/一般登錄者登入
- 管理者可管理旅遊代碼（新增/編輯/刪除/開啟或關閉）
- 旅遊列表新增/編輯/刪除（一般登錄者不可刪除）
- 去程/回程航班資訊
- 轉機資訊（單一轉機地點）
- 軟刪除欄位 `is_destroyed`

## 環境需求
- Node.js 22+
- Supabase Postgres

## 初始化資料庫
1. 在 Supabase SQL Editor 執行 `supabase_schema.sql`
2. 若已上線過，且需要補回程欄位，執行 `supabase_migration_return_trip.sql`
3. 完成後，設定專案環境變數 `DATABASE_URL` 與 `AUTH_SECRET`

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

## 新機器接手流程（另一台 Codex / 開發機）
1. GitHub 登入（可推 code）
   - 建議用 `gh auth login` 登入 `1ting0215travel@gmail.com`
   - 確認有 repo 寫入權限
2. 拉專案
   - `git clone https://github.com/1ting0215travel-web/en_travel_table.git`
3. 安裝依賴
   - `npm install`
4. 建立 `.env.local`
   - 需要兩個值：`DATABASE_URL`、`AUTH_SECRET`
5. 本機啟動
   - `npm run dev`
6. Vercel 部署（如需）
   - `npx vercel login` 登入同帳號
   - 若 repo 已連 Vercel，`git push` 會自動部署

## 注意事項
- `DATABASE_URL` 建議使用 Supabase Pooler URI，並加上 `?sslmode=require`
- `DATABASE_URL` 密碼若含特殊字元，必須 URL encode
- 生產環境要在 Vercel 專案設定 `DATABASE_URL` 與 `AUTH_SECRET`
- 刪除為軟刪除，資料仍保留於資料庫（`is_destroyed = true`）
