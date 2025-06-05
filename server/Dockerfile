FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy only the requirements file first to leverage Docker cache
COPY ./LLM/requirements.txt /app/LLM/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r /app/LLM/requirements.txt

# Copy the rest of the application code
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Set the working directory to /app/LLM/app (your app.py is inside /app/LLM/app)
WORKDIR /app/LLM/app

# Run app.py when the container launches
CMD ["python", "app.py"]
