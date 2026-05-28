export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-pulse">
      <div>
        <div className="h-6 w-48 bg-neutral-200 rounded mb-2" />
        <div className="h-4 w-80 bg-neutral-100 rounded" />
      </div>
      <div className="h-48 bg-neutral-100 rounded" />
      <div className="h-32 bg-neutral-100 rounded" />
      <div className="h-24 bg-neutral-100 rounded" />
    </main>
  );
}
