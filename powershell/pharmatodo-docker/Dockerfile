FROM node:22-alpine

# Instalar Git para poder clonar el repositorio
RUN apk add --no-cache git

# Directorio de trabajo
WORKDIR /app

# Clonar el proyecto desde GitHub
RUN git clone https://github.com/Sebastianprogramador594/Backend-projec-pharmatodo .

# Instalar las dependencias
RUN npm ci

# Entorno de ejecución
ENV NODE_ENV=production

# Puerto de la aplicación
ENV PORT=3000

# Exponer el puerto del contenedor
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]