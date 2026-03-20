// src/components/ui.jsx
import React from 'react';

// ── Badge ──────────────────────────────────────────────
const BADGE_COLORS = {
  blue:   { bg: 'var(--primary-light)',   color: 'var(--primary)' },
  green:  { bg: 'var(--success-light)',   color: 'var(--success)' },
  yellow: { bg: 'var(--warning-light)',   color: 'var(--warning)' },
  red:    { bg: 'var(--danger-light)',    color: 'var(--danger)' },
  gray:   { bg: 'var(--gray-100)',        color: 'var(--gray-600)' },
};

export function Badge({ color = 'gray', children, style }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, ...style
    }}>
      {children}
    </span>
  );
}

// ── SimilarityBar ──────────────────────────────────────
export function SimilarityBar({ value }) {
  const color = value < 30 ? 'var(--success)' : value < 60 ? 'var(--warning)' : 'var(--danger)';
  const textColor = color;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32, textAlign: 'right', color: textColor }}>{value}%</span>
    </div>
  );
}

// ── Button ─────────────────────────────────────────────
export function Button({ variant = 'primary', children, onClick, disabled, style, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s', fontFamily: 'inherit', opacity: disabled ? .6 : 1,
  };
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff' },
    outline: { background: '#fff', color: 'var(--gray-700)', border: '1px solid var(--gray-200)' },
    ghost:   { background: 'transparent', color: 'var(--gray-600)', border: 'none' },
    danger:  { background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────
export function Card({ children, style, padding = '0' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow)', border: '1px solid var(--gray-100)',
      overflow: 'hidden', padding, ...style
    }}>
      {children}
    </div>
  );
}

// ── SectionHeader ──────────────────────────────────────
export function SectionHeader({ title, children }) {
  return (
    <div style={{
      padding: '14px 20px', borderBottom: '1px solid var(--gray-100)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', flex: 1 }}>{title}</span>
      {children}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────
export function StatCard({ icon, value, label, change, changeType = 'up', iconBg }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)', padding: 18,
      boxShadow: 'var(--shadow)', border: '1px solid var(--gray-100)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9, background: iconBg || 'var(--primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>{label}</div>
      {change && (
        <div style={{
          fontSize: 11, fontWeight: 600, marginTop: 8,
          color: changeType === 'up' ? 'var(--success)' : changeType === 'warn' ? 'var(--warning)' : 'var(--gray-500)',
        }}>
          {change}
        </div>
      )}
    </div>
  );
}

// ── FormInput ──────────────────────────────────────────
export function FormInput({ label, error, children, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {error && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid var(--gray-200)',
  borderRadius: 8, fontSize: 13, color: 'var(--gray-800)', outline: 'none',
  transition: 'border-color .15s, box-shadow .15s', background: '#fff',
};

export function Input({ ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        borderColor: focused ? 'var(--primary)' : 'var(--gray-200)',
        boxShadow: focused ? '0 0 0 3px rgba(26,86,219,.08)' : 'none',
        ...props.style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function Textarea({ ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6,
        borderColor: focused ? 'var(--primary)' : 'var(--gray-200)',
        boxShadow: focused ? '0 0 0 3px rgba(26,86,219,.08)' : 'none',
        ...props.style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function Select({ children, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputStyle, cursor: 'pointer',
        borderColor: focused ? 'var(--primary)' : 'var(--gray-200)',
        boxShadow: focused ? '0 0 0 3px rgba(26,86,219,.08)' : 'none',
        ...props.style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

// ── Spinner ────────────────────────────────────────────
export function Spinner({ size = 18 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid var(--gray-200)', borderTopColor: 'var(--primary)',
      animation: 'spin .7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ── EmptyState ─────────────────────────────────────────
export function EmptyState({ icon, title, description }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--gray-400)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{description}</div>
    </div>
  );
}

// ── FilterTabs ─────────────────────────────────────────
export function FilterTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--gray-100)', padding: 3, borderRadius: 8 }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            background: active === tab.value ? '#fff' : 'transparent',
            color: active === tab.value ? 'var(--gray-800)' : 'var(--gray-500)',
            boxShadow: active === tab.value ? 'var(--shadow)' : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
