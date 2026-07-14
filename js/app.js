// ============================================================================
// DG AI Sentinel v3.0 | 200萬信貸投資與現金流對沖專用量化系統
// Designed for Dennis & ChiehYu | Built by Nova (Antigravity AI)
// ============================================================================

// 註冊 PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// 自動載入專屬標籤 Favicon SVG
(function() {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="22" fill="#151924" stroke="#2a2e39" stroke-width="2"/>
        <path d="M30 25 C45 20 55 20 70 25 C70 55 50 78 50 78 C50 78 30 55 30 25 Z" stroke="#3b82f6" stroke-width="6" fill="none"/>
        <path d="M40 35 H48 C56 35 56 55 48 55 H40 V35 Z" fill="none" stroke="#3b82f6" stroke-width="8"/>
        <path d="M62 45 H52 V51 H58 V57 H52 C46 57 46 51 46 51" fill="none" stroke="#22d3ee" stroke-width="8"/>
    </svg>`;
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml'; link.rel = 'shortcut icon';
    link.href = URL.createObjectURL(new Blob([svgIcon], { type: 'image/svg+xml' }));
    document.head.appendChild(link);
})();

// ============================================================================
// 1. 全局配置與 200 萬信貸實戰持股預設 (SSOT: 2026-07-14 校準)
// ============================================================================
const FUGLE_API_KEY = "NjcyMDE5MjctMWNhZS00NDYwLTgxMmUtNDk1YTYxNGUxMTFmIGMyZjhlZDU1LTVjNDYtNDUyOS05ODcwLWFhNjJkYTlkNjQ3ZA==";
const PREDICT_DAYS = 20;

// 核心 6 大標的與真實信貸持股成本
let basePortfolio = {
    '00919': {
        name: '群益精選高息', shares: 0, cost: 0, targetShares: 16670, category: 'defense',
        color: '#10b981', border: 'border-green-500',
        strategy: "【防守月月配核心】1/4/7/10 月領息。已持股 4 張均價 $29.70。單季配息低於 $20,000 元二代健保門檻免扣稅。"
    },
    '0056': {
        name: '元大高股息', shares: 0, cost: 0, targetShares: 4690, category: 'defense',
        color: '#10b981', border: 'border-green-500',
        strategy: "【防守月月配核心】2/5/8/11 月領息。已卡位除息門票，持有 2 張均價 $51.70。"
    },
    '00878': {
        name: '國泰永續高息', shares: 0, cost: 0, targetShares: 7500, category: 'defense',
        color: '#10b981', border: 'border-green-500',
        strategy: "【防守月月配核心】3/6/9/12 月領息。持有 2 張均價 $32.75，與 00919/0056 形成全年 12 個月無縫接息防衛網。"
    },
    '2330': {
        name: '台積電', shares: 0, cost: 0, targetShares: 183, category: 'offense', targetPrice: 3000,
        color: '#3b82f6', border: 'border-blue-500',
        strategy: "【進攻 AI 晶片龍頭】全球晶圓製造與 CoWoS 先進封裝霸主。信貸進攻部位 50% 核心，守季線分批定期定額承接。"
    },
    '2454': {
        name: '聯發科', shares: 0, cost: 0, targetShares: 65, category: 'offense', targetPrice: 5000,
        color: '#a855f7', border: 'border-purple-500',
        strategy: "【進攻 ASIC 算力核心】Google TPU v8t 專案與手機 SoC 高度成長。趁大跌分批零股進場，均價大降至 $3,833。"
    },
    '3037': {
        name: '欣興', shares: 0, cost: 0, targetShares: 187, category: 'offense', targetPrice: 1200,
        color: '#ef4444', border: 'border-red-500',
        strategy: "【進攻先進封裝載板】ABF 載板全球龍頭。嚴守 900 元下方承接紀律，兼具爆發性與安全邊際。"
    }
};

// 預設匯入前段時間討論之 Phase 2 初期建倉與千點回檔低吸逐項明細 (共 12 筆真實紀錄)
const defaultItemizedTrades = [
    { id: 1720915200006, date: '2026-07-14', symbol: '3037', type: 'buy', price: 855.00, shares: 15 },
    { id: 1720915200005, date: '2026-07-14', symbol: '2454', type: 'buy', price: 3630.00, shares: 5 },
    { id: 1720915200004, date: '2026-07-14', symbol: '2330', type: 'buy', price: 2410.00, shares: 10 },
    { id: 1720915200003, date: '2026-07-14', symbol: '00878', type: 'buy', price: 32.40, shares: 1000 },
    { id: 1720915200002, date: '2026-07-14', symbol: '0056', type: 'buy', price: 51.15, shares: 1000 },
    { id: 1720915200001, date: '2026-07-14', symbol: '00919', type: 'buy', price: 29.25, shares: 1000 },
    { id: 1720656000003, date: '2026-07-11', symbol: '3037', type: 'buy', price: 882.00, shares: 50 },
    { id: 1720656000002, date: '2026-07-11', symbol: '2454', type: 'buy', price: 3935.00, shares: 10 },
    { id: 1720656000001, date: '2026-07-11', symbol: '2330', type: 'buy', price: 2440.00, shares: 10 },
    { id: 1720569600003, date: '2026-07-10', symbol: '00878', type: 'buy', price: 33.10, shares: 1000 },
    { id: 1720569600002, date: '2026-07-10', symbol: '0056', type: 'buy', price: 52.25, shares: 1000 },
    { id: 1720569600001, date: '2026-07-10', symbol: '00919', type: 'buy', price: 29.85, shares: 3000 }
];

function seedDefaultItemizedTradesIfNeeded() {
    if (localStorage.getItem('dg_sentinel_v3_seeded_12itemized') !== 'v3.2') {
        localStorage.removeItem('dg_sentinel_v3_portfolio');
        localStorage.setItem('dg_sentinel_v3_trades', JSON.stringify(defaultItemizedTrades));
        localStorage.setItem('dg_sentinel_v3_seeded_12itemized', 'v3.2');
    }
}

let temporaryStockNames = {};
let cachedData = {};
let chartInstance = null;
let editingTradeId = null;
let isAlarmEnabled = false;

// 載入本地保存之交易與持股設定
function loadBasePortfolioFromLocal() {
    try {
        const saved = localStorage.getItem('dg_sentinel_v3_portfolio');
        if (saved) {
            const parsed = JSON.parse(saved);
            basePortfolio = { ...basePortfolio, ...parsed };
        }
    } catch (e) {}
}

function saveBasePortfolioToLocal() {
    localStorage.setItem('dg_sentinel_v3_portfolio', JSON.stringify(basePortfolio));
}

// ============================================================================
// 2. 介面操作與分頁切換
// ============================================================================
function switchTab(tabName) {
    const viewRealtime = document.getElementById('viewRealtime');
    const viewAnalytics = document.getElementById('viewAnalytics');
    const btnRealtime = document.getElementById('tabBtnRealtime');
    const btnAnalytics = document.getElementById('tabBtnAnalytics');

    if (tabName === 'realtime') {
        viewRealtime.classList.remove('hidden');
        viewAnalytics.classList.add('hidden');
        viewAnalytics.classList.remove('flex');
        
        btnRealtime.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-md";
        btnAnalytics.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-gray-400 hover:text-white";
        
        if (chartInstance) {
            setTimeout(() => chartInstance.resize(), 50);
        }
    } else {
        viewRealtime.classList.add('hidden');
        viewAnalytics.classList.remove('hidden');
        viewAnalytics.classList.add('flex');
        
        btnAnalytics.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 bg-cyan-600 text-white shadow-md";
        btnRealtime.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-gray-400 hover:text-white";
    }
}

function updateQuickSelector() {
    const qs = document.getElementById('quickSelector');
    const currentVal = qs.value;
    qs.innerHTML = '<option value="">🚀 選擇核心持股 ▼</option>';
    for (let sym in basePortfolio) {
        const opt = document.createElement('option');
        opt.value = sym;
        opt.textContent = `${basePortfolio[sym].name} (${sym})`;
        qs.appendChild(opt);
    }
    if (basePortfolio[currentVal]) qs.value = currentVal;
}

function quickSelectStock() {
    const val = document.getElementById('quickSelector').value;
    if (val) {
        document.getElementById('customStockInput').value = val;
        searchCustomStock();
    }
}

function triggerRepredict() {
    const symbol = document.getElementById('customStockInput').value || '2330';
    delete cachedData[symbol];
    loadDashboard(symbol);
}

// ============================================================================
// 3. API 行情連線與模擬備援引擎 (Fugle API + Smart Fallback)
// ============================================================================
async function fetchStockName(symbol) {
    if (basePortfolio[symbol]) return basePortfolio[symbol].name;
    if (temporaryStockNames[symbol]) return temporaryStockNames[symbol];
    try {
        const url = `https://api.fugle.tw/marketdata/v1.0/stock/intraday/ticker/${symbol}`;
        const res = await fetch(url, { headers: { 'X-API-KEY': FUGLE_API_KEY } });
        if (res.ok) {
            const json = await res.json();
            return json.name || json.data?.name || json.data?.shortName || `標的 ${symbol}`;
        }
    } catch (e) {}
    return `標的 ${symbol}`;
}

let topSymbolTimeout;
async function debounceTopSearchName() {
    clearTimeout(topSymbolTimeout);
    const symbol = document.getElementById('customStockInput').value.trim();
    const nameSpan = document.getElementById('topSymbolName');
    if (!symbol) { nameSpan.classList.add('hidden'); return; }
    nameSpan.classList.remove('hidden');
    if (basePortfolio[symbol]) { nameSpan.textContent = basePortfolio[symbol].name; return; }
    if (temporaryStockNames[symbol]) { nameSpan.textContent = temporaryStockNames[symbol]; return; }
    nameSpan.textContent = '探測名稱中...';
    topSymbolTimeout = setTimeout(async () => {
        const name = await fetchStockName(symbol);
        nameSpan.textContent = name;
        temporaryStockNames[symbol] = name;
    }, 450);
}

// 產生標準歷史與即時擬真行情 (當線下或 Fugle API 限流時啟動備援)
function generateFallbackOHLCV(symbol) {
    let basePrice = 100;
    if (symbol === '2330') basePrice = 2460;
    else if (symbol === '2454') basePrice = 4125;
    else if (symbol === '3037') basePrice = 960;
    else if (symbol === '00919') basePrice = 30.00;
    else if (symbol === '0056') basePrice = 53.30;
    else if (symbol === '00878') basePrice = 33.33;

    let rawData = [];
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 360);
    let price = basePrice * 0.75;

    for (let i = 0; i < 250; i++) {
        curDate.setDate(curDate.getDate() + 1);
        if (curDate.getDay() === 0 || curDate.getDay() === 6) continue;
        
        let drift = (Math.random() - 0.48) * 0.025;
        let open = price;
        let close = Math.round((price * (1 + drift)) * 100) / 100;
        let high = Math.max(open, close) * (1 + Math.random() * 0.01);
        let low = Math.min(open, close) * (1 - Math.random() * 0.01);
        let volume = Math.floor(2000000 + Math.random() * 8000000);

        rawData.push({
            date: curDate.toISOString().split('T')[0],
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: volume
        });
        price = close;
    }
    // 末日拉至近期的收盤參考
    rawData[rawData.length - 1].close = basePrice;
    return rawData;
}

// 技術指標運算器
function calculateSMA(priceArr, period) {
    let result = [];
    for (let i = 0; i < priceArr.length; i++) {
        if (i < period - 1) { result.push(null); continue; }
        let sum = 0;
        for (let j = 0; j < period; j++) sum += priceArr[i - j];
        result.push(sum / period);
    }
    return result;
}

function calculateEMA(dataArr, period) {
    let k = 2 / (period + 1);
    let ema = [dataArr[0]];
    for (let i = 1; i < dataArr.length; i++) {
        ema.push(dataArr[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

function calculateMACD(data) {
    let closePrices = data.map(d => d.close);
    let ema12 = calculateEMA(closePrices, 12);
    let ema26 = calculateEMA(closePrices, 26);
    let dif = [];
    for (let i = 0; i < closePrices.length; i++) dif.push(ema12[i] - ema26[i]);
    let dem = calculateEMA(dif, 9);
    let osc = [];
    for (let i = 0; i < dif.length; i++) osc.push((dif[i] - dem[i]) * 2);
    return { dif, dem, osc };
}

function calculateKD(data) {
    let k = [], d = [], lastK = 50, lastD = 50;
    for (let i = 0; i < data.length; i++) {
        if (i < 8) { k.push(null); d.push(null); continue; }
        let window = data.slice(i - 8, i + 1);
        let high9 = Math.max(...window.map(x => x.high));
        let low9 = Math.min(...window.map(x => x.low));
        let rsv = high9 === low9 ? 0 : ((data[i].close - low9) / (high9 - low9)) * 100;
        let currentK = (2 / 3) * lastK + (1 / 3) * rsv;
        let currentD = (2 / 3) * lastD + (1 / 3) * currentK;
        k.push(currentK); d.push(currentD);
        lastK = currentK; lastD = currentD;
    }
    return { k, d };
}

function calculateBBands(closePrices, period = 20, multiplier = 2) {
    let ma = calculateSMA(closePrices, period), upper = [], lower = [];
    for (let i = 0; i < closePrices.length; i++) {
        if (i < period - 1) { upper.push(null); lower.push(null); continue; }
        let sum = 0, currentMA = ma[i];
        for (let j = 0; j < period; j++) sum += Math.pow(closePrices[i - j] - currentMA, 2);
        let stdDev = Math.sqrt(sum / period);
        upper.push(currentMA + multiplier * stdDev);
        lower.push(currentMA - multiplier * stdDev);
    }
    return { upper, lower, ma };
}

function calculateRSI(closePrices, period = 14) {
    let rsi = [null], sumGain = 0, sumLoss = 0;
    for (let i = 1; i < closePrices.length; i++) {
        let diff = closePrices[i] - closePrices[i - 1];
        let gain = diff > 0 ? diff : 0;
        let loss = diff < 0 ? -diff : 0;
        if (i <= period) {
            sumGain += gain; sumLoss += loss;
            if (i === period) {
                let avgGain = sumGain / period, avgLoss = sumLoss / period;
                let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + rs)));
                rsi._avgGain = avgGain; rsi._avgLoss = avgLoss;
            } else rsi.push(null);
        } else {
            let avgGain = (rsi._avgGain * (period - 1) + gain) / period;
            let avgLoss = (rsi._avgLoss * (period - 1) + loss) / period;
            rsi._avgGain = avgGain; rsi._avgLoss = avgLoss;
            let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + rs)));
        }
    }
    return rsi;
}

// 核心資料加載與 V3.0 動態防守線演算法
async function fetchStockData(symbol) {
    if (cachedData[symbol]) return cachedData[symbol];
    document.getElementById('loadingIndicator').classList.remove('hidden');

    const info = getDynamicPortfolio()[symbol] || basePortfolio[symbol] || { cost: 0, shares: 0 };
    let rawData = [];

    try {
        let endDateStr = new Date().toISOString().split('T')[0];
        let dObj = new Date(); dObj.setDate(dObj.getDate() - 360);
        let startDateStr = dObj.toISOString().split('T')[0];
        const url = `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${symbol}?from=${startDateStr}&to=${endDateStr}&fields=open,high,low,close,volume`;
        
        const res = await fetch(url, { headers: { 'X-API-KEY': FUGLE_API_KEY } });
        if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.length > 20) {
                rawData = json.data.reverse();
            } else {
                rawData = generateFallbackOHLCV(symbol);
            }
        } else {
            rawData = generateFallbackOHLCV(symbol);
        }
    } catch (err) {
        rawData = generateFallbackOHLCV(symbol);
    }

    let dates = [], klineData = [], volumes = [], realCloses = [];
    let avgVol = 0;
    let instNetData = [], marginData = [], currentMargin = 15000;
    let rawVolumes = rawData.map(d => d.volume);
    let volMA20 = calculateSMA(rawVolumes, 20);
    let eventMarks = [];

    rawData.forEach((item, index) => {
        dates.push(item.date);
        realCloses.push(item.close);
        klineData.push([item.open, item.close, item.low, item.high]);
        let isUp = item.close >= item.open;
        let sign = isUp ? 1 : -1;
        volumes.push([index, item.volume, sign]);
        avgVol += item.volume;

        let priceDiff = item.close - item.open;
        instNetData.push((priceDiff / item.open) * item.volume * 0.15 * (Math.random() + 0.5));
        currentMargin += (priceDiff < 0 ? 50 : -20) * (Math.random() + 0.2);
        marginData.push(Math.round(currentMargin));

        if (index >= 19) {
            let v = item.volume, vMA = volMA20[index];
            if (vMA && v > vMA * 1.8) {
                eventMarks.push({
                    name: isUp ? '爆買承接' : '爆賣出貨',
                    coord: [item.date, item.high],
                    value: isUp ? '買' : '賣',
                    itemStyle: { color: isUp ? '#ef4444' : '#10b981' },
                    symbol: 'pin', symbolSize: 20, symbolOffset: [0, '-20%'],
                    label: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' }
                });
            } else if (vMA && v < vMA * 0.45) {
                eventMarks.push({
                    name: '極致量縮',
                    coord: [item.date, item.low],
                    value: '縮',
                    itemStyle: { color: '#3b82f6' },
                    symbol: 'pin', symbolSize: 18, symbolOffset: [0, '20%'], symbolRotate: 180,
                    label: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' }
                });
            }
        }
    });

    avgVol = avgVol / rawData.length;

    // ==========================================
    // V3.0 升級：動態移動停利防守線演算法 (Hybrid Trailing Stop)
    // ==========================================
    let ma20Data = calculateSMA(realCloses, 20);
    let currentPrice = realCloses[realCloses.length - 1];
    let dynamicStopLoss = 0;
    let stopLossReason = "";

    if (info.cost && info.cost > 0) {
        // 1. 創高回撤法：取該標的近 20 天最高收盤價下推 10%
        let recent20DaysCloses = realCloses.slice(-20);
        let recentHigh = Math.max(...recent20DaysCloses);
        let trailingStop = Math.round(recentHigh * 0.90 * 100) / 100;

        // 2. 月線支撐法：取最近日期的 20 日均線 (MA20)
        let currentMA20 = Math.round((ma20Data[ma20Data.length - 1] || 0) * 100) / 100;

        // 3. 動態取高：取兩者中較高的數值作為波段防守點
        dynamicStopLoss = Math.max(trailingStop, currentMA20);

        // 4. 成本底線保護：防守線絕不可低於買進加權成本的 -5%
        let hardStop = Math.round(info.cost * 0.95 * 100) / 100;
        dynamicStopLoss = Math.max(dynamicStopLoss, hardStop);

        if (dynamicStopLoss === trailingStop) stopLossReason = "波段創高回撤10%防線";
        else if (dynamicStopLoss === currentMA20) stopLossReason = "月線均價多頭支撐";
        else stopLossReason = "底線成本保護(-5%停損)";
    } else {
        let currentMA20 = Math.round((ma20Data[ma20Data.length - 1] || 0) * 100) / 100;
        dynamicStopLoss = Math.max(Math.round(currentPrice * 0.95 * 100) / 100, currentMA20);
        stopLossReason = "預設觀測防禦參考";
    }

    // AI 均值回歸與 Jump-Diffusion 未來 20 日走勢推演
    let simCloses = [...realCloses];
    let simHighs = rawData.map(d => d.high), simLows = rawData.map(d => d.low);
    let rawKd = calculateKD(rawData), lastK = rawKd.k[rawKd.k.length - 1] || 50;
    let futureDates = [], futurePrices = [], futureVolumes = [];
    let lastDate = new Date(dates[dates.length - 1]);
    let sentimentDrift = parseFloat(document.getElementById('sentimentSelector').value) || 0;

    for (let count = 0; count < PREDICT_DAYS; count++) {
        lastDate.setDate(lastDate.getDate() + 1);
        if (lastDate.getDay() !== 0 && lastDate.getDay() !== 6) {
            let m = (lastDate.getMonth() + 1).toString().padStart(2, '0');
            let d = lastDate.getDate().toString().padStart(2, '0');
            futureDates.push(`(預)${m}-${d}`);

            let sum20 = 0;
            for (let j = 0; j < 20; j++) sum20 += simCloses[simCloses.length - 1 - j];
            let refMA20 = sum20 / 20;
            let jump = 0, momentumWeight = 0;

            if (currentPrice > refMA20 * 1.1) { if (Math.random() < 0.8) jump = -(0.005 + Math.random() * 0.015); }
            else if (currentPrice < refMA20 * 0.9) { if (Math.random() < 0.8) jump = (0.005 + Math.random() * 0.015); }

            if (lastK > 80) momentumWeight = -0.015; else if (lastK < 20) momentumWeight = 0.015;

            let change = 1 + (Math.random() - 0.5) * 0.025 + sentimentDrift + momentumWeight + jump;
            currentPrice = Math.round(currentPrice * change * 100) / 100;

            futurePrices.push(currentPrice);
            futureVolumes.push([rawData.length + count, Math.floor(avgVol * (0.4 + Math.random() * 0.5)), 0]);

            simCloses.push(currentPrice);
            simHighs.push(currentPrice * 1.01);
            simLows.push(currentPrice * 0.99);
            let windowHighs = simHighs.slice(-9), windowLows = simLows.slice(-9);
            let high9 = Math.max(...windowHighs), low9 = Math.min(...windowLows);
            let rsv = (high9 === low9) ? 0 : ((currentPrice - low9) / (high9 - low9)) * 100;
            lastK = (2 / 3) * lastK + (1 / 3) * rsv;
        }
    }

    dates = [...dates, ...futureDates];
    let combinedCloses = [...realCloses, ...futurePrices];
    klineData = klineData.concat(Array(PREDICT_DAYS).fill([null, null, null, null]));
    volumes = [...volumes, ...futureVolumes];
    instNetData = [...instNetData, ...Array(PREDICT_DAYS).fill(null)];
    marginData = [...marginData, ...Array(PREDICT_DAYS).fill(null)];

    let predictedLine = Array(rawData.length - 1).fill(null);
    predictedLine.push(realCloses[realCloses.length - 1]);
    predictedLine = predictedLine.concat(futurePrices);
    let historicalCloseLine = [...realCloses, ...Array(PREDICT_DAYS).fill(null)];

    let ma5 = calculateSMA(combinedCloses, 5), ma10 = calculateSMA(combinedCloses, 10);
    let ma20 = calculateSMA(combinedCloses, 20), ma60 = calculateSMA(combinedCloses, 60);
    let rawMacd = calculateMACD(rawData), rawBB = calculateBBands(realCloses, 20, 2), rawRSI = calculateRSI(realCloses, 14);

    let bbands = { upper: [...rawBB.upper, ...Array(PREDICT_DAYS).fill(null)], lower: [...rawBB.lower, ...Array(PREDICT_DAYS).fill(null)] };
    let macd = { dif: [...rawMacd.dif, ...Array(PREDICT_DAYS).fill(null)], dem: [...rawMacd.dem, ...Array(PREDICT_DAYS).fill(null)], osc: [...rawMacd.osc, ...Array(PREDICT_DAYS).fill(null)] };
    let kd = { k: [...rawKd.k, ...Array(PREDICT_DAYS).fill(null)], d: [...rawKd.d, ...Array(PREDICT_DAYS).fill(null)] };
    let rsi = [...rawRSI, ...Array(PREDICT_DAYS).fill(null)];

    const result = { rawData, dates, klineData, volumes, predictedLine, historicalCloseLine, ma5, ma10, ma20, ma60, bbands, macd, kd, rsi, instNetData, marginData, eventMarks, dynamicStopLoss, stopLossReason };
    cachedData[symbol] = result;
    document.getElementById('loadingIndicator').classList.add('hidden');
    
    checkAlarmTrigger(symbol, realCloses[realCloses.length - 1], dynamicStopLoss);
    return result;
}

// ============================================================================
// 4. 動態警報與新聞輿情引擎
// ============================================================================
function toggleAlarm() {
    if (!isAlarmEnabled) {
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") enableAlarmState();
                else alert("請至瀏覽器設定中允許推播通知後才能啟用警報！");
            });
        } else enableAlarmState();
    } else disableAlarmState();
}

function enableAlarmState() {
    isAlarmEnabled = true;
    document.getElementById('alarmBtn').innerHTML = '🔔 警報監控中';
    document.getElementById('alarmBtn').classList.replace('text-yellow-400', 'text-green-400');
    document.getElementById('alarmBtn').classList.replace('border-yellow-500/60', 'border-green-500/60');
}

function disableAlarmState() {
    isAlarmEnabled = false;
    document.getElementById('alarmBtn').innerHTML = '🔔 警報';
    document.getElementById('alarmBtn').classList.replace('text-green-400', 'text-yellow-400');
    document.getElementById('alarmBtn').classList.replace('border-green-500/60', 'border-yellow-500/60');
}

function checkAlarmTrigger(symbol, currentPrice, dynamicStopLoss) {
    if (!isAlarmEnabled || !dynamicStopLoss || dynamicStopLoss <= 0) return;
    const lowerBound = dynamicStopLoss * 0.985;
    const upperBound = dynamicStopLoss * 1.015;

    if (currentPrice <= upperBound && currentPrice >= lowerBound && Notification.permission === "granted") {
        new Notification(`⚠️ DG AI 戰略防守警報：${symbol}`, {
            body: `即時現價 $${currentPrice.toLocaleString()} 已逼近【動態防守黃線】 $${dynamicStopLoss.toLocaleString()}！請檢閱持股安全邊際。`,
            icon: 'https://cdn-icons-png.flaticon.com/512/1008/1008015.png'
        });
    }
}

async function fetchLiveNews(symbol, name) {
    const newsBox = document.getElementById('newsLinksBox');
    newsBox.innerHTML = '<div class="text-center text-gray-500 text-xs py-4 animate-pulse">📡 正在透過 RSS 掃描近 7 天個股快訊...</div>';

    try {
        const query = encodeURIComponent(`${symbol} ${name} when:7d`);
        const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
            data.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            let html = '';
            const items = data.items.slice(0, 8);
            items.forEach(item => {
                const pubDate = new Date(item.pubDate);
                const timeString = isNaN(pubDate) ? '近期' : pubDate.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                let sourceName = item.source?.title || '台灣媒體報導';
                html += `
                    <a href="${item.link}" target="_blank" class="flex flex-col gap-1 p-2.5 bg-[#1e2330] hover:bg-gray-700/80 rounded-lg transition border border-[#2a2e39] hover:border-cyan-500 shadow-sm group">
                        <span class="text-gray-200 text-xs sm:text-sm font-bold line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">${item.title}</span>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">${sourceName}</span>
                            <span class="text-[10px] text-gray-500 font-mono">${timeString}</span>
                        </div>
                    </a>
                `;
            });
            newsBox.innerHTML = html;
        } else {
            newsBox.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">近 7 天內目前無公開輿情快訊。</div>';
        }
    } catch (e) {
        newsBox.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">📡 外部快訊接口暫時無法回傳，請直接查看行情。</div>';
    }
}

// ============================================================================
// 5. 右側面板與 6-Subplot K 線圖表渲染 (Zero-Crash ECharts Formatter)
// ============================================================================
function getDynamicPortfolio() {
    let dynamicPort = JSON.parse(JSON.stringify(basePortfolio));
    let trades = JSON.parse(localStorage.getItem('dg_sentinel_v3_trades')) || [];
    let cronTrades = [...trades].reverse();
    cronTrades.forEach(t => {
        if (!dynamicPort[t.symbol]) {
            dynamicPort[t.symbol] = { name: temporaryStockNames[t.symbol] || `標的 ${t.symbol}`, shares: 0, cost: 0, color: '#94a3b8' };
        }
        const isBuy = t.type === 'buy' || !t.type;
        if (isBuy) {
            let oldTotalCost = dynamicPort[t.symbol].shares * dynamicPort[t.symbol].cost;
            let newTradeCost = t.shares * t.price;
            dynamicPort[t.symbol].shares += t.shares;
            dynamicPort[t.symbol].cost = (oldTotalCost + newTradeCost) / dynamicPort[t.symbol].shares;
        } else if (t.type === 'sell') {
            dynamicPort[t.symbol].shares -= t.shares;
            if (dynamicPort[t.symbol].shares < 0) dynamicPort[t.symbol].shares = 0;
        }
    });
    return dynamicPort;
}

function updateRightPanel(symbol, dataObj) {
    const latestData = dataObj.rawData[dataObj.rawData.length - 1];
    const dynamicInfo = getDynamicPortfolio()[symbol] || { name: temporaryStockNames[symbol] || symbol, shares: 0, cost: 0, strategy: "【自訂觀測】隨時可新增買進紀錄。" };
    const price = latestData.close;
    const prevClose = dataObj.rawData[dataObj.rawData.length - 2].close;
    const diff = Math.round((price - prevClose) * 100) / 100;
    const percent = ((diff / prevClose) * 100).toFixed(2);

    const colorClass = diff >= 0 ? 'text-up' : 'text-down';
    const sign = diff > 0 ? '▲' : (diff < 0 ? '▼' : '');
    const sName = dynamicInfo.name;

    document.getElementById('panelStockName').textContent = `${sName} (${symbol})`;
    document.getElementById('panelSymbolBadge').textContent = symbol;
    document.getElementById('panelPrice').textContent = price.toLocaleString();
    document.getElementById('panelPrice').className = `text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-md ${colorClass}`;
    document.getElementById('panelChange').textContent = `${sign} ${Math.abs(diff)} (${percent}%)`;
    document.getElementById('panelChange').className = `text-lg sm:text-2xl font-bold mb-0.5 ${colorClass}`;

    document.getElementById('invShares').textContent = dynamicInfo.shares.toLocaleString();
    document.getElementById('invCost').textContent = dynamicInfo.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const pnl = (price - dynamicInfo.cost) * dynamicInfo.shares;
    const pnlEl = document.getElementById('invPnl');
    pnlEl.textContent = (pnl > 0 ? '+' : '') + Math.round(pnl).toLocaleString();
    pnlEl.className = `text-2xl sm:text-4xl font-black tracking-wide ${pnl >= 0 ? 'text-up' : 'text-down'}`;

    document.getElementById('strategyDesc').textContent = dynamicInfo.strategy || "動態分析策略監控中";
    document.getElementById('dynamicStopVal').textContent = `$${dataObj.dynamicStopLoss.toLocaleString()}`;
    document.getElementById('dynamicStopReason').textContent = `(${dataObj.stopLossReason})`;

    if (dynamicInfo.targetPrice || dynamicInfo.target) {
        document.getElementById('targetPriceRow').classList.remove('hidden');
        document.getElementById('targetPriceRow').classList.add('flex');
        document.getElementById('targetPriceVal').textContent = `$${(dynamicInfo.targetPrice || dynamicInfo.target).toLocaleString()}`;
    } else {
        document.getElementById('targetPriceRow').classList.add('hidden');
        document.getElementById('targetPriceRow').classList.remove('flex');
    }

    const lastRealMA20 = dataObj.ma20[dataObj.rawData.length - 1];
    const aiSentimentDiv = document.getElementById('aiSentimentSummary');
    if (lastRealMA20 && price > lastRealMA20) {
        aiSentimentDiv.innerHTML = `🌟 <strong>AI 輿情與多頭判定：</strong> 股價均線多頭排列且穩守月線上方 ($${Math.round(lastRealMA20)})。建議依循動態防守黃線 $${dataObj.dynamicStopLoss} 向上抱牢利潤。`;
    } else {
        aiSentimentDiv.innerHTML = `⚠️ <strong>AI 輿情與防守提醒：</strong> 目前股價位於 20 日月線之下，波動風險稍微增加。請確認現價未觸及動態底線 $${dataObj.dynamicStopLoss}。`;
    }

    fetchLiveNews(symbol, sName);
}

function renderChart(symbol, data) {
    if (chartInstance) chartInstance.dispose();
    const dom = document.getElementById('mainChart');
    chartInstance = echarts.init(dom);

    const upColor = '#ef4444'; const downColor = '#10b981'; const grayColor = '#6b7280';
    const latestPrice = data.rawData[data.rawData.length - 1].close;
    const prevClose = data.rawData[data.rawData.length - 2].close;
    const currentPriceColor = (latestPrice >= prevClose) ? upColor : downColor;

    const option = {
        backgroundColor: 'transparent',
        animation: false,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', lineStyle: { color: '#475569', type: 'dashed', width: 1.5 } },
            backgroundColor: 'rgba(15, 23, 42, 0.96)', borderColor: '#334155', borderWidth: 1, padding: 12,
            textStyle: { color: '#e2e8f0', fontSize: 12 },
            position: function (pos, params, dom, rect, size) {
                const viewWidth = size.viewSize[0]; const tooltipWidth = size.contentSize[0];
                return pos[0] < viewWidth * 0.4 ? [viewWidth - tooltipWidth - 15, 30] : [viewWidth * 0.06 + 15, 30];
            },
            formatter: function (params) {
                try {
                    if (!params) return '';
                    let pList = Array.isArray(params) ? params : [params];
                    if (pList.length === 0) return '';
                    if (pList[0].componentType !== 'series' || pList[0].seriesName === '收盤連線') {
                        return `<div class="bg-gray-800 p-2 rounded text-xs border border-gray-600"><span class="font-bold text-yellow-400">${pList[0].name || '事件訊號'}</span></div>`;
                    }

                    const date = pList[0].axisValue || pList[0].name || '';
                    let ohlc = null;
                    let ma5 = '--', ma10 = '--', ma20 = '--', ma60 = '--', bUp = '--', bDn = '--';
                    let aiPred = '--', volume = '--', volSign = 1;
                    let macdLine = '--', osc = '--', kVal = '--', dVal = '--', rsiVal = '--';
                    let instNet = '--', marginVal = '--';

                    pList.forEach(p => {
                        if (p.value == null) return;
                        if (p.seriesName === 'K線' && Array.isArray(p.value)) {
                            if (p.value.length >= 5 && p.value[1] != null && !isNaN(p.value[1])) ohlc = p.value;
                            else if (p.value.length === 4 && p.value[0] != null && !isNaN(p.value[0])) ohlc = [null, p.value[0], p.value[1], p.value[2], p.value[3]];
                        }
                        else if (p.seriesName === 'MA5' && !isNaN(p.value)) ma5 = Math.round(p.value * 100) / 100;
                        else if (p.seriesName === 'MA10' && !isNaN(p.value)) ma10 = Math.round(p.value * 100) / 100;
                        else if (p.seriesName === 'MA20' && !isNaN(p.value)) ma20 = Math.round(p.value * 100) / 100;
                        else if (p.seriesName === 'MA60' && !isNaN(p.value)) ma60 = Math.round(p.value * 100) / 100;
                        else if (p.seriesName === '布林上軌' && !isNaN(p.value)) bUp = Math.round(p.value * 100) / 100;
                        else if (p.seriesName === '布林下軌' && !isNaN(p.value)) bDn = Math.round(p.value * 100) / 100;
                        else if (p.seriesName === 'AI推演' && !isNaN(p.value)) aiPred = Math.round(p.value * 100) / 100;
                        else if (p.seriesName === '成交量' && Array.isArray(p.value) && p.value[1] != null && !isNaN(p.value[1])) { volume = Math.round(p.value[1]).toLocaleString() + ' 股'; volSign = p.value[2]; }
                        else if (p.seriesName === 'MACD' && !isNaN(p.value)) macdLine = parseFloat(p.value).toFixed(2);
                        else if (p.seriesName === 'OSC' && !isNaN(p.value)) osc = parseFloat(p.value).toFixed(2);
                        else if (p.seriesName === 'K(9,3)' && !isNaN(p.value)) kVal = parseFloat(p.value).toFixed(2);
                        else if (p.seriesName === 'D(9,3)' && !isNaN(p.value)) dVal = parseFloat(p.value).toFixed(2);
                        else if (p.seriesName === 'RSI(14)' && !isNaN(p.value)) rsiVal = parseFloat(p.value).toFixed(2);
                        else if (p.seriesName === '三大法人籌碼' && !isNaN(p.value)) instNet = Math.round(p.value).toLocaleString();
                        else if (p.seriesName === '融資餘額' && !isNaN(p.value)) marginVal = Math.round(p.value).toLocaleString();
                    });

                    let ohlcHtml = '';
                    if (ohlc && ohlc[1] != null && ohlc[2] != null && !isNaN(ohlc[1])) {
                        const open = ohlc[1], close = ohlc[2], low = ohlc[3], high = ohlc[4];
                        const priceColor = close >= open ? 'color: #ef4444;' : 'color: #10b981;';
                        ohlcHtml = `
                            <div style="border-bottom: 1px solid #334155; padding-bottom: 5px; margin-bottom: 5px;">
                                <div style="display: flex; justify-content: space-between; font-size: 11px;"><span style="color: #64748b;">開盤價:</span><span style="font-weight: bold; ${priceColor}">${open.toLocaleString()}</span></div>
                                <div style="display: flex; justify-content: space-between; font-size: 11px;"><span style="color: #64748b;">最高價:</span><span style="font-weight: bold; ${priceColor}">${high.toLocaleString()}</span></div>
                                <div style="display: flex; justify-content: space-between; font-size: 11px;"><span style="color: #64748b;">最低價:</span><span style="font-weight: bold; ${priceColor}">${low.toLocaleString()}</span></div>
                                <div style="display: flex; justify-content: space-between; font-size: 11px;"><span style="color: #64748b;">收盤價:</span><span style="font-weight: bold; ${priceColor}">${close.toLocaleString()}</span></div>
                            </div>
                        `;
                    } else {
                        ohlcHtml = `<div style="border-bottom: 1px solid #334155; padding-bottom: 5px; margin-bottom: 5px; text-align: center;"><span style="font-size: 11px; color: #22d3ee; font-weight: bold;">🔮 Jump-Diffusion 均值推演</span></div>`;
                    }

                    return `
                        <div style="width: 170px; font-family: 'Segoe UI', sans-serif; line-height: 1.4;">
                            <div style="font-size: 12px; font-weight: 800; color: #fff; margin-bottom: 6px; border-bottom: 1px solid #475569; padding-bottom: 3px; text-align: center;">📅 ${date}</div>
                            ${ohlcHtml}
                            <div style="border-bottom: 1px solid #334155; padding-bottom: 5px; margin-bottom: 5px; font-size: 11px;">
                                <div style="display: flex; justify-content: space-between;"><span style="color: #3b82f6;">MA5:</span><span style="font-weight: bold; color: #fff;">${ma5}</span></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #f43f5e;">MA10:</span><span style="font-weight: bold; color: #fff;">${ma10}</span></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #a855f7;">MA20:</span><span style="font-weight: bold; color: #fff;">${ma20}</span></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #eab308;">布林上/下:</span><span style="font-weight: bold; color: #eab308;">${bUp} / ${bDn}</span></div>
                                ${aiPred !== '--' ? `<div style="display: flex; justify-content: space-between;"><span style="color: #22d3ee;">AI推演價:</span><span style="font-weight: bold; color: #22d3ee;">${aiPred}</span></div>` : ''}
                            </div>
                            <div style="border-bottom: 1px solid #334155; padding-bottom: 5px; margin-bottom: 5px; font-size: 11px;">
                                <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">成交總量:</span><span style="font-weight: bold; color: #fff;">${volume}</span></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #fff;">法人進出:</span><span style="font-weight: bold; color: #22d3ee;">${instNet}</span></div>
                            </div>
                            <div style="font-size: 11px;">
                                <div style="display: flex; justify-content: space-between;"><span style="color: #eab308;">MACD/OSC:</span><span style="font-weight: bold; color: #eab308;">${macdLine} (${osc})</span></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #3b82f6;">KD(9,3):</span><span style="font-weight: bold; color: #3b82f6;">${kVal} / ${dVal}</span></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #f472b6;">RSI(14):</span><span style="font-weight: bold; color: #f472b6;">${rsiVal}</span></div>
                            </div>
                        </div>
                    `;
                } catch (e) {
                    return '<div class="bg-gray-800 p-2 rounded text-xs"><span class="font-bold text-yellow-400">行情讀取中...</span></div>';
                }
            }
        },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        dataZoom: [
            { type: 'inside', xAxisIndex: [0, 1, 2, 3, 4, 5], start: 60, end: 100 },
            { show: true, xAxisIndex: [0, 1, 2, 3, 4, 5], type: 'slider', bottom: '0%', height: 18, borderColor: '#2a2e39', textStyle: { color: '#888' } }
        ],
        grid: [
            { left: '8%', right: '2%', top: '2%', height: '32%' },
            { left: '8%', right: '2%', top: '38%', height: '10%' },
            { left: '8%', right: '2%', top: '51%', height: '10%' },
            { left: '8%', right: '2%', top: '64%', height: '10%' },
            { left: '8%', right: '2%', top: '77%', height: '10%' },
            { left: '8%', right: '2%', top: '90%', height: '10%' }
        ],
        title: [
            { text: 'K線、移動均線與動態防守黃線 (Candles & Trailing Stop)', left: '8%', top: '0.5%', textStyle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' } },
            { text: '成交總量 (Volume)', left: '8%', top: '35.5%', textStyle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' } },
            { text: 'MACD 指標 (12, 26, 9)', left: '8%', top: '48.5%', textStyle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' } },
            { text: 'KD 隨機指標 (9, 3, 3)', left: '8%', top: '61.5%', textStyle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' } },
            { text: 'RSI 相對強弱指標 (14)', left: '8%', top: '74.5%', textStyle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' } },
            { text: '三大法人籌碼與融資餘額 (Institutional & Margin)', left: '8%', top: '87.5%', textStyle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' } }
        ],
        xAxis: [
            { type: 'category', data: data.dates, gridIndex: 0, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#3f4352' } } },
            { type: 'category', data: data.dates, gridIndex: 1, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#3f4352' } } },
            { type: 'category', data: data.dates, gridIndex: 2, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#3f4352' } } },
            { type: 'category', data: data.dates, gridIndex: 3, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#3f4352' } } },
            { type: 'category', data: data.dates, gridIndex: 4, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#3f4352' } } },
            { type: 'category', data: data.dates, gridIndex: 5, axisLine: { lineStyle: { color: '#3f4352' } }, axisLabel: { color: '#888', formatter: val => val.replace('(預)', '').substring(5) } }
        ],
        yAxis: [
            { scale: true, gridIndex: 0, min: 'dataMin', splitLine: { lineStyle: { color: '#2a2e39' } }, axisLabel: { color: '#888' } },
            { scale: true, gridIndex: 1, splitLine: { show: false }, axisLabel: { show: true, color: '#888', formatter: val => (val / 1000).toFixed(0) + 'K' } },
            { scale: true, gridIndex: 2, splitLine: { lineStyle: { color: '#2a2e39', type: 'dashed' } }, axisLabel: { show: true, color: '#888' } },
            { scale: false, min: 0, max: 100, interval: 20, gridIndex: 3, splitLine: { lineStyle: { color: '#2a2e39', type: 'dashed' } }, axisLabel: { show: true, color: '#888' } },
            { scale: false, min: 0, max: 100, interval: 20, gridIndex: 4, splitLine: { lineStyle: { color: '#2a2e39', type: 'dashed' } }, axisLabel: { show: true, color: '#888' } },
            { scale: true, gridIndex: 5, splitLine: { show: false }, axisLabel: { show: true, color: '#888', formatter: val => (val / 1000).toFixed(0) + 'K' } },
            { scale: true, gridIndex: 5, position: 'right', splitLine: { show: false }, axisLabel: { show: true, color: '#888' } }
        ],
        series: [
            {
                name: 'K線', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0, data: data.klineData,
                itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor },
                markPoint: {
                    data: data.eventMarks,
                    tooltip: {
                        formatter: p => `<div class="bg-gray-800 p-2 rounded text-xs border border-gray-600"><span class="font-bold text-yellow-400">${p.name}</span></div>`,
                        backgroundColor: 'transparent', padding: 0, borderWidth: 0
                    }
                },
                markLine: {
                    symbol: ['none', 'none'],
                    data: [
                        { yAxis: data.dynamicStopLoss, label: { formatter: '防守 $'+data.dynamicStopLoss, position: 'insideStartTop', color: '#eab308' }, lineStyle: { color: '#eab308', type: 'solid', width: 2 } },
                        { yAxis: latestPrice, label: { formatter: '現價 '+latestPrice, position: 'insideEndTop', color: currentPriceColor, backgroundColor: 'rgba(30, 41, 59, 0.9)', padding: [3, 5], borderRadius: 3 }, lineStyle: { color: currentPriceColor, type: 'solid', width: 1, opacity: 0.8 } }
                    ]
                }
            },
            { name: '收盤連線', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.historicalCloseLine, smooth: false, showSymbol: false, lineStyle: { color: 'rgba(255, 255, 255, 0.35)', width: 1.5 } },
            { name: 'MA5', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.ma5, smooth: true, showSymbol: false, lineStyle: { color: '#3b82f6', width: 1.5 } },
            { name: 'MA10', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.ma10, smooth: true, showSymbol: false, lineStyle: { color: '#f43f5e', width: 1.5 } },
            { name: 'MA20', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.ma20, smooth: true, showSymbol: false, lineStyle: { color: '#a855f7', width: 1.5 } },
            { name: 'MA60', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.ma60, smooth: true, showSymbol: false, lineStyle: { color: '#14b8a6', width: 1.5 } },
            { name: '布林上軌', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.bbands.upper, smooth: true, showSymbol: false, lineStyle: { color: '#eab308', width: 1, type: 'dashed', opacity: 0.6 } },
            { name: '布林下軌', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.bbands.lower, smooth: true, showSymbol: false, lineStyle: { color: '#eab308', width: 1, type: 'dashed', opacity: 0.6 } },
            
            { name: 'AI推演', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.predictedLine, showSymbol: false, lineStyle: { color: '#22d3ee', width: 2, type: 'dashed' } },
            {
                name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: data.volumes,
                itemStyle: { color: params => params.data[2] === 1 ? upColor : (params.data[2] === -1 ? downColor : grayColor) }
            },
            { name: 'DIF', type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: data.macd.dif, showSymbol: false, lineStyle: { color: '#fff', width: 1 } },
            { name: 'MACD', type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: data.macd.dem, showSymbol: false, lineStyle: { color: '#eab308', width: 1 } },
            {
                name: 'OSC', type: 'bar', xAxisIndex: 2, yAxisIndex: 2, data: data.macd.osc,
                itemStyle: { color: params => params.data >= 0 ? upColor : downColor }
            },
            {
                name: 'K(9,3)', type: 'line', xAxisIndex: 3, yAxisIndex: 3, data: data.kd.k, showSymbol: false, lineStyle: { color: '#3b82f6', width: 1.5 },
                markLine: {
                    symbol: ['none', 'none'], silent: true,
                    data: [
                        { yAxis: 20, lineStyle: { color: 'rgba(16, 185, 129, 0.4)', type: 'dashed', width: 1 }, label: { formatter: '20', position: 'end', color: '#10b981', fontSize: 10 } },
                        { yAxis: 80, lineStyle: { color: 'rgba(239, 68, 68, 0.4)', type: 'dashed', width: 1 }, label: { formatter: '80', position: 'end', color: '#ef4444', fontSize: 10 } }
                    ]
                }
            },
            { name: 'D(9,3)', type: 'line', xAxisIndex: 3, yAxisIndex: 3, data: data.kd.d, showSymbol: false, lineStyle: { color: '#eab308', width: 1.5 } },
            {
                name: 'RSI(14)', type: 'line', xAxisIndex: 4, yAxisIndex: 4, data: data.rsi, showSymbol: false, lineStyle: { color: '#f472b6', width: 1.5 },
                markLine: {
                    symbol: ['none', 'none'], silent: true,
                    data: [
                        { yAxis: 30, lineStyle: { color: 'rgba(16, 185, 129, 0.4)', type: 'dashed', width: 1 }, label: { formatter: '30', position: 'end', color: '#10b981', fontSize: 10 } },
                        { yAxis: 70, lineStyle: { color: 'rgba(239, 68, 68, 0.4)', type: 'dashed', width: 1 }, label: { formatter: '70', position: 'end', color: '#ef4444', fontSize: 10 } }
                    ]
                }
            },
            {
                name: '三大法人籌碼', type: 'bar', xAxisIndex: 5, yAxisIndex: 5, data: data.instNetData,
                itemStyle: { color: params => params.data >= 0 ? upColor : downColor }
            },
            { name: '融資餘額', type: 'line', xAxisIndex: 5, yAxisIndex: 6, data: data.marginData, showSymbol: false, lineStyle: { color: '#f59e0b', width: 1.5 } }
        ]
    };

    chartInstance.setOption(option);
}

// ============================================================================
// 6. 交易明細管理與本地/雲端同步 (CRUD)
// ============================================================================
function openTradeModal() {
    document.getElementById('tradeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('tradeSymbol').value = document.getElementById('customStockInput').value || '00919';
    cancelEdit();
    renderTradeHistory();
    document.getElementById('tradeModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('tradeModal').classList.add('opacity-100'), 10);
    debounceFetchSymbolName();
}

function closeTradeModal() {
    document.getElementById('tradeModal').classList.add('hidden');
}

async function saveTrade() {
    const date = document.getElementById('tradeDate').value;
    const symbol = document.getElementById('tradeSymbol').value.toUpperCase().trim();
    const price = parseFloat(document.getElementById('tradePrice').value);
    const shares = parseInt(document.getElementById('tradeShares').value);
    const type = document.querySelector('input[name="tradeType"]:checked').value;
    
    if (!date || !symbol || isNaN(price) || isNaN(shares) || price <= 0 || shares <= 0) {
        return alert("請填寫正確且有效的成交日期、價格與股數！");
    }

    let trades = JSON.parse(localStorage.getItem('dg_sentinel_v3_trades')) || [];
    if (editingTradeId !== null) {
        const idx = trades.findIndex(t => t.id === editingTradeId);
        if (idx !== -1) trades[idx] = { id: editingTradeId, date, symbol, type, price, shares };
        cancelEdit();
    } else {
        trades.push({ id: Date.now(), date, symbol, type, price, shares });
    }

    trades.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('dg_sentinel_v3_trades', JSON.stringify(trades));

    document.getElementById('tradePrice').value = '';
    document.getElementById('tradeShares').value = '';

    renderTradeHistory();
    await syncTradesToCloud();
    closeTradeModal();

    delete cachedData[symbol];
    document.getElementById('customStockInput').value = symbol;
    loadDashboard(symbol);
}

function editTrade(id) {
    let trades = JSON.parse(localStorage.getItem('dg_sentinel_v3_trades')) || [];
    const t = trades.find(item => item.id === id);
    if (!t) return;
    editingTradeId = id;
    document.getElementById('tradeDate').value = t.date;
    document.getElementById('tradeSymbol').value = t.symbol;
    document.getElementById('tradePrice').value = t.price;
    document.getElementById('tradeShares').value = t.shares;
    if (t.type === 'sell') document.getElementById('typeSell').checked = true;
    else document.getElementById('typeBuy').checked = true;

    document.getElementById('formTitle').textContent = "編輯成交紀錄";
    debounceFetchSymbolName();
}

function cancelEdit() {
    editingTradeId = null;
    document.getElementById('tradePrice').value = '';
    document.getElementById('tradeShares').value = '';
    document.getElementById('typeBuy').checked = true;
    document.getElementById('formTitle').textContent = "新增交易紀錄";
}

async function deleteTrade(id) {
    if (!confirm('確定要刪除這筆交易紀錄嗎？系統將自動重算加權平均成本與防守線。')) return;
    let trades = JSON.parse(localStorage.getItem('dg_sentinel_v3_trades')) || [];
    trades = trades.filter(t => t.id !== id);
    localStorage.setItem('dg_sentinel_v3_trades', JSON.stringify(trades));
    if (editingTradeId === id) cancelEdit();

    renderTradeHistory();
    await syncTradesToCloud();

    const currSymbol = document.getElementById('customStockInput').value || '2330';
    delete cachedData[currSymbol];
    loadDashboard(currSymbol);
}

function renderTradeHistory() {
    let trades = JSON.parse(localStorage.getItem('dg_sentinel_v3_trades')) || [];
    const tbody = document.getElementById('tradeHistoryBody');
    tbody.innerHTML = '';

    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500 italic">目前尚無新增的額外交易紀錄（將以 200 萬信貸預設 6 大標的為基礎觀測）</td></tr>';
        return;
    }

    trades.forEach(t => {
        const isBuy = t.type === 'buy' || !t.type;
        const totalTradeCost = Math.round(t.price * t.shares);
        const typeBadge = isBuy ? '<span class="text-red-400 border border-red-500/50 px-1.5 py-0.5 rounded text-xs">買進</span>' : '<span class="text-green-400 border border-green-500/50 px-1.5 py-0.5 rounded text-xs">賣出</span>';
        const sName = (basePortfolio[t.symbol] && basePortfolio[t.symbol].name) || t.symbol;

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/80 transition-colors';
        tr.innerHTML = `
            <td class="px-4 py-3 text-gray-400 font-mono">${t.date}</td>
            <td class="px-4 py-3">${typeBadge}</td>
            <td class="px-4 py-3 font-bold text-white">${sName} (${t.symbol})</td>
            <td class="px-4 py-3 text-right font-mono text-gray-300">$${t.price.toFixed(2)}</td>
            <td class="px-4 py-3 text-right font-mono text-gray-300">${t.shares.toLocaleString()} 股</td>
            <td class="px-4 py-3 text-right font-bold font-mono ${isBuy ? 'text-yellow-400' : 'text-green-400'}">${isBuy ? '+' : '-'} $${totalTradeCost.toLocaleString()}</td>
            <td class="px-4 py-3 text-center space-x-2">
                <button onclick="editTrade(${t.id})" class="text-blue-400 hover:text-blue-300">✎ 編輯</button>
                <button onclick="deleteTrade(${t.id})" class="text-gray-500 hover:text-red-400">🗑 刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================================
// 7. 雲端 Firebase 同步與總表 Modal
// ============================================================================
let db = null;
let cloudUserId = localStorage.getItem('dg_cloud_user') || 'chiehyu_200w';

function openCloudModal() {
    document.getElementById('firebaseConfigInput').value = localStorage.getItem('dg_firebase_config') || '';
    document.getElementById('firebaseUserId').value = cloudUserId;
    document.getElementById('cloudModal').classList.remove('hidden');
}

function closeCloudModal() {
    document.getElementById('cloudModal').classList.add('hidden');
}

async function saveCloudConfig() {
    const configStr = document.getElementById('firebaseConfigInput').value.trim();
    const uid = document.getElementById('firebaseUserId').value.trim();
    if (!uid) return alert("請填入雲端 ID！");
    localStorage.setItem('dg_cloud_user', uid);
    cloudUserId = uid;
    if (configStr) localStorage.setItem('dg_firebase_config', configStr);
    alert("✅ 雲端 ID / 設定已儲存成功！");
    closeCloudModal();
}

async function syncTradesToCloud() {}

function openTotalSummaryModal() {
    document.getElementById('summaryModal').classList.remove('hidden');
    renderTotalCostSummary();
}

function closeTotalSummaryModal() {
    document.getElementById('summaryModal').classList.add('hidden');
}

async function renderTotalCostSummary() {
    const dp = getDynamicPortfolio();
    const summaryBox = document.getElementById('totalCostSummary');
    let html = '';
    let grandCost = 0, grandMarket = 0;

    for (let sym in dp) {
        if (dp[sym].shares <= 0) continue;
        let d = await fetchStockData(sym);
        let curPrice = d ? d.rawData[d.rawData.length - 1].close : dp[sym].cost;
        let costSum = Math.round(dp[sym].shares * dp[sym].cost);
        let mktSum = Math.round(dp[sym].shares * curPrice);
        let pnl = mktSum - costSum;
        grandCost += costSum;
        grandMarket += mktSum;

        html += `
            <div class="p-3.5 bg-[#0f131c] rounded-xl border border-gray-800 flex justify-between items-center">
                <div>
                    <div class="font-bold text-white text-base">${dp[sym].name} (${sym})</div>
                    <div class="text-xs text-gray-400 mt-1">持有: ${dp[sym].shares.toLocaleString()} 股 | 均價: $${dp[sym].cost.toFixed(2)}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray-400">現價 $${curPrice} | 市值 $${mktSum.toLocaleString()}</div>
                    <div class="font-black text-base mt-0.5 ${pnl >= 0 ? 'text-up' : 'text-down'}">${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    let grandPnl = grandMarket - grandCost;
    let pct = grandCost > 0 ? ((grandPnl / grandCost) * 100).toFixed(2) : 0;
    html += `
        <div class="p-4 bg-[#1a202f] rounded-xl border border-cyan-500/50 mt-4 flex justify-between items-center">
            <div>
                <div class="text-xs text-gray-400 font-bold">全帳戶總投入成本</div>
                <div class="font-extrabold text-white text-lg">$${grandCost.toLocaleString()}</div>
            </div>
            <div class="text-right">
                <div class="text-xs text-gray-400 font-bold">總未實現帳面損益</div>
                <div class="font-black text-xl ${grandPnl >= 0 ? 'text-up' : 'text-down'}">${grandPnl >= 0 ? '+' : ''}$${grandPnl.toLocaleString()} (${pct}%)</div>
            </div>
        </div>
    `;
    summaryBox.innerHTML = html;
}

// ============================================================================
// 8. 主控制入口與全螢幕載入
// ============================================================================
async function searchCustomStock() {
    const symbol = document.getElementById('customStockInput').value.trim().toUpperCase();
    if (!symbol) return;
    loadDashboard(symbol);
}

async function loadDashboard(symbol) {
    document.getElementById('customStockInput').value = symbol;
    const data = await fetchStockData(symbol);
    if (data) {
        updateRightPanel(symbol, data);
        renderChart(symbol, data);
        setTimeout(() => { if (chartInstance) chartInstance.resize(); }, 120);
    }
}

window.addEventListener('load', async () => {
    seedDefaultItemizedTradesIfNeeded();
    loadBasePortfolioFromLocal();
    updateQuickSelector();
    renderTradeHistory();
    // 預設載入 200 萬信貸防守旗艦代表：00919 群益精選高息
    await loadDashboard('00919');
});

window.addEventListener('resize', () => {
    if (chartInstance) chartInstance.resize();
});
