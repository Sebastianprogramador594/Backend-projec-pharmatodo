const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Cargar variables de entorno desde .env local y de la raíz
dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

// Advertencia de JWT_SECRET si falta en el entorno
if (!process.env.JWT_SECRET) {
    console.warn("⚠️ Advertencia: JWT_SECRET no configurada. Usando clave de desarrollo por defecto.");
    process.env.JWT_SECRET = "pharmatodo_jwt_secret_key_production_default_change_me_2026";
}

// Conexión a la base de datos
require("../config/db");

// Inicialización automática de esquema y datos si la base de datos está vacía
const { inicializarBaseDeDatos } = require("./init-db");
inicializarBaseDeDatos().catch((err) => {
    console.warn("⚠️ Advertencia en auto-inicialización de base de datos:", err.message);
});

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Detectar y servir archivos estáticos del Frontend
const posiblesRutasFrontend = [
    path.resolve(__dirname, "../../Frontend"),
    path.resolve(__dirname, "../Frontend"),
    path.resolve(process.cwd(), "Frontend")
];
const rutaFrontend = posiblesRutasFrontend.find(p => fs.existsSync(p));

if (rutaFrontend) {
    app.use(express.static(rutaFrontend));
    console.log(`📁 Frontend estático activo desde: ${rutaFrontend}`);
}

// Rutas de la API
const medicamentosRoutes = require("../routes/medicamentos.routes");
const authRoutes = require("../routes/auth.routes");
const dashboardRoutes = require("../routes/dashboard.routes");
const inventariosRoutes = require("../routes/inventarios.routes");
const ventasRoutes = require("../routes/ventas.routes");
const proveedoresRoutes = require("../routes/proveedores.routes");
const usuariosRoutes = require("../routes/usuarios.routes");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

app.use("/api", medicamentosRoutes);
app.use("/api", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", inventariosRoutes);
app.use("/api", ventasRoutes);
app.use("/api", proveedoresRoutes);
app.use("/api/usuarios", usuariosRoutes);

// Endpoint de estado y documentación de endpoints
app.get("/api", (req, res) => {
    res.json({
        mensaje: "🚀 API de PharmaTodo activa y funcionando",
        version: "1.0.0",
        sistema: "Sistema de gestión farmacéutica y control de inventarios",
        endpoints: {
            auth: "/api/auth/login",
            dashboard: "/api/dashboard",
            medicamentos: "/api/medicamentos",
            inventarios: "/api/inventarios",
            ventas: "/api/ventas",
            proveedores: "/api/proveedores",
            usuarios: "/api/usuarios"
        }
    });
});

// Endpoint de salud (Health Check) para Railway y monitores
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get(
    "/api/auth/protegida",
    verificarToken,
    (req, res) => {
        res.json({
            mensaje: "Acceso autorizado",
            usuario: req.usuario
        });
    }
);

app.get(
    "/api/auth/solo-administrador",
    verificarToken,
    verificarRol("Administrador"),
    (req, res) => {
        res.json({
            mensaje: "Acceso autorizado para administrador",
            usuario: req.usuario
        });
    }
);

// Ruta raíz: si existe el frontend, servir la pantalla de login
app.get("/", (req, res) => {
    if (rutaFrontend) {
        const loginPath = path.join(rutaFrontend, "PantallaLogin.html");
        if (fs.existsSync(loginPath)) {
            return res.sendFile(loginPath);
        }
    }
    res.json({
        mensaje: "🚀 Servidor PharmaTodo activo",
        version: "1.0.0",
        documentacion: "/api"
    });
});

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
    if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({
            mensaje: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}`
        });
    }

    if (rutaFrontend) {
        const loginPath = path.join(rutaFrontend, "PantallaLogin.html");
        if (fs.existsSync(loginPath)) {
            return res.redirect("/PantallaLogin.html");
        }
    }

    res.status(404).send("Página no encontrada");
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error("❌ Error interno del servidor:", err);
    res.status(500).json({
        mensaje: "Ocurrió un error interno en el servidor",
        error: process.env.NODE_ENV === "production" ? undefined : err.message
    });
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 Servidor PharmaTodo corriendo en el puerto ${PORT}`);
    console.log(`🌐 Escuchando en http://${HOST}:${PORT}`);
    console.log(`📡 Endpoints disponibles en http://${HOST}:${PORT}/api`);
    console.log(`====================================================`);
});

module.exports = { app, server };
