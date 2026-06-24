import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { Avatar } from '../../components/Avatar';
import { AVATAR_PRESETS } from '../../lib/avatars';
import { Tag } from '../../components/Tag';
import type { Tag as TagType, Frequency, ToolKey, StartingNode, WorkingNode, NotifyingNode, Personality, Tone, Temperament } from '../../types';
import { Check, Pencil, Calendar, Wrench, Bell, Plus, Trash2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { MargauxNudge } from '../../components/MargauxNudge';
import { celebrateFiling } from '../../lib/celebrate';
import { useT, type MessageKey } from '../../lib/i18n';
import type { Agent } from '../../types';

const ALL_TAGS: TagType[] = [
  'US Stocks', 'HK Stocks', 'Japan', 'A-Shares',
  'Value Investor', 'Quant', 'Macro', 'Semiconductor',
  'AI', 'Energy', 'Healthcare', 'Crypto', 'Earnings',
  'Options', 'Dividends', 'ETFs', 'News', 'Sentiment',
];

const ALL_TOOLS: { key: ToolKey; label: string }[] = [
  { key: 'youtube_transcript', label: 'YouTube transcript' },
  { key: 'news_fetcher',       label: 'News fetcher' },
  { key: 'tavily_search',      label: 'Tavily search' },
  { key: 'sec_filings',        label: 'SEC filings' },
  { key: 'price_quote',        label: 'Price quote' },
  { key: 'reddit_scan',        label: 'Reddit scan' },
  { key: 'twitter_scan',       label: 'X / Twitter scan' },
  { key: 'fundamentals',       label: 'Fundamentals' },
  { key: 'pdf_reader',         label: 'PDF reader' },
  { key: 'calendar_earnings',  label: 'Earnings calendar' },
];

const FREQS: Frequency[] = ['Hourly', 'Every 4 hours', 'Daily', 'Weekdays 09:30', 'Weekly Monday', 'Monthly'];
const PERSONALITY: Personality[] = ['Analytical', 'Cautious', 'Bold', 'Sardonic', 'Cheerful', 'Stoic', 'Curious', 'Skeptical'];
const TONE: Tone[] = ['Formal', 'Conversational', 'Concise', 'Detailed'];
const TEMPER: Temperament[] = ['Methodical', 'Spontaneous', 'Patient', 'Energetic'];

function uid() { return Math.random().toString(36).slice(2, 9); }

export function CreateAgent() {
  const nav = useNavigate();
  const t = useT();
  const { agents, setAgents, setChats, persisted, updatePersisted } = useApp();

  // Edit mode: /create?edit=<id> reopens this flow prefilled with an existing
  // agent and saves changes back instead of creating a new one.
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const editing = useMemo(() => (editId ? agents.find((a) => a.id === editId) : undefined), [editId, agents]);
  const isEdit = !!editing;
  const editStart = editing?.task.nodes.find((n) => n.kind === 'starting') as StartingNode | undefined;
  const editWorking = editing?.task.nodes.filter((n) => n.kind === 'working') as WorkingNode[] | undefined;
  const editNotify = editing?.task.nodes.find((n) => n.kind === 'notifying') as NotifyingNode | undefined;

  // Step 1 (basics)
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  // Avatar is chosen from a fixed pool of editorial crests — no uploads. Edit
  // mode keeps the agent's existing crest; new agents start on a random one.
  const [avatarSeed, setAvatarSeed] = useState<string>(
    () => editing?.avatarSeed ?? AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tags, setTags] = useState<TagType[]>(editing?.tags ?? []);
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? false);

  // Step 2 (task)
  const [start, setStart] = useState<StartingNode>(editStart ?? {
    kind: 'starting', id: uid(), name: 'Inputs & schedule',
    description: 'Collects user-defined inputs and triggers the run.',
    variables: [{ key: 'ticker', label: 'Stock code', type: 'stock', example: 'AAPL' }],
    frequency: 'Daily',
  });
  const [working, setWorking] = useState<WorkingNode[]>(editWorking && editWorking.length ? editWorking : [
    { kind: 'working', id: uid(), name: 'Gather & synthesize', description: 'Pull data and write the analysis.', prompt: 'Given {{ticker}}, summarize the last 24h and surface the three most material events.', tools: ['news_fetcher', 'price_quote'], expectedOutput: 'A 5-bullet brief with citations.' },
  ]);
  const [notify, setNotify] = useState<NotifyingNode>(editNotify ?? {
    kind: 'notifying', id: uid(), name: 'Notify', description: 'Deliver the brief.', channels: ['in_app'], format: 'chat_summary_pdf',
  });

  // Randomized personality (system-derived from description)
  const personality = useMemo<Personality>(() => PERSONALITY[(description.length * 7 + name.length) % PERSONALITY.length], [description, name]);
  const tone = useMemo<Tone>(() => TONE[(description.length * 3 + name.length) % TONE.length], [description, name]);
  const temperament = useMemo<Temperament>(() => TEMPER[(description.length + name.length * 5) % TEMPER.length], [description, name]);

  const toggleTag = (t: TagType) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const addWorking = () => setWorking((w) => [...w, {
    kind: 'working', id: uid(), name: `Step ${w.length + 1}`, description: '', prompt: '', tools: [], expectedOutput: '',
  }]);
  const removeWorking = (id: string) => setWorking((w) => (w.length <= 1 ? w : w.filter(x => x.id !== id)));
  const patchWorking = (id: string, patch: Partial<WorkingNode>) => setWorking((w) => w.map(x => x.id === id ? { ...x, ...patch } : x));

  const canStep2 = name.trim().length > 1 && description.trim().length > 5;
  const canPublish = canStep2 && working.every(w => w.prompt.trim().length > 0);

  const publish = () => {
    const trimmedName = name.trim();

    // Edit mode: update the existing agent in place, preserving its id, history,
    // reviews, and stats. No new chat/welcome, no celebration — it's an edit.
    if (editing) {
      setAgents((list) => list.map((a) => a.id === editing.id ? {
        ...a,
        name: trimmedName,
        avatarSeed,
        description: description.trim(),
        isPublic,
        tags,
        personality, tone, temperament,
        task: { nodes: [start, ...working, notify] },
        fullDescription: description.trim(),
      } : a));
      nav(`/chat/${editing.id}/profile`);
      return;
    }

    const newId = `user-${Date.now()}`;
    const nextRunAt = new Date(Date.now() + 60 * 60_000).toISOString();
    const newAgent: Agent = {
      id: newId,
      name: trimmedName,
      avatarSeed,
      description: description.trim(),
      creator: 'You',
      isPublic,
      tags,
      personality, tone, temperament,
      task: { nodes: [start, ...working, notify] },
      memory: ['Agent initialized. Awaiting first run.'],
      uploadedDocs: [],
      nextRunAt,
      unread: 0,
      tokensTotal: 0,
      tokensPerTask: 1200,
      duplicates: 0,
      rating: 5,
      reviews: [],
      editorsChoice: false,
      fullDescription: description.trim(),
      howToUse: 'Open the agent, confirm the inputs, and let it run on schedule.',
      tips: 'Upload a PDF thesis on the agent profile to ground every report.',
    };
    setAgents((list) => [newAgent, ...list]);

    // Welcome message in the chat so the new agent has a preview line in the Chat
    // list, identical to the hire flow.
    const welcomeAt = new Date().toISOString();
    setChats((c) => [
      ...c,
      {
        id: `m-welcome-${newId}`,
        agentId: newId,
        role: 'agent',
        text: `Hi — I'm ${trimmedName}. Ready when you are. I'll run on the schedule you set and deliver results in here.`,
        at: welcomeAt,
      },
    ]);

    updatePersisted({
      hasOnboarded: true,
      userCreatedAgentIds: [...persisted.userCreatedAgentIds, newId],
      firstAgentCelebrated: true,
      hasNewHires: true,
    });
    // Signature filing stamp on publish.
    celebrateFiling(t('celebrate.published'));
    nav(`/chat/${newId}`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader title={step === 1 ? (isEdit ? t('create.title.edit') : t('create.title.basics')) : t('create.title.task')} subtitle={step === 1 ? t('create.subtitle.basics') : t('create.subtitle.task')} />

      <div className="flex-1 min-h-0 overflow-y-auto pb-28 w-full max-w-3xl mx-auto">
        {/* First visit to Create: the front desk's honest v0.0001 warning. */}
        {step === 1 && !isEdit && !persisted.margaux.hidden && !persisted.margaux.dismissedNudges.includes('create') && (
          <div className="px-4 pt-4">
            <MargauxNudge
              text={t('margaux.nudge.create')}
              onDismiss={() => updatePersisted({ margaux: { ...persisted.margaux, dismissedNudges: [...persisted.margaux.dismissedNudges, 'create'] } })}
              dismissLabel={t('margaux.nudge.dismiss')}
            />
          </div>
        )}
        {step === 1 ? (
          <>
            {/* Avatar — tap the crest to reveal the animal pool, then pick one. */}
            <section className="px-4 py-5 border-b border-ink-200">
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                aria-expanded={pickerOpen}
                className="flex items-center gap-3 text-left rounded-lg -mx-1 px-1 py-1 active:bg-ink-50 transition-colors"
              >
                <div className="relative">
                  <Avatar seed={avatarSeed} name={name} size={72} ink ring/>
                  <span className="absolute bottom-0 right-0 w-7 h-7 rounded-pill bg-ink-900 text-paper flex items-center justify-center">
                    <Pencil size={13} strokeWidth={1.8}/>
                  </span>
                </div>
                <div className="text-[15px] text-ink-500">
                  <p className="font-medium text-ink-900 text-[15px]">{t("create.avatar.title")}</p>
                  <p>{t("create.avatar.hint")}</p>
                </div>
              </button>
              {pickerOpen && (
                <div className="mt-4 flex flex-wrap gap-2.5 animate-fade-rise">
                  {AVATAR_PRESETS.map((seed) => {
                    const selected = seed === avatarSeed;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => { setAvatarSeed(seed); setPickerOpen(false); }}
                        aria-pressed={selected}
                        aria-label={t("create.avatar.option")}
                        className={`relative rounded-pill transition-all duration-200 ease-out-expo ${selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-paper' : 'ring-1 ring-ink-200 hover:ring-ink-300'}`}
                      >
                        <Avatar seed={seed} name={name} size={48} ink/>
                        {selected && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-pill accent-gradient text-onaccent flex items-center justify-center">
                            <Check size={12} strokeWidth={2.4}/>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Name + Description */}
            <section className="px-4 py-4 border-b border-ink-200 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-label text-ink-500">{t("create.field.name")}</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder={t("create.field.name.ph")}
                  className="mt-1.5 w-full rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[16px] outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-label text-ink-500">{t("create.field.description")}</label>
                <textarea
                  rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("create.field.description.ph")}
                  className="mt-1.5 w-full rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[16px] outline-none"
                />
              </div>
            </section>

            {/* Tags */}
            <section className="px-4 py-4 border-b border-ink-200">
              <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-3">{t("create.section.tags")}</h3>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.map((t) => (
                  <Tag key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Tag>
                ))}
              </div>
            </section>

            {/* Visibility */}
            <section className="px-4 py-4 border-b border-ink-200">
              <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-3">{t("create.section.visibility")}</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsPublic(false)}
                  className={`rounded-md border px-3.5 py-3 text-left transition-colors duration-200 ease-out-expo ${!isPublic ? 'border-ink-900 bg-ink-100' : 'border-ink-200'}`}
                >
                  <p className="text-[15px] font-medium text-ink-900">{t("create.visibility.private")}</p>
                  <p className="text-[13px] text-ink-500 mt-0.5">{t("create.visibility.private.hint")}</p>
                </button>
                <button
                  onClick={() => setIsPublic(true)}
                  className={`rounded-md border px-3.5 py-3 text-left transition-colors duration-200 ease-out-expo ${isPublic ? 'border-ink-900 bg-ink-100' : 'border-ink-200'}`}
                >
                  <p className="text-[15px] font-medium text-ink-900">{t("create.visibility.public")}</p>
                  <p className="text-[13px] text-ink-500 mt-0.5">{t("create.visibility.public.hint")}</p>
                </button>
              </div>
            </section>

            {/* Generated personality preview */}
            <section className="px-4 py-4 border-b border-ink-200">
              <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t("create.temperament.title")}</h3>
              <p className="text-[15px] text-ink-500 mb-2">{t("create.temperament.hint")}</p>
              <p className="font-display text-[17px] text-ink-900">{personality} · {tone} · {temperament}</p>
            </section>
          </>
        ) : (
          <>
            {/* Starting node */}
            <section className="px-4 pt-4 pb-3">
              <div className="rounded-lg bg-ink-100 p-4">
                <div className="flex items-center gap-1.5 text-ink-500 text-[11px] uppercase tracking-label"><Calendar size={12} strokeWidth={1.6}/> {t("create.start.eyebrow")}</div>
                <input
                  value={start.name} onChange={(e) => setStart({ ...start, name: e.target.value })}
                  className="mt-3 w-full bg-card rounded-md border border-ink-200 px-3 py-2.5 text-[16px] outline-none"
                />
                <textarea
                  rows={2}
                  value={start.description} onChange={(e) => setStart({ ...start, description: e.target.value })}
                  className="mt-2 w-full bg-card rounded-md border border-ink-200 px-3 py-2.5 text-[15px] outline-none"
                />
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t("create.start.variables")}</p>
                  <div className="space-y-2">
                    {start.variables.map((v, i) => (
                      <div key={i} className="grid grid-cols-[1fr_110px_28px] gap-2">
                        <input
                          placeholder={t("create.start.varLabel.ph")}
                          value={v.label}
                          onChange={(e) => {
                            const next = [...start.variables]; next[i] = { ...v, label: e.target.value }; setStart({ ...start, variables: next });
                          }}
                          className="bg-card rounded-md border border-ink-200 px-2.5 py-2 text-[15px] outline-none"
                        />
                        <select
                          value={v.type}
                          onChange={(e) => {
                            const next = [...start.variables]; next[i] = { ...v, type: e.target.value as any }; setStart({ ...start, variables: next });
                          }}
                          className="bg-card rounded-md border border-ink-200 px-2.5 py-2 text-[15px] outline-none"
                        >
                          <option value="stock">stock</option>
                          <option value="url">url</option>
                          <option value="text">text</option>
                          <option value="number">number</option>
                        </select>
                        <button
                          onClick={() => setStart({ ...start, variables: start.variables.filter((_, j) => j !== i) })}
                          className="text-ink-500 hover:text-ink-900 transition-colors flex items-center justify-center"
                          aria-label="remove"
                        ><Trash2 size={14} strokeWidth={1.6}/></button>
                      </div>
                    ))}
                    <button
                      onClick={() => setStart({ ...start, variables: [...start.variables, { key: `var${start.variables.length+1}`, label: '', type: 'text' }] })}
                      className="text-ink-500 hover:text-ink-900 transition-colors text-[14px] inline-flex items-center gap-1"
                    ><Plus size={12} strokeWidth={1.8}/> {t("create.start.addVariable")}</button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t("create.start.frequency")}</p>
                  <select
                    value={start.frequency} onChange={(e) => setStart({ ...start, frequency: e.target.value as Frequency })}
                    className="w-full bg-card rounded-md border border-ink-200 px-2.5 py-2.5 text-[15px] outline-none"
                  >
                    {FREQS.map((f) => <option key={f} value={f}>{t(`freq.${f}` as MessageKey)}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Working nodes */}
            <section className="px-4 pb-3">
              {working.map((w, idx) => (
                <div key={w.id} className="rounded-lg border border-ink-200 p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-ink-500 text-[11px] uppercase tracking-label"><Wrench size={12} strokeWidth={1.6}/> {t("create.working.eyebrow", { n: idx + 1 })}</div>
                    {working.length > 1 && (
                      <button onClick={() => removeWorking(w.id)} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label="remove">
                        <Trash2 size={14} strokeWidth={1.6}/>
                      </button>
                    )}
                  </div>
                  <input
                    value={w.name} onChange={(e) => patchWorking(w.id, { name: e.target.value })}
                    className="mt-3 w-full rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[16px] outline-none"
                    placeholder={t("create.working.name.ph")}
                  />
                  <textarea
                    rows={2}
                    value={w.description} onChange={(e) => patchWorking(w.id, { description: e.target.value })}
                    className="mt-2 w-full rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[15px] outline-none"
                    placeholder={t("create.working.description.ph")}
                  />
                  <textarea
                    rows={3}
                    value={w.prompt} onChange={(e) => patchWorking(w.id, { prompt: e.target.value })}
                    className="mt-2 w-full rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[15px] outline-none font-mono"
                    placeholder={t("create.working.prompt.ph")}
                  />
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t("create.working.tools")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TOOLS.map((t) => (
                        <Tag
                          key={t.key}
                          active={w.tools.includes(t.key)}
                          onClick={() => patchWorking(w.id, { tools: w.tools.includes(t.key) ? w.tools.filter(x => x !== t.key) : [...w.tools, t.key] })}
                        >{t.label}</Tag>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={w.expectedOutput} onChange={(e) => patchWorking(w.id, { expectedOutput: e.target.value })}
                    className="mt-3 w-full rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[15px] outline-none"
                    placeholder={t("create.working.expectedOutput.ph")}
                  />
                </div>
              ))}
              <button onClick={addWorking} className="w-full rounded-md border border-dashed border-ink-300 text-ink-500 py-3 text-[14px] font-medium inline-flex items-center justify-center gap-1 hover:border-ink-900 hover:text-ink-900 transition-colors duration-200 ease-out-expo">
                <Plus size={14} strokeWidth={1.8}/> {t("create.working.add")}
              </button>
            </section>

            {/* Notifying node */}
            <section className="px-4 pb-4">
              <div className="rounded-lg bg-ink-100 p-4">
                <div className="flex items-center gap-1.5 text-ink-500 text-[11px] uppercase tracking-label"><Bell size={12} strokeWidth={1.6}/> {t("create.notify.eyebrow")}</div>
                <input
                  value={notify.name} onChange={(e) => setNotify({ ...notify, name: e.target.value })}
                  className="mt-3 w-full bg-card rounded-md border border-ink-200 px-3 py-2.5 text-[16px] outline-none"
                />
                <textarea
                  rows={2}
                  value={notify.description} onChange={(e) => setNotify({ ...notify, description: e.target.value })}
                  className="mt-2 w-full bg-card rounded-md border border-ink-200 px-3 py-2.5 text-[15px] outline-none"
                />
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t("create.notify.channels")}</p>
                  <div className="flex gap-1.5">
                    <Tag active={notify.channels.includes('in_app')} onClick={() => setNotify({ ...notify, channels: notify.channels.includes('in_app') ? notify.channels.filter(c => c !== 'in_app') : [...notify.channels, 'in_app'] })}>{t("create.notify.inApp")}</Tag>
                    <Tag active={notify.channels.includes('telegram')} onClick={() => setNotify({ ...notify, channels: notify.channels.includes('telegram') ? notify.channels.filter(c => c !== 'telegram') : [...notify.channels, 'telegram'] })}>Telegram</Tag>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t("create.notify.format")}</p>
                  <select
                    value={notify.format} onChange={(e) => setNotify({ ...notify, format: e.target.value as any })}
                    className="w-full bg-card rounded-md border border-ink-200 px-2.5 py-2.5 text-[15px] outline-none"
                  >
                    <option value="chat_summary_pdf">{t("create.notify.format.chatPdf")}</option>
                    <option value="chat_only">{t("create.notify.format.chatOnly")}</option>
                    <option value="pdf_only">{t("create.notify.format.pdfOnly")}</option>
                    <option value="md_only">{t("create.notify.format.mdOnly")}</option>
                  </select>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 px-4 py-3 border-t border-ink-200 bg-paper flex gap-2">
        {step === 2 && (
          <button onClick={() => setStep(1)} className="px-5 py-3 rounded-sm border border-ink-900 text-ink-900 font-medium text-[14px] inline-flex items-center gap-1 hover:bg-ink-900 hover:text-paper transition-colors duration-200 ease-out-expo">
            <ArrowLeft size={14} strokeWidth={1.8}/> {t("create.footer.back")}
          </button>
        )}
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canStep2}
            className="flex-1 btn-accent font-medium text-[14px] px-5 py-3 flex items-center justify-center gap-2 disabled:bg-ink-200 disabled:text-ink-500 duration-200 ease-out-expo"
          >
            {t("create.footer.continue")} <ArrowRight size={14} strokeWidth={1.8}/>
          </button>
        ) : (
          <button
            onClick={publish}
            disabled={!canPublish}
            className="flex-1 btn-accent font-medium text-[14px] px-5 py-3 flex items-center justify-center gap-2 disabled:bg-ink-200 disabled:text-ink-500 duration-200 ease-out-expo"
          >
            <CheckCircle2 size={16} strokeWidth={1.8}/>
            {isEdit ? t('create.footer.save') : isPublic ? t('create.footer.publish') : t('create.footer.create')}
          </button>
        )}
      </div>
    </div>
  );
}
