export default function CompareLoading() {
  return (
    <div className="p-8">
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-6" />
        <div className="h-8 w-48 bg-muted rounded mb-2" />
        <div className="h-4 w-32 bg-muted rounded mb-8" />

        <div className="bg-background rounded-xl border overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="grid grid-cols-4 gap-4 p-4 border-t">
              <div className="h-6 bg-muted rounded" />
              <div className="h-6 bg-muted rounded" />
              <div className="h-6 bg-muted rounded" />
              <div className="h-6 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
