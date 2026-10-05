// Componente raíz: decide qué pantalla se ve según haya o no una carrera en marcha.
import { useState } from 'react'
import type { Carrera } from './modelo/tipos'
import { CrearCarrera } from './pantallas/CrearCarrera'
import { PantallaCarrera } from './pantallas/PantallaCarrera'

function App() {
  // null = todavía no hay carrera; se muestra la pantalla de crearla.
  const [carrera, setCarrera] = useState<Carrera | null>(null)

  if (carrera === null) {
    return <CrearCarrera alCrear={setCarrera} />
  }
  return <PantallaCarrera carrera={carrera} alCambiar={setCarrera} alSalir={() => setCarrera(null)} />
}

export default App
