## Qué cambia

<!-- Describe el cambio y el área afectada: auth, rh, produccion, administracion, gateway, web -->

## Checklist

- [ ] `mvn -f backend/pom.xml verify` pasa
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pasa
- [ ] Si hay migraciones nuevas, son aditivas (no se edita una migración ya aplicada)
- [ ] Si cambia un contrato de API, actualicé `docs/API.md` y `packages/core/src/tipos.ts`
- [ ] Si cambia el esquema o los datos, verifiqué la estrategia de respaldo/restauración
- [ ] No incluí secretos ni archivos `.env`

## Evidencia

<!-- Capturas, salida de pruebas o pasos para reproducir -->
