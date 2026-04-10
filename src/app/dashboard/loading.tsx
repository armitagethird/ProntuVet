export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full h-full min-h-[75vh] px-4 pb-24 animate-pulse">
      {/* Skeleton Logo Area */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-1 mb-6">
          <div className="h-12 w-32 bg-muted/60 rounded-2xl" />
          <div className="h-12 w-20 bg-muted/40 rounded-2xl" />
        </div>
        
        <div className="h-8 w-64 bg-muted/30 rounded-xl mx-auto mb-4" />
        <div className="h-4 w-48 bg-muted/20 rounded-lg mx-auto" />
      </div>

      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Template Selector Skeleton */}
        <div className="bg-card/30 border border-border/20 rounded-[2rem] p-6 h-28" />

        {/* Action Button Skeleton */}
        <div className="bg-card/50 border border-border/20 rounded-3xl p-10 h-64" />
      </div>
    </div>
  )
}
