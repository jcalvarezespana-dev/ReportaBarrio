// =============================================================
// ReportaBarrio · Servidor Express
// Proyecto de aula · Tecnologías Web · Universidad Simón Bolívar
// =============================================================

// ---------- 1. Importaciones y configuración básica ----------
const express = require('express'); // framework del servidor
const path = require('path');       // arma rutas de carpetas sin errores

const app = express();
const PUERTO = process.env.PORT || 3000;

// ---------- 2. Datos fijos de la aplicación ----------
// Categorías pertinentes al ODS 11 (clave que viaja en el formulario → nombre visible)
const CATEGORIAS = {
  vias: 'Vías y huecos',
  alumbrado: 'Alumbrado público',
  residuos: 'Residuos y basuras',
  agua: 'Agua y alcantarillado',
  espacio: 'Espacio público y zonas verdes',
  seguridad: 'Seguridad vial'
};

// Si cambias esta lista, cámbiala también en public/reportar.html
const BARRIOS = [
  'Centro', 'El Prado', 'Alto Prado', 'Boston', 'Barrio Abajo',
  'Rebolo', 'Ciudad Jardín', 'Riomar', 'Las Nieves', 'Otro'
];

const URGENCIAS = ['baja', 'media', 'alta'];
const ESTADOS = ['Pendiente', 'En proceso', 'Resuelto'];

// Clase CSS que corresponde a cada estado
const CLASE_ESTADO = {
  'Pendiente': 'estado-pendiente',
  'En proceso': 'estado-proceso',
  'Resuelto': 'estado-resuelto'
};

// ---------- 3. "Base de datos" en memoria ----------
// Se borra cada vez que el servidor se reinicia (no hay base de datos).
const reportes = [];
let siguienteId = 1;

// Fecha de hoy en formato AAAA-MM-DD, con hora de Colombia
function hoy() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

// Crea un reporte con todos sus campos y lo guarda en el arreglo
function agregarReporte(datos, estado = 'Pendiente', fecha = hoy()) {
  const reporte = {
    id: siguienteId++,
    titulo: datos.titulo,
    categoria: datos.categoria,
    barrio: datos.barrio,
    descripcion: datos.descripcion,
    urgencia: datos.urgencia,
    contacto: datos.contacto,
    fecha: fecha,
    estado: estado
  };
  reportes.push(reporte);
  return reporte;
}

// Reportes de ejemplo para que el listado y las estadísticas no estén vacíos
agregarReporte({ titulo: 'Hueco profundo en la calle principal', categoria: 'vias', barrio: 'Centro',
  descripcion: 'Un hueco de más de medio metro dificulta el paso de carros y motos.',
  urgencia: 'alta', contacto: 'vecino1@example.com' }, 'Pendiente', '2026-11-02');
agregarReporte({ titulo: 'Poste de luz apagado frente al parque', categoria: 'alumbrado', barrio: 'El Prado',
  descripcion: 'La esquina queda completamente oscura desde hace dos semanas.',
  urgencia: 'media', contacto: 'vecino2@example.com' }, 'En proceso', '2026-11-05');
agregarReporte({ titulo: 'Basura acumulada en la esquina', categoria: 'residuos', barrio: 'Centro',
  descripcion: 'El camión no pasa y las bolsas se están rompiendo en la vía.',
  urgencia: 'alta', contacto: 'vecino3@example.com' }, 'Pendiente', '2026-11-08');
agregarReporte({ titulo: 'Fuga de agua en la acera', categoria: 'agua', barrio: 'Boston',
  descripcion: 'Sale agua limpia de una tubería rota y se desperdicia todo el día.',
  urgencia: 'alta', contacto: 'vecino4@example.com' }, 'Resuelto', '2026-10-28');
agregarReporte({ titulo: 'Zona verde sin mantenimiento', categoria: 'espacio', barrio: 'Barrio Abajo',
  descripcion: 'El pasto está muy alto y los juegos infantiles están deteriorados.',
  urgencia: 'baja', contacto: 'vecino5@example.com' }, 'Pendiente', '2026-11-10');
agregarReporte({ titulo: 'Falta señal de pare cerca del colegio', categoria: 'seguridad', barrio: 'Ciudad Jardín',
  descripcion: 'En la hora de salida de los niños los carros cruzan sin detenerse.',
  urgencia: 'media', contacto: 'vecino6@example.com' }, 'Pendiente', '2026-11-12');

// ---------- 4. Funciones auxiliares ----------
// Escapa caracteres especiales para que lo que escribe el usuario no se ejecute como HTML
function esc(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Devuelve un texto limpio; si no llega un texto (o llega vacío), devuelve ''
function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// <option> de categorías, marcando la seleccionada
function opcionesCategorias(seleccionada) {
  return Object.entries(CATEGORIAS)
    .map(([clave, nombre]) =>
      `<option value="${clave}"${clave === seleccionada ? ' selected' : ''}>${esc(nombre)}</option>`)
    .join('');
}

// <option> de barrios, marcando el seleccionado (sin distinguir mayúsculas)
function opcionesBarrios(seleccionado) {
  return BARRIOS
    .map(barrio =>
      `<option value="${esc(barrio)}"${barrio.toLowerCase() === seleccionado.toLowerCase() ? ' selected' : ''}>${esc(barrio)}</option>`)
    .join('');
}

// ---------- 5. Plantillas HTML (template strings) ----------
// Estructura común de las páginas que genera el servidor
function pagina({ titulo, activo, contenido, lateral }) {
  const enlace = (href, nombre, clave) =>
    `<li><a href="${href}"${activo === clave ? ' aria-current="page"' : ''}>${nombre}</a></li>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(titulo)} – ReportaBarrio</title>
  <link rel="icon" href="/img/logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/estilos.css">
</head>
<body>
  <a class="saltar-contenido" href="#contenido-principal">Saltar al contenido</a>
  <header class="cabecera">
    <a class="logo" href="/">
      <img src="/img/logo.svg" alt="" width="32" height="32">
      <span>ReportaBarrio</span>
    </a>
    <nav aria-label="Menú principal">
      <ul class="menu">
        ${enlace('/', 'Inicio', 'inicio')}
        ${enlace('/reportar.html', 'Reportar', 'reportar')}
        ${enlace('/reportes', 'Reportes', 'reportes')}
        ${enlace('/estadisticas', 'Estadísticas', 'estadisticas')}
      </ul>
    </nav>
  </header>
  <div class="diseno">
    <main id="contenido-principal">
      ${contenido}
    </main>
    <aside class="lateral">
      ${lateral}
    </aside>
  </div>
  <footer class="pie">
    <p>ReportaBarrio, proyecto de aula de Tecnologías Web. Universidad Simón Bolívar. ODS 11: Ciudades y comunidades sostenibles.</p>
  </footer>
</body>
</html>`;
}

// Tarjeta de un reporte. El contacto se guarda pero no se muestra al público.
function tarjetaReporte(r) {
  return `<article class="tarjeta">
        <header class="tarjeta-cabecera">
          <span class="etiqueta etiqueta-categoria">${esc(CATEGORIAS[r.categoria])}</span>
          <span class="etiqueta urgencia-${r.urgencia}">Urgencia ${r.urgencia}</span>
        </header>
        <h3>${esc(r.titulo)}</h3>
        <p class="tarjeta-barrio">Barrio: ${esc(r.barrio)}</p>
        <p>${esc(r.descripcion)}</p>
        <footer class="tarjeta-pie">
          <span>${esc(r.fecha)}</span>
          <span class="etiqueta ${CLASE_ESTADO[r.estado]}">${esc(r.estado)}</span>
        </footer>
      </article>`;
}

// Tabla con barras para las estadísticas
function tablaEstadistica(titulo, filas, total) {
  const cuerpo = filas.map(fila => {
    const porcentaje = total === 0 ? 0 : Math.round((fila.total / total) * 100);
    return `<tr>
          <th scope="row">${esc(fila.nombre)}</th>
          <td>${fila.total} (${porcentaje} %)</td>
          <td><span class="barra" aria-hidden="true"><span style="width: ${porcentaje}%"></span></span></td>
        </tr>`;
  }).join('');

  return `<table class="tabla-estadistica">
        <caption>${esc(titulo)}</caption>
        <thead>
          <tr><th scope="col">Grupo</th><th scope="col">Reportes</th><th scope="col">Proporción</th></tr>
        </thead>
        <tbody>
        ${cuerpo}
        </tbody>
      </table>`;
}

// ---------- 6. Middlewares ----------
// Lee los datos que llegan desde los formularios (POST) y los deja en req.body
app.use(express.urlencoded({ extended: true }));
// Sirve los archivos de la carpeta public/ (HTML, CSS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// ---------- 7. Rutas ----------
// GET /reportes → lista de reportes, con filtros opcionales por la URL (req.query)
app.get('/reportes', (req, res) => {
  const categoria = texto(req.query.categoria);
  const barrio = texto(req.query.barrio);

  let lista = reportes;
  if (categoria) {
    lista = lista.filter(r => r.categoria === categoria);
  }
  if (barrio) {
    lista = lista.filter(r => r.barrio.toLowerCase() === barrio.toLowerCase());
  }
  // Los más recientes primero (sin modificar el arreglo original)
  lista = [...lista].sort((a, b) => b.id - a.id);

  const resultados = lista.length > 0
    ? `<div class="tarjetas">
      ${lista.map(tarjetaReporte).join('\n      ')}
    </div>`
    : `<p class="mensaje-vacio">No hay reportes que cumplan los filtros elegidos. Prueba con otra categoría u otro barrio, o quita los filtros.</p>`;

  const contenido = `<section aria-labelledby="titulo-reportes">
      <h1 id="titulo-reportes">Reportes del barrio</h1>
      <p>Consulta lo que han reportado los vecinos y filtra por categoría o por barrio.</p>
      <form class="filtros" action="/reportes" method="get">
        <div class="campo">
          <label for="filtro-categoria">Categoría</label>
          <select id="filtro-categoria" name="categoria">
            <option value="">Todas las categorías</option>
            ${opcionesCategorias(categoria)}
          </select>
        </div>
        <div class="campo">
          <label for="filtro-barrio">Barrio</label>
          <select id="filtro-barrio" name="barrio">
            <option value="">Todos los barrios</option>
            ${opcionesBarrios(barrio)}
          </select>
        </div>
        <div class="filtros-acciones">
          <button class="boton" type="submit">Aplicar filtros</button>
          <a class="boton boton-secundario" href="/reportes">Quitar filtros</a>
        </div>
      </form>
    </section>
    <section aria-labelledby="titulo-resultados">
      <h2 id="titulo-resultados">Resultados</h2>
      <p class="conteo">Mostrando ${lista.length} de ${reportes.length} reportes.</p>
      ${resultados}
    </section>`;

  const lateral = `<h2>Cómo funcionan los filtros</h2>
      <p>Los filtros viajan en la dirección de la página, por ejemplo:</p>
      <p><code>/reportes?categoria=alumbrado</code></p>
      <p><code>/reportes?categoria=residuos&amp;barrio=Centro</code></p>
      <p>Si eliges los dos, solo aparecen los reportes que cumplen ambos.</p>`;

  res.send(pagina({ titulo: 'Reportes', activo: 'reportes', contenido, lateral }));
});

// POST /reportes → recibe el formulario, valida, guarda y redirige
app.post('/reportes', (req, res) => {
  const cuerpo = req.body || {};
  const datos = {
    titulo: texto(cuerpo.titulo),
    categoria: texto(cuerpo.categoria),
    barrio: texto(cuerpo.barrio),
    descripcion: texto(cuerpo.descripcion),
    urgencia: texto(cuerpo.urgencia),
    contacto: texto(cuerpo.contacto)
  };

  // Validación en el servidor: se acumulan los errores encontrados
  const errores = [];

  if (!datos.titulo) {
    errores.push('El título es obligatorio.');
  } else if (datos.titulo.length > 100) {
    errores.push('El título no puede superar los 100 caracteres.');
  }

  if (!datos.categoria) {
    errores.push('Debes elegir una categoría.');
  } else if (!Object.hasOwn(CATEGORIAS, datos.categoria)) {
    errores.push('La categoría elegida no es válida.');
  }

  if (!datos.barrio) {
    errores.push('Debes elegir un barrio.');
  } else if (!BARRIOS.includes(datos.barrio)) {
    errores.push('El barrio elegido no es válido.');
  }

  if (!datos.descripcion) {
    errores.push('La descripción es obligatoria.');
  } else if (datos.descripcion.length > 500) {
    errores.push('La descripción no puede superar los 500 caracteres.');
  }

  if (!datos.urgencia) {
    errores.push('Debes elegir el nivel de urgencia.');
  } else if (!URGENCIAS.includes(datos.urgencia)) {
    errores.push('El nivel de urgencia no es válido.');
  }

  if (!datos.contacto) {
    errores.push('El correo de contacto es obligatorio.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.contacto)) {
    errores.push('El correo de contacto no tiene un formato válido.');
  }

  // Si hay errores: código 400, mensaje claro y NO se guarda nada
  if (errores.length > 0) {
    const contenido = `<section aria-labelledby="titulo-error">
      <h1 id="titulo-error">No se pudo guardar el reporte</h1>
      <div class="mensaje-error" role="alert">
        <p>El reporte no fue guardado porque hay datos por corregir:</p>
        <ul>
          ${errores.map(e => `<li>${esc(e)}</li>`).join('\n          ')}
        </ul>
      </div>
      <p><a class="boton" href="/reportar.html">Volver al formulario</a></p>
    </section>`;
    const lateral = `<h2>Qué se valida</h2>
      <ul>
        <li>Todos los campos son obligatorios.</li>
        <li>El título admite hasta 100 caracteres.</li>
        <li>La descripción admite hasta 500 caracteres.</li>
        <li>El contacto debe ser un correo válido.</li>
      </ul>`;
    return res.status(400).send(pagina({ titulo: 'Datos incompletos', activo: 'reportar', contenido, lateral }));
  }

  // Datos válidos: se guarda y se redirige al listado
  agregarReporte(datos);
  res.redirect('/reportes');
});

// GET /estadisticas → conteo de reportes por categoría y por estado
app.get('/estadisticas', (req, res) => {
  const total = reportes.length;

  const porCategoria = Object.entries(CATEGORIAS).map(([clave, nombre]) => ({
    nombre: nombre,
    total: reportes.filter(r => r.categoria === clave).length
  }));

  const porEstado = ESTADOS.map(estado => ({
    nombre: estado,
    total: reportes.filter(r => r.estado === estado).length
  }));

  const contenido = `<section aria-labelledby="titulo-estadisticas">
      <h1 id="titulo-estadisticas">Estadísticas</h1>
      <p class="conteo">Total de reportes registrados: <strong>${total}</strong></p>
    </section>
    <section aria-labelledby="titulo-por-categoria">
      <h2 id="titulo-por-categoria">Por categoría</h2>
      ${tablaEstadistica('Reportes por categoría', porCategoria, total)}
    </section>
    <section aria-labelledby="titulo-por-estado">
      <h2 id="titulo-por-estado">Por estado</h2>
      ${tablaEstadistica('Reportes por estado', porEstado, total)}
    </section>`;

  const lateral = `<h2>Qué significa cada estado</h2>
      <ul>
        <li><strong>Pendiente:</strong> el reporte está registrado y nadie lo ha atendido.</li>
        <li><strong>En proceso:</strong> ya se está gestionando.</li>
        <li><strong>Resuelto:</strong> el problema fue solucionado.</li>
      </ul>`;

  res.send(pagina({ titulo: 'Estadísticas', activo: 'estadisticas', contenido, lateral }));
});

// ---------- 8. Error 404 ----------
// Va al final: si ninguna ruta anterior respondió, llega aquí
app.use((req, res) => {
  const contenido = `<section aria-labelledby="titulo-404">
      <h1 id="titulo-404">Página no encontrada</h1>
      <p>La dirección <code>${esc(req.originalUrl)}</code> no existe en ReportaBarrio.</p>
      <p><a class="boton" href="/">Volver al inicio</a></p>
    </section>`;
  const lateral = `<h2>Páginas disponibles</h2>
      <ul>
        <li><a href="/">Inicio</a></li>
        <li><a href="/reportar.html">Reportar un problema</a></li>
        <li><a href="/reportes">Ver reportes</a></li>
        <li><a href="/estadisticas">Estadísticas</a></li>
      </ul>`;
  res.status(404).send(pagina({ titulo: 'Página no encontrada', activo: '', contenido, lateral }));
});

// ---------- 9. Arranque del servidor ----------
app.listen(PUERTO, () => {
  console.log(`ReportaBarrio funcionando en http://localhost:${PUERTO}`);
});
