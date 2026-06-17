import React, { useEffect, useState } from "react";

type Jugador = {
    nombre: string;
    puntos: number;
};

const SHEET_ID = "1o-F-FmTLNoX0YzDw7Rv2iV2VK6l3ShiENEv6viX_r7w";

type Props = {
    jugador: string
    setJugador: React.Dispatch<string> 
}

export const SelectPlayer = ({jugador, setJugador} : Props) => {
    const [jugadores, setJugadores] = useState<Jugador[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarJugadores();
    }, []);

    const cargarJugadores = async () => {
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Jugadores`;

            const response = await fetch(url);
            const text = await response.text();

            const json = JSON.parse(
                text.substring(47).slice(0, -2)
            );

            const filas = json.table.rows;

            const jugadoresParseados: Jugador[] = filas.map(
                (fila: any) => ({
                    nombre: fila.c[0]?.v ?? "",
                    puntos: fila.c[1]?.v ?? 0,
                })
            );

            setJugadores(jugadoresParseados);
        } catch (error) {
            console.error("Error cargando jugadores", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Prode Hockey</h1>

            {loading ? (
                <p>Cargando jugadores...</p>
            ) : (
                <>
                    <label>
                        Seleccionar jugador:
                    </label>

                    <br />
                    <br />

                    <select
                        value={jugador}
                        onChange={(e) =>
                            setJugador(e.target.value)
                        }
                    >
                        <option value="">
                            Elegir jugador
                        </option>

                        {jugadores.map((j) => (
                            <option
                                key={j.nombre}
                                value={j.nombre}
                            >
                                {j.nombre}
                            </option>
                        ))}
                    </select>

                    <br />
                    <br />

                    {jugador && (
                        <p>
                            Jugador seleccionado:{" "}
                            <strong>{jugador}</strong>
                        </p>
                    )}
                </>
            )}
        </div>
    );
};