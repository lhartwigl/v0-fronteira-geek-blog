import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Brand({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <span aria-hidden="true" className={cn('shrink-0 rounded-md bg-white p-0.5', compact ? 'h-7 w-7' : 'h-8 w-8 sm:h-9 sm:w-9')}>
        <Image src="/branding/fronteira-geek.png" alt="" width={40} height={40} sizes="40px" className="h-full w-full object-contain" />
      </span>
      <span className={cn('whitespace-nowrap font-heading font-bold tracking-tight', compact ? 'text-sm' : 'text-base sm:text-xl')}>
        <span className="text-primary">Fronteira</span>{' '}<span className="text-foreground">Geek</span>
      </span>
    </span>
  )
}
