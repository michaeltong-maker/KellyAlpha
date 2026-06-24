import { Link } from 'react-router-dom';
import { Star, Users, Quote, Check } from 'lucide-react';
import type { Agent } from '../types';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { ChartBackground, pickVariant } from './ChartBackground';
import { useT } from '../lib/i18n';

export function EditorsChoiceCard({ agent, rank, hired }: { agent: Agent; rank: number; hired?: boolean }) {
  const t = useT();
  const variant = pickVariant(agent.id);
  const review = agent.reviews[0];
  return (
    <Link
      to={`/marketplace/${agent.id}`}
      className="group block relative overflow-hidden rounded-xl2 bg-card border border-ink-200 transition-all duration-200 hover:border-ink-300 hover:shadow-soft active:bg-ink-50"
    >
      {/* Thematic chart background */}
      <div className="relative h-28 border-b border-ink-200">
        <ChartBackground variant={variant} className="opacity-90" />
        {/* Rank pill */}
        <div className="accent-gradient absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-onaccent text-[11px] uppercase tracking-label shadow-soft">
          Editor's #{rank}
        </div>
        {/* Stars top-right */}
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-card border border-ink-200 font-mono text-[13px] text-ink-900">
          <Star size={11} fill="currentColor" /> {agent.rating.toFixed(1)}
        </div>
        {/* Avatar bottom-right, half-overlapping */}
        <div className="absolute -bottom-5 right-4">
          <Avatar seed={agent.avatarSeed} name={agent.name} size={48} ink className="ring-4 ring-card" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-4">
        {/* Name + title + pitch */}
        <div className="pr-12">
          <h3 className="font-display text-[20px] font-medium text-ink-900 leading-tight">{agent.name}</h3>
          {agent.title && (
            <p className="text-[11px] uppercase tracking-label text-ink-500 leading-tight mt-1.5">{agent.title}</p>
          )}
          {hired && (
            <span className="chip-active inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-pill border text-[11px] font-medium">
              <Check size={11} strokeWidth={2.4} /> {t('marketplace.hired')}
            </span>
          )}
        </div>
        <p className="text-[15px] text-ink-700 leading-snug mt-2.5">
          “{agent.pitch}”
        </p>
        {/* Description */}
        <p className="text-[15px] text-ink-500 leading-snug mt-2 line-clamp-2">
          {agent.description}
        </p>

        {/* Review quote */}
        {review && (
          <div className="mt-3 rounded-md bg-ink-100 px-3 py-2 relative">
            <Quote size={12} className="absolute -top-1.5 -left-1.5 text-ink-300 bg-card rounded-full p-0.5 border border-ink-200" />
            <p className="text-[15px] text-ink-700 leading-snug line-clamp-1">{review.comment}</p>
            <p className="text-[12px] text-ink-500 mt-0.5">— @{review.user}</p>
          </div>
        )}

        {/* Meta row — hired count pinned left (never wraps), tags ride on a
            single no-wrap track to the right so the footer can't break onto
            two lines. */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-ink-200">
          <div className="flex items-center gap-1 text-ink-500 text-[13px] shrink-0 whitespace-nowrap">
            <Users size={11} className="shrink-0" />
            <span className="font-mono">{t('agent.hired', { n: agent.duplicates.toLocaleString() })}</span>
          </div>
          <div className="flex gap-1 justify-end overflow-hidden">
            {agent.tags.slice(0, 2).map((tag) => <Tag key={tag}>{tag}</Tag>)}
          </div>
        </div>
      </div>
    </Link>
  );
}
