import { useState } from 'react'
import { SelectPlayer } from './pages/SelectPlayer'
import { Prode } from './pages/Prode'
import './App.css'
import { Tabla } from './pages/Tabla'

function App() {
  const [jugador, setJugador] = useState("")
  const [mode, setMode] = useState<"player" | "tabla" | "prode">("player")

  return (
    <>
      {mode === "prode" ? (
        <Prode jugador={jugador} setMode={setMode} />
      ) : mode === "tabla" ? (
        <Tabla setMode={setMode} />
      ) : (
        <SelectPlayer jugador={jugador} setJugador={setJugador} setMode={setMode} />
      )}
    </>
  )
}

export default App
