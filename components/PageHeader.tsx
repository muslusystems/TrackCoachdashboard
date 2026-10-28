import * as React from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-500 to-signal-800 text-white shadow-card">
          <Icon size={22} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-ink-400">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
