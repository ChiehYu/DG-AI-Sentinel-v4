---
domain: 投資與量化分析
ai_words: 3500
---
# 📊 DG AI Sentinel v4.0 系統規格書 (System Specification Document)

> [!IMPORTANT]
> 本文件為 **DG AI Sentinel v4.0** 旗艦多螢幕戰情室與 200 萬信貸對抗沙盤推演系統之正式系統規格書，定義了系統架構、前端元件分佈、動態數據模型、多空對抗推演邏輯、信貸對沖數學模型與版本控制與部署規範。

---

## 🏗️ 一、 系統整體架構拓撲 (System Architecture & Topology)

DG AI Sentinel v4.0 採用**單頁面富應用程序 (`Single-Page Application, SPA`)** 與 **漸進式 Web 應用程序 (`Progressive Web App, PWA`)** 混和架構：

```
+-----------------------------------------------------------------------------------+
|                                Client Layer (Browser / PWA)                       |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  | index.html (Layout) |  | css/style.css (TW+V) |  | js/app.js (Core Engine)  |  |
|  +---------------------+  +----------------------+  +--------------------------+  |
|              ^                       ^                            ^               |
|              +-----------------------+----------------------------+               |
|                                      | (DOM Rendering & Event Loop)               |
+--------------------------------------|--------------------------------------------+
                                       v
+-----------------------------------------------------------------------------------+
|                            Data & State Management Layer                          |
|  +--------------------------------+  +-----------------------------------------+  |
|  | Local JSON / API Data Feeds    |  | In-Memory State & LocalStorage Cache    |  |
|  | • data/wargame_report.json     |  | • Chart Instance Cache (ECharts)        |  |
|  | • data/market_context.json     |  | • targetSymbol / currentPeriod State    |  |
|  | • Fugle WebSocket / REST API   |  | • dg_sentinel_ver ('4.0_layout2')       |  |
|  +--------------------------------+  +-----------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🗂️ 二、 目錄結構與檔案清單 (Directory & File Manifest)

| 檔案/路徑 | 類型 | 功能描述 |
| :--- | :--- | :--- |
| `index.html` | HTML5 | 系統主結構容器，包含戰情室頂部橫幅、左/中/右網格、信貸專區分頁與 Modal 彈窗定義 |
| `css/style.css` | CSS | 整合 Tailwind CSS Utility classes 與客製化滾動條 (`custom-scrollbar`)、自訂 Glassmorphism 樣式 |
| `js/app.js` | JS (ES6+) | 核心業務邏輯、ECharts 6 大 Subplots 渲染引擎、多週期重採樣、沙盤推演日誌解析與信貸試算器 |
| `data/wargame_report.json` | JSON | 多標的對抗推演數據源，記錄各代碼 (`00919`, `2330`, `2454` 等) 4 維度 Pillar、CIO 指令與 10 輪攻防 |
| `data/market_context.json` | JSON | 宏觀總經與熱錢指南針快照，記錄美股期貨、美元指數 DXY、台幣匯率與原油黃金數值 |
| `manifest.json` | JSON | PWA 應用程式配置說明書，定義 App 名稱、圖示、啟動畫面背景與螢幕旋轉偏好 |
| `sw.js` | JS | Service Worker 資源快取腳本，支援手機端離線開啟與靜態資源快取防衛 |

---

## 🖥️ 三、 視覺佈局與雙情境網格分配規範 (Grid & Layout Specifications)

### 1. 單頁面資訊戰情室 (`War Room Layout - viewRealtime`)
系統以 `flex flex-col h-full` 外層包裹，內部主內容區採用 `flex flex-col xl:flex-row flex-grow gap-3 min-h-0`：
* **頂部宏觀條 (`#macroWarRoomStrip`)**：高密度 Flex 橫幅，內部切分為「國際市場」、「熱錢外匯」與「亞洲股市」三大區塊，字體約束為 `text-xs sm:text-sm`。
* **左欄 (`xl:w-[320px] 2xl:w-[360px] flex-shrink-0`)**：
  * 上半部 (`#panelStockHeaderCard`)：顯示股名、代碼、現價與漲跌。採用 `truncate` 與 `whitespace-nowrap` 防止視窗化縮窄時跳行。
  * 中間層：動態防守黃線與成本安全邊際提示卡。
  * 下半部：自選清單與五檔委買賣深度切換面板 (`Watchlist vs OrderBook`)。
* **中央 ECharts 主圖區 (`flex-1 min-w-0`)**：
  * 利用 `min-w-0` 與 `flex-1` 強制元素在 Flex 容器中自適應收縮擴張，不擠壓右側空間。
  * 包含頂部多週期切換器 (`日K (短線)` vs `週K (波段)`) 與 `chartContainer`。
* **右欄雙對照網格 (`xl:w-[540px] 2xl:w-[700px] flex-shrink-0`)**：
  * 內部採用 `grid grid-cols-1 2xl:grid-cols-12 gap-3` 分流：
  * **【右左子欄位 2xl:col-span-5】**：自上而下為 4 大維度矩陣、分析師近五日數據佐證卡、個股即時輿情與重大快訊卡 (`#panelNewsSection`)。
  * **【右右子欄位 2xl:col-span-7】**：自上而下為 CIO 策略指引與動機、**Wargame Council 10 輪對抗沙盤推演會議紀錄 (`#wargameDebateContainer`)**。該區塊設定為 `flex-grow overflow-y-auto min-h-[420px] 2xl:min-h-[560px]`，預設全展開且延伸到底部對齊。

---

## ⚔️ 四、 Wargame Council 4 角色演算法與資料庫綱要

### 1. JSON 資料庫結構 (`wargame_report.json`)
```json
{
  "symbol_reports": {
    "2330": {
      "name": "台積電",
      "price": 1085.0,
      "change": "+25.0",
      "change_pct": "+2.36%",
      "trailing_stop": 1020.0,
      "hard_stop": 975.0,
      "pillar_1_macro": "美股費半與 AI 巨頭大漲，台積電 ADR 溢價逾 18%",
      "pillar_2_adr": "夜盤期貨強勁，外資被動型買盤湧入",
      "pillar_3_inst": "外資連續 3 日買超逾 1.8 萬張，投信被動基金鎖籌",
      "pillar_4_retail": "散戶融資小幅獲利了結，籌碼穩定度極高",
      "cio_action_directive": "維持多頭核心部位，沿 20 日動態黃線分批增持",
      "today_strategy_rationale": "10 輪推演達成共識：外資籌碼洗淨且基本面強勁，波段續抱防守底線 1020 元。",
      "persona_verdicts": {
        "quant": { "name": "高盛量化派", "verdict": "看多", "summary": "動態均線偏多，ADR 價差收斂動能強" },
        "fundamental": { "name": "國泰投信基本面", "verdict": "強力看多", "summary": "AI 晶片先進製程產能滿載，2026 EPS 看 58 元" },
        "technical": { "name": "統一投顧籌碼主力", "verdict": "偏多", "summary": "主力買盤紮實，散戶浮額已於前波洗清" },
        "defensive": { "name": "群益長線防守", "verdict": "謹慎看多", "summary": "下檔支撐強韌，停損設 1020 即可安心抱牢" }
      },
      "wargame_rounds": [
        {
          "round": 1,
          "title": "第 1 輪攻防：估值與短期漲幅折衝",
          "quant_arg": "台積電目前本益比落在歷史區間中上緣，但考量成長率 PEG 仍小於 1.2。",
          "fund_arg": "同意，先進封裝 CoWoS 供不應求，定價權極強，本益比具備擴張空間。",
          "tech_arg": "籌碼面來看，外資買盤具備連續性，無主力大舉倒貨跡象。",
          "def_arg": "務必嚴防美股聯準會政策干擾，建議 1020 元防守線不破則不動作。"
        }
      ]
    }
  }
}
```

---

## 🧮 五、 數學與財務模型規範 (Mathematical & Financial Models)

### 1. 綜合動態防守黃線演算法 (`Hybrid Trailing Stop`)
設某標的一段時期內日 K 線之最高價序列為 $H_t$，收盤價序列為 $C_t$，其 20 日簡單移動平均線（月均線）為：
$$MA_{20}(t) = \frac{1}{20} \sum_{i=0}^{19} C_{t-i}$$
波段回撤防守點 $S_{trailing}(t)$ 取近 20 日最高價回撤 $10\%$：
$$S_{trailing}(t) = \max_{0 \le i \le 19}(H_{t-i}) \times 0.90$$
則當日動態防守黃線 $Y_{stop}(t)$ 取二者之極大值：
$$Y_{stop}(t) = \max\left(MA_{20}(t), S_{trailing}(t)\right)$$
同時設定安全邊際底線 $B_{hard}$ 為實付買進成本 $Cost \times 0.95$，若跌破 $B_{hard}$ 則觸發終極停損。

### 2. 多週期重採樣演算法 (`K-Line Period Resampling`)
當使用者點選 `週K (波段)` 時，系統透過前端聚合函數 `computeWeeklyData(rawList)` 將日 K 線轉換為週 K 線：
* 開盤價 $O_{week}$：該週第一交易日之開盤價。
* 最高價 $H_{week}$：該週內所有交易日之最高價極大值 $\max(H_i)$。
* 最低價 $L_{week}$：該週內所有交易日之最低價極小值 $\min(L_i)$。
* 收盤價 $C_{week}$：該週最後一個交易日之收盤價。
* 成交量 $V_{week}$：該週所有交易日成交量之總和 $\sum V_i$。

---

## 🚀 六、 版本控制與 GitHub 永久部署規範 (Version Control & Deployment)

1. **獨立 Repository 原則**：
   * V4.0 為重大架構與視覺大改版，**嚴禁覆蓋既有 V3.0 Repository (`DG-AI-Sentinel-v3`)**。
   * 需在 GitHub 上建立全新的遠端倉庫 `https://github.com/ChiehYu/DG-AI-Sentinel-v4.git`。
2. **快取防衛與更新強制刷新**：
   * 在 `index.html` 頂部與 `app.js` 載入參數中統一配置 `v=4.0_layout2` Cache Buster。
   * Service Worker 若偵測到本地快取非 current version，立即清除舊版 Cache (`dg-sentinel-v4-cache-v4.0`) 並重新綁定，保證瀏覽器與手機端秒速同步為最新介面。

---
* 吸收與維護：[[姜杰佑 (Chiang Chieh-Yu)]]
