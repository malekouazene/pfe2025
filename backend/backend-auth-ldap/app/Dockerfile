FROM python:3.9-slim

WORKDIR /app

# Installation des dépendances système nécessaires pour LDAP
RUN apt-get update && apt-get install -y \
    libldap2-dev \
    libsasl2-dev \
    libssl-dev \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers de dépendances
COPY requirements.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code de l'application
COPY . .

# Exposition du port
EXPOSE 5000

# Commande de démarrage du service
CMD ["python", "app.py"]