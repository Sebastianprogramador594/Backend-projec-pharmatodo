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

app.use("/api", medicamentosRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});