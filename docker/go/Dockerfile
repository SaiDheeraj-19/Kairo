FROM codercom/code-server:latest

USER root

# Install Go
RUN apt-get update && apt-get install -y \
    wget \
    && wget https://go.dev/dl/go1.21.1.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go1.21.1.linux-amd64.tar.gz \
    && rm go1.21.1.linux-amd64.tar.gz \
    && rm -rf /var/lib/apt/lists/*

ENV PATH=$PATH:/usr/local/go/bin

USER coder
WORKDIR /home/coder/project
