"use client";

import { useRouter } from "next/navigation";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { esIlegible } from "@/lib/crypto";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";

export type FilaSolicitud = {
  id: string;
  cliente: string;
  telefono: string;
  detalle: string;
  estado: RequestStatus;
  creada: string; // ISO: las fechas no cruzan al cliente como Date
  precio: number | null;
};

// Colores por estado. Van por semantica, no por la paleta de marca: el
// operador tiene que poder barrer la lista y ver que necesita atencion.
const COLOR_ESTADO: Record<RequestStatus, "default" | "warning" | "info" | "success" | "error"> = {
  PENDIENTE: "warning",
  COTIZADO: "info",
  EN_PROCESO: "info",
  LISTO: "success",
  ENTREGADO: "default",
  CANCELADO: "error",
};

const guaranies = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

export function TablaSolicitudes({
  filas,
  rutaBase,
  etiquetaPrecio,
}: {
  filas: FilaSolicitud[];
  /** "/admin/solicitudes" o "/admin/compra-oro" */
  rutaBase: string;
  etiquetaPrecio: string;
}) {
  const router = useRouter();

  const columnas: GridColDef<FilaSolicitud>[] = [
    {
      field: "cliente",
      headerName: "Cliente",
      flex: 1,
      minWidth: 150,
      // Si el dato no se pudo descifrar se marca en vez de mostrarlo como si
      // fuera el nombre real.
      renderCell: ({ value }) =>
        esIlegible(value) ? (
          <Box component="span" sx={{ color: "error.main", fontStyle: "italic" }}>
            {value}
          </Box>
        ) : (
          value
        ),
    },
    { field: "telefono", headerName: "Teléfono", width: 130 },
    { field: "detalle", headerName: "Detalle", flex: 1.4, minWidth: 180 },
    {
      field: "estado",
      headerName: "Estado",
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={REQUEST_STATUS_LABELS[value as RequestStatus]}
          color={COLOR_ESTADO[value as RequestStatus]}
          variant={value === "ENTREGADO" ? "outlined" : "filled"}
        />
      ),
    },
    {
      field: "creada",
      headerName: "Fecha",
      width: 110,
      // El tipo date deja que la grilla ordene y filtre por fecha de verdad,
      // no como texto.
      type: "date",
      valueGetter: (value: string) => new Date(value),
    },
    {
      field: "precio",
      headerName: etiquetaPrecio,
      width: 130,
      type: "number",
      valueFormatter: (value: number | null) =>
        value == null ? "—" : guaranies.format(value),
    },
  ];

  return (
    <DataGrid
      rows={filas}
      columns={columnas}
      // Toda la fila navega al detalle: es lo que el operador quiere hacer
      // el 100% de las veces que toca una.
      onRowClick={(p) => router.push(`${rutaBase}/${p.id}`)}
      initialState={{
        pagination: { paginationModel: { pageSize: 10 } },
        sorting: { sortModel: [{ field: "creada", sort: "desc" }] },
      }}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      // La barra propia de la grilla ya trae busqueda rapida, selector de
      // columnas, filtros y exportacion. Armar una a mano seria reescribir
      // algo que la libreria hace mejor.
      showToolbar
      sx={{
        "--DataGrid-overlayHeight": "180px",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        "& .MuiDataGrid-row": { cursor: "pointer" },
        "& .MuiDataGrid-columnHeaders": { bgcolor: "action.hover" },
      }}
    />
  );
}
