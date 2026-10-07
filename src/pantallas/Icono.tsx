// Iconos sencillos dibujados a mano en SVG, para no añadir una librería solo por cuatro dibujos.
// Toman el color del texto del botón (currentColor).

const TRAZOS = {
  // Círculo con una raya: sprint que se deja sin registrar.
  sin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  // Uno que adelanta a otro: la escapada.
  escapada: (
    <>
      <path d="M4 17h10" />
      <path d="M10 7h10" />
      <path d="m16 4 4 3-4 3" />
    </>
  ),
  // Reloj con flecha hacia atrás: el historial.
  historial: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
}

export function Icono({ nombre }: { nombre: keyof typeof TRAZOS }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      {TRAZOS[nombre]}
    </svg>
  )
}
