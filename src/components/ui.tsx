import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { FoodTag } from "../lib/types";
import { Icon } from "./Icon";

export function PageHead({
  index,
  kicker,
  title,
  sub,
  actions,
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="pagehead">
      <div className="pagehead__meta">
        <span className="eyebrow">
          <span className="eyebrow__num">{index}</span>
          <span className="eyebrow__line" />
          {kicker}
        </span>
        <span className="pagehead__slash" aria-hidden="true">
          //
        </span>
      </div>
      <div className="pagehead__row">
        <div className="pagehead__main">
          <h1 className="pagehead__title">{title}</h1>
          {sub ? <p className="pagehead__sub">{sub}</p> : null}
        </div>
        {actions ? <div className="pagehead__actions">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Ring({
  value,
  size = 132,
  stroke = 6,
  tone = "pink",
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "pink" | "cherry" | "bone";
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} />
        <circle
          className={`ring__val ring__val--${tone}`}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring__inner" aria-hidden={label ? true : undefined}>{children}</div>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

export function Bar({
  value,
  max,
  tone = "pink",
  height = 6,
  label,
}: {
  value: number;
  max: number;
  tone?: "pink" | "cherry" | "bone" | "dim";
  height?: number;
  label?: string;
}) {
  const p = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={`bar bar--${tone}`}
      style={{ height } as CSSProperties}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <span className="bar__fill" style={{ width: `${p}%` }} />
    </div>
  );
}

export function Tag({ tag }: { tag: FoodTag }) {
  if (tag === "safe") return <span className="tag tag--safe">безопасно</span>;
  if (tag === "red") return <span className="tag tag--red">красный флаг</span>;
  return <span className="tag tag--liquid">жидкое</span>;
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="switchrow">
      <span className="switchrow__text">
        <span className="switchrow__label">{label}</span>
        {hint ? <span className="switchrow__hint">{hint}</span> : null}
      </span>
      <span className={`switch ${checked ? "is-on" : ""}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
      </span>
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  kicker,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  kicker?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const nodes = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>("input, textarea, button");
      (target ?? dialogRef.current)?.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal" role="presentation" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div
        className={`modal__sheet ${wide ? "modal__sheet--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : kicker ?? "Диалог"}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal__grip" aria-hidden="true" />
        <header className="modal__head">
          <div>
            {kicker ? <span className="eyebrow">{kicker}</span> : null}
            <h2 className="modal__title">{title}</h2>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

export function Empty({
  mark = "○",
  title,
  sub,
  action,
}: {
  mark?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty__mark" aria-hidden="true">{mark}</span>
      <p className="empty__title">{title}</p>
      {sub ? <p className="empty__sub">{sub}</p> : null}
      {action}
    </div>
  );
}

export interface ToastData {
  id: number;
  text: string;
  action?: { label: string; onClick: () => void };
}

export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__mark" aria-hidden="true">✕</span>
      <span className="toast__text">{toast.text}</span>
      {toast.action ? (
        <button
          className="toast__action"
          onClick={() => {
            toast.action?.onClick();
            onClose();
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
      <button className="toast__close" onClick={onClose} aria-label="Закрыть уведомление">
        <Icon name="close" size={14} />
      </button>
      <span className="toast__timer" aria-hidden="true" />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`segmented__btn ${value === o.value ? "is-active" : ""}`}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
