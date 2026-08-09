// Le pied de page affiche `new Date().getFullYear()` dans un composant serveur
// (Footer.tsx) : en rendu statique, Next fige cette valeur à la date du build.
// Revalidation quotidienne pour que le millésime tienne à jour sans redeploy.
export const revalidate = 86400;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
