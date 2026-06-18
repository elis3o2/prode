import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Chip,
    Button,
    Divider,
    Paper,
    Avatar,
    CircularProgress,
    Alert,
    IconButton,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

type Props = {
    jugador: string;
    setMode: React.Dispatch<("player" | "tabla" | "prode")>;
};

type Partido = {
    id: number;
    zona: string;
    local: string;
    visitante: string;
    fechaRaw: string;
    horaRaw: string;
    fechaOrden: number; // timestamp para ordenar
    fechaDisplay: string;
    horaDisplay: string;
    resultadoLocal: number | null;
    resultadoVisitante: number | null;
};

type Prediccion = {
    partidoId: number;
    golesLocal: string;
    golesVisitante: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const SHEET_ID = "1o-F-FmTLNoX0YzDw7Rv2iV2VK6l3ShiENEv6viX_r7w";
const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyV3D0TdWOu-urr0sn3pQbL8_-E8mZOzxz-IDchglwdM6n1gz5P4t_d_1sNljQnfJC1/exec";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function parseFecha(raw: string | null | undefined): {
    display: string;
    orden: number;
} {
    if (!raw) return { display: "", orden: 0 };

    let d: Date | null = null;

    // gviz fecha con hora: Date(YYYY,M,D,H,m,s) — ignoramos hora aquí
    const matchFull = raw.match(/^Date\((\d+),(\d+),(\d+)(?:,\d+,\d+,\d+)?\)$/);
    if (matchFull) {
        d = new Date(parseInt(matchFull[1]), parseInt(matchFull[2]), parseInt(matchFull[3]));
    }

    // YYYY-MM-DD (lo que viene de la hoja como texto)
    const matchISO = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!d && matchISO) {
        d = new Date(parseInt(matchISO[1]), parseInt(matchISO[2]) - 1, parseInt(matchISO[3]));
    }

    // DD/MM/YYYY
    const matchDMY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!d && matchDMY) {
        d = new Date(parseInt(matchDMY[3]), parseInt(matchDMY[2]) - 1, parseInt(matchDMY[1]));
    }

    if (!d || isNaN(d.getTime())) return { display: raw, orden: 0 };

    const dia = DIAS[d.getDay()];
    const num = d.getDate();
    return {
        display: `${dia} ${num}`,
        orden: d.getTime(),
    };
}

function parseHora(raw: string | null | undefined): string {
    if (!raw) return "";

    // gviz devuelve horas como Date(1899,11,30,H,M,S) — fecha base epoch de Sheets
    const matchDateHora = raw.match(/^Date\(\d+,\d+,\d+,(\d+),(\d+),\d+\)$/);
    if (matchDateHora) {
        const h = parseInt(matchDateHora[1]).toString().padStart(2, "0");
        const m = parseInt(matchDateHora[2]).toString().padStart(2, "0");
        return `${h}:${m}`;
    }

    // TimeOfDay(H,M,S,MS)
    const matchTime = raw.match(/^TimeOfDay\((\d+),(\d+),/);
    if (matchTime) {
        const h = parseInt(matchTime[1]).toString().padStart(2, "0");
        const m = parseInt(matchTime[2]).toString().padStart(2, "0");
        return `${h}:${m}`;
    }

    // HH:MM string plano
    if (/^\d{1,2}:\d{2}/.test(raw)) {
        const parts = raw.split(":");
        return `${parts[0].padStart(2, "0")}:${parts[1]}`;
    }

    return raw;
}

function calcPuntos(
    partido: Partido,
    pred: Prediccion | undefined
): number | null {
    if (!pred || pred.golesLocal === "" || pred.golesVisitante === "")
        return null;
    const rl = partido.resultadoLocal!;
    const rv = partido.resultadoVisitante!;
    const pl = parseInt(pred.golesLocal);
    const pv = parseInt(pred.golesVisitante);
    if (isNaN(pl) || isNaN(pv)) return null;
    if (pl === rl && pv === rv) return 5;
    const realGanador = rl > rv ? "L" : rl < rv ? "V" : "E";
    const predGanador = pl > pv ? "L" : pl < pv ? "V" : "E";
    if (realGanador === predGanador) return 3;
    return 0;
}

function TeamLogo({ nombre, size = 52 }: { nombre: string; size?: number }) {
    const [imgError, setImgError] = useState(false);
    const src = `${nombre.replace(/ /g, "_")}.jpeg`;

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
            src={src}
            alt={nombre}
            onError={() => setImgError(true)}
            sx={{
                width: size,
                height: size,
                objectFit: "contain",
                borderRadius: 1,
            }}
        />
    );
}

function PuntosChip({ puntos }: { puntos: number | null }) {
    if (puntos === null) return null;

    if (puntos === 5)
        return (
            <Chip
                icon={<CheckCircleOutlinedIcon />}
                label="+5 pts"
                size="small"
                sx={{
                    bgcolor: "success.50",
                    color: "success.800",
                    fontWeight: 700,
                    "& .MuiChip-icon": { color: "success.600" },
                }}
            />
        );

    if (puntos === 3)
        return (
            <Chip
                icon={<RadioButtonUncheckedIcon />}
                label="+3 pts"
                size="small"
                sx={{
                    bgcolor: "info.50",
                    color: "info.800",
                    fontWeight: 700,
                    "& .MuiChip-icon": { color: "info.600" },
                }}
            />
        );

    return (
        <Chip
            icon={<CancelOutlinedIcon />}
            label="+0 pts"
            size="small"
            sx={{
                bgcolor: "grey.100",
                color: "grey.600",
                fontWeight: 700,
                "& .MuiChip-icon": { color: "grey.400" },
            }}
        />
    );
}

function ScoreBox({ value }: { value: number }) {
    return (
        <Box
            sx={{
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                bgcolor: "grey.100",
                border: "1px solid",
                borderColor: "divider",
                fontWeight: 700,
                fontSize: 22,
                color: "text.primary",
            }}
        >
            {value}
        </Box>
    );
}

// Input numérico tipo stepper: botones +/- con valor visible en el centro
function GolesInput({
    value,
    onChange,
    label,
}: {
    value: string;
    onChange: (v: string) => void;
    label: string;
}) {
    const num = value === "" ? null : parseInt(value);

    const incrementar = () => {
        const next = num === null ? 0 : num + 1;
        onChange(next.toString());
    };

    const decrementar = () => {
        if (num === null || num <= 0) return;
        onChange((num - 1).toString());
    };

    return (
        <Stack alignItems="center" gap={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, letterSpacing: 0.5 }}>
                {label}
            </Typography>
            <Stack
                direction="row"
                alignItems="center"
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                }}
            >
                <IconButton
                    size="small"
                    onClick={decrementar}
                    disabled={num === null || num <= 0}
                    sx={{
                        borderRadius: 0,
                        width: 32,
                        height: 40,
                        color: "text.secondary",
                        "&:hover": { bgcolor: "grey.100" },
                    }}
                >
                    <RemoveIcon sx={{ fontSize: 14 }} />
                </IconButton>

                <Box
                    sx={{
                        width: 36,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                        color: num === null ? "text.disabled" : "text.primary",
                        borderLeft: "1px solid",
                        borderRight: "1px solid",
                        borderColor: "divider",
                        userSelect: "none",
                    }}
                >
                    {num === null ? "—" : num}
                </Box>

                <IconButton
                    size="small"
                    onClick={incrementar}
                    sx={{
                        borderRadius: 0,
                        width: 32,
                        height: 40,
                        color: "text.secondary",
                        "&:hover": { bgcolor: "grey.100" },
                    }}
                >
                    <AddIcon sx={{ fontSize: 14 }} />
                </IconButton>
            </Stack>
        </Stack>
    );
}

function PartidoCard({
    partido,
    prediccion,
    onChangePrediccion,
    onGuardar,
}: {
    partido: Partido;
    prediccion: Prediccion | undefined;
    onChangePrediccion: (
        id: number,
        campo: "golesLocal" | "golesVisitante",
        valor: string
    ) => void;
    onGuardar: (id: number) => Promise<void>;
}) {
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const ahora = new Date();
    const fechaPartido = new Date(`${partido.fechaRaw}T${partido.horaRaw}`);
    const finalizado = ahora > fechaPartido || 
        (partido.resultadoLocal !== null && partido.resultadoVisitante !== null);
    const puntos = finalizado ? calcPuntos(partido, prediccion) : null;

    const handleGuardar = async () => {
        setSaveState("saving");
        try {
            await onGuardar(partido.id);
            setSaveState("saved");
        } catch {
            setSaveState("error");
        } finally {
            setTimeout(() => setSaveState("idle"), 2200);
        }
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>


            {/* Header */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, py: 1, bgcolor: "grey.50" }}
            >
                <Typography variant="caption" color="text.secondary">
                    {partido.fechaDisplay}
                    {partido.horaDisplay ? ` · ${partido.horaDisplay} hs` : ""}
                </Typography>
                {finalizado && (
                    <Chip
                        label="Finalizado"
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: 11,
                            bgcolor: "grey.200",
                            color: "grey.700",
                        }}
                    />
                )}
            </Stack>

            <Divider />

            {/* Matchup */}
            <Box sx={{ px: 2, py: 2 }}>

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                >
                    {/* Local */}
                    <Stack alignItems="center" gap={1} sx={{ flex: 1 }}>
                        <TeamLogo nombre={partido.local} />
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            textAlign="center"
                            sx={{ lineHeight: 1.3 }}
                        >
                            {partido.local}
                        </Typography>
                    </Stack>

                    {/* Centro */}
                    <Stack alignItems="center" gap={0.5} sx={{ px: 1 }}>
                        {finalizado ? (
                            <Stack direction="row" alignItems="center" gap={0.5}>
                                <ScoreBox value={partido.resultadoLocal!} />
                                <Typography
                                    color="text.secondary"
                                    fontWeight={700}
                                    fontSize={18}
                                >
                                    -
                                </Typography>
                                <ScoreBox value={partido.resultadoVisitante!} />
                            </Stack>
                        ) : (
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                fontWeight={700}
                                letterSpacing={2}
                            >
                                VS
                            </Typography>
                        )}
                    </Stack>

                    {/* Visitante */}
                    <Stack alignItems="center" gap={1} sx={{ flex: 1 }}>
                        <TeamLogo nombre={partido.visitante} />
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            textAlign="center"
                            sx={{ lineHeight: 1.3 }}
                        >
                            {partido.visitante}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>

            <Divider />

            {/* Footer */}
            <Box sx={{ px: 2, py: 1.5 }}>
                {finalizado ? (
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        {prediccion &&
                        prediccion.golesLocal !== "" &&
                        prediccion.golesVisitante !== "" ? (
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="caption" color="text.secondary">
                                    Tu pronóstico:
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={700}
                                    color="text.primary"
                                >
                                    {prediccion.golesLocal} -{" "}
                                    {prediccion.golesVisitante}
                                </Typography>
                            </Stack>
                        ) : (
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                fontStyle="italic"
                            >
                                Sin pronóstico registrado
                            </Typography>
                        )}
                        <PuntosChip puntos={puntos} />
                    </Stack>
                ) : (
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                    >
                        <Stack direction="row" alignItems="flex-end" gap={1.5}>
                            <GolesInput
                                label={partido.local.split(" ")[0]}
                                value={prediccion?.golesLocal ?? ""}
                                onChange={(v) =>
                                    onChangePrediccion(partido.id, "golesLocal", v)
                                }
                            />
                            <Typography
                                color="text.secondary"
                                fontWeight={700}
                                fontSize={20}
                                sx={{ pb: "6px" }}
                            >
                                -
                            </Typography>
                            <GolesInput
                                label={partido.visitante.split(" ")[0]}
                                value={prediccion?.golesVisitante ?? ""}
                                onChange={(v) =>
                                    onChangePrediccion(
                                        partido.id,
                                        "golesVisitante",
                                        v
                                    )
                                }
                            />
                        </Stack>

                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleGuardar}
                            disabled={saveState === "saving"}
                            startIcon={
                                saveState === "saving" ? (
                                    <CircularProgress size={14} />
                                ) : saveState === "saved" ? (
                                    <CheckCircleOutlinedIcon />
                                ) : (
                                    <SaveIcon />
                                )
                            }
                            color={
                                saveState === "error"
                                    ? "error"
                                    : saveState === "saved"
                                    ? "success"
                                    : "primary"
                            }
                            sx={{ textTransform: "none", alignSelf: "center" }}
                        >
                            {saveState === "saving"
                                ? "Guardando..."
                                : saveState === "saved"
                                ? "Guardado"
                                : saveState === "error"
                                ? "Error"
                                : "Guardar"}
                        </Button>
                    </Stack>
                )}
            </Box>
        </Paper>
    );
}

export const Prode = ({ jugador, setMode }: Props) => {
    const [partidos, setPartidos] = useState<Partido[]>([]);
    const [predicciones, setPredicciones] = useState<
        Record<number, Prediccion>
    >({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [jugador]);

    const leerHoja = async (hoja: string) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${hoja}`;
        const response = await fetch(url);
        const text = await response.text();
        return JSON.parse(text.substring(47).slice(0, -2));
    };

    const cargarDatos = async () => {
        setLoading(true);
        setError(false);
        try {
            const [partidosJson, prediccionesJson] = await Promise.all([
                leerHoja("Partidos"),
                leerHoja("Predicciones"),
            ]);

            const partidosLeidos: Partido[] = partidosJson.table.rows
                .map((fila: any) => {
                    const fechaRaw = fila.c[4]?.v ?? "";
                    const horaRaw = fila.c[5]?.v ?? "";
                    const { display: fechaDisplay, orden: fechaOrden } =
                        parseFecha(fechaRaw);
                    const horaDisplay = parseHora(horaRaw);

                    return {
                        id: fila.c[0]?.v,
                        zona: fila.c[1]?.v,
                        local: fila.c[2]?.v,
                        visitante: fila.c[3]?.v,
                        fechaRaw,
                        horaRaw,
                        fechaDisplay,
                        horaDisplay,
                        fechaOrden,
                        resultadoLocal: fila.c[6]?.v ?? null,
                        resultadoVisitante: fila.c[7]?.v ?? null,
                    };
                })
                // Ordenar por fecha ascendente
                .sort((a: Partido, b: Partido) => a.fechaOrden - b.fechaOrden);

            const mapaPredicciones: Record<number, Prediccion> = {};
            prediccionesJson.table.rows
                .filter((fila: any) => fila.c[0]?.v === jugador)
                .forEach((fila: any) => {
                    mapaPredicciones[fila.c[1]?.v] = {
                        partidoId: fila.c[1]?.v,
                        golesLocal: fila.c[2]?.v?.toString() ?? "",
                        golesVisitante: fila.c[3]?.v?.toString() ?? "",
                    };
                });

            setPartidos(partidosLeidos);
            setPredicciones(mapaPredicciones);
        } catch (err) {
            console.error(err);
            setError(true);
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
                golesLocal: prev[partidoId]?.golesLocal ?? "",
                golesVisitante: prev[partidoId]?.golesVisitante ?? "",
                [campo]: valor,
            },
        }));
    };

    const guardarPrediccion = async (partidoId: number) => {
        const prediccion = predicciones[partidoId];
        if (!prediccion) throw new Error("Sin predicción");

        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                jugador,
                partido: partidoId,
                golesLocal: prediccion.golesLocal,
                golesVisitante: prediccion.golesVisitante,
            }),
            redirect: "follow",
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);
    };

    const partidosOrdenados = partidos.filter((p) => p.id);

    const totalPuntos = partidos
        .filter(
            (p) =>
                p.resultadoLocal !== null && p.resultadoVisitante !== null
        )
        .reduce((sum, p) => {
            const pts = calcPuntos(p, predicciones[p.id]);
            return sum + (pts ?? 0);
        }, 0);

    const partidosFinalizados = partidos.filter(
        (p) => p.resultadoLocal !== null && p.resultadoVisitante !== null
    ).length;

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" py={8} gap={2}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">
                    Cargando partidos...
                </Typography>
            </Stack>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    No se pudieron cargar los datos. Revisá tu conexión e
                    intentá de nuevo.
                </Alert>
            </Box>
        );
    }

    return (
        <Stack gap={3} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 600, mx: "auto" }}>
            <Button
                variant="contained"
                onClick={() => setMode("tabla")}
            >
                Posiciones
            </Button>
            {/* Header */}
            <Stack direction="row" alignItems="center" gap={2}>
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "primary.main",
                        fontSize: 22,
                        fontWeight: 700,
                    }}
                >
                    {jugador.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                        Pronósticos de {jugador}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {partidos.filter((p) => p.id).length} partidos ·{" "}
                        {partidosFinalizados} finalizados
                    </Typography>
                </Box>
            </Stack>

            {/* Barra de puntos */}
            {partidosFinalizados > 0 && (
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: 3,
                        px: 2.5,
                        py: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "grey.50",
                    }}
                >
                    <Stack direction="row" alignItems="center" gap={1}>
                        <EmojiEventsOutlinedIcon
                            sx={{ color: "warning.main", fontSize: 22 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Puntos acumulados
                        </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700}>
                        {totalPuntos} pts
                    </Typography>
                </Paper>
            )}

            {/* Partidos ordenados por fecha */}
            <Stack gap={1.5}>
                {partidosOrdenados.map((partido) => (
                    <PartidoCard
                        key={partido.id}
                        partido={partido}
                        prediccion={predicciones[partido.id]}
                        onChangePrediccion={actualizarPrediccion}
                        onGuardar={guardarPrediccion}
                    />
                ))}
            </Stack>
        </Stack>
    );
};