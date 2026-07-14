---
domain: 投資與量化分析
ai_words: 1680
---
# 🛡️ DG AI Sentinel v3.0 系統規格書與 200 萬信貸實戰手冊

> [!IMPORTANT]
> **「用進階月月配現金流完美防守，用台灣 AI 晶片鐵三角強力進攻。」**
> **DG AI Sentinel v3.0** 為 Dennis & ChiehYu 專用之全平台（電腦端 Web + 手機端 PWA）即時股票監控與盤後分析旗艦系統，建構於 v2.2 規格與優化建議之上，深度綁定 **200萬信貸槓桿投資計畫 (100萬/90萬/10萬 鐵三角)**。

---

## 🌟 一、 V3.0 核心亮點與優化實施 (Architecture & Enhancements)

1. **跨裝置全平台適配 (Desktop + Mobile PWA)**：
   * 純 HTML5 + Tailwind CSS + Vanilla JS 輕量架構，無須建置後端伺服器。
   * 導入 `manifest.json` 與 `sw.js` (Service Worker)，iPhone / Android 可直接點選 Safari/Chrome「加入主畫面」，安裝為全螢幕的原生 PWA 應用程式。
   * 內建 `@media (max-width: 768px)` 響應式佈局，手機端自動改為垂直堆疊視圖，確保 6 大 Subplots 與戰略防守面板完美閱讀。

2. **V3.0 綜合動態防守演算法 (Hybrid Trailing Stop Algorithm)**：
   * **波段回撤防守**：取標的近 20 日波段最高價下推 10% (`High Watermark -10%`)。
   * **生命線支撐防守**：取當前 20 日月均線 (`MA20 Support`) 作為趨勢支撐。
   * **動態取高邏輯**：取上述二者中「數值較高者」為當日動態防守黃線。
   * **安全邊際底線保護 (`Hard Stop -5%`)**：鎖定使用者實際加權買進成本，防守線終極底線不低於成本 `-5%`，杜絕向下無限攤平風險。

3. **200 萬信貸槓桿雙軌分析模式 (Realtime vs Post-Market Dashboard)**：
   * **即時監控分頁**：6 大 Subplots K 線、成交量能、MACD、KD、RSI、籌碼追蹤，結合即時快訊與警報。
   * **盤後信貸與流速分頁**：單一介面彙整銀行月均攤還 `27,044 元` vs 月月配 ETF 預估利息 `8,419 元` vs 實付自繳 `18,625 元` (減壓 31.1%)；內建 **「以息養股」零股複利試算引擎**，隨時掌握每月現金流與增持動能。

---

## 🔌 二、 系統 API 需求明細表 (API Requirements & Setup)

如欲開啟完整的盤中即時與進階盤後分析，系統所需與相容之 API 接口如下：

| API 類別 | 功能用途 | 推薦服務源 | 需求與狀態 |
| :--- | :--- | :--- | :--- |
| **1. 歷史 K 線與即時報價 API** | 讀取 360 日歷史 OHLCV 蠟燭圖、均線指標計算與即時現價 | **Fugle (富果) MarketData API v1.0 / v0.3 WebSocket** | ✅ 已內建連線模組。<br/>• 為維持高頻查詢 6 大核心標的，建議提供一組個人專屬 Fugle API Key 以避免限流；若網路不穩或限流，系統將自動啟用本地智慧快取與備援產生器。 |
| **2. 三大法人與信用交易 API** | Grid 6 追蹤「外資/投信買賣超」與「融資餘額增減」盤後數據 | **FinMind API** 或 **台灣證交所/櫃買中心 Open Data API** | 💡 建議擴充：提供免費授權 Token，供每日下午 14:30 盤後抓取外資投信真實進出籌碼。 |
| **3. 個股即時新聞與輿情 API** | 近 7 天全網媒體快訊爬取與發布時間軸排序 | **Google News RSS Feed + rss2json API** | ✅ 已內建，無須額外付費金鑰。 |
| **4. AI 輿情解讀與走勢推演 API** | 個股新聞情緒解讀、聯動 Jump-Diffusion 未來 20 日預測 | **Google Gemini Pro API (AI Studio API Key)** | 💡 建議擴充：將個股近一週新聞與 K 線型態轉送至 Gemini 進行多空情緒評分。 |
| **5. 跨平台同步與即時推播 API** | 手機端與電腦端持股成本雙向同步、逼近防守線彈出推播 | **Google Firebase Firestore + Web Push Notifications** | ✅ 已內建 Firebase 模組與 Native Notification API，填入專案 ID 即可雲端同步。 |

---

## 📱 三、 手機端 (iPhone / Android) PWA 快速安裝步驟

1. 使用 iPhone **Safari** 或 Android **Chrome** 開啟本系統網址或本機伺服器連結 (`index.html`)。
2. 點選瀏覽器底部的「**分享**」按鈕 (Safari) 或右上角選單 (Chrome)。
3. 選擇 **「加入主畫面 (Add to Home Screen)」**。
4. 返回手機桌面，即可看到帶有 DG 專屬光環圖標的 **DG AI Sentinel v3.0** 應用程式，點開即享有全螢幕沉浸式看盤體驗。

---
* 吸收與維護：[[姜杰佑 (Chiang Chieh-Yu)]]
