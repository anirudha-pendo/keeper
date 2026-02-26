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
    <Card className={href ? 'hover:border-primary/50 transition-colors cursor-pointer' : ''}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
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
