import { CalendarCheck } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function TodayPage() {
  return (
    <ComingSoon
      icon={CalendarCheck}
      title="Aujourd'hui"
      description="La vue d'accueil qui agrège recettes, trading et sport pour piloter ta journée d'un coup d'œil."
      gradient={["#5aa9ff", "#0a84ff"]}
    />
  );
}
