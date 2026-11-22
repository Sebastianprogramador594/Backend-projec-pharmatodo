
const express = require("express");
const router = express.Router();

const {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} = require("../controllers/usuarios.controller");

const {
    verificarToken,
    verificarRol
} = require("../middlewares/auth.middleware");

router.use(verificarToken);
router.use(verificarRol("Administrador"));

router.get("/", listarUsuarios);
router.get("/:id", obtenerUsuario);
router.post("/", crearUsuario);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUsuario);

module.exports = router;
