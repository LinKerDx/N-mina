FROM alpine:3.20

RUN apk add --no-cache \
      bash \
      postgresql16-client \
      aws-cli \
      openssl \
      tzdata \
    && rm -rf /var/cache/apk/*

WORKDIR /scripts
COPY backup.sh restore.sh restore-drill.sh ./
RUN chmod 0555 ./*.sh

ENTRYPOINT ["/bin/bash"]
CMD ["-c", "while true; do /scripts/backup.sh || echo 'respaldo fallido'; sleep 86400; done"]
