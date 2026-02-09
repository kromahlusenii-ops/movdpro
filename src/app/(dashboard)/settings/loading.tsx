export default function SettingsLoading() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-muted rounded mb-2" />
        <div className="h-4 w-64 bg-muted rounded mb-8" />

        <div className="bg-background rounded-xl border p-6 mb-6">
          <div className="h-5 w-20 bg-muted rounded mb-4" />
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>

        <div className="bg-background rounded-xl border p-6">
          <div className="h-5 w-28 bg-muted rounded mb-4" />
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
