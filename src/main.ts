class Caligramas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private workspace: HTMLElement;

  private position = { x: 0, y: 0 };
  private mouse = { x: 0, y: 0, down: false };
  private textIndex = 0;

  private text: string = 'amor es arte';
  private textArray: string[] = [];
  private fontFamily: string = 'Georgia, serif';
  private fontWeight: string = 'normal';
  private color: string = '#000000';
  private minFontSize = 8;
  private maxFontSize = 200;
  private angleDistortion = 0.01;

  private distScale = 2;
  private spacingDensity = 1.0;
  private leadingFactor = 1.0;
  private thicknessMultiplier = 1.0;

  private isAccessibleMode = true;
  private isDarkTheme = false;

  private operations: any[] = [];
  private history: any[] = [];
  private historyIndex = -1;
  private maxHistory = 50;

  private bgImage: HTMLImageElement | null = null;
  private bgImageSrc: string | null = null;
  private isEyedropperActive = false;

  // Pedagogical
  private currentTemplate = "none";
  private templateParams = { opacity: 0.15, scale: 1.0, offsetX: 0, offsetY: 0 };
  private generativePhrases = [
    "somos la forma en que el universo toma consciencia de sí mismo",
    "fuego digital y cenizas de información fluyendo en el vacío",
    "el algoritmo sueña con ovejas eléctricas que bailan al compás del viento",
    "memoria encriptada en la corteza de un árbol cibernético",
    "respirando datos que exhalan entropía a través del latido binario",
    "lenguaje híbrido donde el alma y la máquina conjugan el amor",
    "ecos de código reescribiendo la mitología de nuestros ancestros",
    "un fractal de pensamientos extendiéndose hasta el borde del cosmos"
  ];

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.workspace = document.getElementById('workspace')!;

    this.setupCanvas();
    this.updateTextArray();
    this.saveState();
    this.bindEvents();
    this.updateModeUI();
    this.startLoop();
  }

  setupCanvas() {
    const rect = this.workspace.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  resizeCanvas() {
    let savedData = null;
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      savedData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    const rect = this.workspace.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    if (savedData) this.ctx.putImageData(savedData, 0, 0);
    this.drawBgImage();
    this.drawTemplate(); // Draw tracing template if any
  }

  updateTextArray() {
    const trimmed = this.text.trim();
    if (!trimmed) {
      this.textArray = ['a'];
      return;
    }
    if (this.isAccessibleMode) {
      this.textArray = trimmed.split(/\s+/);
    } else {
      this.textArray = trimmed.split('');
    }
    this.textIndex = 0;
    const label = document.getElementById('splitMode');
    if (label) label.textContent = this.isAccessibleMode ? 'palabras' : 'caracteres';
  }

  private isDrawingLoopRunning = false;

  startLoop() {
    if (this.isDrawingLoopRunning) return;
    this.isDrawingLoopRunning = true;
    const loop = () => {
      if (!this.mouse.down) {
        this.isDrawingLoopRunning = false;
        return;
      }
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  draw() {
    if (!this.mouse.down) return;
    if (this.textArray.length === 0) return;

    const unit = this.textArray[this.textIndex];
    let angle = Math.atan2(this.mouse.y - this.position.y, this.mouse.x - this.position.x);

    this.ctx.save();
    this.ctx.font = `${this.fontWeight ? this.fontWeight + ' ' : ''}100px ${this.fontFamily}`;
    let fontRatio = this.ctx.measureText(unit).width / 100;
    this.ctx.restore();

    let slope = fontRatio * this.spacingDensity;
    if (Math.abs(Math.sin(angle)) > 0.7) {
      slope *= this.leadingFactor;
    }
    let safeDistScale = Math.max(this.distScale, slope * this.thicknessMultiplier * 1.05);

    let newDistance = this.dist(this.position, this.mouse);
    let fontSize = this.minFontSize + newDistance / safeDistScale;
    fontSize = fontSize * this.thicknessMultiplier;
    if (fontSize > this.maxFontSize) fontSize = this.maxFontSize;

    const fontStr = this.fontWeight + ' ' + fontSize + 'px ' + this.fontFamily;
    let stepSize = this.measureWidth(unit, fontStr);

    stepSize = stepSize * this.spacingDensity;

    if (Math.abs(Math.sin(angle)) > 0.7) {
      stepSize = stepSize * this.leadingFactor;
    }

    if (newDistance > stepSize) {
      const rotation = angle + (Math.random() * (this.angleDistortion * 2) - this.angleDistortion);

      this.ctx.save();
      this.ctx.translate(this.position.x, this.position.y);
      this.ctx.rotate(rotation);
      this.ctx.font = fontStr;
      this.ctx.fillStyle = this.color;
      this.ctx.fillText(unit, 0, 0);
      this.ctx.restore();

      this.operations.push({
        char: unit, x: this.position.x, y: this.position.y,
        fontSize, angle: rotation, fontFamily: this.fontFamily,
        fontWeight: this.fontWeight, color: this.color
      });

      this.textIndex++;
      if (this.textIndex >= this.textArray.length) this.textIndex = 0;

      this.position.x = this.position.x + Math.cos(angle) * stepSize;
      this.position.y = this.position.y + Math.sin(angle) * stepSize;

      this.showIndicator(newDistance, fontSize);
    }
  }

  dist(pt1: any, pt2: any) {
    const dx = pt2.x - pt1.x;
    const dy = pt2.y - pt1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  measureWidth(str: string, fontStr: string) {
    this.ctx.font = fontStr;
    return this.ctx.measureText(str).width;
  }

  showIndicator(distance: number, fontSize: number) {
    const el = document.getElementById('speedIndicator')!;
    document.getElementById('distVal')!.textContent = Math.round(distance).toString();
    document.getElementById('sizeVal')!.textContent = Math.round(fontSize).toString();
    if (!el.classList.contains('show')) el.classList.add('show');
  }

  hideIndicator() {
    document.getElementById('speedIndicator')!.classList.remove('show');
  }

  getCanvasPos(e: any) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX || e.pageX || e.touches?.[0].clientX) - rect.left,
      y: (e.clientY || e.pageY || e.touches?.[0].clientY) - rect.top
    };
  }

  onPointerDown(e: any) {
    if (this.isEyedropperActive) {
      this.pickColor(e);
      return;
    }
    const pos = this.getCanvasPos(e);
    this.mouse.down = true;
    this.position.x = pos.x; this.position.y = pos.y;
    this.mouse.x = pos.x; this.mouse.y = pos.y;
    this.textIndex = 0;
    this.startLoop();
  }

  onPointerMove(e: any) {
    const pos = this.getCanvasPos(e);
    this.mouse.x = pos.x; this.mouse.y = pos.y;
    this.draw();
  }

  onPointerUp() {
    if (this.mouse.down) {
      this.mouse.down = false;
      this.saveState();
      this.hideIndicator();
    }
  }

  pickColor(e: any) {
    const pos = this.getCanvasPos(e);
    const pixel = this.ctx.getImageData(Math.round(pos.x), Math.round(pos.y), 1, 1).data;
    this.color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
    this.isEyedropperActive = false;
    this.canvas.style.cursor = 'crosshair';
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
    (document.getElementById('hexInput') as HTMLInputElement).value = this.rgbToHex(pixel[0], pixel[1], pixel[2]);
    (document.getElementById('rgbInput') as HTMLInputElement).value = `${pixel[0]},${pixel[1]},${pixel[2]}`;
  }

  rgbToHex(r: number, g: number, b: number) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  saveState() {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push({
      dataUrl: this.canvas.toDataURL(),
      opsLength: this.operations.length
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.restoreState(this.history[this.historyIndex]);
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this.restoreState(this.history[this.historyIndex]);
  }

  restoreState(state: any) {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawBgImage();
      this.drawTemplate();
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = state.dataUrl;
    this.operations = this.operations.slice(0, state.opsLength);
  }

  exportPNG() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(this.canvas, 0, 0);

    // Mención a Tim Holman
    tempCtx.font = "12px 'Courier New'";
    tempCtx.fillStyle = "#999999";
    tempCtx.fillText("Inspirado orgánicamente en el motor de Tim Holman. Creado en Greka.", 10, tempCanvas.height - 10);

    const link = document.createElement('a');
    link.download = `greka_caligrama_${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }

  exportSVG() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(`<!-- Inspirado en el Double-Draw Engine de Tim Holman -->`);
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
    lines.push(`  <rect width="100%" height="100%" fill="#ffffff"/>`);

    if (this.bgImageSrc) {
      lines.push(`  <image href="${this.bgImageSrc}" x="0" y="0" width="${w}" height="${h}" opacity="0.15" preserveAspectRatio="xMidYMid meet"/>`);
    }

    for (let i = 0; i < this.operations.length; i++) {
        const op = this.operations[i];
        const deg = (op.angle * 180 / Math.PI).toFixed(2);
        const x = op.x.toFixed(2);
        const y = op.y.toFixed(2);
        const fs = op.fontSize.toFixed(2);
        const escapedChar = op.char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        lines.push(`  <text x="0" y="0" font-family="${op.fontFamily}" font-weight="${op.fontWeight}" font-size="${fs}" fill="${op.color}" transform="translate(${x},${y}) rotate(${deg})">${escapedChar}</text>`);
    }
    lines.push(`  <text x="10" y="${h-10}" font-family="Courier New" font-size="12" fill="#999999">Inspirado orgánicamente en el motor de Tim Holman. Creado en Greka.</text>`);
    lines.push('</svg>');

    const blob = new Blob([lines.join('\n')], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `greka_caligrama_${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  importImage() {
    document.getElementById('fileInput')!.click();
  }

  loadImage(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.bgImage = img;
        this.bgImageSrc = e.target?.result as string;
        this.drawBgImage();
        this.saveState();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  drawBgImage() {
    if (!this.bgImage) return;
    this.ctx.save();
    this.ctx.globalAlpha = this.templateParams.opacity;
    const baseScale = Math.min(this.canvas.width / this.bgImage.width, this.canvas.height / this.bgImage.height);
    const finalScale = baseScale * this.templateParams.scale;
    const w = this.bgImage.width * finalScale;
    const h = this.bgImage.height * finalScale;
    const ox = (this.templateParams.offsetX / 100) * (this.canvas.width / 2);
    const oy = (this.templateParams.offsetY / 100) * (this.canvas.height / 2);
    const x = (this.canvas.width - w) / 2 + ox;
    const y = (this.canvas.height - h) / 2 + oy;
    this.ctx.drawImage(this.bgImage, x, y, w, h);
    this.ctx.globalAlpha = 1.0;
    this.ctx.restore();
  }

  drawTemplate() {
    if (this.currentTemplate === 'none') return;
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(0,0,0,${this.templateParams.opacity})`;
    if(this.isDarkTheme) this.ctx.strokeStyle = `rgba(255,255,255,${this.templateParams.opacity})`;
    this.ctx.setLineDash([5, 5]);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    const ox = (this.templateParams.offsetX / 100) * (this.canvas.width / 2);
    const oy = (this.templateParams.offsetY / 100) * (this.canvas.height / 2);
    const cx = (this.canvas.width / 2) + ox;
    const cy = (this.canvas.height / 2) + oy;
    const baseSize = 200 * this.templateParams.scale;

    if (this.currentTemplate === 'circle') this.ctx.arc(cx, cy, baseSize, 0, Math.PI*2);
    else if (this.currentTemplate === 'square') this.ctx.rect(cx - baseSize, cy - baseSize, baseSize*2, baseSize*2);
    else if (this.currentTemplate === 'hexagon') {
        for(let i=0; i<=6; i++) {
           const angle = i * Math.PI / 3;
           const px = cx + baseSize * Math.cos(angle);
           const py = cy + baseSize * Math.sin(angle);
           if (i === 0) this.ctx.moveTo(px,py); else this.ctx.lineTo(px,py);
        }
    }
    else if (this.currentTemplate === 'triangle') {
        const h = baseSize * Math.sqrt(3) / 2;
        this.ctx.moveTo(cx, cy - baseSize);
        this.ctx.lineTo(cx - baseSize, cy + h);
        this.ctx.lineTo(cx + baseSize, cy + h);
        this.ctx.closePath();
    }
    else if (this.currentTemplate === 'spiral') {
        this.ctx.moveTo(cx, cy);
        for(let i=0; i<300; i++) {
            const angle = 0.1 * i;
            const r = (baseSize / 30) * angle;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            this.ctx.lineTo(px, py);
        }
    }
    else if (this.currentTemplate === 'star') {
        let rot = Math.PI/2*3; let x = cx; let y = cy; let step = Math.PI/5;
        this.ctx.moveTo(cx, cy - baseSize);
        for(let i=0; i<5; i++) {
            x=cx+Math.cos(rot)*baseSize; y=cy+Math.sin(rot)*baseSize; this.ctx.lineTo(x,y); rot+=step;
            x=cx+Math.cos(rot)*(baseSize/2); y=cy+Math.sin(rot)*(baseSize/2); this.ctx.lineTo(x,y); rot+=step;
        }
        this.ctx.lineTo(cx, cy-baseSize);
    }
    else if (this.currentTemplate === 'heart') {
        const size = baseSize;
        this.ctx.moveTo(cx, cy + size/4);
        this.ctx.bezierCurveTo(cx, cy, cx - size/2, cy, cx - size/2, cy + size/4);
        this.ctx.bezierCurveTo(cx - size/2, cy + size/2, cx, cy + size*0.75, cx, cy + size);
        this.ctx.bezierCurveTo(cx, cy + size*0.75, cx + size/2, cy + size/2, cx + size/2, cy + size/4);
        this.ctx.bezierCurveTo(cx + size/2, cy, cx, cy, cx, cy + size/4);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.operations = [];
    this.bgImage = null;
    this.bgImageSrc = null;
    this.drawTemplate(); // Keep template
    this.saveState();
    this.hideAllPanels();
  }

  togglePanel(panelId: string, tabEl: HTMLElement) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const wasVisible = panel.classList.contains('show');
    this.hideAllPanels();
    if (!wasVisible) {
      panel.classList.add('show');
      if (tabEl) tabEl.classList.add('active');
    }
  }

  hideAllPanels() {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('show'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  }

  flashCommand(idx: number) {
    const el = document.querySelector(`.command[data-idx="${idx}"]`);
    if (el) {
      el.classList.add('active');
      setTimeout(() => el.classList.remove('active'), 300);
    }
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    document.documentElement.setAttribute('data-theme', this.isDarkTheme ? 'dark' : '');
    document.getElementById('themeToggle')!.textContent = this.isDarkTheme ? 'OSCURO' : 'CLARO';
    // Redraw to update template color
    this.restoreState(this.history[this.historyIndex]);
  }

  toggleMode() {
    this.isAccessibleMode = !this.isAccessibleMode;
    this.updateModeUI();
    this.updateTextArray();
  }

  updateModeUI() {
    document.getElementById('modeToggle')!.textContent = this.isAccessibleMode ? 'ACCESIBLE' : 'AVANZADO';
    const thicknessTab = document.getElementById('thicknessTab')!;
    const clearTab = document.getElementById('clearTab')!;
    if (this.isAccessibleMode) {
      thicknessTab.classList.add('hidden-tab');
      clearTab.classList.add('hidden-tab');
    } else {
      thicknessTab.classList.remove('hidden-tab');
      clearTab.classList.remove('hidden-tab');
    }
    const label = document.getElementById('splitMode');
    if (label) label.textContent = this.isAccessibleMode ? 'palabras' : 'caracteres';
  }

  speak() {
    const utterance = new SpeechSynthesisUtterance(this.text);
    utterance.lang = 'es-MX';
    utterance.onstart = () => document.getElementById('speakBtn')?.classList.add('speaking');
    utterance.onend = () => document.getElementById('speakBtn')?.classList.remove('speaking');
    window.speechSynthesis.speak(utterance);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this.onPointerUp());

    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.onPointerDown(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.onPointerMove(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.onPointerUp(); }, { passive: false });

    // Tabs
    document.querySelectorAll('.tab').forEach((tab: any) => {
      tab.addEventListener('click', (e: any) => {
        const panelId = e.currentTarget.dataset.panel + 'Panel';
        this.togglePanel(panelId, e.currentTarget);
      });
    });

    document.addEventListener('click', (e: any) => {
      if (!e.target.closest('.sidebar') && !e.target.closest('.panel')) {
        this.hideAllPanels();
      }
    });

    // Typography
    document.querySelectorAll('.font-option').forEach((opt: any) => {
      opt.addEventListener('click', (e: any) => {
        document.querySelectorAll('.font-option').forEach(o => o.classList.remove('selected'));
        e.target.classList.add('selected');
        this.fontFamily = e.target.dataset.font;
      });
    });

    document.querySelectorAll('.weight-btn').forEach((btn: any) => {
      btn.addEventListener('click', (e: any) => {
        document.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.fontWeight = e.target.dataset.weight;
      });
    });

    // Pedagogical Tracing Templates
    document.querySelectorAll('[data-template]').forEach((btn: any) => {
      btn.addEventListener('click', (e: any) => {
        this.currentTemplate = e.target.dataset.template;
        this.restoreState(this.history[this.historyIndex]); // redraws with template
      });
    });

    // Color
    document.querySelectorAll('.color-option').forEach((opt: any) => {
      opt.addEventListener('click', (e: any) => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        e.target.classList.add('selected');
        this.color = e.target.dataset.color;
        (document.getElementById('hexInput') as HTMLInputElement).value = '';
        (document.getElementById('rgbInput') as HTMLInputElement).value = '';
      });
    });

    document.getElementById('hexInput')?.addEventListener('change', (e: any) => {
      const val = e.target.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        this.color = val;
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      }
    });

    document.getElementById('rgbInput')?.addEventListener('change', (e: any) => {
      const parts = e.target.value.match(/\d+/g);
      if (parts && parts.length === 3) {
        const r = parseInt(parts[0], 10), g = parseInt(parts[1], 10), b = parseInt(parts[2], 10);
        if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
          this.color = `rgb(${r},${g},${b})`;
          document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        }
      }
    });

    document.getElementById('eyedropperBtn')?.addEventListener('click', () => {
      this.isEyedropperActive = true;
      this.canvas.style.cursor = 'cell';
    });

    // Sliders
    document.getElementById('thicknessSlider')?.addEventListener('input', (e: any) => {
      this.thicknessMultiplier = parseFloat(e.target.value);
      document.getElementById('thicknessVal')!.textContent = this.thicknessMultiplier.toFixed(1) + 'x';
      e.target.setAttribute('aria-valuenow', e.target.value);
    });

    document.getElementById('distScaleSlider')?.addEventListener('input', (e: any) => {
      this.distScale = parseFloat(e.target.value);
      document.getElementById('distScaleVal')!.textContent = this.distScale.toFixed(1);
      e.target.setAttribute('aria-valuenow', e.target.value);
    });

    document.getElementById('densitySlider')?.addEventListener('input', (e: any) => {
      this.spacingDensity = parseFloat(e.target.value);
      document.getElementById('densityVal')!.textContent = this.spacingDensity.toFixed(1);
      e.target.setAttribute('aria-valuenow', e.target.value);
    });

    document.getElementById('leadingSlider')?.addEventListener('input', (e: any) => {
      this.leadingFactor = parseFloat(e.target.value);
      document.getElementById('leadingVal')!.textContent = this.leadingFactor.toFixed(1);
      e.target.setAttribute('aria-valuenow', e.target.value);
    });

    // Text & Speak
    document.getElementById('textInput')?.addEventListener('input', (e: any) => {
      this.text = e.target.value || 'a';
      this.updateTextArray();
    });

    document.getElementById('speakBtn')?.addEventListener('click', () => {
      this.speak();
    });

    document.getElementById('clearBtn')?.addEventListener('click', () => {
      this.clearCanvas();
    });

    document.getElementById('importBgInput')?.addEventListener('change', (e: any) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.loadImage(file);
      e.target.value = '';
    });

    document.getElementById('clearBgBtn')?.addEventListener('click', () => {
      this.bgImage = null;
      this.bgImageSrc = null;
      this.restoreState(this.history[this.historyIndex]);
    });

    document.getElementById('generateTextBtn')?.addEventListener('click', (e: any) => {
      const randomPhrase = this.generativePhrases[Math.floor(Math.random() * this.generativePhrases.length)];
      this.text = randomPhrase;
      (document.getElementById('textInput') as HTMLTextAreaElement).value = randomPhrase;
      this.updateTextArray();
      e.target.style.transform = 'scale(1.05)';
      setTimeout(() => e.target.style.transform = 'scale(1)', 150);
    });

    document.getElementById('tplOpacitySlider')?.addEventListener('input', (e: any) => {
      this.templateParams.opacity = parseFloat(e.target.value);
      document.getElementById('tplOpacityVal')!.textContent = Math.round(this.templateParams.opacity * 100) + '%';
      e.target.setAttribute('aria-valuenow', e.target.value);
      this.restoreState(this.history[this.historyIndex]);
    });

    document.getElementById('tplScaleSlider')?.addEventListener('input', (e: any) => {
      this.templateParams.scale = parseFloat(e.target.value);
      document.getElementById('tplScaleVal')!.textContent = this.templateParams.scale.toFixed(1) + 'x';
      e.target.setAttribute('aria-valuenow', e.target.value);
      this.restoreState(this.history[this.historyIndex]);
    });

    document.getElementById('tplOffsetXSlider')?.addEventListener('input', (e: any) => {
      this.templateParams.offsetX = parseFloat(e.target.value);
      document.getElementById('tplOffsetXVal')!.textContent = this.templateParams.offsetX + '%';
      e.target.setAttribute('aria-valuenow', e.target.value);
      this.restoreState(this.history[this.historyIndex]);
    });

    document.getElementById('tplOffsetYSlider')?.addEventListener('input', (e: any) => {
      this.templateParams.offsetY = parseFloat(e.target.value);
      document.getElementById('tplOffsetYVal')!.textContent = this.templateParams.offsetY + '%';
      e.target.setAttribute('aria-valuenow', e.target.value);
      this.restoreState(this.history[this.historyIndex]);
    });

    document.getElementById('exportPngBtn')?.addEventListener('click', () => this.exportPNG());
    document.getElementById('exportSvgBtn')?.addEventListener('click', () => this.exportSVG());
    document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
    document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());

    document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('modeToggle')?.addEventListener('click', () => this.toggleMode());

    // Reflection Modal
    const modal = document.getElementById('reflectionModal');
    document.getElementById('finishToggle')?.addEventListener('click', () => {
      if(modal) modal.style.display = 'flex';
      this.exportPNG(); // auto save on finish
    });

    document.getElementById('closeReflectionBtn')?.addEventListener('click', () => {
      if(modal) modal.style.display = 'none';
      const mText = (document.getElementById('reflectionInput') as HTMLInputElement).value;
      console.log("Bitácora Guardada:", mText);
      // Aqui integracion con supabase / backend.
    });

    document.querySelectorAll('.mood-btn').forEach((btn: any) => {
      btn.addEventListener('click', (e: any) => {
        document.querySelectorAll('.mood-btn').forEach((b:any) => b.style.transform = 'scale(1)');
        e.target.style.transform = 'scale(1.3)';
      });
    });

    // Shortcuts
    document.addEventListener('keydown', (e: any) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'g') { e.preventDefault(); this.exportPNG(); this.flashCommand(0); }
        else if (key === 's') { e.preventDefault(); this.exportSVG(); this.flashCommand(1); }
        else if (key === 'i') { e.preventDefault(); this.importImage(); this.flashCommand(2); }
        else if (key === 'z') { e.preventDefault(); this.undo(); this.flashCommand(3); }
        else if (key === 'y') { e.preventDefault(); this.redo(); this.flashCommand(4); }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Caligramas());
} else {
  new Caligramas();
}
