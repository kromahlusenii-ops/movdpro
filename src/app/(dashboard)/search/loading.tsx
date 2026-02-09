export default function SearchLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-4" />

        <div className="bg-background rounded-xl border p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-52 bg-muted rounded-lg" />
            <div className="h-10 w-36 bg-muted rounded-lg" />
            <div className="h-10 w-28 bg-muted rounded-lg" />
            <div className="h-10 w-28 bg-muted rounded-lg" />
            <div className="h-10 w-24 bg-muted rounded-lg" />
          </div>
        </div>

        <div className="text-center py-12 bg-background rounded-lg border">
          <div className="w-10 h-10 bg-muted rounded-full mx-auto mb-3" />
          <div className="h-5 w-32 bg-muted rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-muted rounded mx-auto" />
        </div>
      </div>
    </div>
  )
}
