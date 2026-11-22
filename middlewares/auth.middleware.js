
const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
    const encabezado = req.headers.authorization;

    if (!encabezado || !encabezado.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Acceso denegado. Debes iniciar sesión."
        });
    }

    const token = encabezado.split(" ")[1];

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = datos;
        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: "Token inválido o expirado."
        });
    }
}

function verificarRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: "No tienes permisos para realizar esta acción."
            });
        }

        next();
    };
}

module.exports = {
    verificarToken,
    verificarRol
};
