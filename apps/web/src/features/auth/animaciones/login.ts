import anime from 'animejs';

export interface ReferenciasLogin {
  panelMarca: HTMLElement | null;
  formulario: HTMLElement | null;
  orbes: HTMLElement[];
  tarjetas: HTMLElement[];
  chips: HTMLElement[];
  contadores: HTMLElement[];
}

export function prefiereMenosMovimiento(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Coreografía de entrada del login:
 * marca → formulario → chips → tarjetas flotantes → contadores.
 * Devuelve las instancias para poder detenerlas al desmontar.
 */
export function animarEntradaLogin(referencias: ReferenciasLogin): anime.AnimeInstance[] {
  if (prefiereMenosMovimiento()) {
    return [];
  }

  const instancias: anime.AnimeInstance[] = [];
  const { panelMarca, formulario, orbes, tarjetas, chips, contadores } = referencias;

  if (panelMarca) {
    instancias.push(
      anime({
        targets: panelMarca,
        opacity: [0, 1],
        translateY: [26, 0],
        duration: 900,
        easing: 'easeOutExpo',
      }),
    );
  }

  if (formulario) {
    instancias.push(
      anime({
        targets: formulario,
        opacity: [0, 1],
        translateX: [24, 0],
        scale: [0.985, 1],
        duration: 800,
        delay: 160,
        easing: 'easeOutExpo',
      }),
    );
  }

  if (chips.length > 0) {
    instancias.push(
      anime({
        targets: chips,
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 600,
        delay: anime.stagger(80, { start: 380 }),
        easing: 'easeOutQuad',
      }),
    );
  }

  if (tarjetas.length > 0) {
    instancias.push(
      anime({
        targets: tarjetas,
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.94, 1],
        duration: 900,
        delay: anime.stagger(130, { start: 460 }),
        easing: 'easeOutExpo',
      }),
    );
    instancias.push(
      anime({
        targets: tarjetas,
        translateY: -8,
        direction: 'alternate',
        loop: true,
        duration: 3400,
        delay: anime.stagger(240),
        easing: 'easeInOutSine',
      }),
    );
  }

  if (orbes.length > 0) {
    instancias.push(
      anime({
        targets: orbes,
        translateX: () => anime.random(-32, 32),
        translateY: () => anime.random(-26, 26),
        scale: () => anime.random(0.9, 1.16),
        duration: () => anime.random(6500, 9000),
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
      }),
    );
  }

  instancias.push(...animarContadores(contadores));
  return instancias;
}

function animarContadores(nodos: HTMLElement[]): anime.AnimeInstance[] {
  return nodos.map((nodo) => {
    const destino = Number(nodo.dataset.contador ?? '0');
    const sufijo = nodo.dataset.sufijo ?? '';
    const estado = { valor: 0 };

    return anime({
      targets: estado,
      valor: destino,
      round: 1,
      duration: 1700,
      delay: 620,
      easing: 'easeOutExpo',
      update: () => {
        nodo.textContent = `${estado.valor.toLocaleString('es-MX')}${sufijo}`;
      },
    });
  });
}

/**
 * Parallax sutil del panel de marca según el puntero (solo escritorio).
 */
export function animarParallax(objetivo: HTMLElement | null, x: number, y: number): void {
  if (!objetivo || prefiereMenosMovimiento()) {
    return;
  }
  anime({
    targets: objetivo,
    translateX: x * 12,
    translateY: y * 8,
    duration: 900,
    easing: 'easeOutQuad',
  });
}

export function animarSalidaLogin(elemento: HTMLElement | null): Promise<void> {
  if (!elemento || prefiereMenosMovimiento()) {
    return Promise.resolve();
  }
  return new Promise((resolver) => {
    anime({
      targets: elemento,
      opacity: [1, 0],
      scale: [1, 0.97],
      translateY: [0, -10],
      duration: 380,
      easing: 'easeInQuad',
      complete: () => resolver(),
    });
  });
}

export function sacudir(elemento: HTMLElement | null): void {
  if (!elemento || prefiereMenosMovimiento()) {
    return;
  }
  anime({
    targets: elemento,
    translateX: [-10, 9, -6, 4, 0],
    duration: 420,
    easing: 'easeInOutQuad',
  });
}

export function detenerAnimaciones(instancias: anime.AnimeInstance[]): void {
  for (const instancia of instancias) {
    instancia.pause();
  }
}
