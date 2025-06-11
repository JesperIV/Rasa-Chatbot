FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y netcat-openbsd

COPY admin_api/wait-for-postgres.sh /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh

COPY admin_api/app ./app

COPY shared ./shared

COPY shared/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

CMD ["/wait-for-postgres.sh", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5005"]
