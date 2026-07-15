import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Tag } from '../../components/Tag';
import { Cpu, Coins, Play, Loader2, Check, Clock, Trash2, RefreshCw, SquarePen } from 'lucide-react';
import { ConfirmDeleteSheet } from '../../components/ConfirmDeleteSheet';
import { countdown } from '../../lib/format';
import { celebrateFiling } from '../../lib/celebrate';
import { RunFiling } from '../../components/RunFiling';
import { TrackRecord } from '../../components/TrackRecord';
import type { Agent, Frequency, Result } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';

// Mock report used whenever the user manually triggers a run from the Profile
// tab. Deep dive into Tencent's valuation + recent catalysts — chosen because
// it gives the demo a meaty, sell-side-shaped artifact to read regardless of
// which agent fired the run. All numbers are illustrative.
function buildTencentDeepDiveResult(agent: Agent): Result {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10);
  return {
    id: `manual-${agent.id}-${now.getTime()}`,
    agentId: agent.id,
    title: '騰訊控股(0700.HK)估值與近期催化全景掃描',
    summary:
      '騰訊 2026 Q1 業績超預期:營收 +14%、調整後淨利 +26%;管理層將全年回購上調至 1,200 億港元。影片號廣告與 AI 雲業務是後續 2 個季度的關鍵催化。遠期 PE 17.4x 接近三年均值,維持"增持",目標價 HK$430。',
    body: [
      '## 一句話',
      '騰訊 Q1 業績雙雙超預期;管理層上調回購規模至 1,200 億港元;影片號廣告與 AI 雲業務是後續兩個季度的關鍵催化。',
      '',
      '## 關鍵資料(2026 Q1)',
      '| 指標 | 數值 | 同比 | 一致預期 |',
      '| --- | --- | --- | --- |',
      '| 營收 | RMB 1,725 億 | +14% | +11% |',
      '| 調整後淨利潤 | RMB 542 億 | +26% | +19% |',
      '| 調整後淨利率 | 31.4% | +3pp | — |',
      '| 自由現金流 | RMB 478 億 | +22% | — |',
      '',
      '## 業務分部表現',
      '### 遊戲(佔比 32%)',
      '- 國內遊戲 RMB 411 億 +13%,DNF Mobile 與王者榮耀貢獻主要增量。',
      '- 海外遊戲 RMB 175 億 +40%,Supercell 與 Riot 旗下產品矩陣持續放量。',
      '- 儲備:《王者榮耀 World》定檔 Q3,《地下城與勇士:起源》海外即將上線。',
      '',
      '### 營銷服務(廣告,佔比 18%)',
      '- 收入 RMB 312 億 +20%,影片號廣告變現率從 1.8% 提升至 2.4%。',
      '- AI 廣告歸因系統(全域 ROI)接入後,廣告主 ROI 中位數環比 +18%。',
      '',
      '### 金融科技與企業服務(佔比 32%)',
      '- 收入 RMB 552 億 +9%,微信支付商業支付小幅放緩,雲業務受 AI 工作負載驅動 +19%。',
      '- 微信小店 GMV 同比 +85%,管理層對其變現節奏給出更明確的指引。',
      '',
      '## 近期新聞摘要',
      '- **5/22**:管理層在業績會上宣佈全年回購規模從 1,000 億上調至 1,200 億港元。',
      '- **5/19**:騰訊雲宣佈與輝達合作,H200 執行個體本月開放,定價較 H100 上調 18%。',
      '- **5/15**:王者榮耀韓國版上線首日登頂 Google Play 暢銷榜。',
      '- **5/12**:監管機構通過 22 款遊戲版號,騰訊獲 3 款。',
      '',
      '## 估值快照',
      '- 遠期 PE 17.4x(2026E EPS RMB 24.6),接近 2022–2024 年均值 17.8x。',
      '- EV/EBITDA 12.1x,較"騰訊 + 阿里 + 美團"中位數低約 8%。',
      '- SOTP 拆分:遊戲 HK$215 + 廣告 HK$95 + 金融科技與雲 HK$78 + 投資組合 HK$42 = HK$430。',
      '',
      '## 風險',
      '- 海外遊戲發行節奏低於預期。',
      '- WeChat Pay 國際化進展放緩。',
      '- 中美 H200 GPU 出口管制升級影響雲算力供給。',
      '',
      '## 觀點',
      '維持"增持",目標價 HK$430(對應 19x 2026E PE)。回購加速 + AI 商業化兌現是接下來兩個季度的關鍵看點。',
    ].join('\n'),
    at: now.toISOString(),
    keywords: ['騰訊', '0700.HK', '估值', 'AI', '遊戲', '影片號', '港股'],
    stocks: [
      { symbol: '0700.HK', name: '騰訊控股', market: 'HK', price: 386.51, changePct: 1.05 },
    ],
    artifactFilename: `tencent-deep-dive-${yyyymmdd}.md`,
  };
}

// Alternate mock used on every other manual run — Hang Seng Tech Index
// three-weight valuation note. Shares the same shape as the Tencent deep
// dive so the alternation only swaps content, not structure.
function buildHkTechIndexResult(agent: Agent): Result {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10);
  return {
    id: `manual-${agent.id}-${now.getTime()}`,
    agentId: agent.id,
    title: '恒生科技指數:三大權重股估值梳理與展望',
    summary:
      '恒生科技年初至今 +12%,前三大權重估值分化明顯:騰訊遠期 PE 17.4x 接近三年均值,阿里 EV/Sales 1.6x 處於歷史低位,美團 PE 24.6x 等待外賣單量兌現。短期我們認為騰訊與阿里風險收益較優,美團需觀察 6 月資料。',
    body: [
      '## 一句話',
      '恒生科技指數年初至今 +12%,前三大權重估值分化:騰訊接近三年均值,阿里處於歷史低位,美團等待第二曲線兌現。',
      '',
      '## 估值快照(截至昨日收盤)',
      '| 公司 | 代碼 | 遠期 PE | EV/Sales | 五年區間 |',
      '| --- | --- | --- | --- | --- |',
      '| 騰訊控股 | 0700.HK | 17.4x | 5.2x | PE 12-22x |',
      '| 阿里巴巴 | 9988.HK | 11.8x | 1.6x | PE 9-18x |',
      '| 美團 | 3690.HK | 24.6x | 2.4x | PE 18-45x |',
      '',
      '## 騰訊(0700.HK)— 接近三年均值,遊戲與廣告雙輪驅動',
      '- **估值**:遠期 PE 17.4x,接近 2022–2024 年均值(17.8x),較五年中樞低約 6%。',
      '- **催化**:DNF Mobile 流水持續超預期、影片號廣告變現率從 1.8% 提升至 2.4%、監管節奏溫和。',
      '- **風險**:WeChat Pay 國際化進展低於預期、海外遊戲發行節奏放緩。',
      '- **觀點**:維持"增持",目標價 HK$420(對應 19x 2026E PE)。',
      '',
      '## 阿里巴巴(9988.HK)— 估值歷史低位,雲業務是關鍵變數',
      '- **估值**:EV/Sales 1.6x,處於 2019 年以來歷史低位 5% 分位;SOTP 拆分隱含國內電商業務估值近乎為零。',
      '- **催化**:阿里雲季度收入增速重回雙位數(本季 +12%)、淘寶/天貓 GMV 轉正、回購加速(全年回購 ~5% 市值)。',
      '- **風險**:本地生活整合節奏、AIDC 資本開支擠壓自由現金流。',
      '- **觀點**:維持"增持",SOTP 目標價 HK$118。',
      '',
      '## 美團(3690.HK)— 估值仍處壓力區,等待第二曲線兌現',
      '- **估值**:遠期 PE 24.6x,處於五年區間中位偏上;即時零售業務長期空間清晰,但短期利潤釋放節奏不明朗。',
      '- **催化**:外賣 AOV 同比轉正、閃購單量增速維持 30%+、酒旅業務恢復至 2019 年水平。',
      '- **風險**:抖音本地生活競爭、騎手成本回升、出海業務(KeeTa 香港 / 巴西)虧損擴大。',
      '- **觀點**:維持"中性",等待 6 月外賣單量資料再做切換。',
      '',
      '## 風險提示',
      '- 美聯儲 6 月會議偏鷹,港股流動性承壓。',
      '- 中美科技摩擦升級,出口管制範圍擴圍。',
      '- 內地消費資料持續偏弱,影響整體板塊估值水平。',
    ].join('\n'),
    at: now.toISOString(),
    keywords: ['恒生科技', '港股', '估值', '騰訊', '阿里', '美團'],
    stocks: [
      { symbol: '0700.HK', name: '騰訊控股', market: 'HK', price: 386.51, changePct: 1.05 },
      { symbol: '9988.HK', name: '阿里巴巴', market: 'HK', price: 92.40, changePct: 0.78 },
      { symbol: '3690.HK', name: '美團',       market: 'HK', price: 117.20, changePct: 2.34 },
    ],
    artifactFilename: `hk-tech-index-valuation-${yyyymmdd}.md`,
  };
}

// English variants of the two manual-run mocks. The builder set is chosen by
// the active UI language so a run never drops a Chinese report into the English
// app (or vice-versa) — chrome and report body stay in one language.
function buildTencentDeepDiveResultEn(agent: Agent): Result {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10);
  return {
    id: `manual-${agent.id}-${now.getTime()}`,
    agentId: agent.id,
    title: 'Tencent (0700.HK): valuation & near-term catalysts',
    summary:
      'Tencent beat in 2026 Q1 — revenue +14%, adjusted net profit +26%; management raised the full-year buyback to HK$120bn. Weixin Channels ads and AI cloud are the key catalysts for the next two quarters. Forward PE of 17.4x sits near the three-year average — maintain Overweight, target HK$430.',
    body: [
      '## In one line',
      'Tencent beat on both lines in Q1; management lifted the buyback to HK$120bn; Channels ads and AI cloud are the key catalysts for the next two quarters.',
      '',
      '## Key figures (2026 Q1)',
      '| Metric | Value | YoY | Consensus |',
      '| --- | --- | --- | --- |',
      '| Revenue | RMB 172.5bn | +14% | +11% |',
      '| Adj. net profit | RMB 54.2bn | +26% | +19% |',
      '| Adj. net margin | 31.4% | +3pp | — |',
      '| Free cash flow | RMB 47.8bn | +22% | — |',
      '',
      '## Segment performance',
      '### Gaming (32% of revenue)',
      '- Domestic games RMB 41.1bn, +13% — DNF Mobile and Honor of Kings drove most of the upside.',
      '- Overseas games RMB 17.5bn, +40% — Supercell and Riot titles kept scaling.',
      '- Pipeline: Honor of Kings World slated for Q3; DnF: Origin launching overseas soon.',
      '',
      '### Marketing services (ads, 18%)',
      '- Revenue RMB 31.2bn, +20% — Weixin Channels ad load rose from 1.8% to 2.4%.',
      '- After the AI ad-attribution system (full-funnel ROI) shipped, median advertiser ROI rose +18% QoQ.',
      '',
      '### Fintech & business services (32%)',
      '- Revenue RMB 55.2bn, +9% — Weixin Pay commercial volume slowed slightly; cloud +19% on AI workloads.',
      '- Weixin Mini Shop GMV +85% YoY; management gave clearer guidance on its monetization pace.',
      '',
      '## Recent news',
      '- **5/22**: Management raised the full-year buyback from HK$100bn to HK$120bn on the earnings call.',
      '- **5/19**: Tencent Cloud announced an NVIDIA partnership; H200 instances open this month, priced ~18% above H100.',
      '- **5/15**: Honor of Kings Korea topped the Google Play grossing chart on day one.',
      '- **5/12**: Regulators approved 22 game licences; Tencent received 3.',
      '',
      '## Valuation snapshot',
      '- Forward PE 17.4x (2026E EPS RMB 24.6), near the 2022–2024 average of 17.8x.',
      '- EV/EBITDA 12.1x, ~8% below the Tencent + Alibaba + Meituan median.',
      '- SOTP: gaming HK$215 + ads HK$95 + fintech & cloud HK$78 + investments HK$42 = HK$430.',
      '',
      '## Risks',
      '- Slower overseas game release cadence.',
      '- Weixin Pay international rollout stalls.',
      '- Tighter US–China H200 GPU export controls crimp cloud-compute supply.',
      '',
      '## View',
      'Maintain Overweight, target HK$430 (19x 2026E PE). An accelerating buyback plus AI monetization are the key things to watch over the next two quarters.',
    ].join('\n'),
    at: now.toISOString(),
    keywords: ['Tencent', '0700.HK', 'Valuation', 'AI', 'Gaming', 'Channels', 'HK stocks'],
    stocks: [
      { symbol: '0700.HK', name: 'Tencent Holdings', market: 'HK', price: 386.51, changePct: 1.05 },
    ],
    artifactFilename: `tencent-deep-dive-${yyyymmdd}.md`,
  };
}

function buildHkTechIndexResultEn(agent: Agent): Result {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10);
  return {
    id: `manual-${agent.id}-${now.getTime()}`,
    agentId: agent.id,
    title: 'Hang Seng TECH: valuing the top three weights',
    summary:
      'Hang Seng TECH is +12% YTD with clear valuation dispersion across the top three weights: Tencent at 17.4x forward PE (near its three-year average), Alibaba at 1.6x EV/Sales (historic lows), and Meituan at 24.6x PE (awaiting a delivery-volume payoff). Near term we prefer Tencent and Alibaba on risk/reward; Meituan needs June data.',
    body: [
      '## In one line',
      'Hang Seng TECH is +12% YTD; valuation across the top three weights has split — Tencent near its average, Alibaba at historic lows, Meituan waiting on its second growth curve.',
      '',
      '## Valuation snapshot (as of yesterday’s close)',
      '| Company | Code | Forward PE | EV/Sales | 5y range |',
      '| --- | --- | --- | --- | --- |',
      '| Tencent | 0700.HK | 17.4x | 5.2x | PE 12-22x |',
      '| Alibaba | 9988.HK | 11.8x | 1.6x | PE 9-18x |',
      '| Meituan | 3690.HK | 24.6x | 2.4x | PE 18-45x |',
      '',
      '## Tencent (0700.HK) — near its three-year average; twin engines in games & ads',
      '- **Valuation**: forward PE 17.4x, near the 2022–2024 average (17.8x) and ~6% below the five-year midpoint.',
      '- **Catalysts**: DNF Mobile grossing keeps beating; Channels ad load 1.8% → 2.4%; mild regulatory cadence.',
      '- **Risks**: Weixin Pay international rollout below plan; slower overseas game releases.',
      '- **View**: maintain Overweight, target HK$420 (19x 2026E PE).',
      '',
      '## Alibaba (9988.HK) — historic-low valuation; cloud is the swing factor',
      '- **Valuation**: EV/Sales 1.6x, in the 5th percentile since 2019; SOTP implies near-zero value for domestic e-commerce.',
      '- **Catalysts**: Alibaba Cloud growth back to double digits (+12% this quarter); Taobao/Tmall GMV turned positive; buyback ~5% of market cap.',
      '- **Risks**: local-services integration pace; AIDC capex pressuring free cash flow.',
      '- **View**: maintain Overweight, SOTP target HK$118.',
      '',
      '## Meituan (3690.HK) — still in the pressure zone; awaiting the second curve',
      '- **Valuation**: forward PE 24.6x, mid-to-upper of its five-year range; long-term instant-retail runway is clear but near-term margin release is uncertain.',
      '- **Catalysts**: food-delivery AOV turned positive YoY; flash-purchase order growth holding 30%+; travel back to 2019 levels.',
      '- **Risks**: Douyin local-services competition; rising rider costs; widening overseas losses (KeeTa in HK / Brazil).',
      '- **View**: maintain Neutral; wait for June delivery-volume data before switching.',
      '',
      '## Risk notes',
      '- A hawkish June Fed pressures Hong Kong liquidity.',
      '- Escalating US–China tech friction widens export controls.',
      '- Persistently soft mainland consumption weighs on sector valuations.',
    ].join('\n'),
    at: now.toISOString(),
    keywords: ['Hang Seng TECH', 'HK stocks', 'Valuation', 'Tencent', 'Alibaba', 'Meituan'],
    stocks: [
      { symbol: '0700.HK', name: 'Tencent Holdings', market: 'HK', price: 386.51, changePct: 1.05 },
      { symbol: '9988.HK', name: 'Alibaba Group',    market: 'HK', price: 92.40,  changePct: 0.78 },
      { symbol: '3690.HK', name: 'Meituan',          market: 'HK', price: 117.20, changePct: 2.34 },
    ],
    artifactFilename: `hk-tech-index-valuation-${yyyymmdd}.md`,
  };
}

const FREQ_MINUTES: Record<Frequency, number> = {
  'Hourly': 60,
  'Every 4 hours': 240,
  'Daily': 1440,
  'Weekdays 09:30': 1440,
  'Weekly Monday': 10080,
  'Monthly': 43200,
};

export function AgentDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { agents, setAgents, setChats, setResults, profile, persisted, updatePersisted } = useApp();
  const t = useT();
  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
  const [filing, setFiling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Alternation counter for manual runs — flips between the Tencent deep dive
  // and the Hang Seng Tech Index note on each click. Refs (vs state) keep
  // this from triggering re-renders.
  const runCountRef = useRef(0);
  const [autoUpdate, setAutoUpdate] = useState(true);
  // Adjustable variables — defaults derived from the agent's starting node so
  // each agent surfaces its own ticker example. Edits stay local for this
  // demo; in a real build they'd be saved back to the agent definition.
  const startingNode = useMemo(
    () => agent?.task.nodes.find((n) => n.kind === 'starting'),
    [agent?.id]
  );
  const defaultFrequency: Frequency = startingNode?.kind === 'starting' ? startingNode.frequency : 'Daily';
  const defaultStock = startingNode?.kind === 'starting' && startingNode.variables[0]?.example
    ? startingNode.variables[0].example
    : 'NVDA';
  const [frequency, setFrequency] = useState<Frequency>(defaultFrequency);
  const [stockCode, setStockCode] = useState(defaultStock);
  const [baseValue, setBaseValue] = useState('1000');
  // Re-sync when the active agent changes.
  useEffect(() => {
    setFrequency(defaultFrequency);
    setStockCode(defaultStock);
    setBaseValue('1000');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id]);
  // Derived demo values — deterministic by agent id so the same agent always
  // shows the same version / last-update date across renders.
  const meta = useMemo(() => {
    const aid = agent?.id ?? '';
    let h = 0;
    for (let i = 0; i < aid.length; i++) h = (h * 31 + aid.charCodeAt(i)) >>> 0;
    const version = `v${1 + (h % 3)}.${(h >> 3) % 10}.${(h >> 6) % 12}`;
    const daysAgo = (h % 28) + 1;
    const lastUpdate = new Date(Date.now() - daysAgo * 86_400_000).toLocaleDateString();
    return { version, lastUpdate };
  }, [agent?.id]);
  const [lastUpdateAt, setLastUpdateAt] = useState(meta.lastUpdate);
  // Re-sync when navigating between agents.
  useEffect(() => { setLastUpdateAt(meta.lastUpdate); setAutoUpdate(true); }, [meta.lastUpdate]);

  if (!agent) return <div className="p-4 text-ink-500">{t("agent.notFound")}</div>;

  const onManualUpdate = () => {
    setLastUpdateAt(new Date().toLocaleDateString());
  };

  const onDelete = () => {
    setAgents((list) => list.filter((a) => a.id !== id));
    setChats((c) => c.filter((m) => m.agentId !== id));
    setResults((rs) => rs.filter((r) => r.agentId !== id));
    updatePersisted({
      userCreatedAgentIds: persisted.userCreatedAgentIds.filter((x) => x !== id),
    });
    nav('/chat', { replace: true });
  };

  const starting = agent.task.nodes.find((n) => n.kind === 'starting');

  // Kicks off the live "analyst at work" sequence. The RunFiling overlay owns
  // the timing and calls produceResult() when it resolves.
  const runNow = () => {
    if (runState !== 'idle') return;
    setRunState('running');
    setFiling(true);
  };

  // Emits the bilingual result, files it with the stamp, and posts the
  // columnist's one-line greeting into the thread. Called by the sequence.
  const produceResult = () => {
    const completeAt = Date.now();
    // Alternate the manual-run mock. Each result is fully bilingual: English
    // base + a Traditional-Chinese i18n.zh override, so localizeResult always
    // shows the right language for the active UI.
    const pairs = [
      [buildTencentDeepDiveResultEn, buildTencentDeepDiveResult],
      [buildHkTechIndexResultEn, buildHkTechIndexResult],
    ] as const;
    const [enBuild, zhBuild] = pairs[runCountRef.current % pairs.length];
    const enR = enBuild(agent);
    const zhR = zhBuild(agent);
    const newResult: Result = {
      ...enR,
      i18n: { zh: { title: zhR.title, summary: zhR.summary, body: zhR.body, keywords: zhR.keywords, stocks: zhR.stocks } },
    };
    runCountRef.current += 1;
    setResults((rs) => [newResult, ...rs]);
    celebrateFiling(t('celebrate.filed'));

    const greeting = pickGreeting(profile.name, newResult.title);
    setChats((c) => [
      ...c,
      { id: `m-${completeAt}`, agentId: agent.id, role: 'agent', text: greeting, at: new Date(completeAt).toISOString() },
    ]);

    const minutes = starting && starting.kind === 'starting'
      ? (FREQ_MINUTES[starting.frequency] ?? 60)
      : 60;
    setAgents((list) => list.map((a) => a.id === agent.id ? {
      ...a,
      nextRunAt: new Date(Date.now() + minutes * 60_000).toISOString(),
      tokensTotal: a.tokensTotal + a.tokensPerTask,
    } : a));

    setRunState('done');
    setTimeout(() => setRunState('idle'), 1400);
  };

  function pickGreeting(userName: string, resultTitle: string): string {
    const hour = new Date().getHours();
    const tod = hour < 12 ? t('greet.morning') : hour < 18 ? t('greet.hi') : t('greet.evening');
    const first = userName.split(' ')[0];
    const named = first && first !== 'You' ? `, ${first}` : '';
    const lineKeys: MessageKey[] = ['greet.line.1', 'greet.line.2', 'greet.line.3', 'greet.line.4'];
    const key = lineKeys[Math.floor(Math.random() * lineKeys.length)];
    return t(key, { tod, named, title: resultTitle });
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-paper">
      {filing && <RunFiling agent={agent} onComplete={() => { setFiling(false); produceResult(); }} />}
      <div className="flex-1 min-h-0 overflow-y-auto w-full max-w-3xl mx-auto">
        {/* Task overview — tags moved inline with the heading so the agent's
            focus areas live next to the description of what it does. */}
        <section className="px-4 py-3 border-b border-ink-200">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-[11px] uppercase tracking-label text-ink-500 shrink-0">{t("agent.section.task")}</h3>
            <div className="flex flex-wrap justify-end gap-1">
              {agent.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
            </div>
          </div>
          <p className="text-[15px] text-ink-700 leading-relaxed">
            {agent.fullDescription ?? agent.description}
          </p>
          {starting && starting.kind === 'starting' && (
            <div className="mt-3 rounded-lg bg-ink-100 border border-ink-200 flex items-stretch overflow-hidden">
              <div className="flex-1 min-w-0 pl-3 pr-2 py-2.5 flex items-center gap-2">
                <Clock size={14} className="text-ink-500 shrink-0" strokeWidth={1.6} />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-label text-ink-500 leading-tight">{t('agent.run.runsEvery', { freq: t(`freq.${starting.frequency}` as MessageKey) })}</p>
                  <p className="text-[15px] font-medium text-ink-900 leading-tight mt-0.5">
                    {runState === 'running' ? t('agent.run.runningNow')
                      : runState === 'done' ? t('agent.run.complete')
                      : t('agent.run.nextRunIn', { time: countdown(agent.nextRunAt) })}
                  </p>
                </div>
              </div>
              <button
                onClick={runNow}
                disabled={runState !== 'idle'}
                aria-label={t('agent.run.runNow')}
                className="shrink-0 w-14 flex items-center justify-center bg-ink-900 text-paper active:bg-ink-700 disabled:bg-ink-300 transition-colors duration-200 ease-out-expo"
              >
                {runState === 'running' ? <Loader2 size={18} className="animate-spin" />
                  : runState === 'done' ? <Check size={18} />
                  : <Play size={18} fill="currentColor" />}
              </button>
            </div>
          )}
        </section>

        {/* Adjustable Variables */}
        <section className="px-4 py-3 border-b border-ink-200">
          <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-2">{t('agent.section.adjustable')}</h3>

          {/* Schedule subsection */}
          <div className="rounded-lg border border-ink-200 overflow-hidden mb-3">
            <div className="px-3 py-1.5 bg-ink-100 border-b border-ink-200">
              <p className="text-[11px] uppercase tracking-label text-ink-500">{t('agent.adjustable.schedule')}</p>
            </div>
            <div className="px-3 py-3 flex items-center justify-between gap-3">
              <label className="text-[15px] text-ink-500 shrink-0">{t('agent.adjustable.frequency')}</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="text-[15px] font-medium text-ink-900 bg-card border border-ink-200 rounded-sm px-2 py-1 outline-none focus:border-ink-900 transition-colors"
              >
                {(Object.keys(FREQ_MINUTES) as Frequency[]).map((f) => (
                  <option key={f} value={f}>{t(`freq.${f}` as MessageKey)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Parameters subsection */}
          <div className="rounded-lg border border-ink-200 overflow-hidden">
            <div className="px-3 py-1.5 bg-ink-100 border-b border-ink-200">
              <p className="text-[11px] uppercase tracking-label text-ink-500">{t('agent.adjustable.parameters')}</p>
            </div>
            <div className="divide-y divide-ink-200">
              <div className="px-3 py-3 flex items-center justify-between gap-3">
                <label className="text-[15px] text-ink-500 shrink-0">{t('agent.adjustable.stockCode')}</label>
                <input
                  value={stockCode}
                  onChange={(e) => setStockCode(e.target.value)}
                  className="flex-1 max-w-[55%] font-mono text-[15px] text-right text-ink-900 bg-card border border-ink-200 rounded-sm px-2 py-1 outline-none focus:border-ink-900 transition-colors"
                />
              </div>
              <div className="px-3 py-3 flex items-center justify-between gap-3">
                <label className="text-[15px] text-ink-500 shrink-0">{t('agent.adjustable.baseValue')}</label>
                <input
                  type="number"
                  value={baseValue}
                  onChange={(e) => setBaseValue(e.target.value)}
                  className="flex-1 max-w-[55%] font-mono text-[15px] text-right text-ink-900 bg-card border border-ink-200 rounded-sm px-2 py-1 outline-none focus:border-ink-900 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Personality */}
        <section className="px-4 py-3 border-b border-ink-200">
          <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1">{t('agent.section.personality')}</p>
          <p className="text-[15px] text-ink-900">{agent.personality} · {agent.tone} · {agent.temperament}</p>
        </section>

        {/* Track record — simulated performance of the agent's past calls */}
        <TrackRecord agentId={agent.id} />

        {/* Version & updates */}
        <section className="px-4 py-3 border-b border-ink-200">
          <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-2">{t('agent.section.versionUpdates')}</h3>
          <div className="rounded-lg border border-ink-200 divide-y divide-ink-200 overflow-hidden">
            {/* Created by */}
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-[15px] text-ink-500 shrink-0">{t('agent.createdBy')}</span>
              <span className="text-[15px] font-medium text-ink-900 truncate text-right">{agent.creator}</span>
            </div>
            {/* Version */}
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-[15px] text-ink-500 shrink-0">{t('agent.version')}</span>
              <span className="font-mono text-[14px] text-ink-900">{meta.version}</span>
            </div>
            {/* Auto update toggle */}
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-[15px] text-ink-500 shrink-0">{t('agent.autoUpdate')}</span>
              <div className="flex gap-1 bg-ink-100 rounded-md p-0.5 border border-ink-200">
                <button
                  onClick={() => setAutoUpdate(true)}
                  className={`px-3 py-1 rounded-sm text-[13px] font-medium transition-colors duration-200 ease-out-expo ${autoUpdate ? 'chip-active' : 'text-ink-500 hover:text-ink-900'}`}
                >{t('agent.yes')}</button>
                <button
                  onClick={() => setAutoUpdate(false)}
                  className={`px-3 py-1 rounded-sm text-[13px] font-medium transition-colors duration-200 ease-out-expo ${!autoUpdate ? 'chip-active' : 'text-ink-500 hover:text-ink-900'}`}
                >{t('agent.no')}</button>
              </div>
            </div>
            {/* Latest update — date when auto, button when manual */}
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-[15px] text-ink-500 shrink-0">{t('agent.lastUpdate')}</span>
              {autoUpdate ? (
                <span className="font-mono text-[14px] text-ink-900">{lastUpdateAt}</span>
              ) : (
                <button
                  onClick={onManualUpdate}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-900 bg-transparent border border-ink-900 px-3 py-1 rounded-sm active:bg-ink-100 transition-colors duration-200 ease-out-expo"
                >
                  <RefreshCw size={12} strokeWidth={1.6} /> {t('agent.pressToUpdate')}
                </button>
              )}
            </div>
            {/* Update notes */}
            <div className="px-3 py-3">
              <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1">{t('agent.updateNotes')}</p>
              <p className="text-[14px] text-ink-700 leading-relaxed">{t('agent.updateNotes.body')}</p>
            </div>
          </div>
        </section>

        {/* Token stats */}
        <section className="px-4 py-3 border-b border-ink-200">
          <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-2">{t("agent.section.usage")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-ink-200 p-3">
              <div className="flex items-center gap-1.5 text-ink-500 text-[11px] uppercase tracking-label"><Coins size={12} strokeWidth={1.6}/> Tokens ever used</div>
              <p className="font-mono text-[22px] font-medium text-ink-900 mt-1">{agent.tokensTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-ink-200 p-3">
              <div className="flex items-center gap-1.5 text-ink-500 text-[11px] uppercase tracking-label"><Cpu size={12} strokeWidth={1.6}/> Avg / task</div>
              <p className="font-mono text-[22px] font-medium text-ink-900 mt-1">{agent.tokensPerTask.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Edit — only for agents the user owns (created or hired into their desk). */}
        {persisted.userCreatedAgentIds.includes(agent.id) && (
          <section className="px-4 pt-4">
            <button
              onClick={() => nav(`/create?edit=${agent.id}`)}
              className="w-full px-5 py-3 rounded-sm border border-ink-200 text-ink-900 font-medium text-[14px] inline-flex items-center justify-center gap-2 active:bg-ink-100 transition-colors duration-200 ease-out-expo"
            >
              <SquarePen size={16} strokeWidth={1.6}/> {t('agent.edit')}
            </button>
          </section>
        )}

        {/* Destructive action — sits at the very bottom so it isn't easy to mis-tap. */}
        <section className="px-4 py-4">
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full px-5 py-3 rounded-sm border border-ink-900 text-ink-900 font-medium text-[14px] inline-flex items-center justify-center gap-2 active:bg-ink-100 transition-colors duration-200 ease-out-expo"
          >
            <Trash2 size={16} strokeWidth={1.6}/> {t('agent.delete.action')}
          </button>
        </section>
      </div>

      {confirmDelete && (
        <ConfirmDeleteSheet
          title={t('agent.delete.title', { name: agent.name })}
          body={t('agent.delete.body')}
          sureTitle={t('agent.delete.sureTitle')}
          sureBody={t('agent.delete.sureBody', { name: agent.name })}
          confirmLabel={t('agent.delete.confirm')}
          confirmFinalLabel={t('agent.delete.confirmFinal')}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}
