export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="pb-8 border-b border-neutral-100">
        <div className="h-7 w-52 bg-neutral-200 rounded mb-2" />
        <div className="h-3.5 w-80 bg-neutral-100 rounded" />
        <div className="flex gap-1.5 mt-4">
          <div className="h-5 w-24 bg-violet-100 rounded-full" />
          <div className="h-5 w-28 bg-violet-100 rounded-full" />
        </div>
      </div>

      {/* Compatibility table skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-36 bg-neutral-100 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-neutral-100 rounded-full" />
          <div className="h-6 w-20 bg-neutral-100 rounded-full" />
        </div>
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 px-4 py-3 border-b border-neutral-100 last:border-b-0"
            >
              <div className="h-4 w-28 bg-neutral-100 rounded" />
              <div className="h-5 w-20 bg-neutral-100 rounded-full" />
              <div className="h-4 w-12 bg-neutral-100 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Risk skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-24 bg-neutral-100 rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-16 bg-neutral-100 rounded-lg border-l-4 border-l-neutral-200" />
        ))}
      </div>

      {/* Sim + Monitor skeleton */}
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-neutral-100 rounded" />
          <div className="h-9 w-32 bg-neutral-100 rounded-lg" />
        </div>
        <div className="h-20 bg-neutral-100 rounded-lg" />
      </div>
    </main>
  );
}
