// Componente raíz: decide qué pantalla se ve según haya o no una carrera en marcha.
import { useState } from 'react'
import type { Carrera } from './modelo/tipos'
import { CrearCarrera } from './pantallas/CrearCarrera'
import { TEXTOS } from './textos'

function App() {
  // null = todavía no hay carrera; se muestra la pantalla de crearla.
  const [carrera, setCarrera] = useState<Carrera | null>(null)

  if (carrera === null) {
    return <CrearCarrera alCrear={setCarrera} />
  }

  // Provisional hasta el paso 7: solo confirma que la carrera se ha creado bien.
  return (
    <main className="pantalla">
      <h1>{carrera.nombre}</h1>
      <p>
        {carrera.participantes.length} {TEXTOS.crearCarrera.participantes}, {carrera.configuracion.vueltasTotales}{' '}
        {TEXTOS.crearCarrera.vueltasTotales.toLowerCase()}.
      </p>
      <p>{TEXTOS.carrera.proximamente}</p>
      <button className="boton-principal" onClick={() => setCarrera(null)}>
        {TEXTOS.carrera.nuevaCarrera}
      </button>
    </main>
  )
}

export default App
