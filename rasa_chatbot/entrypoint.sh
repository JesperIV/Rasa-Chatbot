#!/bin/bash
set -e  # Exit on first error

echo "Removing old models..."
rm -rf /app/models/*

echo "Starting training..."
rasa train --out /app/models

# Ensure model training was successful
if ls /app/models/*.tar.gz 1> /dev/null 2>&1; then
    echo "Training completed successfully."
else
    echo "Training failed! No model found."
    exit 1
fi

echo "Starting Rasa server..."
exec rasa run --enable-api --cors "*" --debug --model /app/models
