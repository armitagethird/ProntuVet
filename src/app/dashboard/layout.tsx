export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Header minimalista ou removido para focar no dock
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col relative z-0">
                {children}
            </main>
        </div>
    )
}
