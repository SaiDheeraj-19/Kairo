FROM codercom/code-server:latest

USER root

# Install Python and tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

USER coder
WORKDIR /home/coder/project

# Install common python tools
RUN pip3 install --no-cache-dir black flake8 pytest
