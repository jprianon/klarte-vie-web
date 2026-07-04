import { Dumbbell } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function SportPage() {
  return (
    <ComingSoon
      icon={Dumbbell}
      title="Sport"
      description="Tes séances, ta charge d'entraînement et ta régularité, semaine après semaine."
      gradient={["#ff9f0a", "#ff2d55"]}
    />
  );
}
