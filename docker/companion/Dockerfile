# Strategic Minds AI — Desktop Companion (Docker)
# Runs the Python polling worker that connects to your owned backend.
# For desktop GUI control (click/type/screenshot), run the companion natively on
# your desktop OS instead — Docker containers do not have access to the host display.
# This image is for headless cloud-browser automation and queue polling via Railway/cloud.

FROM python:3.11-slim

WORKDIR /app

# System deps for PyAutoGUI headless + Android adb
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-tk python3-dev scrot xclip xsel \
    adb \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY operator_companion.py .

# The companion reads OPERATOR_ENDPOINT, OPERATOR_TOKEN, OPERATOR_DEVICE_ID
# from environment (or operator-device.json mounted as a volume).
ENV PYTHONUNBUFFERED=1

CMD ["python3", "operator_companion.py", "--worker", "--allow-input"]