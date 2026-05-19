"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export type DateRange = { from: string; to: string };
type Preset = "7d" | "15d" | "30d" | "90d" | "mtd" | "custom";

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(preset: Exclude<Preset, "custom">): DateRange {
  const today = new Date();
  const to = toISO(today);
  const from = new Date(today);

  if (preset === "7d")  { from.setDate(today.getDate() - 6); }
  if (preset === "15d") { from.setDate(today.getDate() - 14); }
  if (preset === "30d") { from.setDate(today.getDate() - 29); }
  if (preset === "90d") { from.setDate(today.getDate() - 89); }
  if (preset === "mtd") { from.setDate(1); }

  return { from: toISO(from), to };
}

const PRESETS: { key: Exclude<Preset, "custom">; label: string }[] = [
  { key: "7d",  label: "7D"  },
  { key: "15d", label: "15D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "mtd", label: "MTD" },
];

export function DateRangePicker({ value, onChange }: Props) {
  const [active, setActive] = useState<Preset>("30d");

  function applyPreset(preset: Exclude<Preset, "custom">) {
    setActive(preset);
    onChange(presetRange(preset));
  }

  function handleFrom(v: string) {
    setActive("custom");
    onChange({ ...value, from: v });
  }

  function handleTo(v: string) {
    setActive("custom");
    onChange({ ...value, to: v });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="h-3 w-3 text-faint flex-none" />

      {/* Preset buttons */}
      <div className="flex border border-rule">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className={`h-7 px-3 text-[10px] uppercase tracking-[0.16em] border-r border-rule last:border-r-0 transition-colors ${
              active === key
                ? "bg-phos text-crt font-semibold"
                : "text-faint hover:text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-faint">
        <span>De</span>
        <input
          type="date"
          value={value.from}
          onChange={e => handleFrom(e.target.value)}
          className="h-7 bg-crt border border-rule px-2 text-phos text-[11px] normal-case outline-none focus:border-hazard transition-colors"
        />
        <span>Até</span>
        <input
          type="date"
          value={value.to}
          onChange={e => handleTo(e.target.value)}
          className="h-7 bg-crt border border-rule px-2 text-phos text-[11px] normal-case outline-none focus:border-hazard transition-colors"
        />
      </div>
    </div>
  );
}
