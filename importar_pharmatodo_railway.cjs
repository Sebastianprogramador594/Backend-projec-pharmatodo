/**
 * Importador de esquema y datos SQL a MySQL de Railway.
 * Compatible con ejecución interactiva (CMD) y automatizada (variables de entorno o argumentos).
 *
 * Uso manual con argumentos:
 *   node importar_pharmatodo_railway.cjs [HOST] [PUERTO] [USUARIO] [BASE_DE_DATOS] [RUTA_SQL] [PASSWORD_OPCIONAL]
 *
 * O simplemente ejecutando el script si las variables ya están en .env o entorno Railway:
 *   node importar_pharmatodo_railway.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

// Cargar variables de .env si existe
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');

function passwordOculta(pregunta) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    if (!input.isTTY || typeof input.setRawMode !== 'function') {
      return reject(new Error('Entorno no interactivo. Pasa la contraseña como variable de entorno MYSQLPASSWORD/DB_PASSWORD o sexto argumento.'));
    }
    let secret = '';
    const previousRaw = input.isRaw;
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          input.removeListener('data', onData);
          input.setRawMode(Boolean(previousRaw));
          input.pause();
          output.write('\n');
          resolve(secret);
          return;
        }
        if (char === '\u0003') {
          input.removeListener('data', onData);
          input.setRawMode(Boolean(previousRaw));
          input.pause();
          output.write('\n');
          reject(new Error('Operación cancelada.'));
          return;
        }
        if (char === '\b' || char === '\u007f') {
          secret = secret.slice(0, -1);
        } else if (char >= ' ') {
          secret += char;
        }
      }
    };
    output.write(pregunta);
    input.setEncoding('utf8');
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

(async () => {
  const args = process.argv.slice(2);

  const host = args[0] || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
  const port = Number(args[1] || process.env.MYSQLPORT || process.env.DB_PORT || 3306);
  const user = args[2] || process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const database = args[3] || process.env.MYSQLDATABASE || process.env.DB_NAME || 'pharmatodo';

  // Buscar archivo SQL: si se pasa argumento, o usar database_railway.sql por defecto
  const posiblesArchivosSql = [
    args[4],
    path.resolve(__dirname, 'database_railway.sql'),
    path.resolve(__dirname, '../database_railway.sql'),
    path.resolve(__dirname, 'database.sql'),
    path.resolve(__dirname, '../database.sql')
  ].filter(Boolean);

  const sqlPath = posiblesArchivosSql.find(p => fs.existsSync(p));

  if (!sqlPath) {
    console.error('❌ No se encontró ningún archivo SQL para importar.');
    process.exitCode = 1;
    return;
  }

  console.log(`📋 Configuración de importación:`);
  console.log(`   Host: ${host}:${port}`);
  console.log(`   Usuario: ${user}`);
  console.log(`   Base de datos: ${database}`);
  console.log(`   Archivo SQL: ${sqlPath}`);

  let password = args[5] || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;

  if (password === undefined) {
    try {
      password = await passwordOculta('Contraseña MySQL de Railway (no se mostrará): ');
    } catch (err) {
      console.error(err.message);
      process.exitCode = 1;
      return;
    }
  }

  const rawSql = fs.readFileSync(path.resolve(sqlPath), 'utf8').replace(/^\uFEFF/, '');
  
  // Limpiar CREATE DATABASE o USE si vinieran en el archivo para evitar errores en Railway
  const sql = rawSql
    .replace(/^\s*CREATE\s+DATABASE\s+[^;]+;\s*/gim, '')
    .replace(/^\s*USE\s+`?\w+`?\s*;\s*/gim, '');

  if (!/\bCREATE\s+TABLE\b/i.test(sql)) {
    console.error('❌ No se encontraron instrucciones CREATE TABLE en el archivo SQL.');
    process.exitCode = 1;
    return;
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password: password || '',
      database,
      multipleStatements: true,
      connectTimeout: 20000,
      charset: 'utf8mb4'
    });

    const [existentes] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [database]
    );

    if (existentes.length) {
      console.warn('⚠️ La base de destino ya tiene tablas:', existentes.map(x => x.TABLE_NAME).join(', '));
      console.log('Se aplicará la estructura asegurando compatibilidad.');
    }

    console.log('⏳ Conexión establecida. Ejecutando SQL...');
    await connection.query(sql);

    const [tablas] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
      [database]
    );
    console.log('✅ Importación terminada con éxito. Tablas verificadas (' + tablas.length + '):');
    console.log(tablas.map(x => '   - ' + x.TABLE_NAME).join('\n'));
  } catch (error) {
    console.error('❌ Error durante la importación:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
})();
