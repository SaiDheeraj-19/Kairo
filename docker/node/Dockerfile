FROM codercom/code-server:latest

USER root

# Install Node.js tools
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install specific Node version if needed
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

USER coder
WORKDIR /home/coder/project

# Pre-install common global packages
RUN npm install -g typescript ts-node nodemon
