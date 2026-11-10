import { z } from 'zod';

export const esquemaLogin = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Escribe un correo válido')
    .max(160, 'El correo es demasiado largo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;

export const esquemaEmpleado = z.object({
  numeroEmpleado: z.string().min(1, 'El número de empleado es obligatorio').max(20),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(80),
  apellidoPaterno: z.string().min(1, 'El apellido paterno es obligatorio').max(80),
  apellidoMaterno: z.string().max(80).optional().or(z.literal('')),
  curp: z.string().length(18, 'La CURP debe tener 18 caracteres').optional().or(z.literal('')),
  rfc: z
    .string()
    .min(12, 'El RFC debe tener al menos 12 caracteres')
    .max(13, 'El RFC debe tener 13 caracteres')
    .optional()
    .or(z.literal('')),
  nss: z.string().max(15, 'El NSS no debe exceder 15 caracteres').optional().or(z.literal('')),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z
    .string()
    .max(20, 'El teléfono no debe exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  departamentoId: z.string().uuid('Selecciona un departamento').optional().or(z.literal('')),
  puestoId: z.string().uuid('Selecciona un puesto').optional().or(z.literal('')),
  tipoContrato: z.enum(['INDEFINIDO', 'TEMPORAL', 'HONORARIOS', 'PRACTICAS']),
  fechaIngreso: z.string().min(1, 'La fecha de ingreso es obligatoria'),
  salarioDiario: z
    .number({ invalid_type_error: 'Escribe un salario válido' })
    .positive('El salario debe ser mayor a cero')
    .max(100000, 'El salario excede el límite permitido'),
});

export type DatosEmpleado = z.infer<typeof esquemaEmpleado>;

export const esquemaPeriodo = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(80),
    tipo: z.enum(['MENSUAL', 'QUINCENAL', 'CATORCENAL', 'SEMANAL']),
    fechaInicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
    fechaFin: z.string().min(1, 'La fecha de fin es obligatoria'),
    fechaPago: z.string().min(1, 'La fecha de pago es obligatoria'),
  })
  .refine((datos) => datos.fechaFin >= datos.fechaInicio, {
    message: 'La fecha de fin no puede ser anterior al inicio',
    path: ['fechaFin'],
  });

export type DatosPeriodo = z.infer<typeof esquemaPeriodo>;

export const esquemaIncidencia = z.object({
  empleadoId: z.string().uuid('Selecciona un empleado'),
  tipo: z.enum([
    'FALTA',
    'RETARDO',
    'HORAS_EXTRA',
    'VACACIONES',
    'INCAPACIDAD',
    'PERMISO',
    'BONO_PRODUCTIVIDAD',
  ]),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  cantidad: z
    .number({ invalid_type_error: 'Escribe una cantidad válida' })
    .positive('La cantidad debe ser mayor a cero'),
  motivo: z.string().max(200).optional().or(z.literal('')),
});

export type DatosIncidencia = z.infer<typeof esquemaIncidencia>;

export const esquemaPago = z.object({
  tipo: z.enum(['NOMINA', 'PROVEEDOR', 'IMPUESTO']),
  centroCostoId: z.string().uuid('Selecciona un centro de costo'),
  proveedorId: z.string().uuid().optional().or(z.literal('')),
  monto: z
    .number({ invalid_type_error: 'Escribe un monto válido' })
    .positive('El monto debe ser mayor a cero'),
  fechaPago: z.string().min(1, 'La fecha de pago es obligatoria'),
  referenciaExterna: z.string().max(80).optional().or(z.literal('')),
});

export type DatosPago = z.infer<typeof esquemaPago>;
