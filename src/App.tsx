import { useState } from 'react'
import { SelectPlayer } from './pages/SelectPlayer'
import { Prode } from './pages/Prode'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [jugador, setJugador] = useState("")

  return (
    <>
      {jugador?
      <Prode
      jugador={jugador}
      />
      :
      <SelectPlayer
        jugador={jugador}
        setJugador={setJugador}
      />}
    </>
  )
}

export default App
