const express = require("express");

const router = express.Router();

const {
    consultarInventarios,
    registrarInventario,
    actualizarInventario,
    eliminarInventario
} = require("../controllers/inventarios.controller");

router.get("/inventarios", consultarInventarios);

router.post("/inventarios", registrarInventario);

router.put("/inventarios/:id", actualizarInventario);

router.delete("/inventarios/:id", eliminarInventario);

module.exports = router;