# syntax=docker/dockerfile:1.7
#
# Build from the SDKWork workspace root (parent of sdkwork-rtc):
#   docker build -f sdkwork-rtc/deployments/docker/Dockerfile -t ghcr.io/sdkwork/rtc-standalone-gateway:latest .

FROM rust:1-bookworm AS builder
WORKDIR /src/sdkwork-rtc
COPY sdkwork-rtc/ ./
COPY sdkwork-database/ ../sdkwork-database/
COPY sdkwork-web-framework/ ../sdkwork-web-framework/
COPY sdkwork-drive/ ../sdkwork-drive/
COPY sdkwork-appbase/ ../sdkwork-appbase/
COPY sdkwork-utils/ ../sdkwork-utils/
COPY sdkwork-id/ ../sdkwork-id/
RUN cargo build --release -p sdkwork-rtc-standalone-gateway

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libssl3 wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/sdkwork/rtc
RUN mkdir -p /opt/sdkwork/rtc/bin /etc/sdkwork/rtc

COPY --from=builder /src/sdkwork-rtc/target/release/sdkwork-rtc-standalone-gateway /opt/sdkwork/rtc/bin/sdkwork-rtc-standalone-gateway
COPY --from=builder /src/sdkwork-rtc/target/release/sdkwork-rtc-reconcile /opt/sdkwork/rtc/bin/sdkwork-rtc-reconcile
COPY sdkwork-rtc/deployments/templates/server.env.example /etc/sdkwork/rtc/server.env.example

ENV SDKWORK_RTC_ENVIRONMENT=production \
    SDKWORK_RTC_DEPLOYMENT_PROFILE=cloud \
    SDKWORK_RTC_SERVICE_LAYOUT=split-services \
    SDKWORK_RTC_APPLICATION_PUBLIC_INGRESS_BIND=0.0.0.0:18088

EXPOSE 18088

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:18088/healthz || exit 1

ENTRYPOINT ["/opt/sdkwork/rtc/bin/sdkwork-rtc-standalone-gateway"]
