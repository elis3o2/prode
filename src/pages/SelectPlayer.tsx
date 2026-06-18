import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Avatar,
    CircularProgress,
    Paper,
    ButtonBase,
    Button
} from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SportsHockeyIcon from "@mui/icons-material/SportsHockey";
import CheckIcon from "@mui/icons-material/Check";

type Jugador = {
    nombre: string;
    puntos: number;
};

const SHEET_ID = "1o-F-FmTLNoX0YzDw7Rv2iV2VK6l3ShiENEv6viX_r7w";

type Props = {
    jugador: string;
    setJugador: React.Dispatch<string>;
    setMode: React.Dispatch<("player" | "tabla" | "prode")>;
};

export const SelectPlayer = ({ jugador, setJugador, setMode }: Props) => {
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
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const jugadoresParseados: Jugador[] = json.table.rows.map(
                (fila: any) => ({
                    nombre: fila.c[0]?.v ?? "",
                    puntos: fila.c[1]?.v ?? 0,
                })
            );
            // Ordenar por puntos descendente
            jugadoresParseados.sort((a, b) => b.puntos - a.puntos);
            setJugadores(jugadoresParseados);
        } catch (error) {
            console.error("Error cargando jugadores", error);
        } finally {
            setLoading(false);
        }
    };

    // Colores para el podio
    const medalColor = (i: number) => {
        if (i === 0) return { bg: "#FFF8E1", border: "#F9A825", text: "#E65100" };
        if (i === 1) return { bg: "#F5F5F5", border: "#9E9E9E", text: "#424242" };
        if (i === 2) return { bg: "#FBE9E7", border: "#BF360C", text: "#BF360C" };
        return null;
    };

    return (

        <Stack
            gap={3}
            sx={{ p: { xs: 2, sm: 3 }, maxWidth: 480, mx: "auto" }}
        >
            <Button
                variant="contained"
                onClick={() => setMode("tabla")}
            >
                Posiciones
            </Button>
            {/* Header */}
            <Stack alignItems="center" gap={1} sx={{ pt: 2 }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <SportsHockeyIcon sx={{ color: "#fff", fontSize: 28 }} />
                </Box>
                <Typography variant="h5" fontWeight={700} textAlign="center">
                    Prode Hockey
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    Seleccioná tu jugador para ver y cargar tus pronósticos
                </Typography>
            </Stack>



            {/* Lista de jugadores */}
            {loading ? (
                <Stack alignItems="center" gap={2} py={4}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary">
                        Cargando jugadores...
                    </Typography>
                </Stack>
            ) : (
                <Stack gap={1.5}>
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ letterSpacing: 1 }}
                    >
                        Clasificación
                    </Typography>

                    {jugadores.map((j, i) => {
                        const seleccionado = jugador === j.nombre;
                        const medalla = medalColor(i);

                        return (
                            <ButtonBase
                                key={j.nombre}
                                onClick={() => {setJugador(j.nombre); setMode("prode")}}
                                sx={{
                                    borderRadius: 3,
                                    display: "block",
                                    textAlign: "left",
                                    width: "100%",
                                }}
                            >
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 3,
                                        px: 2,
                                        py: 1.5,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        border: seleccionado
                                            ? "2px solid"
                                            : "1px solid",
                                        borderColor: seleccionado
                                            ? "primary.main"
                                            : medalla
                                            ? medalla.border
                                            : "divider",
                                        bgcolor: seleccionado
                                            ? "primary.50"
                                            : medalla
                                            ? medalla.bg
                                            : "background.paper",
                                        transition:
                                            "border-color 0.15s, background-color 0.15s",
                                        "&:hover": {
                                            bgcolor: seleccionado
                                                ? "primary.50"
                                                : "grey.50",
                                        },
                                    }}
                                >
                                    {/* Posición */}
                                    <Typography
                                        sx={{
                                            width: 24,
                                            fontWeight: 700,
                                            fontSize: 15,
                                            color: medalla
                                                ? medalla.text
                                                : "text.disabled",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {i + 1}
                                    </Typography>

                                    {/* Avatar */}
                                    <Avatar
                                        sx={{
                                            width: 38,
                                            height: 38,
                                            bgcolor: seleccionado
                                                ? "primary.main"
                                                : "grey.200",
                                            color: seleccionado
                                                ? "#fff"
                                                : "grey.600",
                                            fontWeight: 700,
                                            fontSize: 16,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {j.nombre.charAt(0).toUpperCase()}
                                    </Avatar>

                                    {/* Nombre */}
                                    <Typography
                                        fontWeight={seleccionado ? 700 : 500}
                                        fontSize={15}
                                        color={
                                            seleccionado
                                                ? "primary.main"
                                                : "text.primary"
                                        }
                                        sx={{ flex: 1 }}
                                    >
                                        {j.nombre}
                                    </Typography>

                                    {/* Puntos */}
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        gap={0.5}
                                    >
                                        <EmojiEventsOutlinedIcon
                                            sx={{
                                                fontSize: 15,
                                                color: medalla
                                                    ? medalla.text
                                                    : "text.disabled",
                                            }}
                                        />
                                        <Typography
                                            fontWeight={700}
                                            fontSize={15}
                                            color={
                                                medalla
                                                    ? medalla.text
                                                    : "text.secondary"
                                            }
                                        >
                                            {j.puntos}
                                        </Typography>
                                    </Stack>

                                    {/* Check si está seleccionado */}
                                    {seleccionado && (
                                        <CheckIcon
                                            sx={{
                                                fontSize: 18,
                                                color: "primary.main",
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                </Paper>
                            </ButtonBase>
                        );
                    })}
                </Stack>
            )}
        </Stack>
    );
};