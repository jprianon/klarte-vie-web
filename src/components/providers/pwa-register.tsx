"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (public/sw.js) pour rendre l'app installable
 * et disponible hors-ligne. Aucun rendu — effet de bord uniquement.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // évite le cache en dev

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // enregistrement optionnel : on échoue silencieusement
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
