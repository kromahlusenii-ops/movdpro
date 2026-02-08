import { ProLayoutSkeleton } from '@/components/ProLayoutSkeleton'

export default function DashboardLoading() {
  return (
    <ProLayoutSkeleton activeHref="/dashboard">
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-2" />
          <div className="h-4 w-64 bg-muted rounded mb-8" />

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </ProLayoutSkeleton>
  )
}
