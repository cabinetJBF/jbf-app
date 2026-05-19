export function Placeholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {phase}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">{description}</p>
      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-400">À venir</p>
      </div>
    </div>
  );
}
