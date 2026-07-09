import { cn } from "@/lib/utils";

/** Note en étoiles (0..5), pleines puis vides. Purement décoratif ici. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("text-klarte-orange", className)}
      aria-label={`${value} sur 5`}
      role="img"
    >
      <span aria-hidden="true" className="tracking-[1px]">
        {"★".repeat(value)}
        <span className="text-muted-foreground/40">{"☆".repeat(5 - value)}</span>
      </span>
    </span>
  );
}
