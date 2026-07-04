import { Search } from "lucide-react";

/** En-tête d'une page du dashboard : titre + sous-titre à gauche, actions à droite. */
export function PageHeader({
  title,
  subtitle,
  showSearch = false,
  searchPlaceholder = "Rechercher…",
  actions,
}: {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-border/70 px-6 py-5 md:px-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        {showSearch && (
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground sm:flex">
            <Search className="size-4" />
            <span>{searchPlaceholder}</span>
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}
