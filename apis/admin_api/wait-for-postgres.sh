#!/bin/sh

echo "Waiting for Postgres container at $POSTGRES_HOST:$POSTGRES_PORT..."

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  sleep 0.5
done

echo "Postgres container is up and running! Starting admin API..."
exec "$@"
