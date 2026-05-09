FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY config.py .
COPY core/ ./core/
COPY agents/ ./agents/
COPY server/ ./server/
COPY chain/ ./chain/
COPY main.py .

# Copy frontend files
COPY frontend/package.json frontend/
COPY frontend/package-lock.json frontend/
COPY frontend/tsconfig.json frontend/
COPY frontend/next.config.ts frontend/
COPY frontend/postcss.config.mjs frontend/
COPY frontend/src/ ./frontend/src/
COPY frontend/public/ ./frontend/public/

# Install curl and Node.js, then build frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    cd frontend && npm install && npm run build

# Expose ports
EXPOSE 8000 4000

# Run both services with a script
RUN echo '#!/bin/bash\n\
python -m uvicorn server.api:app --host 0.0.0.0 --port 8000 &\n\
cd frontend && npm start -- -p 4000 &\n\
wait' > /app/run.sh && chmod +x /app/run.sh

CMD ["/app/run.sh"]
