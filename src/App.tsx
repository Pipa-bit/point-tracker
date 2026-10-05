// Componente raíz: decide qué pantalla se ve según haya o no una carrera en marcha.
import { useEffect, useState } from 'react'
import { borrarCarreraActual, cargarCarreraActual, guardarCarreraActual, pedirAlmacenamientoPersistente } from './almacen'
import type { Carrera } from './modelo/tipos'
import { CrearCarrera } from './pantallas/CrearCarrera'
import { PantallaFinal } from './pantallas/PantallaFinal'
import { PantallaCarrera } from './pantallas/PantallaCarrera'

function App() {
  // Al abrir la web se recupera la carrera guardada, si la hay. null = se muestra la pantalla de crearla.
  // Pasar una función a useState hace que solo se lea el almacén la primera vez, no en cada pintado.
  const [carrera, setCarrera] = useState<Carrera | null>(() => cargarCarreraActual())

  // useEffect ejecuta código después de pintar. Este se repite cada vez que cambia `carrera`.
  useEffect(() => {
    if (carrera) guardarCarreraActual(carrera)
    else borrarCarreraActual()
  }, [carrera])

  // Con [] solo se ejecuta una vez, al abrir la web.
  useEffect(() => {
    pedirAlmacenamientoPersistente()
  }, [])

  if (carrera === null) {
    return <CrearCarrera alCrear={setCarrera} />
  }
  if (carrera.estado === 'terminada') {
    return <PantallaFinal carrera={carrera} alCambiar={setCarrera} alSalir={() => setCarrera(null)} />
  }
  return <PantallaCarrera carrera={carrera} alCambiar={setCarrera} alSalir={() => setCarrera(null)} />
}

export default App
