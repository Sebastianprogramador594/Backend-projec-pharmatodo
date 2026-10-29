const express = require("express");

const router = express.Router();

const {
    registrarVenta,
    consultarVentas,
    consultarDetalleVenta
} = require("../controllers/ventas.controller");

router.get("/ventas", consultarVentas);

router.get("/ventas/:codigo/detalle", consultarDetalleVenta);

router.post("/ventas", registrarVenta);

module.exports = router;