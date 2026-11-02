export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton h-9 w-56" />
      <div className="skeleton mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <div className="skeleton mt-8 h-64" />
    </div>
  );
}
