import { cn } from '@/lib/utils';

interface UClasesLogoProps {
  className?: string;
  compact?: boolean;
}

export function UClasesLogo({ className, compact = false }: UClasesLogoProps) {
  return (
    <span className={cn('inline-flex items-baseline leading-none', compact ? 'text-xl' : 'text-2xl', className)} aria-label="U-clases">
      <span className="gradient-text font-extrabold">u</span>
      <span className="font-bold text-foreground">clases</span>
    </span>
  );
}
