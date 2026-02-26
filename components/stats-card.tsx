'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

interface StatsCardProps {
  icon: IconSvgElement
  label: string
  count: number
  href?: string
}

export function StatsCard({ icon, label, count, href }: StatsCardProps) {
  const content = (
    <Card className={href ? 'hover:border-primary/50 transition-colors cursor-pointer p-0' : ''}>
      <CardContent className="p-2 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-lg font-bold leading-none">{count}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} data-tracking-id={`dashboard-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {content}
      </Link>
    )
  }

  return content
}
