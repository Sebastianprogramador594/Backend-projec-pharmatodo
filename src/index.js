require("../config/db");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const medicamentosRoutes = require("../routes/medicamentos.routes");

app.use("/", medicamentosRoutes);

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});