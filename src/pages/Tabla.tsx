import { useEffect, useState } from "react";
import React from "react";
import {
    Box,
    Typography,
    Stack,
    CircularProgress,
    Paper,
    Button,
    Avatar,
    Chip,
} from "@mui/material";
import SportsHockeyIcon from "@mui/icons-material/SportsHockey";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type Equipo = {
    nombre: string;
    zona: string;
    puntos: number;
    dg: number;
    gf: number;
    gc: number;
};

const SHEET_ID = "1o-F-FmTLNoX0YzDw7Rv2iV2VK6l3ShiENEv6viX_r7w";

type Props = {
    setMode: React.Dispatch<"player" | "tabla" | "prode">;
};

function TeamLogo({ nombre, size = 32 }: { nombre: string; size?: number }) {
    const [imgError, setImgError] = useState(false);
    if (imgError) {
        return (
            <Avatar
                sx={{
                    width: size,
                    height: size,
                    bgcolor: "grey.100",
                    color: "grey.600",
                    fontSize: size * 0.38,
                    fontWeight: 700,
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                {nombre.charAt(0).toUpperCase()}
            </Avatar>
        );
    }
    return (
        <Box
            component="img"
            src={`${nombre.replace(/ /g, "_")}.jpeg`}
            alt={nombre}
            onError={() => setImgError(true)}
            sx={{ width: size, height: size, objectFit: "contain", borderRadius: 1 }}
        />
    );
}

const COL_HEADERS = [
    { key: "puntos", label: "Pts", title: "Puntos" },
    { key: "dg",     label: "DG",  title: "Diferencia de goles" },
    { key: "gf",     label: "GF",  title: "Goles a favor" },
    { key: "gc",     label: "GC",  title: "Goles en contra" },
];

function ZonaTabla({ titulo, equipos }: { titulo: string; equipos: Equipo[] }) {
    // Cuántos clasifican (top 2 avanzan, por convención de torneos de hockey)
    const CLASIFICAN = 2;

    return (
        <Stack gap={1}>
            {/* Encabezado zona */}
            <Stack direction="row" alignItems="center" gap={1} sx={{ px: 0.5 }}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                    {titulo}
                </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                {/* Header de columnas */}
                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ px: 2, py: 1, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}
                >
                    <Box sx={{ width: 28, flexShrink: 0 }} />
                    <Box sx={{ width: 32, flexShrink: 0, mr: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 600 }}>
                        Equipo
                    </Typography>
                    {COL_HEADERS.map((col) => (
                        <Typography
                            key={col.key}
                            variant="caption"
                            color="text.secondary"
                            title={col.title}
                            sx={{ width: 36, textAlign: "center", fontWeight: 600, flexShrink: 0 }}
                        >
                            {col.label}
                        </Typography>
                    ))}
                </Stack>

                {/* Filas */}
                {equipos.map((equipo, i) => {
                    const clasifica = i < CLASIFICAN;
                    const lider = i === 0;

                    return (
                        <Stack
                            key={equipo.nombre}
                            direction="row"
                            alignItems="center"
                            sx={{
                                px: 2,
                                py: 1.25,
                                borderBottom: i < equipos.length - 1 ? "1px solid" : "none",
                                borderColor: "divider",
                                bgcolor: lider ? "warning.50" : "background.paper",
                                transition: "background-color 0.15s",
                                "&:hover": { bgcolor: "grey.50" },
                            }}
                        >
                            {/* Posición */}
                            <Typography
                                sx={{
                                    width: 28,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: lider ? "warning.800" : clasifica ? "primary.main" : "text.disabled",
                                    flexShrink: 0,
                                }}
                            >
                                {i + 1}
                            </Typography>

                            {/* Logo */}
                            <Box sx={{ width: 32, mr: 1, flexShrink: 0 }}>
                                <TeamLogo nombre={equipo.nombre} size={28} />
                            </Box>

                            {/* Nombre */}
                            <Typography
                                variant="body2"
                                fontWeight={clasifica ? 600 : 400}
                                color={clasifica ? "text.primary" : "text.secondary"}
                                sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                                {equipo.nombre}
                            </Typography>

                            {/* Stats */}
                            {COL_HEADERS.map((col) => {
                                const val = equipo[col.key as keyof Equipo] as number;
                                const esPuntos = col.key === "puntos";
                                return (
                                    <Box
                                        key={col.key}
                                        sx={{ width: 36, textAlign: "center", flexShrink: 0 }}
                                    >
                                        {esPuntos ? (
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    color: lider ? "warning.800" : "text.primary",
                                                }}
                                            >
                                                {val}
                                            </Typography>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: 13 }}
                                            >
                                                {val > 0 && col.key === "dg" ? `+${val}` : val}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            })}
                        </Stack>
                    );
                })}
            </Paper>

            {/* Leyenda */}
            <Stack direction="row" gap={1.5} sx={{ px: 0.5 }}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
                    <Typography variant="caption" color="text.secondary">Clasifica</Typography>
                </Stack>
            </Stack>
        </Stack>
    );
}

export const Tabla = ({ setMode }: Props) => {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarEquipos();
    }, []);

    const cargarEquipos = async () => {
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Equipos`;
            const response = await fetch(url);
            const text = await response.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const equiposLeidos: Equipo[] = json.table.rows.map((fila: any) => ({
                nombre: fila.c[1]?.v ?? "",
                zona:   fila.c[2]?.v ?? "",
                puntos: fila.c[3]?.v ?? 0,
                dg:     fila.c[4]?.v ?? 0,
                gf:     fila.c[5]?.v ?? 0,
                gc:     fila.c[6]?.v ?? 0,
            }));
            setEquipos(equiposLeidos);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sortZona = (zona: string) =>
        equipos
            .filter((e) => e.zona === zona)
            .sort((a, b) => b.puntos !== a.puntos ? b.puntos - a.puntos : b.dg - a.dg);

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" py={8} gap={2}>
                <CircularProgress size={28} />
                <Typography variant="body2" color="text.secondary">
                    Cargando tabla...
                </Typography>
            </Stack>
        );
    }

    const zonas = [...new Set(equipos.map((e) => e.zona))].sort();

    return (
        <Stack gap={3} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 520, mx: "auto" }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" gap={2}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <SportsHockeyIcon sx={{ color: "#fff", fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                        Tabla de Posiciones
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {equipos.length} equipos · {zonas.length} zonas
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setMode("player")}
                    sx={{ textTransform: "none", flexShrink: 0 }}
                >
                    Jugadores
                </Button>
            </Stack>

            {/* Zonas */}
            {zonas.map((zona) => (
                <ZonaTabla
                    key={zona}
                    titulo={`Zona ${zona}`}
                    equipos={sortZona(zona)}
                />
            ))}
        </Stack>
    );
};