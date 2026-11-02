export default function RoomsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading rooms">
      <div className="skeleton h-4 w-20" />
      <div className="skeleton mt-3 h-10 w-80 max-w-full" />
      <div className="skeleton mt-6 h-16" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
