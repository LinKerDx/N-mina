import { esquemaPago, type CentroCosto, type Proveedor } from '@nomina360/core';
import { Boton, Campo, MensajeError, Selector } from '@nomina360/ui';
import { useState, type FormEvent } from 'react';
import type { NuevoPago } from '@/features/administracion/api';
import { mensajeDeError } from '@/shared/lib/errores';

export function FormularioPago({
  centros,
  proveedores,
  onRegistrado,
  onCancelar,
}: {
  centros: CentroCosto[];
  proveedores: Proveedor[];
  onRegistrado: (pago: NuevoPago) => Promise<void>;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState({
    tipo: 'NOMINA' as NuevoPago['tipo'],
    centroCostoId: '',
    proveedorId: '',
    referenciaExterna: '',
    monto: '',
    fechaPago: new Date().toISOString().slice(0, 10),
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar(campo: keyof typeof valores, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = esquemaPago.safeParse({
      ...valores,
      monto: Number(valores.monto),
    });

    if (!resultado.success) {
      const nuevos: Record<string, string> = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0];
        if (typeof campo === 'string' && !nuevos[campo]) {
          nuevos[campo] = problema.message;
        }
      }
      setErrores(nuevos);
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      const datos = resultado.data;
      await onRegistrado({
        tipo: datos.tipo,
        centroCostoId: datos.centroCostoId,
        proveedorId: datos.proveedorId || undefined,
        monto: datos.monto,
        fechaPago: datos.fechaPago,
        referenciaExterna: datos.referenciaExterna || undefined,
      });
    } catch (excepcion) {
      setErrorGeneral(mensajeDeError(excepcion));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={manejarEnvio} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Tipo de pago"
          name="tipo"
          value={valores.tipo}
          onChange={(evento) => actualizar('tipo', evento.target.value)}
        >
          <option value="NOMINA">Nómina</option>
          <option value="PROVEEDOR">Proveedor</option>
          <option value="IMPUESTO">Impuesto</option>
        </Selector>

        <Selector
          etiqueta="Centro de costo"
          name="centroCostoId"
          value={valores.centroCostoId}
          onChange={(evento) => actualizar('centroCostoId', evento.target.value)}
          error={errores.centroCostoId}
        >
          <option value="">Selecciona un centro</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>
              {centro.codigo} · {centro.nombre}
            </option>
          ))}
        </Selector>

        {valores.tipo === 'PROVEEDOR' ? (
          <Selector
            etiqueta="Proveedor"
            name="proveedorId"
            value={valores.proveedorId}
            onChange={(evento) => actualizar('proveedorId', evento.target.value)}
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.razonSocial}
              </option>
            ))}
          </Selector>
        ) : null}

        <Campo
          etiqueta="Monto (MXN)"
          name="monto"
          type="number"
          min="0.01"
          step="0.01"
          value={valores.monto}
          onChange={(evento) => actualizar('monto', evento.target.value)}
          error={errores.monto}
        />

        <Campo
          etiqueta="Fecha de pago"
          name="fechaPago"
          type="date"
          value={valores.fechaPago}
          onChange={(evento) => actualizar('fechaPago', evento.target.value)}
          error={errores.fechaPago}
        />

        <Campo
          etiqueta="Referencia externa"
          name="referenciaExterna"
          placeholder="Factura, periodo o transferencia"
          value={valores.referenciaExterna}
          onChange={(evento) => actualizar('referenciaExterna', evento.target.value)}
          error={errores.referenciaExterna}
        />
      </div>

      {errorGeneral ? <MensajeError>{errorGeneral}</MensajeError> : null}

      <div className="flex justify-end gap-3 pt-2">
        <Boton variante="secundario" type="button" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          Registrar pago
        </Boton>
      </div>
    </form>
  );
}
