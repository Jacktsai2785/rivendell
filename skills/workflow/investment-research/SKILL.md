---
name: investment-research
description: >
  Structured investment research workflow: alpha discovery, risk management,
  backtesting, and financial statement analysis using news_stock data.
  TRIGGER when: user asks to research stocks, find alpha, analyze investment
  opportunities, run backtests, or says "投資研究" / "研究報告".
  DO NOT TRIGGER when: debugging code (use systematic-debugging), reviewing
  code quality (use code-reviewer), or building UI features.
tags: [workflow, finance]
version: 1
source: manual
user_invocable: true
---

# Investment Research

Structured research workflow for finding alpha and managing risk, powered by the news_stock platform.

## Goals

1. **Find alpha** — identify mispriced opportunities through data-driven analysis
2. **Manage risk** — quantify downside before committing capital

## Research Workflow

```
1. Environment Scan    →  2. Stock Pool     →  3. Alpha Discovery  →  4. Risk Assessment
   (macro + sentiment)     (universe filter)    (signals + scoring)    (drawdown + correlation)

5. Entry/Exit Strategy →  6. Backtesting    →  7. Financial Review  →  8. Report
   (rules + triggers)      (validate edge)     (四大報表)              (final output)
```

---

## Step 1: Environment Scan

Assess the macro backdrop before picking stocks. Use news_stock data directly.

### 1a. Market Cycle Phase

```python
# Read from news_stock macro.db
import sqlite3, os

DB = os.path.expanduser("~/Documents/Projects/news_stock/macro.db")
conn = sqlite3.connect(DB)

# Latest cycle for US and TW
cycles = conn.execute("""
    SELECT country, phase, composite_score, confidence, date
    FROM market_cycles
    WHERE (country, date) IN (
        SELECT country, MAX(date) FROM market_cycles GROUP BY country
    )
""").fetchall()
for country, phase, score, conf, date in cycles:
    print(f"{country}: {phase} (score={score:.2f}, confidence={conf:.0%}) as of {date}")
```

**Cycle → Allocation mapping** (from `config/macro_indicators.py`):

| Phase | Stocks | Bonds | Cash | Preferred Sectors |
|-------|--------|-------|------|-------------------|
| EXPANSION | 80% | 15% | 5% | Growth, Momentum, Tech |
| PEAK | 55% | 30% | 15% | Defensive, Dividend |
| CONTRACTION | 30% | 45% | 25% | Utilities, Staples, Gold |
| TROUGH | 60% | 25% | 15% | Cyclicals, Value |

### 1b. Key Macro Indicators

```python
# Check latest FRED indicators
indicators = conn.execute("""
    SELECT mi.series_id, mi.name, md.value, md.date
    FROM macro_indicators mi
    JOIN macro_data md ON mi.series_id = md.series_id
    WHERE md.date = (SELECT MAX(date) FROM macro_data WHERE series_id = mi.series_id)
    ORDER BY mi.country, mi.series_id
""").fetchall()
```

**Critical thresholds** (from `config/macro_indicators.py`):
- Yield curve (T10Y2Y) < 0 → inversion warning
- VIX > 25 → elevated fear
- Unemployment > 5% → recession risk
- Fed Funds rising → tightening cycle

### 1c. News Sentiment

```python
NEWS_DB = os.path.expanduser("~/Documents/Projects/news_stock/news.db")
nconn = sqlite3.connect(NEWS_DB)

# Recent news volume and sentiment keywords
recent = nconn.execute("""
    SELECT source_type, COUNT(*), MIN(published_at), MAX(published_at)
    FROM news
    WHERE published_at >= date('now', '-7 days')
    GROUP BY source_type
""").fetchall()
```

Use WebSearch for breaking news not yet in the database.

---

## Step 2: Stock Pool Selection

Define the universe to research. Use existing stock pools from `finance.db`.

### Available Pools

```python
FIN_DB = os.path.expanduser("~/Documents/Projects/news_stock/finance.db")
fconn = sqlite3.connect(FIN_DB)

pools = fconn.execute("""
    SELECT sp.name, sp.description, COUNT(spm.symbol) as size
    FROM stock_pools sp
    LEFT JOIN stock_pool_members spm ON sp.id = spm.pool_id
    GROUP BY sp.id
""").fetchall()
```

**System pools** (7 defined):
- AI Supply Chain (US): ~89 stocks, 18 layers
- AI Supply Chain (TW): ~79 stocks
- Geopolitical: ~31 stocks
- US Sectors (GICS): ~532 stocks
- US Stocks: ~540 stocks
- TW Stocks: ~117 stocks
- ETFs: ~67 stocks

### Pool Selection Logic

```
What is the research thesis?
  → AI/semiconductor → AI Supply Chain pool
  → Macro cycle play → US Sectors + ETFs
  → Taiwan market → TW Stocks pool
  → Geopolitical hedge → Geopolitical pool
  → Broad scan → US Stocks pool (apply filters below)
```

### Fundamental Filters (narrow the pool)

```python
# Filter by fundamentals from finance.db
candidates = fconn.execute("""
    SELECT w.symbol, w.name, f.*
    FROM fundamentals f
    JOIN watchlist w ON f.symbol = w.symbol
    WHERE f.date = (SELECT MAX(date) FROM fundamentals WHERE symbol = f.symbol)
      AND f.pe_ratio > 0 AND f.pe_ratio < 30
      AND f.roe > 0.15
      AND f.profit_margin > 0.10
    ORDER BY f.roe DESC
""").fetchall()
```

Adjust filters based on cycle phase:
- **EXPANSION**: Growth focus (PEG < 1.5, revenue growth > 15%)
- **CONTRACTION**: Value focus (PE < 15, dividend yield > 3%, low debt/equity)

---

## Step 3: Alpha Discovery

Run multi-factor scoring on the filtered pool.

### 3a. Technical Signals

Use `src/strategy/analyzer.py` patterns:

```python
# analyzer.py calculates these for each symbol:
# MA crossover: MA5 > MA20 → BUY signal
# RSI: < 30 → oversold BUY, > 70 → overbought SELL
# MACD: crossover → momentum shift
# BB: price near lower band → potential reversal
# Volume-price breakout: consolidation + volume spike + MACD cross + KD low
```

```python
from src.strategy.analyzer import TechnicalAnalyzer

analyzer = TechnicalAnalyzer(fconn)
for symbol in candidate_symbols:
    result = analyzer.analyze(symbol, period="6mo")
    signals = result['signals']  # List of BUY/SELL with dates and reasons
    indicators = result['indicators']  # RSI, MACD, BB values
```

### 3b. Fundamental Scoring

Apply scoring weights from `config/strategy_constants.py`:

| Factor | Weight | Source |
|--------|--------|--------|
| Cycle fit | 30% | Market phase × sector alignment |
| Moat | 30% | Profit margin, operating margin, ROE, institutional ownership |
| Growth | 25% | PEG ratio, forward PE discount |
| Momentum | 15% | Price trend, volume trend |

**Moat thresholds**:
- Profit margin > 20% → strong moat
- Operating margin > 15% → operational efficiency
- ROE > 20% → capital efficiency
- Institutional ownership > 60% → smart money validation

**Megatrend multipliers** (from `strategy_constants.py`):
- AI: 1.0x, EV: 0.85x, Clean Energy: 0.80x, Biotech: 0.75x
- Declining: Retail, Fossil fuels, Traditional media (penalty)

### 3c. AI Supply Chain Lens

For AI-related research, use the 18-layer taxonomy:

```python
from config.ai_stocks import AI_LAYERS, AI_LAYER_STOCKS, AI_STOCK_DESCRIPTIONS

# Identify which layer a stock belongs to
# Compare performance across layers (upstream vs downstream)
# Find lagging layers that may catch up (mean reversion alpha)
```

### 3d. Cross-reference with News

```python
# Search news for candidate symbols
for symbol in top_candidates:
    news = nconn.execute("""
        SELECT title, source, published_at
        FROM news
        WHERE (title LIKE ? OR content LIKE ?)
          AND published_at >= date('now', '-30 days')
        ORDER BY published_at DESC
        LIMIT 5
    """, (f'%{symbol}%', f'%{symbol}%')).fetchall()
```

Use WebSearch for real-time news and analyst reports not in the database.

---

## Step 4: Risk Assessment

Quantify risk before defining entry/exit rules.

### Key Risk Metrics

| Metric | Formula | Red Flag |
|--------|---------|----------|
| Max Drawdown | Peak-to-trough decline | > 30% |
| Sharpe Ratio | (Return - Rf) / σ | < 0.5 |
| Beta | Covariance with market / market variance | > 1.5 (too volatile) |
| Correlation | Between positions | > 0.8 (concentration risk) |
| VaR (95%) | 5th percentile daily loss | Context-dependent |

```python
import pandas as pd
import numpy as np

# Calculate from daily_prices
prices = pd.read_sql("""
    SELECT date, close FROM daily_prices
    WHERE symbol = ? AND date >= date('now', '-1 year')
    ORDER BY date
""", fconn, params=(symbol,), parse_dates=['date'])

returns = prices['close'].pct_change().dropna()
sharpe = returns.mean() / returns.std() * np.sqrt(252)
max_dd = (prices['close'] / prices['close'].cummax() - 1).min()
var_95 = returns.quantile(0.05)
```

### Portfolio Correlation Check

```python
# Ensure selected stocks aren't all correlated
portfolio_symbols = ['NVDA', 'AMD', 'TSM']  # example
price_matrix = pd.DataFrame()
for sym in portfolio_symbols:
    df = pd.read_sql(f"""
        SELECT date, close FROM daily_prices
        WHERE symbol = '{sym}' AND date >= date('now', '-1 year')
    """, fconn, parse_dates=['date']).set_index('date')
    price_matrix[sym] = df['close']

corr = price_matrix.pct_change().corr()
# Flag pairs with correlation > 0.8
```

---

## Step 5: Entry/Exit Strategy

Define clear, rule-based triggers. No discretionary decisions.

### Entry Rules (pick combination based on thesis)

| Rule | Condition | Weight |
|------|-----------|--------|
| Trend confirmation | MA5 crosses above MA20 | Required |
| Momentum | RSI between 40-65 (not overbought) | Required |
| Volume | Volume ratio > 1.5 (above 20d avg) | Preferred |
| MACD | Histogram turning positive | Preferred |
| Fundamental | Score in top 20% of pool | Required |

### Exit Rules

| Rule | Condition | Action |
|------|-----------|--------|
| Stop loss | -8% from entry | Sell all |
| Trailing stop | -12% from peak | Sell all |
| Take profit | +25% from entry | Sell 50% |
| Signal reversal | MA5 crosses below MA20 + RSI > 70 | Sell all |
| Time limit | 90 trading days, no +10% | Review/exit |

### Position Sizing

```
Per-position size = Portfolio × Risk_per_trade / (Entry - Stop_loss)
Risk_per_trade = 2% of portfolio (max)
Max positions = 10 (diversification floor)
```

---

## Step 6: Backtesting

Validate the strategy edge using historical data.

### Using news_stock Backtesting Infrastructure

```python
from src.strategy.analyzer import TechnicalAnalyzer
from src.strategy.portfolio_strategy import PortfolioStrategy
from src.strategy.cycle_backtest import CycleBacktester

# Option 1: Technical backtest (single stock)
analyzer = TechnicalAnalyzer(fconn)
result = analyzer.backtest(symbol, strategy="ma_crossover", period="2y")
# Returns: total_return, win_rate, sharpe, max_drawdown, trades

# Option 2: Portfolio strategy backtest
strategy = PortfolioStrategy(fconn)
# Momentum rotation with monthly rebalancing
result = strategy.momentum_rotation(
    symbols=candidate_symbols,
    top_n=5,
    lookback=60,
    rebalance_period=21,
    start_date="2024-01-01"
)

# Option 3: Cycle-based backtest
backtester = CycleBacktester(fconn, conn)  # finance + macro DBs
result = backtester.run(symbols=candidate_symbols, start_date="2023-01-01")
```

### Backtest Validation Checklist

- [ ] Test period includes at least one drawdown > 15%
- [ ] Sharpe ratio > 1.0 (after transaction costs)
- [ ] Win rate > 45% with profit factor > 1.5
- [ ] Max drawdown < 25%
- [ ] No single trade accounts for > 30% of total P&L
- [ ] Results hold across different time windows (walk-forward)
- [ ] Compare vs buy-and-hold benchmark (SPY / 0050)

### Report Backtest Results

```
Strategy: [name]
Period: YYYY-MM-DD to YYYY-MM-DD
Universe: [pool name] ([N] stocks)

| Metric | Strategy | Benchmark (SPY) |
|--------|----------|-----------------|
| Total Return | X% | Y% |
| Annualized Return | X% | Y% |
| Sharpe Ratio | X.XX | Y.YY |
| Max Drawdown | -X% | -Y% |
| Win Rate | X% | — |
| # Trades | N | 1 |
| Profit Factor | X.XX | — |
```

---

## Step 7: Financial Statement Review (四大報表)

Before final conviction, review the company's financial health using fundamental data.

### 四大報表 Analysis Framework

#### 1. 損益表 (Income Statement)

| Metric | Source Field | What to Check |
|--------|-------------|---------------|
| Revenue trend | `revenue` | Growing YoY? Accelerating? |
| Profit margin | `profit_margin` | Stable or expanding? |
| Operating margin | `operating_margin` | > Industry average? |
| EPS growth | `eps_trailing`, `eps_forward` | Forward > Trailing = growth |

#### 2. 資產負債表 (Balance Sheet)

| Metric | Source Field | What to Check |
|--------|-------------|---------------|
| Debt/Equity | `debt_to_equity` | < 1.0 preferred, < 0.5 strong |
| Current ratio | `current_ratio` | > 1.5 = healthy liquidity |
| Book value | `book_value` | P/B < 3 for value |

#### 3. 現金流量表 (Cash Flow Statement)

| Check | Rule |
|-------|------|
| Operating CF | Must be positive and growing |
| FCF | Operating CF - CapEx > 0 |
| FCF yield | FCF / Market cap > 3% is attractive |

#### 4. 權益變動表 (Changes in Equity)

| Check | Rule |
|-------|------|
| Share buybacks | Decreasing share count = shareholder-friendly |
| ROE trend | Stable > 15% over 3+ years |
| Retained earnings | Growing = reinvesting profitably |

### Quick Fundamental Query

```python
# Pull latest fundamentals for a candidate
fund = fconn.execute("""
    SELECT * FROM fundamentals
    WHERE symbol = ?
    ORDER BY date DESC LIMIT 1
""", (symbol,)).fetchone()
```

Use WebSearch to supplement with latest quarterly earnings data and analyst estimates not in the database.

---

## Step 8: Research Report Template

Generate the final report in this structure:

```markdown
# Investment Research Report — [Date]

## Executive Summary
- Market phase: [EXPANSION/PEAK/CONTRACTION/TROUGH]
- Research thesis: [1-2 sentences]
- Top picks: [3-5 symbols with conviction level]

## 1. Macro Environment
- Cycle phase and key indicators
- News sentiment summary
- Risk events on the horizon

## 2. Stock Pool & Screening
- Universe: [pool name], [N] stocks
- Filters applied: [list]
- Survivors: [N] candidates

## 3. Alpha Signals
| Symbol | Score | Technical | Fundamental | Catalyst |
|--------|-------|-----------|-------------|----------|
| ... | | | | |

## 4. Risk Analysis
| Symbol | Beta | Max DD | Sharpe | Correlation |
|--------|------|--------|--------|-------------|
| ... | | | | |

## 5. Strategy & Backtest
- Entry/exit rules
- Backtest results table
- vs Benchmark comparison

## 6. Financial Health (四大報表)
Per-stock financial statement highlights

## 7. Portfolio Construction
| Symbol | Weight | Entry | Stop Loss | Target |
|--------|--------|-------|-----------|--------|
| ... | | | | |

## 8. Risk Disclosure
- Key risks and mitigation
- Scenario analysis (bull/base/bear)

---
_Generated by investment-research skill on [date]_
_Data source: news_stock platform (finance.db, news.db, macro.db)_
```

---

## Integration with Other Skills

| Skill | How it Integrates |
|-------|-------------------|
| **planning-with-files** | Use for multi-day research projects with progress tracking |
| **office-xlsx** | Export backtest results and portfolio to spreadsheet |
| **office-pdf** | Generate formatted research report PDF |
| **webapp-testing** | Verify news_stock web dashboard displays correctly |

## Data Freshness

Before starting research, verify data is current:

```python
# Check latest data dates
latest_price = fconn.execute("SELECT MAX(date) FROM daily_prices").fetchone()[0]
latest_news = nconn.execute("SELECT MAX(published_at) FROM news").fetchone()[0]
latest_macro = conn.execute("SELECT MAX(date) FROM macro_data").fetchone()[0]

print(f"Prices: {latest_price}, News: {latest_news}, Macro: {latest_macro}")
# If stale, suggest running collectors first
```

## Web Research

When database data is insufficient, use WebSearch for:
- Breaking news and earnings surprises
- Analyst price targets and consensus estimates
- SEC filings (10-K, 10-Q)
- Industry reports and competitive landscape
- Geopolitical developments affecting positions
