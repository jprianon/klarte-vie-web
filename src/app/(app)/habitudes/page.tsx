import { TimerReset } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function HabitudesPage() {
  return (
    <ComingSoon
      icon={TimerReset}
      title="Habitudes"
      description="Tes routines et séries de jours réussis, en lien avec l'app mobile Klarte Vie."
      gradient={["#c99bff", "#bf5af2"]}
    />
  );
}
