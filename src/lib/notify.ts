/**
 * Notifications locales du carnet — utilisées quand une recette finit de se
 * préparer en tâche de fond (reformatage IA / OCR).
 *
 * Portée : la notification est émise par le service worker tant que l'app est
 * vivante (premier plan ou arrière-plan non suspendu). Une vraie livraison
 * « app fermée » nécessiterait du Web Push serveur (VAPID) — non couvert ici.
 * Le service worker n'étant enregistré qu'en production, en dev on retombe
 * silencieusement sur le toast in-app géré par l'appelant.
 */

/** Les notifications sont-elles possibles (API dispo + non refusées) ? */
export function canNotify(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission !== "denied"
  );
}

/** Demande la permission une seule fois (no-op si déjà accordée/refusée). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/**
 * Affiche « recette enregistrée » via le service worker. Renvoie `true` si la
 * notification système a bien été montrée (sinon l'appelant garde son toast).
 */
export async function notifyRecipeSaved(recipe: { id: string; title: string }): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification("Recette enregistrée ✨", {
      body: `« ${recipe.title} » est prête. Touche pour la revoir.`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: `recipe-${recipe.id}`,
      data: { recipeId: recipe.id },
    });
    return true;
  } catch {
    return false;
  }
}
