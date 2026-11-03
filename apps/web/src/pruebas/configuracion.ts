import '@testing-library/jest-dom/vitest';

// jsdom no implementa matchMedia: el login lo consulta para respetar
// "prefers-reduced-motion" y así omitir animaciones en las pruebas.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((consulta: string) => ({
    matches: true,
    media: consulta,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
