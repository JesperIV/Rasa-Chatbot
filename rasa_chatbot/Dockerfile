FROM rasa/rasa:latest

WORKDIR /app

USER root

# Copy Rasa project files
COPY . /app

ENV PYTHONUNBUFFERED=1

# Install Python dependencies, then install Spacy and the required Dutch language model (large, about 541 MB)
RUN pip install -r requirements.txt && \
    python -m spacy download nl_core_news_lg --timeout 360

# Copy the entrypoint script into the container
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint script to run both Rasa and actions
ENTRYPOINT ["/app/entrypoint.sh"]
