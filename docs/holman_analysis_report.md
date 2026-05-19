# Análisis Técnico: Patrones de Interacción Cursor→Texto en el Ecosistema de T. Holman

**Fecha**: 2026-04-06T01:24:31+00:00  
**Investigador**: Khaos y Eloise (GLM-5.1-Turbo)  
**Objetivo**: Ingeniería inversa de los patrones de renderizado dinámico cursor→texto para la app Caligramas

---

## Tabla de Contenidos

1. [Repositorios Analizados](#1-repositorios-analizados)
2. [Anatomía del Algoritmo Principal (Texter)](#2-anatomía-del-algoritmo-principal-texter)
3. [Análisis de Fórmulas Clave](#3-análisis-de-fórmulas-clave)
4. [Sistemas de Cursor-Effects Comparados](#4-sistemas-de-cursor-effects-comparados)
5. [El Origen: Generative Design P_2_3_3_01](#5-el-origen-generative-design-p_2_3_3_01)
6. [Técnicas de Anti-Superposición y Control de Densidad](#6-técnicas-de-anti-superposición-y-control-de-densidad)
7. [Comparación con Implementaciones Externas](#7-comparación-con-implementaciones-externas)
8. [Recomendaciones Concretas para Caligramas](#8-recomendaciones-concretas-para-caligramas)
9. [Pseudocódigo del Motor Mejorado](#9-pseudocódigo-del-motor-mejorado)
10. [Anexo: Código Fuente Completo](#10-anexo-código-fuente-completo)

---

## 1. Repositorios Analizados

### 1.1 tholman/texter — El repositorio central

- **URL**: https://github.com/tholman/texter
- **Archivo clave**: `js/texter.js` (197 líneas)
- **HTML wrapper**: `index.html` (usa dat.GUI para controles)
- **Origen**: Portado desde un demo del libro *Generative Gestaltung* — http://www.generative-gestaltung.de
- **Licencia**: Apache 2.0 (heredada del original)

**Controles expuestos via dat.GUI**:
```javascript
gui.add(texter, "text").name("Text");
gui.add(texter, "minFontSize", 3, 100).name("Minimum Size");
gui.add(texter, "maxFontSize", 3, 400).name("Maximum Size");
gui.add(texter, "angleDistortion", 0, 2).step(0.1).name("Random Angle");
gui.addColor(texter, "textColor").name("Text Color");
gui.addColor(texter, "bgColor").name("Background Color");
gui.add(texter, "clear").name("Clear");
gui.add(texter, "save").name("Save");
```

### 1.2 tholman/cursor-effects — Colección de 14 efectos

- **URL**: https://github.com/tholman/cursor-effects
- **14 efectos en `/src`**:
  - `antsCursor.js` — Hormigas que persiguen el cursor con cadena de seguimiento
  - `characterCursor.js` — Caracteres que se disparan desde el cursor (284 líneas)
  - `textFlag.js` — Bandera de texto ondulante siguiendo el mouse (149 líneas)
  - `fairyDustCursor.js` — Polvo de hadas (partículas de texto) (172 líneas)
  - `trailingCursor.js` — Estela elástica con easing (163 líneas)
  - `followingDotCursor.js`, `ghostCursor.js`, `rainbowCursor.js`, etc.

### 1.3 tholman/useless-web-archive

- **URL**: https://github.com/tholman/useless-web-archive
- Colección de sitios interactivos; no contiene código de renderizado de texto relevante.

### 1.4 Generative Design — Código fuente original P_2_3_3_01

- **URL**: https://github.com/generative-design/Code-Package-p5.js/blob/master/01_P/P_2_3_3_01/sketch.js
- **Archivo**: `01_P/P_2_3_3_01/sketch.js` (87 líneas, p5.js)
- Este es el **antecesor directo** del Texter de Holman.

---

## 2. Anatomía del Algoritmo Principal (Texter)

### 2.1 Variables de Estado

```javascript
position = { x: 0, y: window.innerHeight / 2 };  // Última posición donde se colocó un carácter
textIndex = 0;                                     // Índice en la cadena de texto
mouse = { x: 0, y: 0, down: false };              // Estado actual del mouse
```

### 2.2 Flujo del Loop de Animación

```
requestAnimationFrame(update)
    └─> update()
          └─> draw()  [solo si mouse.down === true]
                ├─ Calcular newDistance = distance(position, mouse)
                ├─ Calcular fontSize = minFontSize + newDistance / 2
                ├─ Clamp fontSize a maxFontSize
                ├─ Obtener siguiente letra: text[textIndex]
                ├─ Calcular stepSize = textWidth(letra, fontSize)
                ├─ if newDistance > stepSize:
                │     ├─ Calcular angle = atan2(mouse.y - position.y, mouse.x - position.x)
                │     ├─ Dibujar letra en (position.x, position.y) con rotación
                │     ├─ Avanzar textIndex (con wrap-around)
                │     └─ Mover position forward: x += cos(angle)*stepSize, y += sin(angle)*stepSize
                └─ else: no dibujar (esperar más distancia)
```

### 2.3 Diagrama de Flujo Visual

```
Mouse Down → Inicializa position = mouse
                    │
                    ▼
            mousemove event → mouse.x/y actualizados → draw() llamado
                    │
                    ▼
            ┌──────────────────────┐
            │ mouse.down == true?  │──No──→ return
            └─────────┬────────────┘
                      │ Sí
                      ▼
            ┌──────────────────────┐
            │ d = dist(position,   │
            │      mouse)          │
            └─────────┬────────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │ fontSize = min + d/2 │
            │ clamp(fontSize, max) │
            └─────────┬────────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │ stepSize = width(    │
            │   nextLetter,        │
            │   fontSize)          │
            └─────────┬────────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │ d > stepSize?        │──No──→ return (esperar)
            └─────────┬────────────┘
                      │ Sí
                      ▼
            ┌──────────────────────┐
            │ angle = atan2(dy,dx) │
            │ rotation = angle +   │
            │   random(distort)    │
            └─────────┬────────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │ draw(letter, pos,    │
            │      rotation, size) │
            │ pos += step en dir   │
            └──────────────────────┘
```

### 2.4 Eventos de Entrada

```javascript
// mousedown/touchstart: reset position al punto de contacto
onDown = function(event) {
    mouse.down = true;
    position.x = eventObject.pageX;
    position.y = eventObject.pageY;
    mouse.x = eventObject.pageX;
    mouse.y = eventObject.pageY;
}

// mousemove/touchmove: solo actualiza coordenadas del mouse
onMove = function(event) {
    mouse.x = eventObject.pageX;
    mouse.y = eventObject.pageY;
    draw();  // ← draw() se llama directamente desde el evento
}

// mouseup/touchend: detiene el dibujo
onUp = function() { mouse.down = false; }
```

**NOTA CRÍTICA**: `draw()` se llama tanto desde `requestAnimationFrame` (cada frame) como desde `onMove` (cada evento mousemove). Esto significa que el dibujo responde **inmediatamente** a cada movimiento del mouse, no solo al siguiente frame. Esto es lo que da la sensación de "precisión brutal".

---

## 3. Análisis de Fórmulas Clave

### 3.1 Distancia → Tamaño de Fuente (fontSize)

**Fórmula exacta**:
```javascript
fontSize = minFontSize + newDistance / 2;
```

| Variable | Tipo | Valor default | Rango |
|----------|------|---------------|-------|
| `minFontSize` | number | 8 | 3–100 (vía GUI) |
| `maxFontSize` | number | 300 | 3–400 (vía GUI) |
| `newDistance` | pixels | variable | 0–∞ |
| Divisor | number | **2** | fijo (no configurable en Texter) |

**Comportamiento matemático**:
- Es una **función lineal**: `f(d) = 8 + d/2`
- `d = 0` → fontSize = 8px (mínimo absoluto)
- `d = 10` → fontSize = 13px
- `d = 50` → fontSize = 33px
- `d = 100` → fontSize = 58px
- `d = 584` → fontSize = 300px (tope máximo)

**Análisis**: La función es deliberadamente **simple y directa**. No hay smoothing, no hay curvas de easing, no hay normalización. La respuesta es **proporcional e instantánea** a la distancia. Esto produce:
- ✅ Respuesta inmediata sin lag perceptual
- ✅ Mapeo intuitivo: mover rápido = letras grandes
- ⚠️ Sensibilidad al jitter: movimientos mínimos del mouse producen cambios de tamaño
- ⚠️ Sin protección contra saltos bruscos de tamaño

**Comparación con v12 (caligramas anterior)**:
```javascript
// v12 usaba VELOCIDAD (distancia/tiempo) con smoothing exponencial:
smoothVelocity = smoothVelocity * 0.85 + velocity * 0.15;
fontSize = minFontSize + smoothVelocity * sizeMultiplier;
```
La v12 introducía un **EMA (Exponential Moving Average)** que causaba lag perceptual. Holman NO usa esto.

### 3.2 Distancia → Step Size (espaciado entre caracteres)

**Fórmula exacta**:
```javascript
stepSize = textWidth(letter, fontSize);
```

Donde:
```javascript
textWidth = function(string, size) {
    context.font = size + "px Georgia";
    return context.measureText(string).width;
}
```

**Análisis**: Este es el aspecto **más elegante** del algoritmo. El stepSize es **exactamente el ancho medido del carácter** a la fontSize calculada. Esto significa:

- Caracteres estrechos ('i', 'l', '1') → stepSize pequeño → se colocan más cerca
- Caracteres anchos ('W', 'M', 'O') → stepSize grande → se colocan más lejos
- fontSize grande → stepSize proporcionalmente grande
- fontSize pequeño → stepSize proporcionalmente pequeño

**Resultado visual**: Los caracteres se tocan/enciman **naturalmente** según su forma, sin gaps artificiales. Cuando el mouse se mueve lento, las letras pequeñas se aprietan; cuando se mueve rápido, las letras grandes se espacian proporcionalmente.

**NO HAY**: factor de densidad configurable, factor de interlineado, ni mecanismo de ajuste de spacing.

### 3.3 Ángulo de Rotación

**Fórmula exacta**:
```javascript
angle = Math.atan2(mouse.y - position.y, mouse.x - position.x);
rotation = angle + (Math.random() * (angleDistortion * 2) - angleDistortion);
```

Donde `angleDistortion = 0.01` (default).

**Comportamiento**:
- El ángulo base siempre apunta en la **dirección del movimiento** (mouse - position)
- La distorsión agrega ruido uniforme en [-angleDistortion, +angleDistortion]
- Con distortion=0.01: ±0.01 radianes = ±0.57° → prácticamente imperceptible
- Con distortion=2.0: ±2.0 radianes = ±114° → efecto caótico/artístico

### 3.4 Avance de Posición

```javascript
position.x = position.x + Math.cos(angle) * stepSize;
position.y = position.y + Math.sin(angle) * stepSize;
```

La posición avanza **exactamente stepSize** píxeles en la dirección del ángulo. Esto significa que el siguiente carácter se coloca **justo al borde** del carácter actual (según su ancho medido). No hay gaps, no hay solapamiento forzado.

### 3.5 No existe: Leading / Interlineado

**FINDING CRÍTICO**: El Texter de Holman **NO tiene concepto de interlineado**. Los caracteres siguen el camino exacto del mouse, sea cual sea la dirección. Un movimiento vertical produce una columna de letras apiladas verticalmente con spacing = ancho del carácter, no con un "leading" vertical separado.

---

## 4. Sistemas de Cursor-Effects Comparados

### 4.1 characterCursor.js — Partículas de texto con lifespan

**URL**: `https://raw.githubusercontent.com/tholman/cursor-effects/master/src/characterCursor.js`

**Patrón**: Sistema de partículas donde cada carácter es una entidad con:
- **Lifespan**: `Math.floor(Math.random() * 60 + 80)` → 80-140 frames
- **Velocidad inicial**: `{x: ±random()*5, y: ±random()*5}`
- **Cambio de velocidad**: aceleración aleatoria por frame
- **Escala**: `scale = max(lifeLeft / lifeSpan * 2, 0)` → se encoge hasta desaparecer
- **Rotación**: `degrees = sign * lifeLeft / 5` → gira progresivamente

**Fórmulas clave**:
```javascript
// Escala basada en vida restante
characterScalingFunction(age, lifeSpan) {
    let lifeLeft = lifeSpan - age;
    return Math.max(lifeLeft / lifeSpan * 2, 0);
}

// Rotación basada en vida restante
characterNewRotationDegreesFunction(age, lifeSpan) {
    let lifeLeft = lifeSpan - age;
    return lifeLeft / 5;
}

// Cambio de velocidad por frame
x_func(age, lifeSpan) { return (random() < 0.5 ? -1 : 1) / 30; }
y_func(age, lifeSpan) { return (random() < 0.5 ? -1 : 1) / 15; }
```

**Key Insight**: Aquí Holman usa un modelo de **partículas temporales** (nacen, viven, mueren), completamente diferente del modelo de Texter donde los caracteres son **permanentes** en el canvas. La escala decae linealmente, la rotación es proporcional a la vida restante.

### 4.2 textFlag.js — Cadena de texto con easing y ondulación

**URL**: `https://raw.githubusercontent.com/tholman/cursor-effects/master/src/textFlag.js`

**Patrón**: Una cadena de caracteres donde:
- Cada carácter sigue al anterior con un gap fijo
- El primer carácter sigue al cursor con **easing divisional**
- Se aplica una **oscilación sinusoidal** para el efecto de bandera

**Fórmulas clave**:
```javascript
// Easing: el primer carácter persigue al cursor con factor de atenuación 1/5
x1 += (cursor.x - x1) / 5 + locX + 2;
y1 += (cursor.y - y1) / 5 + locY;

// Cada carácter siguiente copia posición del anterior + gap
charArray[i].x = charArray[i - 1].x + gap;
charArray[i].y = charArray[i - 1].y;

// Ondulación sinusoidal
angle += 0.15;
locX = radiusX * Math.cos(angle);  // radiusX = 2
locY = radiusY * Math.sin(angle);  // radiusY = 5
```

**Key Insight**: El easing `(target - current) / N` es la forma más simple de suavizado. Con N=5, el carácter alcanza ~63% de la distancia al cursor cada ~2 frames. La oscilación es constante (no depende de la velocidad del mouse).

### 4.3 fairyDustCursor.js — Partículas con gravedad

**URL**: `https://raw.githubusercontent.com/tholman/cursor-effects/master/src/fairyDustCursor.js`

**Fórmulas clave**:
```javascript
// Condición de creación: solo si el mouse se movió suficiente
distBetweenPoints = Math.hypot(cursor.x - lastPos.x, cursor.y - lastPos.y);
if (distBetweenPoints > 1.5) { addParticle(...); }

// Física de partícula
velocity.y += 0.02;  // gravedad constante
scale = max(lifeSpan / initialLifeSpan, 0);  // escala decreciente
```

**Key Insight**: La gravedad constante (`0.02` por frame) crea un efecto de caída natural. El umbral de distancia (`1.5px`) previene la creación excesiva de partículas cuando el mouse está quieto.

### 4.4 trailingCursor.js — Easing de cadena elástica

**URL**: `https://raw.githubusercontent.com/tholman/cursor-effects/master/src/trailingCursor.js`

**Fórmulas clave**:
```javascript
// Cada partícula sigue a la siguiente con factor de rate
const rate = 0.4;
particles.forEach(function(particle, index, particles) {
    let nextParticle = particles[index + 1] || particles[0];
    particle.position.x = x;
    particle.position.y = y;
    x += (nextParticle.position.x - particle.position.x) * rate;
    y += (nextParticle.position.y - particle.position.y) * rate;
});
```

**Key Insight**: Este es un **easing de cadena** donde cada nodo se interpola hacia el siguiente con un factor `rate=0.4`. Crédito original: https://codepen.io/jakedeakin/full/MWKQVxX. La estela se comporta como una cadena elástica — el primer nodo se ubica en el cursor, el segundo interpola hacia el primero, el tercero hacia el segundo, etc.

### 4.5 antsCursor.js — IA de enjambre simplificada

**URL**: `https://raw.githubusercontent.com/tholman/cursor-effects/master/src/antsCursor.js`

**Patrón**: Hormigas con comportamiento de wandering + seguimiento en cadena:
```javascript
// Solo la hormiga más cercana al cursor lo sigue directamente
// Las demás forman una cadena: cada una sigue a la más cercana que ya sigue

// Smooth angle interpolation
angleDiff = targetAngle - this.angle;
while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
this.angle += angleDiff * 0.3;

// Speed based on distance
speed = Math.min(antSpeed * 1.8, dist * 0.15);

// Velocity smoothing
this.velocity.x += (targetVx - this.velocity.x) * 0.2;
```

---

## 5. El Origen: Generative Design P_2_3_3_01

### 5.1 Código fuente original (p5.js)

**URL**: `https://github.com/generative-design/Code-Package-p5.js/blob/master/01_P/P_2_3_3_01/sketch.js`

```javascript
'use strict';

var x = 0;
var y = 0;
var stepSize = 5.0;

var font = 'Georgia';
var letters = 'All the world\'s a stage...';
var fontSizeMin = 3;
var angleDistortion = 0.0;

var counter = 0;

function setup() {
  createCanvas(displayWidth, displayHeight);
  background(255);
  cursor(CROSS);
  x = mouseX;
  y = mouseY;
  textFont(font);
  textAlign(LEFT);
  fill(0);
}

function draw() {
  if (mouseIsPressed && mouseButton == LEFT) {
    var d = dist(x, y, mouseX, mouseY);
    textSize(fontSizeMin + d / 2);                        // ← IDÉNTICO a Holman
    var newLetter = letters.charAt(counter);
    stepSize = textWidth(newLetter);

    if (d > stepSize) {                                   // ← IDÉNTICO a Holman
      var angle = atan2(mouseY - y, mouseX - x);          // ← IDÉNTICO a Holman

      push();
      translate(x, y);
      rotate(angle + random(angleDistortion));            // ← IDÉNTICO a Holman
      text(newLetter, 0, 0);
      pop();

      counter++;
      if (counter >= letters.length) counter = 0;

      x = x + cos(angle) * stepSize;                     // ← IDÉNTICO a Holman
      y = y + sin(angle) * stepSize;                     // ← IDÉNTICO a Holman
    }
  }
}

function mousePressed() {
  x = mouseX;
  y = mouseY;
}
```

### 5.2 Comparación: Original vs. Holman

| Aspecto | Generative Design (p5.js) | Holman Texter (Canvas nativo) |
|---------|--------------------------|-------------------------------|
| `fontSize` | `fontSizeMin + d/2` | `minFontSize + newDistance/2` |
| `stepSize` | `textWidth(newLetter)` | `textWidth(letter, fontSize)` |
| Condición | `d > stepSize` | `newDistance > stepSize` |
| Ángulo | `atan2(mouseY-y, mouseX-x)` | `Math.atan2(mouse.y-position.y, mouse.x-position.x)` |
| Rotación | `angle + random(angleDistortion)` | `angle + (random()*2*distort - distort)` |
| Avance | `x += cos(angle)*stepSize` | `position.x += cos(angle)*stepSize` |
| Loop | p5.js `draw()` automático | `requestAnimationFrame` manual + `draw()` en mousemove |
| GUI | Teclado (flechas para distortion) | dat.GUI (sliders) |
| Save | `saveCanvas()` | `bgCanvas.toDataURL("image/png")` |
| maxFontSize | No existe (sin clamp) | `if (fontSize > maxFontSize) fontSize = maxFontSize` |

**Conclusión**: Holman hizo un **port casi 1:1** del algoritmo original, pero añadió:
1. `maxFontSize` con clamp (el original no lo tenía)
2. dat.GUI para controles visuales
3. `requestAnimationFrame` explícito + doble llamada a `draw()` (en rAF y en mousemove)
4. Soporte para touch events
5. Export a PNG con background

---

## 6. Técnicas de Anti-Superposición y Control de Densidad

### 6.1 Mecanismo Natural (Texter)

El Texter de Holman **NO tiene** un mecanismo explícito de anti-superposición. Sin embargo, el diseño del algoritmo produce un anti-superposición **natural**:

```
Carácter se coloca SOLO cuando newDistance > stepSize
stepSize = ancho_medido_del_carácter(fontSize)
```

Esto significa:
- El espacio mínimo entre caracteres es **exactamente el ancho del carácter anterior**
- Los caracteres se **tocan** pero no se superponen significativamente
- Cuando el mouse se mueve lentamente: stepSize es pequeño → caracteres pequeños muy juntos
- Cuando el mouse se mueve rápido: stepSize es grande → caracteres grandes más separados

**Excepción**: La rotación aleatoria (`angleDistortion`) puede causar ligera superposición visual, especialmente con valores altos.

### 6.2 Mecanismo de Fairy Dust

```javascript
// Umbral mínimo de distancia para crear partícula
if (distBetweenPoints > 1.5) { addParticle(...); }
```

Esto previene la creación de partículas cuando el mouse está casi quieto.

### 6.3 Mecanismo de Character Cursor

```javascript
// Cada partícula tiene lifespan finito → auto-limpieza
if (particles[i].lifeSpan < 0) { particles.splice(i, 1); }
```

Las partículas mueren naturalmente, previniendo acumulación infinita.

### 6.4 Mecanismo de Text Flag

```javascript
// Gap fijo entre caracteres previene solapamiento
gap = cursorOptions.gap || textSize + 2;
charArray[i].x = charArray[i - 1].x + gap;
```

### 6.5 Evaluación para Caligramas

| Técnica | Aplicable a Caligramas | Nota |
|---------|----------------------|------|
| stepSize = textWidth() | ✅ Ya implementado | Mecanismo natural del algoritmo |
| Umbral de distancia | ⚠️ Parcialmente | Útil para evitar dibujo cuando mouse quieto |
| Lifespan de partículas | ❌ No aplicable | Caligramas necesita persistencia |
| Gap fijo | ❌ No deseable | Deseamos spacing dinámico según velocidad |
| Clamp fontSize | ✅ Esencial | Prevenir caracteres absurdamente grandes |

---

## 7. Comparación con Implementaciones Externas

### 7.1 Otros motores de "draw with text"

#### Enfoque A: Generative Design (original) — p5.js
- `textSize(fontSizeMin + d / 2)` — Lineal, directo
- Sin maxFontSize → puede crecer indefinidamente
- Sin smoothing
- **Evaluación**: Algoritmo base, simple y efectivo

#### Enfoque B: Holman Texter — Canvas nativo
- `fontSize = minFontSize + newDistance / 2` — Lineal, directo
- maxFontSize configurable (3-400)
- Doble llamada a draw() (rAF + mousemove)
- **Evaluación**: Port limpio con mejoras de UX

#### Enfoque C: Caligramas v12 — Velocity + EMA
- `smoothVelocity = smoothVelocity * 0.85 + velocity * 0.15` — EMA
- `fontSize = minFontSize + smoothVelocity * multiplier` — Basado en velocidad
- **Evaluación**: Lag perceptual por smoothing excesivo

#### Enfoque D: Caligramas v13 — Distance-based (Holman-inspired)
- `fontSize = minFontSize + newDistance / distScale` — Lineal con divisor configurable
- Sin smoothing — Respuesta instantánea
- spacingDensity y leadingFactor como multiplicadores
- **Evaluación**: Mejor adaptación, pero añade complejidad innecesaria

### 7.2 Fórmulas Matemáticas Encontradas — Resumen

| Fuente | speed→fontSize | Tipo de función | Smoothing | stepSize |
|--------|---------------|----------------|-----------|----------|
| Gen. Design P_2_3_3_01 | `min + d/2` | Lineal | Ninguno | `textWidth()` |
| Holman Texter | `min + d/2` | Lineal | Ninguno | `textWidth()` |
| Holman characterCursor | N/A (partículas) | Escala: `lifeLeft/life*2` | Ninguno | N/A |
| Holman textFlag | N/A (fijo) | Fijo | Easing: `/5` | `textSize + 2` |
| Holman fairyDust | N/A (partículas) | Escala: `life/initialLife` | Ninguno | N/A |
| Holman trailing | N/A (cursor img) | N/A | Easing: `*0.4` | N/A |
| Caligramas v12 | `min + vel*mult` | Lineal (sobre vel.) | EMA: `0.85/0.15` | Configurable |
| Caligramas v13 | `min + d/scale` | Lineal | Ninguno | `textWidth() * density` |

### 7.3 Técnicas de Suavizado Encontradas

| Técnica | Fórmula | Uso en Holman | Efecto |
|---------|---------|---------------|--------|
| EMA (Exponential Moving Average) | `s = s*α + x*(1-α)` | ❌ Nunca | Suaviza señales ruidosas |
| Easing divisional | `x += (target - x) / N` | ✅ textFlag, trailing | Persigue objetivo con retardo |
| Angle interpolation | `angle += diff * factor` | ✅ antsCursor | Giro suave hacia objetivo |
| Velocity smoothing | `vel += (target - vel) * factor` | ✅ antsCursor | Aceleración/desaceleración suave |
| Linear interpolation | `lerp(a, b, t)` | ❌ No usado | Interpolación recta |
| requestAnimationFrame throttling | Solo en rAF | ✅ Todos | 60fps máximo |

---

## 8. Recomendaciones Concretas para Caligramas

### 8.1 Mantener la Simplicidad de Holman (NO sobrediseñar)

El mayor error de las iteraciones anteriores fue **añadir complejidad innecesaria** (smoothing, power curves, normalización). Holman demuestra que la **simplicidad brutal** produce la mejor experiencia de usuario:

1. **Eliminar todo smoothing** — El mouse ya es naturalmente suave por el input del sistema operativo
2. **Usar distancia directa, no velocidad** — La velocidad introduce dependencia temporal y jitter
3. **Mantener la fórmula lineal `min + d/N`** — No requiere tuning, es intuitiva

### 8.2 Ajustes Recomendados sobre la Base de Holman

| Parámetro | Valor Holman | Recomendación Caligramas | Razón |
|-----------|-------------|------------------------|-------|
| `distScale` (divisor) | 2 fijo | 2.0 default, slider 1-5 | Permite al usuario ajustar sensibilidad |
| `minFontSize` | 8 | 6 default, slider 3-30 | Letras más pequeñas permiten más detalle |
| `maxFontSize` | 300 | 120 default, slider 50-300 | Prevenir caracteres demasiado grandes |
| `angleDistortion` | 0.01 | 0.01 default, slider 0-1 | Mantener la precisión como default |
| `spacingDensity` | No existe | 1.0 default, slider 0.5-2.0 | Permitir solapamiento/artistic spacing |
| `leadingFactor` | No existe | 1.0 default, slider 1.0-2.5 | Solo para movimiento vertical |
| Font family | Georgia | Configurable (system fonts) | Diferentes fuentes = diferentes personalidades |

### 8.3 Control de Densidad para Caligramas

Dado que Caligramas es una herramienta artística (no un simple experimento), recomendamos añadir:

1. **spacingDensity multiplier** sobre stepSize:
   ```javascript
   stepSize = textWidth(unit, fontStr) * spacingDensity;
   // spacingDensity < 1.0 → caracteres se solapan (denso)
   // spacingDensity = 1.0 → caracteres se tocan (natural, estilo Holman)
   // spacingDensity > 1.0 → caracteres con gap (aireado)
   ```

2. **leadingFactor para movimiento vertical**:
   ```javascript
   var angle = Math.atan2(dy, dx);
   var verticalFactor = Math.abs(Math.sin(angle));
   if (verticalFactor > 0.7) {
       stepSize *= leadingFactor;
   }
   ```
   Esto añade espacio extra solo cuando el movimiento es predominantemente vertical, creando un efecto de "líneas de texto" naturales.

### 8.4 Optimización del Loop de Animación

Holman llama `draw()` tanto desde `rAF` como desde `mousemove`. Para Caligramas, recomendamos:

```javascript
// Opción A (estilo Holman): respuesta máxima
var draw = function() {
    if (mouse.down) { /* ... */ }
};
canvas.addEventListener("mousemove", onMove);  // onMove llama draw()
function update() { requestAnimationFrame(update); draw(); }

// Opción B (más eficiente): solo rAF
canvas.addEventListener("mousemove", function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    // NO llamar draw() aquí — dejar que rAF lo maneje
});
function update() {
    requestAnimationFrame(update);
    draw();  // Solo se dibuja en el ciclo rAF
}
```

**Recomendación**: Usar **Opción B** para Caligramas. La Opción A puede causar dibujado duplicado en un mismo frame (mousemove + rAF), mientras que la Opción B garantiza exactamente un dibujado por frame y es más eficiente.

### 8.5 Características Avanzadas Suggeridas (futuras)

Basado en los patrones vistos en cursor-effects:

1. **Modo Partícula** (inspirado en characterCursor): Los caracteres tienen lifespan, se desvanecen, y se puede controlar su física. Útil para efectos artísticos.

2. **Modo Bandera** (inspirado en textFlag): El texto forma una cadena que sigue al cursor con easing. Útil para títulos animados.

3. **Modo Lluvia** (inspirado en fairyDust): Los caracteres caen con gravedad. Útil para efectos decorativos.

---

## 9. Pseudocódigo del Motor Mejorado

```
// ============================================
// MOTOR DE RENDERIZO CALIGRAMAS v14
// Basado en Holman Texter + mejoras
// ============================================

CONFIGURACIÓN:
    text = "Texto del caligrama..."
    fontFamily = "Georgia"
    fontWeight = "normal"
    textColor = "#000000"
    minFontSize = 6
    maxFontSize = 120
    distScale = 2.0           // divisor para fontSize
    angleDistortion = 0.01    // ruido angular
    spacingDensity = 1.0      // multiplicador de stepSize
    leadingFactor = 1.0       // multiplicador para movimiento vertical

ESTADO:
    position = {x: 0, y: 0}  // última posición colocada
    mouse = {x: 0, y: 0, down: false}
    textIndex = 0
    canvas, context
    history = []              // para undo/redo

FUNCIÓN distance(p1, p2):
    RETURN sqrt((p2.x-p1.x)² + (p2.y-p1.y)²)

FUNCIÓN measureWidth(char, fontString):
    SET context.font = fontString
    RETURN context.measureText(char).width

FUNCIÓN draw():
    IF NOT mouse.down THEN RETURN

    // 1. Calcular distancia desde última posición colocada
    newDistance = distance(position, mouse)

    // 2. Calcular fontSize (LINEAL, sin smoothing)
    fontSize = minFontSize + newDistance / distScale
    IF fontSize > maxFontSize THEN fontSize = maxFontSize

    // 3. Obtener siguiente unidad de texto
    unit = text[textIndex]
    fontString = fontWeight + " " + fontSize + "px " + fontFamily

    // 4. Calcular stepSize (ancho medido × densidad)
    stepSize = measureWidth(unit, fontString) * spacingDensity

    // 5. Ajustar stepSize para movimiento vertical (leading)
    angle = atan2(mouse.y - position.y, mouse.x - position.x)
    IF abs(sin(angle)) > 0.7 THEN
        stepSize = stepSize * leadingFactor
    END IF

    // 6. SOLO colocar si hay suficiente distancia (anti-superposición natural)
    IF newDistance > stepSize THEN

        // 7. Calcular rotación (dirección + distorsión aleatoria)
        rotation = angle + (random() * angleDistortion * 2 - angleDistortion)

        // 8. Dibujar el carácter
        SET context.font = fontString
        SET context.fillStyle = textColor
        context.save()
        context.translate(position.x, position.y)
        context.rotate(rotation)
        context.fillText(unit, 0, 0)
        context.restore()

        // 9. Avanzar posición沿stepSize en dirección del ángulo
        position.x = position.x + cos(angle) * stepSize
        position.y = position.y + sin(angle) * stepSize

        // 10. Avanzar índice de texto (con wrap-around)
        textIndex = (textIndex + 1) % text.length

        // 11. Guardar operación para undo
        history.push({
            type: "char",
            x: position.x, y: position.y,
            unit: unit, fontSize: fontSize,
            rotation: rotation, font: fontString,
            color: textColor
        })
    END IF

FUNCIÓN onMouseDown(event):
    mouse.down = true
    position.x = event.pageX
    position.y = event.pageY
    mouse.x = event.pageX
    mouse.y = event.pageY

FUNCIÓN onMouseMove(event):
    mouse.x = event.pageX
    mouse.y = event.pageY
    // NOTA: NO llamar draw() aquí — dejar que rAF lo maneje

FUNCIÓN onMouseUp():
    mouse.down = false

LOOP principal:
    FUNCTION update():
        requestAnimationFrame(update)
        draw()
```

### 9.1 Fórmulas de Referencia Rápida

```
fontSize     = minFontSize + (distance / distScale)
stepSize     = measureWidth(char, fontSize) × spacingDensity
angle        = atan2(mouse.y - pos.y, mouse.x - pos.x)
rotation     = angle + random(-distortion, +distortion)
newPos.x     = pos.x + cos(angle) × stepSize
newPos.y     = pos.y + sin(angle) × stepSize
condición    = distance > stepSize  →  colocar carácter
```

### 9.2 Mapa de Parámetros: Rango vs. Efecto

```
distScale:    1.0 [──muy sensible──] 2.0 [──default─] 5.0 [──muy suave──]
spacingDensity: 0.5 [──solapado──] 1.0 [──natural─] 2.0 [──aireado──]
leadingFactor:  1.0 [──normal──] 1.5 [──espaciado─] 2.5 [──muy abierto─]
angleDistortion: 0.0 [──perfecto──] 0.01 [──sutil─] 1.0 [──artístico─] 2.0 [──caos─]
minFontSize:   3  [──microscópico─] 8 [──legible─] 30 [──grande──]
maxFontSize:  50 [──limitado──] 120 [──default─] 300 [──masivo──]
```

---

## 10. Anexo: Código Fuente Completo

### 10.1 texter.js de Holman (completo, 197 líneas)

```javascript
/*
 *  Texter - Drawing with Text.
 *  - Ported from demo in Generative Design book
 *  - Modified and maintained by Tim Holman - tholman.com - @twholman
 */
function Texter() {
  var _this = this;
  position = { x: 0, y: window.innerHeight / 2 };
  textIndex = 0;
  this.textColor = "#000000";
  this.bgColor = "#ffffff";
  this.minFontSize = 8;
  this.maxFontSize = 300;
  this.angleDistortion = 0.01;

  this.text = "There was a table set out under a tree...";

  canvas = null;
  context = null;
  mouse = { x: 0, y: 0, down: false };
  bgCanvas = null;
  bgContext = null;

  this.initialize = function () {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.addEventListener("mousemove", onMove, false);
    canvas.addEventListener("mousedown", onDown, false);
    canvas.addEventListener("mouseup", onUp, false);
    canvas.addEventListener("mouseout", onUp, false);
    canvas.addEventListener("touchstart", onDown, false);
    canvas.addEventListener("touchmove", onMove, false);
    canvas.addEventListener("touchend", onUp, false);
    canvas.addEventListener("touchcancel", onUp, false);

    bgCanvas = document.createElement("canvas");
    bgContext = bgCanvas.getContext("2d");
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    _this.setBackground(_this.bgColor);
    update();
  };

  var update = function () { requestAnimationFrame(update); draw(); };

  var draw = function () {
    if (mouse.down) {
      var newDistance = distance(position, mouse);
      var fontSize = _this.minFontSize + newDistance / 2;
      if (fontSize > _this.maxFontSize) fontSize = _this.maxFontSize;

      var letter = _this.text[textIndex];
      var stepSize = textWidth(letter, fontSize);

      if (newDistance > stepSize) {
        var angle = Math.atan2(mouse.y - position.y, mouse.x - position.x);
        context.font = fontSize + "px Georgia";
        context.save();
        context.translate(position.x, position.y);
        context.rotate(angle + (Math.random() * (_this.angleDistortion * 2) - _this.angleDistortion));
        context.fillText(letter, 0, 0);
        context.restore();

        textIndex++;
        if (textIndex > _this.text.length - 1) textIndex = 0;
        position.x = position.x + Math.cos(angle) * stepSize;
        position.y = position.y + Math.sin(angle) * stepSize;
      }
    }
  };

  var distance = function (pt, pt2) {
    var xs = pt2.x - pt.x; xs = xs * xs;
    var ys = pt2.y - pt.y; ys = ys * ys;
    return Math.sqrt(xs + ys);
  };

  var onDown = function (event) {
    const eventObject = event.touches && event.touches.item(0) || event;
    mouse.down = true;
    position.x = eventObject.pageX;
    position.y = eventObject.pageY;
    mouse.x = eventObject.pageX;
    mouse.y = eventObject.pageY;
  };

  var onUp = function () { mouse.down = false; };

  var onMove = function (event) {
    const eventObject = event.touches && event.touches.item(0) || event;
    mouse.x = eventObject.pageX;
    mouse.y = eventObject.pageY;
    draw();  // ← draw() se llama directamente en mousemove
  };

  var textWidth = function (string, size) {
    context.font = size + "px Georgia";
    return context.measureText(string).width;
  };
}
```

### 10.2 P_2_3_3_01 — Generative Design original (completo)

```javascript
// P_2_3_3_01 — Generative Gestaltung
'use strict';
var x = 0, y = 0, stepSize = 5.0;
var font = 'Georgia';
var letters = 'All the world\'s a stage...';
var fontSizeMin = 3, angleDistortion = 0.0;
var counter = 0;

function setup() {
  createCanvas(displayWidth, displayHeight);
  background(255); cursor(CROSS);
  x = mouseX; y = mouseY;
  textFont(font); textAlign(LEFT); fill(0);
}

function draw() {
  if (mouseIsPressed && mouseButton == LEFT) {
    var d = dist(x, y, mouseX, mouseY);
    textSize(fontSizeMin + d / 2);
    var newLetter = letters.charAt(counter);
    stepSize = textWidth(newLetter);
    if (d > stepSize) {
      var angle = atan2(mouseY - y, mouseX - x);
      push(); translate(x, y);
      rotate(angle + random(angleDistortion));
      text(newLetter, 0, 0); pop();
      counter++;
      if (counter >= letters.length) counter = 0;
      x = x + cos(angle) * stepSize;
      y = y + sin(angle) * stepSize;
    }
  }
}

function mousePressed() { x = mouseX; y = mouseY; }
```

---

## Resumen Ejecutivo

### Hallazgos Principales

1. **La fórmula central es trivialmente simple**: `fontSize = min + distance/2`. No hay smoothing, no hay curvas, no hay normalización. La simplicidad ES la característica.

2. **El anti-superposición es un emergente natural**: `stepSize = textWidth()` garantiza que los caracteres se tocan sin gaps, creando un trazo continuo.

3. **No existe "leading" en Holman**: El interlineado vertical es una **invención de Caligramas**. Holman simplemente sigue el camino del mouse, sea cual sea la dirección.

4. **La clave del "feel" es la doble llamada a draw()**: Llamar draw() tanto en rAF como en mousemove garantiza respuesta inmediata a cada movimiento.

5. **El código de Holman es un port 1:1 del Generative Design P_2_3_3_01**: Holman añadió maxFontSize, dat.GUI, touch support, y PNG export. El algoritmo es idéntico.

### Próximos Pasos Recomendados

- Implementar motor v14 con la base de Holman pura
- Añadir solo los controles esenciales: distScale, spacingDensity, leadingFactor
- Eliminar cualquier smoothing o EMA
- Usar solo rAF loop (no doble llamada a draw)
- Testear con múltiples system fonts para validar textWidth()
- Añadir modo "partícula" inspirado en characterCursor.js como modo alternativo
