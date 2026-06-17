import { useEffect, useState } from "react";

type Props = {
    jugador: string;
};

type Partido = {
    id: number;
    zona: string;
    local: string;
    visitante: string;
    fecha: string;
    hora: string;
    resultadoLocal: number | null;
    resultadoVisitante: number | null;
};

type Prediccion = {
    partidoId: number;
    golesLocal: string;
    golesVisitante: string;
};

const SHEET_ID = "1o-F-FmTLNoX0YzDw7Rv2iV2VK6l3ShiENEv6viX_r7w";

export const Prode = ({ jugador }: Props) => {

    const [partidos, setPartidos] = useState<Partido[]>([]);
    const [loading, setLoading] = useState(true);

    const [predicciones, setPredicciones] = useState<
        Record<number, Prediccion>
    >({});

    useEffect(() => {
        cargarDatos();
    }, [jugador]);

    const leerHoja = async (hoja: string) => {
        const url =
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${hoja}`;

        const response = await fetch(url);
        const text = await response.text();

        return JSON.parse(
            text.substring(47).slice(0, -2)
        );
    };

    const cargarDatos = async () => {
        try {
            const [partidosJson, prediccionesJson] =
                await Promise.all([
                    leerHoja("Partidos"),
                    leerHoja("Predicciones"),
                ]);

            const partidosLeidos: Partido[] =
                partidosJson.table.rows.map(
                    (fila: any) => ({
                        id: fila.c[0]?.v,
                        zona: fila.c[1]?.v,
                        local: fila.c[2]?.v,
                        visitante: fila.c[3]?.v,
                        fecha: fila.c[4]?.v,
                        hora: fila.c[5]?.v,
                        resultadoLocal:
                            fila.c[6]?.v ?? null,
                        resultadoVisitante:
                            fila.c[7]?.v ?? null,
                    })
                );

            const prediccionesJugador =
                prediccionesJson.table.rows.filter(
                    (fila: any) =>
                        fila.c[0]?.v === jugador
                );

            const mapaPredicciones: Record<
                number,
                Prediccion
            > = {};

            prediccionesJugador.forEach(
                (fila: any) => {
                    mapaPredicciones[fila.c[1]?.v] = {
                        partidoId: fila.c[1]?.v,
                        golesLocal:
                            fila.c[2]?.v?.toString() ??
                            "",
                        golesVisitante:
                            fila.c[3]?.v?.toString() ??
                            "",
                    };
                }
            );

            setPartidos(partidosLeidos);
            setPredicciones(mapaPredicciones);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const actualizarPrediccion = (
        partidoId: number,
        campo: "golesLocal" | "golesVisitante",
        valor: string
    ) => {
        setPredicciones((prev) => ({
            ...prev,
            [partidoId]: {
                partidoId,
                golesLocal:
                    prev[partidoId]?.golesLocal ?? "",
                golesVisitante:
                    prev[partidoId]?.golesVisitante ??
                    "",
                [campo]: valor,
            },
        }));
    };


    if (loading) {
        return <div>Cargando...</div>;
    }

    const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyV3D0TdWOu-urr0sn3pQbL8_-E8mZOzxz-IDchglwdM6n1gz5P4t_d_1sNljQnfJC1/exec";

const guardarPrediccion = async ( partidoId: number ) => {
    const prediccion = predicciones[partidoId];

    if (!prediccion) return;

    // 1. En lugar de FormData, armamos un objeto simple de JavaScript
    const payload = {
        jugador: jugador,
        partido: partidoId,
        golesLocal: prediccion.golesLocal,
        golesVisitante: prediccion.golesVisitante
    };

    try {
        const respuesta = await fetch(
            SCRIPT_URL,
            {
                method: "POST",
                // 2. Usamos text/plain para evitar errores CORS de "preflight" en Google
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                // 3. Convertimos el objeto a un string JSON
                body: JSON.stringify(payload),
                // 4. Google Apps Script requiere seguir redirecciones internamente
                redirect: "follow" 
            }
        );

        // Opcional: verificar si la red no dio error (como un 404 o 500)
        if (!respuesta.ok) {
            throw new Error(`Error de red: ${respuesta.status}`);
        }

        // Si quieres leer la respuesta de tu backend (status: "created" o "updated"):
        // const resultado = await respuesta.json();
        // console.log(resultado);

        alert("Pronóstico enviado");

    } catch (error) {
        console.error("Error enviando el pronóstico:", error);
        alert("Hubo un problema al enviar el pronóstico. Revisa la consola.");
    }
};


    return (
        <div style={{ padding: 20 }}>
            <h1>
                Pronósticos de {jugador}
            </h1>

            {partidos.map((partido) => {
                const finalizado =
                    partido.resultadoLocal !==
                        null &&
                    partido.resultadoVisitante !==
                        null;

                return (
                    <div
                        key={partido.id}
                        style={{
                            border:
                                "1px solid #ddd",
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            Zona {partido.zona}
                        </div>

                        <h3>
                            {partido.local}
                            {" vs "}
                            {partido.visitante}
                        </h3>

                        <div>
                            {partido.fecha}
                            {" "}
                            {partido.hora}
                        </div>

                        {finalizado ? (
                            <div
                                style={{
                                    marginTop: 12,
                                    fontWeight:
                                        "bold",
                                }}
                            >
                                Resultado:
                                {" "}
                                {
                                    partido.resultadoLocal
                                }
                                {" - "}
                                {
                                    partido.resultadoVisitante
                                }
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: 12,
                                    display:
                                        "flex",
                                    gap: 10,
                                    alignItems:
                                        "center",
                                }}
                            >
                                <input
                                    type="number"
                                    min={0}
                                    value={
                                        predicciones[
                                            partido
                                                .id
                                        ]
                                            ?.golesLocal ??
                                        ""
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        actualizarPrediccion(
                                            partido.id,
                                            "golesLocal",
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                />

                                <span>
                                    -
                                </span>

                                <input
                                    type="number"
                                    min={0}
                                    value={
                                        predicciones[
                                            partido
                                                .id
                                        ]
                                            ?.golesVisitante ??
                                        ""
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        actualizarPrediccion(
                                            partido.id,
                                            "golesVisitante",
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                />

                                <button
                                    onClick={() =>
                                        guardarPrediccion(
                                            partido.id
                                        )
                                    }
                                >
                                    Guardar
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};