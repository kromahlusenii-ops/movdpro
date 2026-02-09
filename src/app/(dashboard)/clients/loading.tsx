export default function ClientsLoading() {
  return (
    <div className="p-8">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-32 bg-muted rounded mb-2" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
          <div className="h-10 w-28 bg-muted rounded-lg" />
        </div>

        <div className="bg-background rounded-xl border divide-y">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
