export default function Seg({ value, onPick, items }: { value: string; onPick: (v: string) => void; items: { v: string; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-ink/40 p-0.5 font-mono text-[12px]">
      {items.map((it) => (
        <button
          key={it.v}
          type="button"
          onClick={() => onPick(it.v)}
          className={"rounded-md px-3 py-1.5 transition-colors " + (value === it.v ? "bg-white/[0.08] text-paper" : "text-muted hover:text-paper")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
