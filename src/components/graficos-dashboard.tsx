"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import Box from "@mui/material/Box";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";

// Tonos derivados del dorado de marca, de mas oscuro a mas claro. Se usan como
// escala secuencial: el estado no tiene color propio, lo que se compara es
// cuanto hay de cada uno.
const ESCALA = ["#906f23", "#a8873c", "#c0a05a", "#d4b87e", "#e3cda6", "#efe2c9"];

function Vacio({ children }: { children: string }) {
  return (
    <Box
      sx={{
        height: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "text.secondary",
        fontSize: 14,
      }}
    >
      {children}
    </Box>
  );
}

export function GraficoEstados({
  datos,
}: {
  datos: { estado: RequestStatus; total: number }[];
}) {
  const conDatos = datos.filter((d) => d.total > 0);
  if (conDatos.length === 0) return <Vacio>Todavía no hay solicitudes.</Vacio>;

  return (
    <BarChart
      height={240}
      // Horizontal porque las etiquetas de estado son palabras: en vertical
      // se cortan o se inclinan y dejan de leerse.
      layout="horizontal"
      dataset={conDatos.map((d) => ({
        etiqueta: REQUEST_STATUS_LABELS[d.estado],
        total: d.total,
      }))}
      yAxis={[{ dataKey: "etiqueta", scaleType: "band", width: 92 }]}
      xAxis={[{ label: "Solicitudes", tickMinStep: 1 }]}
      series={[{ dataKey: "total", label: "Solicitudes", color: "#906f23" }]}
      hideLegend
      margin={{ left: 0, right: 12, top: 8, bottom: 24 }}
    />
  );
}

export function GraficoPorServicio({
  datos,
}: {
  datos: { servicio: string; total: number }[];
}) {
  if (datos.length === 0) return <Vacio>Todavía no hay solicitudes este mes.</Vacio>;

  return (
    <PieChart
      height={240}
      series={[
        {
          data: datos.map((d, i) => ({
            id: i,
            value: d.total,
            label: d.servicio,
            color: ESCALA[i % ESCALA.length],
          })),
          // El agujero del centro deja leer las etiquetas sin que compitan con
          // la masa de color.
          innerRadius: 46,
          paddingAngle: 2,
          cornerRadius: 4,
          highlightScope: { fade: "global", highlight: "item" },
        },
      ]}
      margin={{ right: 8 }}
    />
  );
}

export function ProductosMasVistos({
  datos,
}: {
  datos: { nombre: string; vistas: number }[];
}) {
  if (datos.length === 0) return <Vacio>Todavía no hay productos activos.</Vacio>;

  return (
    <BarChart
        height={240}
        layout="horizontal"
        dataset={datos.map((d) => ({
          // Los nombres largos rompen el eje; se cortan con puntos suspensivos.
          etiqueta: d.nombre.length > 22 ? d.nombre.slice(0, 21) + "…" : d.nombre,
          vistas: d.vistas,
        }))}
        yAxis={[{ dataKey: "etiqueta", scaleType: "band", width: 150 }]}
        xAxis={[{ label: "Visitas", tickMinStep: 1 }]}
        series={[{ dataKey: "vistas", label: "Visitas", color: "#906f23" }]}
        hideLegend
      margin={{ left: 0, right: 12, top: 8, bottom: 24 }}
    />
  );
}
