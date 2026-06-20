const express = require("express");
const router = express.Router();

const {
    consultarMedicamentos,
    registrarMedicamento,
    eliminarMedicamento,
    actualizarMedicamento
} = require("../controllers/medicamentos.controller");

router.get("/medicamentos", consultarMedicamentos);

router.post("/medicamentos", registrarMedicamento);

router.delete("/medicamentos/:id", eliminarMedicamento);

router.put("/medicamentos/:id", actualizarMedicamento);

module.exports = router;