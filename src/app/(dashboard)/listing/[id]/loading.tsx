export default function ListingDetailLoading() {
  return (
    <div className="p-4 md:p-8">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-6" />
        <div className="h-64 bg-muted rounded-xl mb-6" />
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  )
}
