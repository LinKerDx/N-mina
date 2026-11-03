import { describe, expect, it } from 'vitest';
import { construirQuery } from '../http';
import { aFechaLocal, iniciales, moneda, porcentaje, redondear, sumar } from '../formato';

describe('formato', () => {
  it('formatea importes en pesos mexicanos', () => {
    expect(moneda(15000)).toContain('15,000.00');
    expect(moneda(null)).toBe('—');
  });

  it('convierte fechas ISO a fecha local sin corrimiento de zona', () => {
    const valor = aFechaLocal('2026-01-15');
    expect(valor?.getDate()).toBe(15);
    expect(valor?.getMonth()).toBe(0);
    expect(valor?.getFullYear()).toBe(2026);
  });

  it('redondea a dos decimales y suma sin errores de punto flotante', () => {
    expect(redondear(0.1 + 0.2)).toBe(0.3);
    expect(sumar([0.1, 0.2, 0.3])).toBe(0.6);
    expect(porcentaje(62.5)).toBe('62.5%');
  });

  it('calcula iniciales para el avatar', () => {
    expect(iniciales('Ana López García')).toBe('AL');
  });
});

describe('construirQuery', () => {
  it('omite valores vacios', () => {
    expect(construirQuery({ q: 'ana', estatus: '', page: 0, size: undefined })).toBe('?q=ana&page=0');
  });

  it('devuelve cadena vacia sin parametros', () => {
    expect(construirQuery({})).toBe('');
  });
});
