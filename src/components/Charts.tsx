import { useId, useState } from "react";
import { fmt, fmt1 } from "../lib/calc";

const W = 680;

function niceCeil(v: number): number {
  if (v <= 10) return Math.ceil(v);
  if (v <= 100) return Math.ceil(v / 10) * 10;
  if (v <= 1000) return Math.ceil(v / 50) * 50;
  return Math.ceil(v / 100) * 100;
}

interface Pt {
  label: string;
  value: number | null;
}

export function LineChart({
  data,
  goal,
  height = 230,
  unit = "ккал",
  min,
  max,
  tone = "pink",
  avg,
  emptyText = "Пока пусто. Данные не появляются сами.",
}: {
  data: Pt[];
  goal?: number;
  height?: number;
  unit?: string;
  min?: number;
  max?: number;
  tone?: "pink" | "bone";
  avg?: number;
  emptyText?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((d) => d.value).filter((v): v is number => v !== null);

  if (!values.length) {
    return <div className="chart chart--empty">{emptyText}</div>;
  }

  const pad = { l: 46, r: 16, t: 20, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const domainMax = max ?? niceCeil(Math.max(...values, goal ?? 0) * 1.08);
  const domainMin = min ?? 0;
  const span = domainMax - domainMin || 1;
  const step = data.length > 1 ? iw / (data.length - 1) : 0;
  const x = (i: number) => pad.l + i * step;
  const y = (v: number) => pad.t + ih - ((v - domainMin) / span) * ih;

  const segments: { i: number; v: number }[][] = [];
  let current: { i: number; v: number }[] = [];
  data.forEach((d, i) => {
    if (d.value === null) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push({ i, v: d.value });
    }
  });
  if (current.length) segments.push(current);

  const gridLines = 4;
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const toneColor = tone === "pink" ? "var(--pink)" : "var(--bone)";

  return (
    <div className="chart" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="chart__svg"
        role="img"
        aria-label={`График ${unit}. ${data.length} точек. ${values.length ? `Среднее ${fmt(values.reduce((a, b) => a + b, 0) / values.length)} ${unit}.` : ""}`}
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={toneColor} stopOpacity="0.32" />
            <stop offset="100%" stopColor={toneColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const v = domainMin + (span * i) / gridLines;
          return (
            <g key={i}>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--line)"
                strokeDasharray={i === 0 ? undefined : "2 5"}
              />
              <text x={pad.l - 10} y={y(v) + 3.5} textAnchor="end" className="chart__axis">
                {fmt(v)}
              </text>
            </g>
          );
        })}

        {goal !== undefined ? (
          <g>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(goal)}
              y2={y(goal)}
              stroke="var(--cherry-2)"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
            <text x={W - pad.r} y={y(goal) - 6} textAnchor="end" className="chart__goal">
              цель {fmt(goal)}
            </text>
          </g>
        ) : null}

        {avg !== undefined ? (
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(avg)}
            y2={y(avg)}
            stroke="var(--muted)"
            strokeWidth="1"
            strokeDasharray="1 4"
            opacity="0.6"
          />
        ) : null}

        {segments.map((seg, si) => {
          const line = seg.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i)},${y(p.v)}`).join(" ");
          const area = `${line} L${x(seg[seg.length - 1].i)},${pad.t + ih} L${x(seg[0].i)},${pad.t + ih} Z`;
          return (
            <g key={si}>
              {seg.length > 1 ? <path d={area} fill={`url(#fill-${gid})`} /> : null}
              <path d={line} fill="none" stroke={toneColor} strokeWidth="1.8" strokeLinejoin="round" />
            </g>
          );
        })}

        {data.map((d, i) =>
          d.value === null ? null : (
            <rect
              key={`dot-${i}`}
              x={x(i) - Math.max(step / 2, 6)}
              y={pad.t}
              width={Math.max(step, 12)}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "crosshair" }}
            />
          ),
        )}

        {hover !== null && data[hover]?.value !== null ? (
          <g pointerEvents="none">
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.t}
              y2={pad.t + ih}
              stroke="var(--pink)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            <circle cx={x(hover)} cy={y(data[hover].value as number)} r="5" fill="var(--ink)" stroke={toneColor} strokeWidth="2" />
            <circle cx={x(hover)} cy={y(data[hover].value as number)} r="1.6" fill={toneColor} />
          </g>
        ) : null}

        {data.map((d, i) =>
          d.value === null || i % labelEvery !== 0 ? null : (
            <text key={`x-${i}`} x={x(i)} y={height - 9} textAnchor="middle" className="chart__axis">
              {d.label}
            </text>
          ),
        )}
      </svg>

      {hover !== null && data[hover]?.value !== null ? (
        <div
          className="chart__tip"
          style={{
            left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`,
            top: `${Math.max(6, (y(data[hover].value as number) / height) * 100)}%`,
          }}
        >
          <span className="chart__tip-label">{data[hover].label}</span>
          <span className="chart__tip-val">
            {fmt1(data[hover].value as number)} <em>{unit}</em>
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function BarsChart({
  data,
  height = 180,
  unit = "",
  goal,
  tone = "pink",
  max,
  emptyText = "Пусто.",
}: {
  data: Pt[];
  height?: number;
  unit?: string;
  goal?: number;
  tone?: "pink" | "cherry";
  max?: number;
  emptyText?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((d) => d.value).filter((v): v is number => v !== null);
  if (!values.length) return <div className="chart chart--empty">{emptyText}</div>;

  const pad = { l: 40, r: 12, t: 16, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const domainMax = max ?? niceCeil(Math.max(...values, goal ?? 0) * 1.08);
  const step = iw / data.length;
  const bw = Math.max(3, Math.min(26, step * 0.58));
  const x = (i: number) => pad.l + step * i + step / 2;
  const y = (v: number) => pad.t + ih - (v / (domainMax || 1)) * ih;
  const color = tone === "pink" ? "var(--pink)" : "var(--cherry-2)";
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="chart" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${height}`} className="chart__svg" role="img" aria-label={`Столбчатый график ${unit}`}>
        <defs>
          <linearGradient id={`bar-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={pad.t + ih * (1 - f)}
              y2={pad.t + ih * (1 - f)}
              stroke="var(--line)"
              strokeDasharray={f === 0 ? undefined : "2 5"}
            />
            <text x={pad.l - 8} y={pad.t + ih * (1 - f) + 3.5} textAnchor="end" className="chart__axis">
              {fmt(domainMax * f)}
            </text>
          </g>
        ))}
        {goal !== undefined ? (
          <line x1={pad.l} x2={W - pad.r} y1={y(goal)} y2={y(goal)} stroke="var(--cherry-2)" strokeDasharray="6 4" />
        ) : null}
        {data.map((d, i) => (
          <g key={i}>
            {d.value !== null ? (
              <rect
                x={x(i) - bw / 2}
                y={y(d.value)}
                width={bw}
                height={Math.max(1, pad.t + ih - y(d.value))}
                fill={`url(#bar-${gid})`}
                className="chart__bar"
              />
            ) : null}
            <rect
              x={x(i) - step / 2}
              y={pad.t}
              width={step}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {i % labelEvery === 0 ? (
              <text x={x(i)} y={height - 8} textAnchor="middle" className="chart__axis">
                {d.label}
              </text>
            ) : null}
          </g>
        ))}
        {hover !== null && data[hover]?.value !== null ? (
          <rect
            x={x(hover) - bw / 2}
            y={y(data[hover].value as number)}
            width={bw}
            height={Math.max(1, pad.t + ih - y(data[hover].value as number))}
            fill="none"
            stroke="var(--pink-soft)"
            strokeWidth="1"
          />
        ) : null}
      </svg>
      {hover !== null && data[hover]?.value !== null ? (
        <div
          className="chart__tip"
          style={{
            left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`,
            top: `${Math.max(6, (y(data[hover].value as number) / height) * 100)}%`,
          }}
        >
          <span className="chart__tip-label">{data[hover].label}</span>
          <span className="chart__tip-val">
            {fmt1(data[hover].value as number)} <em>{unit}</em>
          </span>
        </div>
      ) : null}
    </div>
  );
}

export interface StackDatum {
  label: string;
  parts: { value: number; tone: "p" | "f" | "c" }[];
}

const STACK_COLORS = {
  p: "var(--pink)",
  f: "var(--cherry-2)",
  c: "var(--bone-dim)",
};

export function StackedBars({
  data,
  height = 200,
  goal,
  max,
}: {
  data: StackDatum[];
  height?: number;
  goal?: number;
  max?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = data.map((d) => d.parts.reduce((a, b) => a + b.value, 0));
  const nonZero = totals.filter((t) => t > 0);
  if (!nonZero.length) return <div className="chart chart--empty">Макросы не появятся из воздуха.</div>;

  const pad = { l: 42, r: 12, t: 16, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const domainMax = max ?? niceCeil(Math.max(...nonZero, goal ?? 0) * 1.08);
  const step = iw / data.length;
  const bw = Math.max(3, Math.min(24, step * 0.56));
  const x = (i: number) => pad.l + step * i + step / 2;
  const y = (v: number) => pad.t + ih - (v / (domainMax || 1)) * ih;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="chart" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${height}`} className="chart__svg" role="img" aria-label="Столбчатый график макросов по дням">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={pad.t + ih * (1 - f)}
              y2={pad.t + ih * (1 - f)}
              stroke="var(--line)"
              strokeDasharray={f === 0 ? undefined : "2 5"}
            />
            <text x={pad.l - 8} y={pad.t + ih * (1 - f) + 3.5} textAnchor="end" className="chart__axis">
              {fmt(domainMax * f)}
            </text>
          </g>
        ))}
        {goal !== undefined ? (
          <line x1={pad.l} x2={W - pad.r} y1={y(goal)} y2={y(goal)} stroke="var(--cherry-2)" strokeDasharray="6 4" />
        ) : null}
        {data.map((d, i) => {
          let acc = 0;
          const total = totals[i];
          return (
            <g key={i}>
              {total > 0
                ? d.parts.map((part) => {
                    if (part.value <= 0) return null;
                    const y0 = y(acc + part.value);
                    const y1 = y(acc);
                    acc += part.value;
                    return (
                      <rect
                        key={part.tone}
                        x={x(i) - bw / 2}
                        y={y0}
                        width={bw}
                        height={Math.max(0.5, y1 - y0)}
                        fill={STACK_COLORS[part.tone]}
                        opacity={0.9}
                      />
                    );
                  })
                : null}
              <rect
                x={x(i) - step / 2}
                y={pad.t}
                width={step}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {i % labelEvery === 0 ? (
                <text x={x(i)} y={height - 8} textAnchor="middle" className="chart__axis">
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover !== null && totals[hover] > 0 ? (
        <div
          className="chart__tip"
          style={{
            left: `${Math.min(86, Math.max(14, (x(hover) / W) * 100))}%`,
            top: `${Math.max(6, (y(totals[hover]) / height) * 100)}%`,
          }}
        >
          <span className="chart__tip-label">{data[hover].label}</span>
          <span className="chart__tip-val">{fmt(totals[hover])} <em>г</em></span>
          <span className="chart__tip-sub">
            б {fmt1(data[hover].parts[0]?.value ?? 0)} · ж {fmt1(data[hover].parts[1]?.value ?? 0)} · у {fmt1(data[hover].parts[2]?.value ?? 0)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; tone: "p" | "f" | "c" | "pink" | "bone" }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span className="legend__item" key={i.label}>
          <span
            className="legend__swatch"
            style={{
              background:
                i.tone === "p" || i.tone === "pink"
                  ? "var(--pink)"
                  : i.tone === "f"
                    ? "var(--cherry-2)"
                    : "var(--bone-dim)",
            }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
