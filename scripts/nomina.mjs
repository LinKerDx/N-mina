#!/usr/bin/env node
/**
 * Nómina360 · CLI de operación local
 *
 *   node scripts/nomina.mjs up        Levanta TODO con Docker (recomendado)
 *   node scripts/nomina.mjs dev       Bases en Docker + Java y Vite en local
 *   node scripts/nomina.mjs check     Ejecuta todas las verificaciones
 *   node scripts/nomina.mjs doctor    Revisa requisitos del entorno
 *   node scripts/nomina.mjs status    Estado de los contenedores
 *   node scripts/nomina.mjs logs      Sigue los logs del stack
 *   node scripts/nomina.mjs down      Detiene el stack (--datos borra volúmenes)
 *   node scripts/nomina.mjs backup    Respaldo cifrado de las 4 bases
 *
 * No usa dependencias externas: sólo Node 22+ y Docker.
 */
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ES_WINDOWS = process.platform === 'win32';
const LOGS = path.join(RAIZ, 'logs');
const ARCHIVO_PIDS = path.join(RAIZ, '.dev-pids.json');

const URL_WEB = 'http://localhost:8088/healthz';
const PUERTOS_INFRA = [5433, 5434, 5435, 5436, 5672];

const VERDE = '\u001b[32m';
const ROJO = '\u001b[31m';
const AMARILLO = '\u001b[33m';
const CIAN = '\u001b[36m';
const GRIS = '\u001b[90m';
const RESET = '\u001b[0m';

const ok = (texto) => console.log(`${VERDE}✓${RESET} ${texto}`);
const aviso = (texto) => console.log(`${AMARILLO}!${RESET} ${texto}`);
const error = (texto) => console.error(`${ROJO}✗${RESET} ${texto}`);
const info = (texto) => console.log(`${CIAN}→${RESET} ${texto}`);
const tenue = (texto) => console.log(`${GRIS}${texto}${RESET}`);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const COMANDOS_CMD = new Set(['mvn', 'pnpm', 'npm']);
const COMSPEC = process.env.ComSpec ?? 'cmd.exe';

function construirProceso(comando, args, opciones = {}) {
  const stdio = opciones.stdio ?? (opciones.silencioso ? 'ignore' : 'inherit');
  const base = {
    cwd: opciones.cwd ?? RAIZ,
    env: { ...process.env, ...opciones.env },
    stdio,
    detached: opciones.detached ?? false,
    windowsHide: true,
  };
  // En Windows los .cmd (mvn, pnpm) requieren cmd.exe; sin shell:true para
  // evitar el warning DEP0190 y el riesgo de inyección de argumentos.
  if (ES_WINDOWS && COMANDOS_CMD.has(comando)) {
    return { bin: COMSPEC, argv: ['/d', '/s', '/c', comando, ...args], base };
  }
  return { bin: comando, argv: args, base };
}

function ejecutar(comando, args = [], opciones = {}) {
  const { bin, argv, base } = construirProceso(comando, args, opciones);
  return spawnSync(bin, argv, base).status ?? 1;
}

function lanzar(comando, args, opciones = {}) {
  const { bin, argv, base } = construirProceso(comando, args, opciones);
  return spawn(bin, argv, base);
}

function disponible(comando, args = ['--version'], env = {}) {
  return ejecutar(comando, args, { silencioso: true, env }) === 0;
}

/**
 * Permite usar un repositorio Maven local al proyecto cuando ~/.m2 no es
 * escribible (sandboxes, runners con HOME restringido):
 *   NOMINA_MAVEN_REPO=./.m2repo pnpm check
 */
function argumentosMaven() {
  const repo = process.env.NOMINA_MAVEN_REPO;
  return repo ? [`-Dmaven.repo.local=${repo}`] : [];
}

function dormir(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function esperarHttp(url, { intentos = 120, intervalo = 2000, etiqueta = url, silencioso = false } = {}) {
  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      const respuesta = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (respuesta.ok) {
        return true;
      }
    } catch {
      // el servicio todavía no escucha; se reintenta
    }
    if (!silencioso && intento % 5 === 0) {
      tenue(`   esperando ${etiqueta}… (${Math.round((intento * intervalo) / 1000)}s)`);
    }
    await dormir(intervalo);
  }
  return false;
}

const SERVICIOS_HTTP = [
  ['auth-service', 'http://localhost:8081/actuator/health'],
  ['rh-service', 'http://localhost:8082/actuator/health'],
  ['produccion-service', 'http://localhost:8083/actuator/health'],
  ['administracion-service', 'http://localhost:8084/actuator/health'],
  ['api-gateway', 'http://localhost:8080/actuator/health'],
];

/**
 * Espera a que TODOS los servicios respondan salud. El gateway puede estar
 * arriba mientras auth todavía migra la base, así que no basta con uno.
 */
async function esperarServicios(intentos = 150) {
  const resultados = await Promise.all(
    SERVICIOS_HTTP.map(async ([nombre, url]) => ({
      nombre,
      listo: await esperarHttp(url, { etiqueta: nombre, intentos, silencioso: true }),
    })),
  );
  return resultados.filter((resultado) => !resultado.listo).map((resultado) => resultado.nombre);
}

function puertoAbierto(puerto, host = '127.0.0.1') {
  return new Promise((resolver) => {
    const socket = net.connect({ port: puerto, host });
    const cerrar = (valor) => {
      socket.destroy();
      resolver(valor);
    };
    socket.setTimeout(1200);
    socket.once('connect', () => cerrar(true));
    socket.once('timeout', () => cerrar(false));
    socket.once('error', () => cerrar(false));
  });
}

async function esperarPuertos(puertos, { intentos = 60, intervalo = 1500 } = {}) {
  for (let intento = 0; intento < intentos; intento += 1) {
    const estados = await Promise.all(puertos.map((puerto) => puertoAbierto(puerto)));
    if (estados.every(Boolean)) {
      return true;
    }
    await dormir(intervalo);
  }
  return false;
}

function verificarDocker() {
  if (!disponible('docker', ['--version'])) {
    error('Docker no está instalado o no está en el PATH.');
    tenue('Instala Docker Desktop: https://www.docker.com/products/docker-desktop/');
    return false;
  }
  if (!disponible('docker', ['info'])) {
    error('Docker está instalado pero el daemon no responde.');
    tenue('Abre Docker Desktop, espera a que diga "Engine running" y vuelve a intentar.');
    return false;
  }
  return true;
}

function crearEnvSiFalta() {
  const destino = path.join(RAIZ, '.env');
  if (existsSync(destino)) {
    ok('.env ya existe');
    return;
  }
  const ejemplo = path.join(RAIZ, '.env.example');
  if (!existsSync(ejemplo)) {
    aviso('No existe .env.example: se omite la creación de .env');
    return;
  }
  const secreto = randomBytes(48).toString('base64url');
  const frase = randomBytes(32).toString('base64url');
  const contenido = readFileSync(ejemplo, 'utf8')
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secreto}`)
    .replace(/^BACKUP_ENCRYPTION_PASSPHRASE=.*$/m, `BACKUP_ENCRYPTION_PASSPHRASE=${frase}`);
  writeFileSync(destino, contenido, { encoding: 'utf8' });
  ok('.env creado con JWT_SECRET y passphrase de respaldo aleatorios');
  tenue('  Ese archivo contiene secretos: no lo comitees.');
}

function detectarJava() {
  const valido = (ruta) => {
    const bin = path.join(ruta, 'bin', ES_WINDOWS ? 'java.exe' : 'java');
    if (!existsSync(bin)) {
      return null;
    }
    const release = path.join(ruta, 'release');
    if (!existsSync(release)) {
      return ruta;
    }
    const texto = readFileSync(release, 'utf8');
    const coincidencia = /JAVA_VERSION="(\d+)/.exec(texto);
    return { ruta, version: coincidencia ? Number(coincidencia[1]) : 0 };
  };

  const actual = valido(process.env.JAVA_HOME ?? '');
  if (actual && typeof actual === 'object' && actual.version >= 21 && actual.version <= 24) {
    return actual;
  }

  const bases = ES_WINDOWS
    ? ['C:/Program Files/Java', 'C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Microsoft']
    : ['/usr/lib/jvm', '/Library/Java/JavaVirtualMachines'];
  const candidatos = [];
  for (const base of bases) {
    if (!existsSync(base)) {
      continue;
    }
    for (const nombre of readdirSync(base)) {
      const resultado = valido(path.join(base, nombre));
      if (resultado && typeof resultado === 'object' && resultado.version >= 21 && resultado.version <= 24) {
        candidatos.push(resultado);
      }
    }
  }
  candidatos.sort((a, b) => b.version - a.version);
  return candidatos[0] ?? null;
}

function reportarVersiones() {
  console.log('');
  console.log(`  ${CIAN}Nómina360 · verificación del entorno${RESET}`);
  console.log('');

  const nodo = Number(process.versions.node.split('.')[0]);
  nodo >= 22 ? ok(`Node ${process.version}`) : error(`Node ${process.version} (se requiere 22+)`);

  disponible('pnpm') ? ok('pnpm disponible') : error('pnpm no encontrado (corepack enable)');
  disponible('docker', ['--version']) ? ok('Docker CLI disponible') : error('Docker CLI no encontrado');
  disponible('docker', ['info'])
    ? ok('Docker daemon en ejecución')
    : aviso('Docker daemon detenido (arráncalo para usar "up"/"dev")');

  const java = detectarJava();
  if (java) {
    ok(`JDK ${java.version} en ${java.ruta}`);
  } else {
    error('No se encontró un JDK 21–24 (define JAVA_HOME)');
  }

  disponible('mvn', ['-v'], java ? { JAVA_HOME: java.ruta } : {})
    ? ok('Maven disponible')
    : aviso('Maven no encontrado en PATH (sólo necesario para "dev" y "check --backend")');

  existsSync(path.join(RAIZ, '.env'))
    ? ok('.env presente')
    : aviso('.env no existe (se crea al ejecutar "up" o "dev")');

  console.log('');
}

function imprimirAccesos() {
  console.log('');
  console.log(`  ${VERDE}Nómina360 está arriba${RESET}`);
  console.log('');
  console.log('  Web .............. http://localhost:8088');
  console.log('  API Gateway ...... http://localhost:8080');
  console.log('  Swagger RH ....... http://localhost:8082/swagger-ui.html');
  console.log('  Swagger Admin .... http://localhost:8084/swagger-ui.html');
  console.log('  RabbitMQ ......... http://localhost:15672  (nomina / nomina_dev_pass)');
  console.log('');
  console.log('  Usuarios demo (contraseña Nomina360!):');
  console.log('    admin@nomina360.mx           Administrador');
  console.log('    rh@nomina360.mx              Recursos Humanos');
  console.log('    produccion@nomina360.mx      Producción');
  console.log('    admin.finanzas@nomina360.mx  Administración');
  console.log('');
  console.log('  Detener:  node scripts/nomina.mjs down');
  console.log('  Logs:     node scripts/nomina.mjs logs');
  console.log('');
}

function detenerArbol(pid) {
  if (!pid) {
    return;
  }
  if (ES_WINDOWS) {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      // el proceso ya terminó
    }
  }
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------

async function comandoUp() {
  crearEnvSiFalta();
  if (!verificarDocker()) {
    process.exitCode = 1;
    return;
  }
  info('Construyendo imágenes y levantando contenedores (la primera vez tarda varios minutos)…');
  const estado = ejecutar('docker', ['compose', 'up', '--build', '-d']);
  if (estado !== 0) {
    error('docker compose up falló. Revisa la salida anterior.');
    process.exitCode = 1;
    return;
  }
  info('Esperando a que los 5 servicios y la web respondan (la primera vez tarda ~40 s)…');
  const pendientes = await esperarServicios();
  if (pendientes.length > 0) {
    error(`Sin respuesta: ${pendientes.join(', ')}`);
    tenue('Revisa: node scripts/nomina.mjs logs <servicio>');
    process.exitCode = 1;
    return;
  }
  const webOk = await esperarHttp(URL_WEB, { etiqueta: 'web :8088', intentos: 30 });
  if (!webOk) {
    aviso('La web aún no responde, pero el API ya está arriba.');
  }
  imprimirAccesos();
}

function comandoDown(flags) {
  const borrarDatos = flags.has('--datos') || flags.has('-v');
  const args = ['compose', 'down'];
  if (borrarDatos) {
    args.push('-v');
    aviso('Se eliminarán también los volúmenes: se pierden los datos de desarrollo.');
  }
  const estado = ejecutar('docker', args);
  if (estado !== 0) {
    process.exitCode = estado;
    return;
  }
  ok(borrarDatos ? 'Stack detenido y datos borrados' : 'Stack detenido (los datos se conservan)');
}

async function comandoDev(flags) {
  crearEnvSiFalta();
  if (!verificarDocker()) {
    process.exitCode = 1;
    return;
  }

  info('Levantando sólo la infraestructura (4 PostgreSQL + RabbitMQ)…');
  const estado = ejecutar('docker', [
    'compose',
    'up',
    '-d',
    'db-auth',
    'db-rh',
    'db-produccion',
    'db-admin',
    'rabbitmq',
  ]);
  if (estado !== 0) {
    error('No se pudo levantar la infraestructura.');
    process.exitCode = 1;
    return;
  }

  info('Esperando puertos 5433–5436 y 5672…');
  if (!(await esperarPuertos(PUERTOS_INFRA))) {
    error('Las bases no abrieron los puertos a tiempo. Revisa "docker compose ps".');
    process.exitCode = 1;
    return;
  }
  ok('Infraestructura lista');

  const java = detectarJava();
  if (!java) {
    error('No se encontró un JDK 21–24. Instálalo o define JAVA_HOME y vuelve a intentar.');
    tenue('Con Docker puedes usar "node scripts/nomina.mjs up" sin JDK local.');
    process.exitCode = 1;
    return;
  }
  ok(`Usando JDK ${java.version}`);

  if (flags.has('--solo-infra')) {
    console.log('');
    ok('Infraestructura arriba (--solo-infra).');
    tenue('Ejecuta los servicios con: mvn -f backend/pom.xml -pl services/rh-service spring-boot:run');
    return;
  }

  mkdirSync(LOGS, { recursive: true });
  const servicios = ['auth-service', 'rh-service', 'produccion-service', 'administracion-service', 'api-gateway'];
  const hijos = [];

  info('Arrancando microservicios en segundo plano (logs en ./logs)…');
  for (const servicio of servicios) {
    const salida = openSync(path.join(LOGS, `${servicio}.log`), 'a');
    const hijo = lanzar(
      'mvn',
      ['-f', 'backend/pom.xml', '-pl', `services/${servicio}`, ...argumentosMaven(), 'spring-boot:run'],
      {
        env: { JAVA_HOME: java.ruta },
        stdio: ['ignore', salida, salida],
        detached: !ES_WINDOWS,
      },
    );
    hijos.push({ servicio, pid: hijo.pid });
    ok(`${servicio} (pid ${hijo.pid}) → logs/${servicio}.log`);
  }
  writeFileSync(ARCHIVO_PIDS, JSON.stringify(hijos, null, 2), 'utf8');

  info('Esperando a los 5 servicios (primera compilación ~1 min)…');
  const pendientes = await esperarServicios(120);
  if (pendientes.length > 0) {
    error(`Sin respuesta: ${pendientes.join(', ')}. Revisa logs/<servicio>.log`);
  } else {
    ok('Backend arriba en http://localhost:8080');
  }

  const detenerTodo = () => {
    info('Deteniendo microservicios…');
    for (const { pid } of hijos) {
      detenerArbol(pid);
    }
    if (existsSync(ARCHIVO_PIDS)) {
      writeFileSync(ARCHIVO_PIDS, '[]', 'utf8');
    }
  };
  process.on('SIGINT', () => {
    detenerTodo();
    process.exit(0);
  });

  console.log('');
  info('Iniciando Vite en primer plano (Ctrl+C detiene también los servicios)…');
  console.log('');
  const web = lanzar('pnpm', ['--filter', '@nomina360/web', 'dev'], { stdio: 'inherit' });
  const codigo = await new Promise((resolver) => web.on('exit', (valor) => resolver(valor ?? 0)));
  detenerTodo();
  process.exitCode = codigo;
}

function comandoCheck(flags) {
  const rapido = flags.has('--rapido');
  const soloBackend = flags.has('--backend');
  const soloFrontend = flags.has('--frontend');
  const resultados = [];

  const anotar = (nombre, estado) => {
    resultados.push({ nombre, estado });
    estado === 0 ? ok(nombre) : error(nombre);
  };

  if (!soloFrontend) {
    const java = detectarJava();
    if (!java) {
      error('No hay JDK 21–24 para compilar el backend');
      anotar('backend: mvn verify', 1);
    } else {
      info(`Backend con JDK ${java.version}`);
      anotar(
        'backend: mvn verify',
        ejecutar('mvn', ['-f', 'backend/pom.xml', '-B', '-ntp', ...argumentosMaven(), 'verify'], {
          env: { JAVA_HOME: java.ruta },
        }),
      );
    }
  }

  if (!soloBackend) {
    anotar('frontend: lint', ejecutar('pnpm', ['lint']));
    anotar('frontend: typecheck', ejecutar('pnpm', ['typecheck']));
    anotar('frontend: test', ejecutar('pnpm', ['test']));
    if (!rapido) {
      anotar('frontend: build', ejecutar('pnpm', ['build']));
    } else {
      tenue('build omitido (--rapido)');
    }
  }

  console.log('');
  const fallos = resultados.filter((r) => r.estado !== 0);
  if (fallos.length === 0) {
    ok(`Todo en verde (${resultados.length} verificaciones)`);
  } else {
    error(`${fallos.length} verificación(es) fallaron: ${fallos.map((f) => f.nombre).join(', ')}`);
    process.exitCode = 1;
  }
}

function comandoStatus() {
  if (!verificarDocker()) {
    process.exitCode = 1;
    return;
  }
  ejecutar('docker', ['compose', 'ps']);
}

function comandoLogs(resto) {
  if (!verificarDocker()) {
    process.exitCode = 1;
    return;
  }
  const servicio = resto.find((arg) => !arg.startsWith('-'));
  const args = ['compose', 'logs', '-f', '--tail', '120'];
  if (servicio) {
    args.push(servicio);
  }
  ejecutar('docker', args);
}

function comandoBackup() {
  if (!verificarDocker()) {
    process.exitCode = 1;
    return;
  }
  crearEnvSiFalta();
  aviso('El respaldo requiere BACKUP_S3_BUCKET y credenciales válidas en .env');
  const estado = ejecutar('docker', [
    'compose',
    '-f',
    'docker-compose.yml',
    '-f',
    'infra/backup/docker-compose.backup.yml',
    'run',
    '--rm',
    '--build',
    'backup',
    '/scripts/backup.sh',
  ]);
  if (estado !== 0) {
    error('El respaldo falló. Revisa la salida y docs/RESPALDOS.md');
    process.exitCode = 1;
    return;
  }
  ok('Respaldo terminado. Objetos en S3 bajo postgres/<área>/<timestamp>/');
}

function comandoDoctor() {
  reportarVersiones();
  const java = detectarJava();
  const dockerOk = disponible('docker', ['info']);
  if (!java && !dockerOk) {
    process.exitCode = 1;
  }
}

function comandoAyuda() {
  console.log('');
  console.log(`  ${CIAN}Nómina360 · CLI${RESET}`);
  console.log('');
  console.log('  Uso: node scripts/nomina.mjs <comando> [opciones]');
  console.log('');
  console.log('  Comandos:');
  console.log('    up              Levanta todo con Docker (web, API y 4 bases)');
  console.log('    dev             Infra en Docker + microservicios y Vite en local');
  console.log('    check           Ejecuta mvn verify, lint, typecheck, test y build');
  console.log('    doctor          Revisa Node, pnpm, Docker, JDK y Maven');
  console.log('    status          Estado de los contenedores');
  console.log('    logs [servicio] Sigue los logs (opcional: rh-service, web, …)');
  console.log('    down [--datos]  Detiene el stack (--datos borra los volúmenes)');
  console.log('    backup          Respaldo cifrado de las cuatro bases a S3');
  console.log('');
  console.log('  Opciones de check:  --rapido  --backend  --frontend');
  console.log('  Opciones de dev:    --solo-infra');
  console.log('');
  console.log('  Atajos con pnpm:    pnpm up | pnpm dev:local | pnpm check | pnpm doctor');
  console.log('');
}

// ---------------------------------------------------------------------------
// Punto de entrada
// ---------------------------------------------------------------------------

const argumentos = process.argv.slice(2);
const comando = argumentos[0] ?? 'ayuda';
const resto = argumentos.slice(1);
const flags = new Set(resto.filter((arg) => arg.startsWith('-')));

const COMANDOS = {
  up: comandoUp,
  dev: () => comandoDev(flags),
  check: () => comandoCheck(flags),
  doctor: comandoDoctor,
  status: comandoStatus,
  logs: () => comandoLogs(resto),
  down: () => comandoDown(flags),
  backup: comandoBackup,
  ayuda: comandoAyuda,
  help: comandoAyuda,
};

const accion = COMANDOS[comando];
if (!accion) {
  error(`Comando desconocido: ${comando}`);
  comandoAyuda();
  process.exitCode = 1;
} else {
  await accion();
}
