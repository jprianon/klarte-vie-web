"use client";

import { useEffect } from "react";

/**
 * Garde l'écran allumé tant que l'app est au premier plan — pratique en cuisine,
 * la recette sous les yeux, sans que le téléphone se verrouille.
 *
 * Screen Wake Lock API : supportée iOS 16.4+ (Safari + PWA installée) et
 * Chrome/Android. Nécessite HTTPS (ou localhost). Sans effet si indisponible.
 * Le verrou est libéré automatiquement quand l'onglet passe en arrière-plan ;
 * on le ré-acquiert au retour au premier plan.
 */
export function WakeLock() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let stopped = false;

    const acquire = async () => {
      if (stopped || lock || document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener("release", () => {
          lock = null;
        });
      } catch {
        /* refusé (batterie faible, onglet caché…) : on réessaiera au retour */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => undefined);
      lock = null;
    };
  }, []);

  return null;
}
