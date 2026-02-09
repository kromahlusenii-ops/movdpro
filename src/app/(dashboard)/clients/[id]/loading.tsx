export default function ClientDetailLoading() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-6" />

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
          <div className="h-10 w-10 bg-muted rounded-lg" />
        </div>

        <div className="bg-background rounded-xl border p-6 mb-6">
          <div className="h-5 w-24 bg-muted rounded mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>

        <div className="bg-background rounded-xl border p-6">
          <div className="h-5 w-32 bg-muted rounded mb-4" />
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
