"use client"

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, PawPrint, FileText, User } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const dockItems = [
  { href: '/dashboard', icon: Home, label: 'Início', color: 'text-orange-500', bgColor: 'bg-orange-500/10', id: 'nav-home' },
  { href: '/history', icon: PawPrint, label: 'Pacientes', color: 'text-blue-500', bgColor: 'bg-blue-500/10', id: 'nav-history' },
  { href: '/templates', icon: FileText, label: 'Modelos', color: 'text-teal-500', bgColor: 'bg-teal-500/10', id: 'nav-templates' },
  { href: '/profile', icon: User, label: 'Perfil', color: 'text-purple-500', bgColor: 'bg-purple-500/10', id: 'nav-profile' },
]

function DockIcon({ 
  item, 
  isActive, 
  mouseX, 
  onActivate, 
  router 
}: { 
  item: any, 
  isActive: boolean, 
  mouseX: any, 
  onActivate: (href: string) => void, 
  router: any 
}) {
  const ref = useRef<HTMLDivElement>(null)
  
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })
  
  const widthSync = useTransform(distance, [-120, 0, 120], [48, 72, 48])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })
  
  const iconSizeSync = useTransform(distance, [-120, 0, 120], [22, 32, 22])
  const iconSize = useSpring(iconSizeSync, { mass: 0.1, stiffness: 150, damping: 12 })

  // Optimized trigger to start load on touch start
  const handlePointerDown = (e: React.PointerEvent) => {
    // Start prefetching the second the user touches the icon (100-200ms advantage)
    router.prefetch(item.href)
    
    if (e.pointerType === 'touch' || e.button === 0) {
      onActivate(item.href)
    }
  }

  return (
    <motion.div
      ref={ref}
      id={item.id}
      onMouseEnter={() => router.prefetch(item.href)}
      style={{ width, height: width }}
      className={`relative flex items-center justify-center rounded-xl transition-colors duration-200 group ${
        isActive 
          ? `${item.bgColor} ring-1 ring-border shadow-inner text-foreground` 
          : 'bg-muted/50 hover:bg-muted border border-border/30 text-muted-foreground'
      }`}
    >
      <Link 
        href={item.href} 
        prefetch={true}
        onPointerDown={handlePointerDown}
        className="flex items-center justify-center w-full h-full"
      >
        <div className="absolute bottom-[calc(100%+12px)] px-3 py-1.5 text-xs font-semibold text-foreground bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-xl z-50 transform group-hover:-translate-y-1">
          {item.label}
        </div>
        <motion.div style={{ width: iconSize, height: iconSize }} className={`flex items-center justify-center ${item.color}`}>
          <item.icon className="w-full h-full" />
        </motion.div>
      </Link>
    </motion.div>
  )
}

export function DockNav() {
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null)
  const mouseX = useMotionValue(Infinity)
  const pathname = usePathname()
  const router = useRouter()

  // Sync optimistic path with actual pathname
  useEffect(() => {
    setOptimisticPath(null)
  }, [pathname])

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8) // Slightly more distinct tap for mobile speed feedback
      } catch (e) {}
    }
  }, [])

  const handleNavClick = (href: string) => {
    if (pathname === href) return
    setOptimisticPath(href)
    triggerHaptic()
    // Next.js Link handles the actual navigation, 
    // we just manage the optimistic UI state here.
  }

  // Moved conditional return here to comply with Rules of Hooks
  if (pathname === '/login' || pathname === '/' || pathname === '/auth') {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-safe pb-safe">
      <motion.nav
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-3 px-3 py-2.5 bg-background/80 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] ring-1 ring-white/10"
      >
        {dockItems.map((item) => {
          const currentPath = optimisticPath || pathname
          const isActive = currentPath === item.href || (currentPath.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/')
          return <DockIcon key={item.href} item={item} isActive={isActive} mouseX={mouseX} onActivate={handleNavClick} router={router} />
        })}
      </motion.nav>
    </div>
  )
}
