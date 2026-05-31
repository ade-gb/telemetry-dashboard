import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export function Panel({ children, className = "", title, eyebrow, action }: PanelProps) {
  return (
    <section className={`glass-panel rounded-[8px] ${className}`}>
      {(title || eyebrow || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
          <div>
            {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyanGlow/70">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-sm font-semibold text-slate-100">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
