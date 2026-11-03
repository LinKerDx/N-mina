import { describe, expect, it } from 'vitest';
import { esquemaLogin } from '@nomina360/core';

describe('esquema de login', () => {
  it('acepta credenciales validas', () => {
    const resultado = esquemaLogin.safeParse({
      email: 'rh@nomina360.mx',
      password: 'Nomina360!',
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza correos invalidos', () => {
    const resultado = esquemaLogin.safeParse({ email: 'no-es-correo', password: 'Nomina360!' });
    expect(resultado.success).toBe(false);
  });

  it('exige una contrasena de al menos 8 caracteres', () => {
    const resultado = esquemaLogin.safeParse({ email: 'rh@nomina360.mx', password: 'corta' });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain('8');
    }
  });
});
