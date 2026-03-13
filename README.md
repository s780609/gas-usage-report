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
- **資料庫**: Neon PostgreSQL (規劃中)

## 開發

```bash
npm install
npm run dev
```

開啟 http://localhost:3000 查看。

## 部署

推送至 GitHub 後透過 Vercel 自動部署。

## 路線圖

- [ ] 連接 Neon PostgreSQL 資料庫
- [ ] API Routes 儲存/讀取度數資料
- [ ] 歷史紀錄查詢
- [ ] 用量計算（本期 - 上期）
