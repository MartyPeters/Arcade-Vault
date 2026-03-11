# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port 5000 (Flask default)
EXPOSE 5000

# Set environment variables for Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Start the application using Gunicorn for production
RUN pip install gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
