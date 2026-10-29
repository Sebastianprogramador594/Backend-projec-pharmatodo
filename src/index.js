require("../config/db");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("🚀 API de PharmaTodo desplegada correctamente en Railway");
});

const medicamentosRoutes = require("../routes/medicamentos.routes");
const authRoutes = require("../routes/auth.routes");
const dashboardRoutes = require("../routes/dashboard.routes");
const inventariosRoutes = require("../routes/inventarios.routes");
const ventasRoutes = require("../routes/ventas.routes");
const proveedoresRoutes = require("../routes/proveedores.routes");

app.use("/api", medicamentosRoutes);
app.use("/api", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", inventariosRoutes);
app.use("/api", ventasRoutes);
app.use("/api", proveedoresRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});