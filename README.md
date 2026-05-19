# Caligramas

Lienzo tipográfico interactivo: dibuja con texto.

Caligramas transforma el movimiento del cursor en un campo tipográfico dinámico. Cada trazo escribe una frase cuyo tamaño se ajusta a la velocidad del gesto, creando composiciones visuales que fusionan escritura a mano, caligrafía y arte generativo.

## Demostración en vivo

Abre `src/caligramas.html` en cualquier navegador moderno. No requiere servidor: es completamente autónomo.

## Genealogía

```
Diseño generativo (2012)
Bohnacker, Gross, Laub, Lazzeroni

|
v
P_2_3_3_01 (p5.js)
Texto paramétrico a lo largo de una ruta

|
v
Texter (2014) — Tim Holman
Canvas 2D + dat.GUI
https://github.com/tholman/texter

|
v
Caligramas (2026) — Khaos_Liminal
Campo tipográfico con interlineado, motor de distancia y controles artísticos
```

Caligramas se basa en el enfoque de renderizado basado en la distancia, pionero en Texter y el libro Generative Design, transformándolo de un efecto de rastro del cursor en una herramienta completa de composición tipográfica con:

- **Motor de distancia**: el tamaño de los caracteres se ajusta a la distancia espacial (no a la velocidad), proporcionando una respuesta visual inmediata sin retardo de suavizado.
- **Factor de interlineado**: introduce un espaciado vertical entre líneas al dibujar verticalmente, cambiando el paradigma de "texto como trazo" a "texto como campo tipográfico".
- **Exportación SVG completa**: cada carácter se conserva como elementos `<text>` editables con transformación y rotación.
- **Sin dependencias**: un único archivo HTML, solo fuentes del sistema, funciona sin conexión.

## Características

- Renderizado de texto a lo largo de la trayectoria del cursor con ajuste de tamaño de fuente basado en la distancia.
- Interlineado, densidad de espaciado y grosor configurables.
- Selección de fuentes (Georgia, Times, Courier, Arial, Verdana)
- Sistema de deshacer/rehacer (50 estados)
- Exportación a PNG y SVG
- Importación de imágenes de fondo
- Tema oscuro/claro
- Compatibilidad táctil para móviles
- Atajos de teclado

## Créditos

- **Tim Holman** — Texter y efectos de cursor (<https://github.com/tholman>)
- **Generative Design** — Bohnacker, Gross, Laub, Lazzeroni (2012)
- **ENTORNO GREKA** — Dirección creativa y marco conceptual

## Licencia

Ver [LICENSE] para detalles completos.

Código de terceros referenciado en este proyecto:

- Texter de Tim Holman (BSD-3-Clause)
- Generative Design P_2_3_3_01 (código que acompaña al libro)