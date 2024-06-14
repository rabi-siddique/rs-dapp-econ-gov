# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 synthetixio/docker-e2e:18.16-ubuntu as base

# Recent e2e test failures for all dApps were due to inconsistent network configurations in the CI setup.
# GitHub Actions infrastructure can resolve localhost inconsistently (IPv4 or IPv6).
# To address this, we set NODE_OPTIONS=--dns-result-order=ipv4first to prioritize IPv4 DNS resolution.
# For more details, see: https://github.com/cypress-io/cypress/issues/27962
ENV NODE_OPTIONS=--dns-result-order=ipv4first

RUN mkdir /app
WORKDIR /app

RUN apt update && apt install -y nginx

COPY tests/e2e/nginx.conf /etc/nginx/sites-available/default

COPY . .

RUN yarn install --frozen-lockfile
