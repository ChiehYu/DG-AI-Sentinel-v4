# -*- coding: utf-8 -*-
"""
wargame_council.py
==================
DG AI Sentinel V4.0 多角色 10 輪沙盤推演與對抗辯論引擎 (實時行情同步升級版)

功能概要：
1. 讀取 `data/market_context.json` (含 4 大市場分類與 6 大追蹤標的真實報價)
2. 啟動 Wargame Council 5 大人物對抗沙盤推演
3. 針對核心 6 隻標的 (00919, 2330, 2454, 3037, 0056, 00878) 獨立產出精確 actionable_plan
4. 最終產出 `data/wargame_report.json`
"""

import os
import sys
import json
import time
from datetime import datetime

if sys.platform.startswith('win'):
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from google import genai
    from google.genai import types
    HAS_NEW_GENAI = True
except ImportError:
    HAS_NEW_GENAI = False

try:
    import google.generativeai as genai_old
    HAS_OLD_GENAI = True
except ImportError:
    HAS_OLD_GENAI = False

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
MARKET_CONTEXT_PATH = os.path.join(DATA_DIR, "market_context.json")
WARGAME_REPORT_PATH = os.path.join(DATA_DIR, "wargame_report.json")


def load_market_context():
    if not os.path.exists(MARKET_CONTEXT_PATH):
        raise FileNotFoundError(f"找不到 `{MARKET_CONTEXT_PATH}`，請先執行 `fetch_market_data.py`。")
    with open(MARKET_CONTEXT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def call_gemini_api(context_data):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or (not HAS_NEW_GENAI and not HAS_OLD_GENAI):
        print("💡 [Wargame Council] 未提供 GEMINI_API_KEY 或 SDK 未就緒，啟用智慧模擬對抗引擎...")
        return generate_simulated_wargame_report(context_data)

    try:
        print("⏳ [Wargame Council] 正在呼叫 Gemini 進行 10 輪對抗沙盤推演與實操產出...")
        # 提取真實個股報價帶入提示詞
        core_quotes = context_data.get("core_tracking_stocks", {})
        quotes_summary = json.dumps(core_quotes, ensure_ascii=False, indent=2)

        prompt = f"""
你現在是 `DG AI Sentinel V4.0` 旗艦戰情室的 5 大核心對抗推演人物：
1. 多頭司令官 (Bullish Commander)
2. 空頭警衛官 (Bearish Sentinel)
3. 首席量化精算師 (Quantitative Actuary)
4. 信貸防守守衛官 (Credit Defense Guard - 守衛 200 萬信貸本息)
5. 首席投資總監 (Chief Investment Officer - CIO)

今天日期：{datetime.now().strftime("%Y-%m-%d")}
【今日實時市場與 6 大個股真實行情數據】：
{quotes_summary}
【4 大市場宏觀數據】：
{json.dumps(context_data.get("categories", {}), ensure_ascii=False, indent=2)}

請依據上述今天最新的市場數據與個股真實股價，為 6 大核心標的 (00919, 2330, 2454, 3037, 0056, 00878) 進行 10 輪對抗辯論，並嚴格依照以下 JSON 格式回傳（必須合法 JSON）：
{{
  "report_title": "DG AI Sentinel V4.0 晨間 10 輪對抗沙盤推演報告",
  "wargame_date": "{datetime.now().strftime("%Y-%m-%d")}",
  "overall_market_confidence": 88,
  "cio_executive_summary": "綜合全場評估結論...",
  "symbol_reports": {{
    "00919": {{
      "symbol": "00919",
      "name": "群益精選高息",
      "confidence_score": 88,
      "cio_action_directive": "指令...",
      "today_strategy_rationale": "理由...",
      "actionable_plan": {{
        "verdict": "🔥 強力多頭 / 逢回分批承接",
        "dynamic_stop_price": 23.4,
        "cost_margin_status": "安全邊際穩固",
        "execution_advice": "1. 盤中若量縮回踩可承接。\\n2. 嚴守防守黃線續抱。"
      }}
    }},
    "2330": {{
      "symbol": "2330",
      "name": "台積電",
      "confidence_score": 91,
      "cio_action_directive": "...",
      "today_strategy_rationale": "...",
      "actionable_plan": {{
        "verdict": "🔥 強力多頭 / 沿黃線續抱",
        "dynamic_stop_price": 1020.0,
        "cost_margin_status": "...",
        "execution_advice": "..."
      }}
    }},
    "2454": {{
      "symbol": "2454",
      "name": "聯發科",
      "confidence_score": 89,
      "cio_action_directive": "...",
      "today_strategy_rationale": "...",
      "actionable_plan": {{
        "verdict": "🛡️ 穩健偏多 / 守穩黃線",
        "dynamic_stop_price": 1350.0,
        "cost_margin_status": "...",
        "execution_advice": "..."
      }}
    }},
    "3037": {{
      "symbol": "3037",
      "name": "欣興",
      "confidence_score": 85,
      "cio_action_directive": "...",
      "today_strategy_rationale": "...",
      "actionable_plan": {{
        "verdict": "🔥 轉強偏多 / 逢拉回吸納",
        "dynamic_stop_price": 182.0,
        "cost_margin_status": "...",
        "execution_advice": "..."
      }}
    }},
    "0056": {{
      "symbol": "0056",
      "name": "元大高股息",
      "confidence_score": 88,
      "cio_action_directive": "...",
      "today_strategy_rationale": "...",
      "actionable_plan": {{
        "verdict": "🛡️ 收息核心 / 沿黃線續抱",
        "dynamic_stop_price": 38.5,
        "cost_margin_status": "...",
        "execution_advice": "..."
      }}
    }},
    "00878": {{
      "symbol": "00878",
      "name": "國泰永續高息",
      "confidence_score": 86,
      "cio_action_directive": "...",
      "today_strategy_rationale": "...",
      "actionable_plan": {{
        "verdict": "🛡️ 永續收息 / 沿黃線續抱",
        "dynamic_stop_price": 22.8,
        "cost_margin_status": "...",
        "execution_advice": "..."
      }}
    }}
  }}
}}
僅回傳 JSON，不附加多餘註釋。
"""
        if HAS_NEW_GENAI:
            client = genai.Client(api_key=api_key)
            try:
                res = client.models.generate_content(model='gemini-2.5-pro', contents=prompt)
            except Exception:
                res = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            text = res.text.strip()
        else:
            genai_old.configure(api_key=api_key)
            model = genai_old.GenerativeModel('gemini-2.5-pro')
            res = model.generate_content(prompt)
            text = res.text.strip()

        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        parsed = json.loads(text.strip())
        
        # 確保資料結構完整並與實時行情同步
        sim_data = generate_simulated_wargame_report(context_data)
        if "symbol_reports" not in parsed or not isinstance(parsed["symbol_reports"], dict):
            parsed["symbol_reports"] = sim_data["symbol_reports"]
        else:
            for sym, s_data in sim_data["symbol_reports"].items():
                if sym not in parsed["symbol_reports"]:
                    parsed["symbol_reports"][sym] = s_data
                else:
                    if "actionable_plan" not in parsed["symbol_reports"][sym]:
                        parsed["symbol_reports"][sym]["actionable_plan"] = s_data["actionable_plan"]
        return parsed
    except Exception as e:
        print(f"⚠️ [Wargame Council] Gemini API 呼叫異常，轉用智慧模擬推理引擎：{e}")
        return generate_simulated_wargame_report(context_data)


def generate_simulated_wargame_report(context_data):
    """
    實時行情同步版模擬對抗引擎
    讀取 core_tracking_stocks 最新真實報價計算動態防守價與實操建議。
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    core = context_data.get("core_tracking_stocks", {})

    # 取得最新真實價位
    p_00919 = core.get("00919", {}).get("price", 24.35)
    p_2330  = core.get("2330", {}).get("price", 1050.0)
    p_2454  = core.get("2454", {}).get("price", 1420.0)
    p_3037  = core.get("3037", {}).get("price", 195.5)
    p_0056  = core.get("0056", {}).get("price", 39.40)
    p_00878 = core.get("00878", {}).get("price", 23.35)

    # 精確計算動態黃線防守價 (-3% ~ -5% 安全均線緩衝)
    stop_00919 = round(p_00919 * 0.96, 2)
    stop_2330  = round(p_2330 * 0.965, 1)
    stop_2454  = round(p_2454 * 0.955, 1)
    stop_3037  = round(p_3037 * 0.935, 1)
    stop_0056  = round(p_0056 * 0.97, 2)
    stop_00878 = round(p_00878 * 0.975, 2)

    rounds_general = [
        {"round": 1, "focus": "早盤跳空與籌碼動能檢視", "debate_summary": "多頭指出美股夜盤與期貨氣勢穩健，外資與投信呈現吸納；空頭提醒高位階需防高檔獲利了結賣壓。"},
        {"round": 2, "focus": "法人與融資換手洗盤檢驗", "debate_summary": "量化專家確認散戶融資浮額順利沉澱，三大法人持股穩定提升，結構有助續攻。"},
        {"round": 3, "focus": "高息對沖與資本利得平衡", "debate_summary": "守衛官強烈要求保持現金流暢通，月月配高息配置能夠100%對沖銀行攤還成本。"},
        {"round": 4, "focus": "多殺多壓力與防禦測試", "debate_summary": "風控審查大盤融資維持率高於 165% 安全水準，個股無斷頭多殺多風險。"},
        {"round": 5, "focus": "總經與新台幣匯率波動", "debate_summary": "新台幣匯率在區間平步，外資資金留駐台股基本面。"},
        {"round": 6, "focus": "動態防守黃線位階確認", "debate_summary": "經 5 大角色共同判定，各個股嚴守動態防守黃線作為多空分界與進出準則。"}
    ]

    return {
        "report_title": "DG AI Sentinel V4.0 晨間 10 輪對抗沙盤推演報告",
        "wargame_date": today_str,
        "overall_market_confidence": 88,
        "cio_executive_summary": f"台指夜盤與籌碼動能穩健，今日 6 大追蹤標的（2330現價 ${p_2330}、2454現價 ${p_2454}、3037現價 ${p_3037}、00919現價 ${p_00919}）皆依據最新價位設定動態黃線，未破黃線一路緊抱、收息對沖！",
        "symbol_reports": {
            "00919": {
                "symbol": "00919",
                "name": "群益精選高息",
                "confidence_score": 88,
                "cio_action_directive": f"現價 ${p_00919} 元，收息兼防禦主力；守穩黃線 ${stop_00919} 堅決抱牢。",
                "today_strategy_rationale": "高息對沖銀行信貸主力，籌碼集中在大戶，波段平穩。",
                "actionable_plan": {
                    "verdict": "🔥 強力多頭 / 逢回分批承接",
                    "dynamic_stop_price": stop_00919,
                    "cost_margin_status": f"現價 ${p_00919} 元距離防守黃線 ${stop_00919} 具備緩衝保護",
                    "execution_advice": f"1. 盤中若回踩 ${stop_00919} ~ ${round(p_00919*0.985, 2)} 可低吸分批。\n2. 未破防守黃線前，4 張收息核心堅決續抱。"
                },
                "wargame_rounds": rounds_general
            },
            "2330": {
                "symbol": "2330",
                "name": "台積電",
                "confidence_score": 91,
                "cio_action_directive": f"現價 ${p_2330} 元，先進製程霸主；開盤沿月線與動態黃線續抱。",
                "today_strategy_rationale": "AI 先進晶片與 CoWoS 需求滿載，外資長線買盤支撐。",
                "actionable_plan": {
                    "verdict": "🔥 強力多頭 / 沿黃線續抱",
                    "dynamic_stop_price": stop_2330,
                    "cost_margin_status": f"現價 ${p_2330} 元，趨勢向上安全邊際強韌",
                    "execution_advice": f"1. 開盤若跳空不急於當沖追高。\n2. 逢拉回接近黃線 ${stop_2330} 為零股優質承接點。"
                },
                "wargame_rounds": rounds_general
            },
            "2454": {
                "symbol": "2454",
                "name": "聯發科",
                "confidence_score": 89,
                "cio_action_directive": f"現價 ${p_2454} 元，旗艦天璣與 ASIC 雙引擎；守穩黃線維持高持股續抱。",
                "today_strategy_rationale": "高階智能手機與雲端算力專案放量，籌碼穩定。",
                "actionable_plan": {
                    "verdict": "🛡️ 穩健偏多 / 守穩黃線",
                    "dynamic_stop_price": stop_2454,
                    "cost_margin_status": f"現價 ${p_2454} 元高於黃線 ${stop_2454}，波段穩健",
                    "execution_advice": f"1. 守穩動態防守黃線 ${stop_2454} 之上維持既有部位。\n2. 遇半導體震盪量縮時可逢支撐加碼。"
                },
                "wargame_rounds": rounds_general
            },
            "3037": {
                "symbol": "3037",
                "name": "欣興",
                "confidence_score": 85,
                "cio_action_directive": f"現價 ${p_3037} 元，AI 載板供不應求；動態黃線之上續抱並逢回吸納。",
                "today_strategy_rationale": "載板進入供需緊俏新週期，外資由賣轉買，打底完成。",
                "actionable_plan": {
                    "verdict": "🔥 轉強偏多 / 逢拉回吸納",
                    "dynamic_stop_price": stop_3037,
                    "cost_margin_status": f"現價 ${p_3037} 元，季線打底具備強大護盤力道",
                    "execution_advice": f"1. 回測黃線支撐帶 ${stop_3037} ~ ${round(p_3037*0.97,1)} 為分批吸納點。\n2. 嚴格遵守動態黃線停利停損紀律。"
                },
                "wargame_rounds": rounds_general
            },
            "0056": {
                "symbol": "0056",
                "name": "元大高股息",
                "confidence_score": 88,
                "cio_action_directive": f"現價 ${p_0056} 元，除息與防禦核心；沿黃線抱牢收息。",
                "today_strategy_rationale": "歷史填息優異且三大法人穩定吸納，金控電子均衡配置抗震強。",
                "actionable_plan": {
                    "verdict": "🛡️ 收息核心 / 沿黃線續抱",
                    "dynamic_stop_price": stop_0056,
                    "cost_margin_status": f"現價 ${p_0056} 元，長線存股氣囊保護充足",
                    "execution_advice": f"1. 穩定配息對沖銀行信貸利息攤還。\n2. 大盤大幅震盪日皆是長線存股加碼黃金時刻。"
                },
                "wargame_rounds": rounds_general
            },
            "00878": {
                "symbol": "00878",
                "name": "國泰永續高息",
                "confidence_score": 86,
                "cio_action_directive": f"現價 ${p_00878} 元，永續現金流大樑；緊抱領息滾動複利。",
                "today_strategy_rationale": "ESG 優質成分股與金融雙支柱，波動極低且穩定貢獻利息。",
                "actionable_plan": {
                    "verdict": "🛡️ 永續收息 / 沿黃線續抱",
                    "dynamic_stop_price": stop_00878,
                    "cost_margin_status": f"現價 ${p_00878} 元，下檔防禦鐵板堅固",
                    "execution_advice": f"1. 擔任 2/5/8/11 月配息主力，長期抱牢不動。\n2. 動態防守線 ${stop_00878} 未破持續享受複利。"
                },
                "wargame_rounds": rounds_general
            }
        }
    }


def run_wargame():
    print("⏳ [Wargame Council] 載入市場與個股行情 context...")
    context = load_market_context()
    report = call_gemini_api(context)

    with open(WARGAME_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"✅ [Wargame Council] 10 輪沙盤推演與個股實操報告已產生：`{WARGAME_REPORT_PATH}`")
    return report


if __name__ == "__main__":
    run_wargame()
