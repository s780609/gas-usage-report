# 瓦斯度數紀錄系統

**家美香榭廣場 B棟** 社區瓦斯抄表紀錄工具。

## 功能

- 表格介面記錄 15-1 ~ 15-6 號、2F ~ 17F 各戶瓦斯度數
- 每格限制 4 碼數字輸入
- 日期選擇器標記抄表日期
- 即時顯示填寫進度

## 技術

- **框架**: Next.js 16 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS 4
- **部署**: Vercel
- **資料庫**: Neon PostgreSQL + Drizzle ORM
- **API**: Next.js Route Handlers

## 開發

```bash
npm install
npm run dev
```

開啟 http://localhost:3000 查看。

## API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/periods` | 取得所有期別（新到舊） |
| POST | `/api/periods` | 新增期別 `{ label, readingDate }` |
| GET | `/api/readings?periodId=1` | 取得某期所有度數 |
| POST | `/api/readings` | 儲存度數 `{ periodId, records }` |

## 部署

推送至 GitHub 後透過 Vercel 自動部署。

## 路線圖

- [x] 連接 Neon PostgreSQL 資料庫
- [x] API Routes 儲存/讀取度數資料
- [x] 歷史紀錄查詢（透過期別選擇器切換）
- [x] 用量計算（本期 - 上期）
