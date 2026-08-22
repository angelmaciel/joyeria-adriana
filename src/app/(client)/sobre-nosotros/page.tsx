import type { Metadata } from "next";
import { Award, Clock, Gem, HeartHandshake, MapPin, Sparkles } from "lucide-react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { Revelar } from "@/components/revelar";
import { BUSINESS_NAME } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// CONTENIDO DE RELLENO — REEMPLAZAR POR EL REAL
//
// Todo el texto de esta página vive acá arriba a propósito: se cambia esto y no
// hace falta tocar el markup de abajo. Nada de esto sale de la base de datos
// todavía; si más adelante el negocio quiere editarlo desde el panel, esto es
// lo que habría que mover a una tabla.
// ─────────────────────────────────────────────────────────────────────────────

const INTRO = {
  etiqueta: "Nuestra casa",
  titulo: "Sobre nosotros",
  bajada:
    "Texto de ejemplo. Acá va la presentación del negocio en dos o tres " +
    "líneas: quiénes son, hace cuánto trabajan en el rubro y qué los " +
    "distingue de una joyería cualquiera.",
};

const HISTORIA = {
  etiqueta: "Nuestra historia",
  titulo: "Un oficio que se hereda",
  parrafos: [
    "Párrafo de ejemplo. Acá va el origen del negocio: en qué año abrió, " +
      "quién lo fundó y cómo empezó todo.",
    "Segundo párrafo de ejemplo. Sirve para contar cómo fue creciendo el " +
      "taller, qué se aprendió en el camino y qué se mantiene igual desde " +
      "el primer día.",
  ],
};

const CIFRAS = [
  { valor: "00", etiqueta: "Años de oficio" },
  { valor: "0.000", etiqueta: "Piezas entregadas" },
  { valor: "00", etiqueta: "Clientes por semana" },
];

const VALORES = [
  {
    icono: Gem,
    titulo: "Materiales nobles",
    texto:
      "Texto de ejemplo sobre la calidad de los materiales que se usan y de " +
      "dónde se consiguen.",
  },
  {
    icono: HeartHandshake,
    titulo: "Trato cercano",
    texto:
      "Texto de ejemplo sobre cómo se atiende a cada cliente y por qué la " +
      "confianza importa en este rubro.",
  },
  {
    icono: Award,
    titulo: "Trabajo garantizado",
    texto:
      "Texto de ejemplo sobre la garantía de cada reparación y de cada " +
      "pieza fabricada a medida.",
  },
  {
    icono: Sparkles,
    titulo: "Diseño a medida",
    texto:
      "Texto de ejemplo sobre la posibilidad de encargar una pieza única, " +
      "pensada desde cero junto al cliente.",
  },
];

const EQUIPO = [
  { nombre: "Nombre Apellido", rol: "Fundadora", nota: "Texto de ejemplo." },
  { nombre: "Nombre Apellido", rol: "Joyero", nota: "Texto de ejemplo." },
  { nombre: "Nombre Apellido", rol: "Relojero", nota: "Texto de ejemplo." },
];

const VISITANOS = {
  titulo: "Visitanos",
  direccion: "Calle de ejemplo 1234, Ciudad",
  horarios: [
    { dia: "Lunes a viernes", hora: "00:00 a 00:00" },
    { dia: "Sábados", hora: "00:00 a 00:00" },
    { dia: "Domingos", hora: "Cerrado" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `Sobre nosotros — ${BUSINESS_NAME}`,
  description: INTRO.bajada,
};

export default function SobreNosotrosPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* La primera sección entra sola al cargar: ya está en pantalla, no tiene
          sentido esperar a que el usuario scrollee. Las de abajo sí se revelan. */}
      <header className="animate-fade-up text-center">
        <Chip
          label={INTRO.etiqueta}
          variant="outlined"
          size="small"
          className="mb-3"
        />
        <h1>{INTRO.titulo}</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-balance">
          {INTRO.bajada}
        </p>
      </header>

      <Revelar className="mt-14">
        <section>
          <p className="text-primary text-sm font-medium tracking-wide uppercase">
            {HISTORIA.etiqueta}
          </p>
          <h2 className="font-heading mt-1 text-2xl font-semibold">
            {HISTORIA.titulo}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {HISTORIA.parrafos.map((parrafo, i) => (
              <p key={i} className="text-foreground/80 leading-relaxed">
                {parrafo}
              </p>
            ))}
          </div>
        </section>
      </Revelar>

      <Revelar className="mt-14">
        <section className="border-border bg-card grid grid-cols-3 gap-4 rounded-xl border p-6">
          {CIFRAS.map((cifra) => (
            <div key={cifra.etiqueta} className="text-center">
              <p className="font-heading text-primary text-3xl font-semibold">
                {cifra.valor}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {cifra.etiqueta}
              </p>
            </div>
          ))}
        </section>
      </Revelar>

      <section className="mt-14">
        <Revelar>
          <h2 className="font-heading text-center text-2xl font-semibold">
            Lo que nos importa
          </h2>
        </Revelar>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {VALORES.map((valor, i) => {
            const Icono = valor.icono;
            return (
              // El escalonado hace que entren de a una en vez de todas de golpe.
              <Revelar key={valor.titulo} delay={i * 80}>
                <Card className="tarjeta-interactiva h-full">
                  <CardContent className="flex flex-col gap-2">
                    <Icono className="text-primary size-6" />
                    <Typography variant="subtitle1" component="h3">
                      {valor.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {valor.texto}
                    </Typography>
                  </CardContent>
                </Card>
              </Revelar>
            );
          })}
        </div>
      </section>

      <section className="mt-14">
        <Revelar>
          <h2 className="font-heading text-center text-2xl font-semibold">
            Quiénes lo hacen
          </h2>
        </Revelar>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {EQUIPO.map((persona, i) => (
            <Revelar key={i} delay={i * 80}>
              <Card className="tarjeta-interactiva h-full text-center">
                <CardContent className="flex flex-col items-center gap-1">
                  {/* Marcador de posición para la foto. */}
                  <div className="bg-muted text-muted-foreground/40 flex size-20 items-center justify-center rounded-full">
                    <Gem className="size-7" />
                  </div>
                  <Typography variant="subtitle1" component="h3" className="mt-2">
                    {persona.nombre}
                  </Typography>
                  <p className="text-primary text-sm">{persona.rol}</p>
                  <Typography variant="body2" color="text.secondary">
                    {persona.nota}
                  </Typography>
                </CardContent>
              </Card>
            </Revelar>
          ))}
        </div>
      </section>

      <Revelar className="mt-14">
        <section className="border-border bg-accent/40 rounded-xl border p-6">
          <h2 className="font-heading text-2xl font-semibold">
            {VISITANOS.titulo}
          </h2>
          <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
            <MapPin className="text-primary size-4 shrink-0" />
            {VISITANOS.direccion}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {VISITANOS.horarios.map((horario) => (
              <li
                key={horario.dia}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="text-primary size-4 shrink-0" />
                  {horario.dia}
                </span>
                <span className="font-medium">{horario.hora}</span>
              </li>
            ))}
          </ul>
        </section>
      </Revelar>
    </div>
  );
}
