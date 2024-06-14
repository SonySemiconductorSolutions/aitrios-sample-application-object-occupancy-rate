# [Choice] Python version (use -bullseye variants on local arm64/Apple Silicon): 3, 3.10, 3.9, 3.8, 3.7, 3.6, 3-bullseye, 3.10-bullseye, 3.9-bullseye, 3.8-bullseye, 3.7-bullseye, 3.6-bullseye, 3-buster, 3.10-buster, 3.9-buster, 3.8-buster, 3.7-buster, 3.6-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:${VARIANT}
RUN apt-get update && apt-get install -y \
    linux-libc-dev \
    libncurses-dev \
    ncurses-base \
    ncurses-bin \
    libsystemd0 \
    libudev1 \
    libpq-dev \
    libx11-6 \
    libx11-data \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*
RUN npm uninstall -g pnpm
