# syntax=docker/dockerfile:1
# Imagen multi-stage compartida por los 5 microservicios.
# Uso: docker build -f backend/Dockerfile --build-arg SERVICE=rh-service .
FROM maven:3.9-eclipse-temurin-21 AS build

ARG SERVICE
WORKDIR /workspace

# POMs primero para aprovechar la cache de capas
COPY backend/pom.xml backend/pom.xml
COPY backend/libs/common-jwt/pom.xml backend/libs/common-jwt/pom.xml
COPY backend/libs/common-web/pom.xml backend/libs/common-web/pom.xml
COPY backend/libs/common-security/pom.xml backend/libs/common-security/pom.xml
COPY backend/services/api-gateway/pom.xml backend/services/api-gateway/pom.xml
COPY backend/services/auth-service/pom.xml backend/services/auth-service/pom.xml
COPY backend/services/rh-service/pom.xml backend/services/rh-service/pom.xml
COPY backend/services/produccion-service/pom.xml backend/services/produccion-service/pom.xml
COPY backend/services/administracion-service/pom.xml backend/services/administracion-service/pom.xml

RUN --mount=type=cache,id=maven,sharing=locked,target=/root/.m2 \
    mvn -B -ntp -f backend/pom.xml -pl services/${SERVICE} -am dependency:go-offline -DskipTests || true

COPY backend/libs backend/libs
COPY backend/services backend/services

RUN --mount=type=cache,id=maven,sharing=locked,target=/root/.m2 \
    mvn -B -ntp -f backend/pom.xml -pl services/${SERVICE} -am -DskipTests package

FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache wget \
    && addgroup -S nomina \
    && adduser -S nomina -G nomina

ARG SERVICE
WORKDIR /app
COPY --from=build /workspace/backend/services/${SERVICE}/target/${SERVICE}.jar /app/app.jar
RUN chown -R nomina:nomina /app
USER nomina

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${SERVER_PORT:-8080}/actuator/health" || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
