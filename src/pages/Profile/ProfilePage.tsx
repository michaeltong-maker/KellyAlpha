import { useMemo, useRef, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { AppHeader } from '../../components/AppHeader';
import { Avatar } from '../../components/Avatar';
import {
  Send, CreditCard, Sparkles, Users, FileBadge, Camera,
  Languages, MessageSquare, FileText, ChevronRight, X, Check,
  Sun, Moon, Smartphone, Compass,
} from 'lucide-react';
import type { ThemeMode, Lang } from '../../lib/storage';
import { useT } from '../../lib/i18n';

const TERMS_URL = 'https://alphawalk.ai/terms';

export function ProfilePage() {
  const { profile, setProfile, agents, persisted, updatePersisted } = useApp();
  const t = useT();
  const [telegramDraft, setTelegramDraft] = useState(profile.telegramHandle ?? '');
  const [last4, setLast4] = useState(profile.paymentLast4 ?? '');
  const [brand, setBrand] = useState(profile.paymentBrand ?? 'Visa');
  const [openSheet, setOpenSheet] = useState<null | 'language' | 'feedback' | 'theme'>(null);

  const myAgents = useMemo(() => agents.filter((a) => persisted.userCreatedAgentIds.includes(a.id)), [agents, persisted]);
  const totalHires = useMemo(() => myAgents.reduce((sum, a) => sum + a.duplicates, 0), [myAgents]);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveTelegram = () => setProfile({ ...profile, telegramHandle: telegramDraft.trim() });
  const savePayment = () => setProfile({ ...profile, paymentLast4: last4.trim(), paymentBrand: brand });

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setProfile({ ...profile, avatarSeed: url });
  };

  const languageLabel =
    persisted.language === 'zh' ? t('language.zh.native')
    : persisted.language === 'zh-Hans' ? t('language.zhHans.native')
    : t('language.en.native');
  const themeMode = persisted.theme;
  const themeLabel = themeMode === 'dark' ? t('theme.dark') : themeMode === 'light' ? t('theme.light') : t('theme.system');
  const openTerms = () => window.open(TERMS_URL, '_blank', 'noreferrer');

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader back title={t('header.profile.title')} subtitle={profile.email} />

      <div className="flex-1 min-h-0 overflow-y-auto w-full max-w-3xl mx-auto">
        {/* Identity */}
        <section className="px-4 py-5 border-b border-ink-200 flex items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="relative shrink-0" aria-label="change avatar">
            <Avatar seed={profile.avatarSeed} name={profile.name} size={64} ring />
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-pill bg-ink-900 text-paper flex items-center justify-center">
              <Camera size={12} strokeWidth={1.8} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
          <div className="flex-1 min-w-0">
            <input
              value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-transparent outline-none font-display text-[22px] font-medium text-ink-900"
            />
            <input
              value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-transparent outline-none text-[15px] text-ink-500"
            />
          </div>
        </section>

        {/* Creator stats */}
        <section className="px-4 py-4 border-b border-ink-200">
          <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-3">{t('profile.creatorStats')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-ink-500 text-[13px]"><FileBadge size={12} strokeWidth={1.6}/> {t('profile.agentsCreated')}</div>
              <p className="font-display text-[32px] font-medium text-ink-900 mt-1">{myAgents.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-ink-500 text-[13px]"><Users size={12} strokeWidth={1.6}/> {t('profile.totalHires')}</div>
              <p className="font-display text-[32px] font-medium text-ink-900 mt-1 tabular-nums">{totalHires.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Subscription information — demo values stored locally; in a real
            build these would come from the billing service. */}
        <section className="px-4 py-4 border-b border-ink-200">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="text-[11px] uppercase tracking-label text-ink-500">{t('profile.section.subscription')}</h3>
            <button
              onClick={() => { /* TODO: wire to billing flow */ }}
              className="shrink-0 inline-flex items-center gap-1 text-[13px] font-medium text-onaccent btn-accent px-3.5 py-1.5 duration-200 ease-out-expo"
            >
              {t('profile.subscription.upgrade')}
            </button>
          </div>
          <div className="border-t border-ink-200 divide-y divide-ink-200">
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-[15px] text-ink-500 shrink-0">{t('profile.subscription.tier')}</span>
              <span className="text-[15px] font-medium text-ink-900">Pro</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-[15px] text-ink-500 shrink-0">{t('profile.subscription.expiry')}</span>
              <span className="font-mono text-[14px] text-ink-900">
                {new Date(Date.now() + 90 * 86_400_000).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-[15px] text-ink-500 shrink-0">{t('profile.subscription.credits')}</span>
              <span className="font-mono text-[14px] text-ink-900">8,420</span>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="px-4 py-4 border-b border-ink-200">
          <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-2">{t('profile.preferences')}</h3>
          <div className="border-t border-ink-200 divide-y divide-ink-200">
            <Row
              icon={<Languages size={16} className="text-ink-500" strokeWidth={1.6} />}
              label={t('profile.row.language')}
              value={languageLabel}
              onClick={() => setOpenSheet('language')}
            />
            <Row
              icon={<Sun size={16} className="text-ink-500" strokeWidth={1.6} />}
              label={t('profile.row.appearance')}
              value={themeLabel}
              onClick={() => setOpenSheet('theme')}
            />
            <Row
              icon={<MessageSquare size={16} className="text-ink-500" strokeWidth={1.6} />}
              label={t('profile.row.feedback')}
              onClick={() => setOpenSheet('feedback')}
            />
            <Row
              icon={<FileText size={16} className="text-ink-500" strokeWidth={1.6} />}
              label={t('profile.row.terms')}
              onClick={openTerms}
            />
            {/* Restore (or re-hide) the front-desk concierge thread. This is the
                "bring it back" path for the hide action in Margaux's header. */}
            <ToggleRow
              icon={<Compass size={16} className="text-ink-500" strokeWidth={1.6} />}
              label={t('margaux.profileRow')}
              on={!persisted.margaux.hidden}
              onChange={(next) => updatePersisted({ margaux: { ...persisted.margaux, hidden: !next } })}
              stateLabel={persisted.margaux.hidden ? t('margaux.profileValue.hidden') : t('margaux.profileValue.shown')}
            />
          </div>
        </section>

        {/* Telegram */}
        <section className="px-4 py-4 border-b border-ink-200">
          <div className="flex items-center gap-1.5 mb-2"><Send size={13} className="text-ink-500" strokeWidth={1.6}/><h3 className="text-[11px] uppercase tracking-label text-ink-500">{t('profile.section.telegram')}</h3></div>
          <p className="text-[15px] text-ink-500 mb-2.5">{t('profile.telegram.help')}</p>
          <div className="flex gap-2">
            <input
              value={telegramDraft} onChange={(e) => setTelegramDraft(e.target.value)}
              placeholder="@yourhandle"
              className="flex-1 rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[16px] outline-none"
            />
            <button onClick={saveTelegram} className="px-5 py-2.5 rounded-sm bg-ink-900 text-paper text-[14px] font-medium transition-colors duration-200 ease-out-expo">{t('profile.save')}</button>
          </div>
          <p className="mt-2 text-[12px] text-ink-500 leading-snug">
            {t('profile.telegram.tip')}
          </p>
          {profile.telegramHandle && (
            <p className="text-[13px] text-ink-500 mt-2">{t('profile.telegram.connected', { handle: profile.telegramHandle })}</p>
          )}
        </section>

        {/* Payment */}
        <section className="px-4 py-4 border-b border-ink-200">
          <div className="flex items-center gap-1.5 mb-2.5"><CreditCard size={13} className="text-ink-500" strokeWidth={1.6}/><h3 className="text-[11px] uppercase tracking-label text-ink-500">{t('profile.section.payment')}</h3></div>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <input
              value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={t('profile.payment.last4')}
              className="rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[16px] font-mono outline-none"
            />
            <select
              value={brand} onChange={(e) => setBrand(e.target.value)}
              className="rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[16px] outline-none"
            >
              <option>Visa</option><option>Mastercard</option><option>Amex</option><option>UnionPay</option>
            </select>
          </div>
          <button onClick={savePayment} className="mt-2.5 px-5 py-2.5 rounded-sm bg-ink-900 text-paper text-[14px] font-medium transition-colors duration-200 ease-out-expo">{t('profile.payment.save')}</button>
          {profile.paymentLast4 && (
            <p className="font-mono text-[13px] text-ink-500 mt-2">{profile.paymentBrand} •••• {profile.paymentLast4}</p>
          )}
        </section>

        {/* Reset onboarding (utility for demo) */}
        <section className="px-4 py-4">
          <div className="flex items-center gap-1.5 mb-2.5"><Sparkles size={13} className="text-ink-500" strokeWidth={1.6}/><h3 className="text-[11px] uppercase tracking-label text-ink-500">{t('profile.section.demo')}</h3></div>
          <button
            onClick={() => updatePersisted({
              hasOnboarded: false,
              hasSeenWelcome: false,
              userCreatedAgentIds: [],
              duplicatedAgentIds: [],
              hiredCopies: {},
              interests: [],
              userAgents: [],
              userResults: [],
              firstAgentCelebrated: false,
              firstDuplicateCelebrated: false,
            })}
            className="px-5 py-2.5 rounded-sm border border-ink-900 text-ink-900 text-[14px] font-medium hover:bg-ink-900 hover:text-paper transition-colors duration-200 ease-out-expo"
          >{t('profile.demo.reset')}</button>
        </section>
      </div>

      {openSheet === 'language' && (
        <LanguageSheet
          current={persisted.language}
          onClose={() => setOpenSheet(null)}
          onChoose={(lang) => { updatePersisted({ language: lang }); setOpenSheet(null); }}
        />
      )}
      {openSheet === 'theme' && (
        <ThemeSheet
          current={themeMode}
          onClose={() => setOpenSheet(null)}
          onChoose={(mode) => { updatePersisted({ theme: mode }); setOpenSheet(null); }}
        />
      )}
      {openSheet === 'feedback' && (
        <FeedbackSheet onClose={() => setOpenSheet(null)} />
      )}
    </div>
  );
}

function Row({ icon, label, value, onClick }: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3.5 active:bg-ink-50 transition-colors duration-200">
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left text-[15px] text-ink-900">{label}</span>
      {value && <span className="text-[15px] text-ink-500">{value}</span>}
      <ChevronRight size={16} className="text-ink-300 shrink-0" strokeWidth={1.6} />
    </button>
  );
}

function ToggleRow({ icon, label, on, onChange, stateLabel }: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onChange: (next: boolean) => void;
  stateLabel: string;
}) {
  return (
    <div className="w-full flex items-center gap-3 py-3.5">
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left text-[15px] text-ink-900">{label}</span>
      <span className="text-[13px] text-ink-500">{stateLabel}</span>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative shrink-0 w-11 h-6 rounded-pill border-0 outline-none transition-colors duration-200 ease-out-expo ${on ? 'accent-gradient' : 'bg-ink-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-pill bg-card shadow-sm transition-transform duration-200 ease-out-expo ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function LanguageSheet({ current, onChoose, onClose }: {
  current: Lang;
  onChoose: (lang: Lang) => void;
  onClose: () => void;
}) {
  const t = useT();
  const options: { value: Lang; label: string; native: string }[] = [
    { value: 'en', label: t('language.en.label'), native: t('language.en.native') },
    { value: 'zh', label: t('language.zh.label'), native: t('language.zh.native') },
    { value: 'zh-Hans', label: t('language.zhHans.label'), native: t('language.zhHans.native') },
  ];
  return (
    <div className="absolute inset-0 z-30 bg-ink-900/40 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),12px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-pill bg-ink-200" />
        </div>
        <header className="px-5 pb-3 pt-1 flex items-center justify-between">
          <h3 className="font-display text-[22px] font-medium text-ink-900">{t('language.title')}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label="close"><X size={18} strokeWidth={1.6}/></button>
        </header>
        <ul className="px-3 pb-2">
          {options.map((o) => {
            const active = o.value === current;
            return (
              <li key={o.value}>
                <button
                  onClick={() => onChoose(o.value)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors duration-200 ${active ? 'bg-ink-100' : 'active:bg-ink-50'}`}
                >
                  <span className="flex-1 text-left">
                    <span className="block text-[17px] font-medium text-ink-900">{o.native}</span>
                    <span className="block text-[13px] text-ink-500">{o.label}</span>
                  </span>
                  {active && <Check size={18} className="text-accent" strokeWidth={1.8} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ThemeSheet({ current, onChoose, onClose }: {
  current: ThemeMode;
  onChoose: (mode: ThemeMode) => void;
  onClose: () => void;
}) {
  const t = useT();
  const options: { value: ThemeMode; label: string; hint: string; icon: React.ReactNode }[] = [
    { value: 'system', label: t('theme.system'), hint: t('theme.system.hint'), icon: <Smartphone size={18} className="text-ink-500" strokeWidth={1.6} /> },
    { value: 'light',  label: t('theme.light'),  hint: t('theme.light.hint'),  icon: <Sun        size={18} className="text-ink-500" strokeWidth={1.6} /> },
    { value: 'dark',   label: t('theme.dark'),   hint: t('theme.dark.hint'),   icon: <Moon       size={18} className="text-ink-500" strokeWidth={1.6} /> },
  ];
  return (
    <div className="absolute inset-0 z-30 bg-ink-900/40 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),12px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-pill bg-ink-200" />
        </div>
        <header className="px-5 pb-3 pt-1 flex items-center justify-between">
          <h3 className="font-display text-[22px] font-medium text-ink-900">{t('theme.title')}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label="close"><X size={18} strokeWidth={1.6}/></button>
        </header>
        <ul className="px-3 pb-2">
          {options.map((o) => {
            const active = o.value === current;
            return (
              <li key={o.value}>
                <button
                  onClick={() => onChoose(o.value)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors duration-200 ${active ? 'bg-ink-100' : 'active:bg-ink-50'}`}
                >
                  <span className="shrink-0">{o.icon}</span>
                  <span className="flex-1 text-left">
                    <span className="block text-[17px] font-medium text-ink-900">{o.label}</span>
                    <span className="block text-[13px] text-ink-500">{o.hint}</span>
                  </span>
                  {active && <Check size={18} className="text-accent" strokeWidth={1.8} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [msg, setMsg] = useState('');
  const send = () => {
    const subject = encodeURIComponent('AlphaWalk — feedback');
    const body = encodeURIComponent(msg.trim());
    window.location.href = `mailto:cs@alphawalk.ai?subject=${subject}&body=${body}`;
    onClose();
  };
  return (
    <div className="absolute inset-0 z-30 bg-ink-900/40 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),12px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-pill bg-ink-200" />
        </div>
        <header className="px-5 pb-2 pt-1 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-[22px] font-medium text-ink-900">{t('feedback.title')}</h3>
            <p className="text-[13px] text-ink-500">{t('feedback.help')} <span className="font-mono text-ink-900">cs@alphawalk.ai</span></p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label="close"><X size={18} strokeWidth={1.6}/></button>
        </header>
        <div className="px-5 pb-4">
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={5}
            placeholder={t('feedback.placeholder')}
            className="w-full rounded-md border border-ink-200 bg-paper px-3 py-2.5 text-[15px] outline-none resize-none"
          />
          <button
            onClick={send}
            disabled={msg.trim().length === 0}
            className="mt-3 w-full rounded-sm bg-ink-900 text-paper px-5 py-3 font-medium text-[14px] disabled:bg-ink-200 disabled:text-ink-500 transition-colors duration-200 ease-out-expo"
          >
            {t('feedback.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
