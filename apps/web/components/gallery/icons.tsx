/** Flèche vers un trait : « ceci descend chez vous ». Utilisée partout où
    quelque chose se télécharge, pour que le geste soit reconnaissable. */
export function DownloadIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4.5V16" />
      <path d="M6.5 10.5 12 16l5.5-5.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
}

/** Le cadenas de la ligne « paiement sécurisé ». Dessiné plutôt qu'écrit :
    c'est la seule chose qu'on regarde avant de taper un numéro de carte. */
export function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  );
}
