# HOA Manager - Docker Services

This directory contains Docker configuration for each infrastructure service.

## Structure

```
docker/
└── postgres/       # PostgreSQL configuration (custom init scripts, etc.)
```

## Adding a new service

1. Create a new subfolder `docker/<service-name>/`.
2. Add a `Dockerfile` or any configuration files (init scripts, custom configs, etc.).
3. Reference the service in the root `docker-compose.yml`.
