FROM python:3.10-slim

RUN apt-get update && apt-get install -y netcat-openbsd

WORKDIR /app

COPY user_api/wait-for-postgres.sh /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh

COPY user_api/app ./app

COPY /shared ./shared
COPY shared/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

CMD ["/wait-for-postgres.sh", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5003"]