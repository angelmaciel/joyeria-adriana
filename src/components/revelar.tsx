"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Revela su contenido cuando entra en pantalla al scrollear.
 *
 * Usa IntersectionObserver y no el evento de scroll: el observer no corre en el
 * hilo principal en cada píxel, así que no traba el scroll.
 *
 * Agrega la clase directo sobre el nodo en vez de pasar por estado de React: el
 * revelado es puramente visual y no hay nada más que dependa de él, así que un
 * re-render por cada sección que aparece sería trabajo al pedo justo mientras
 * el usuario scrollea.
 *
 * El observer se desconecta apenas revela. Es a propósito: una sección que se
 * vuelve a esconder al salir de pantalla y reaparece al volver marea, y encima
 * deja al usuario mirando huecos vacíos cuando scrollea para arriba.
 *
 * Si no hay JavaScript, el bloque `@media (scripting: none)` de globals.css
 * muestra el contenido igual; sin eso quedaría invisible para siempre.
 */
export function Revelar({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Escalonado en ms, para que los hermanos no entren todos juntos. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const revelar = () => el.classList.add("revelar-visible");

    if (typeof IntersectionObserver === "undefined") {
      revelar();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        revelar();
        observer.disconnect();
      },
      // El -12% de abajo hace que dispare cuando la sección ya entró de verdad
      // y no apenas asoma un píxel por el borde inferior.
      { threshold: 0.1, rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("revelar", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
