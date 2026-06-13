import React from 'react';

export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      <div className="page-actions">{actions}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}): React.JSX.Element {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}): React.JSX.Element {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Loading(): React.JSX.Element {
  return <div className="loading">Loading…</div>;
}

export function Empty({ message }: { message: string }): React.JSX.Element {
  return <div className="empty">{message}</div>;
}
