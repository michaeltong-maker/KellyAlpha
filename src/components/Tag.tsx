interface Props {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function Tag({ children, active, onClick, size = 'sm' }: Props) {
  const base =
    size === 'sm'
      ? 'text-[12px] px-3 py-1 rounded-pill'
      : 'text-[13px] px-3.5 py-1.5 rounded-pill';
  const cls = active
    ? 'chip-active border font-medium'
    : 'bg-transparent text-ink-500 border border-ink-200 hover:border-ink-300 hover:text-ink-700';
  return onClick ? (
    <button onClick={onClick} className={`${base} ${cls} transition-colors duration-200 ease-out-expo`}>{children}</button>
  ) : (
    <span className={`${base} ${cls}`}>{children}</span>
  );
}
