require("dotenv").config();
require("../config/db");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta base con información del estado de la API
app.get("/", (req, res) => {
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

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
    res.status(404).json({
        mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error("❌ Error interno del servidor:", err);
    res.status(500).json({
        mensaje: "Ocurrió un error interno en el servidor",
        error: process.env.NODE_ENV === "production" ? undefined : err.message
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Servidor PharmaTodo corriendo en el puerto ${PORT}`);
    console.log(`🌐 URL base: http://localhost:${PORT}`);
    console.log(`📡 Endpoints disponibles en http://localhost:${PORT}/api`);
    console.log(`====================================================`);
});
