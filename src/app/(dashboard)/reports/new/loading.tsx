export default function NewReportLoading() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-6" />
        <div className="h-8 w-40 bg-muted rounded mb-2" />
        <div className="h-4 w-64 bg-muted rounded mb-8" />

        <div className="space-y-6">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-12 w-32 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}
