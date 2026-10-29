
const express = require("express");
const router = express.Router();

const {
    consultarProveedores,
    registrarProveedor,
    actualizarProveedor,
    eliminarProveedor
} = require("../controllers/proveedores.controller");

router.get("/proveedores", consultarProveedores);
router.post("/proveedores", registrarProveedor);
router.put("/proveedores/:id", actualizarProveedor);
router.delete("/proveedores/:id", eliminarProveedor);

module.exports = router;