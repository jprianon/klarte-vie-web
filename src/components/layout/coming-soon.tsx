import type { LucideIcon } from "lucide-react";

/** Placeholder d'un onglet pas encore implémenté (Today, Trading, Sport…). */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: [string, string];
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <span
          className="mb-5 grid size-16 place-items-center rounded-[20px] text-white shadow-lg"
          style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
        >
          <Icon className="size-8" strokeWidth={1.9} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">{description}</p>
        <span className="mt-5 rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
          Bientôt disponible
        </span>
      </div>
    </div>
  );
}
