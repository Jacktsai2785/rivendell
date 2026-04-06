FROM python:3.11-slim
WORKDIR /app

COPY dashboard-next/api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY dashboard-next/api/server.py ./
COPY dashboard/lib/ /dashboard/lib/

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
