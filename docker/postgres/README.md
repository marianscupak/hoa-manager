# PostgreSQL

This directory holds PostgreSQL-specific Docker assets.

## Custom Init Scripts

Place `.sql` files here and mount them to `/docker-entrypoint-initdb.d/` in `docker-compose.yml`
to automatically run them when the container is first created.

Example:

```yaml
volumes:
    - ./docker/postgres/init:/docker-entrypoint-initdb.d
```
