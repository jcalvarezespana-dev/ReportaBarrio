# ReportaBarrio

Plataforma ciudadana para reportar problemas del barrio. Proyecto de aula de **Tecnologías Web**, Ingeniería de Sistemas, Universidad Simón Bolívar.

## Integrantes

- Juan Camilo Alvarez España
- [Nombre del integrante 2]
- [Nombre del integrante 3, si aplica]

## Descripción

ReportaBarrio permite que los vecinos registren problemas cotidianos (huecos, basuras, alumbrado dañado, fugas de agua, falta de señalización), consulten lo que otros han reportado, filtren por categoría y barrio, y vean estadísticas básicas por categoría y por estado.

La aplicación usa Node.js y Express. No usa base de datos: los reportes viven en un arreglo en memoria y se reinician cuando el servidor se detiene. Tampoco usa React ni frameworks CSS.

## ODS elegido

**ODS 11: Ciudades y comunidades sostenibles.**

- **Meta 11.1** (servicios básicos): los reportes de agua, alcantarillado y alumbrado muestran dónde fallan los servicios.
- **Meta 11.3** (participación): cualquier vecino puede reportar, consultar y hacer seguimiento.
- **Meta 11.6** (impacto ambiental urbano): las basuras y las zonas verdes descuidadas quedan registradas por barrio.

Las categorías de reporte son: vías y huecos, alumbrado público, residuos y basuras, agua y alcantarillado, espacio público y zonas verdes, y seguridad vial.

## Instalación y ejecución

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev
```

El servidor muestra en consola `http://localhost:3000`. Para ejecutarlo sin nodemon: `npm start`.

## Rutas del servidor

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/` | Página de inicio (archivo estático) |
| GET | `/reportar.html` | Formulario para crear un reporte (archivo estático) |
| GET | `/reportes` | Lista los reportes. Filtros opcionales: `?categoria=...&barrio=...` |
| POST | `/reportes` | Recibe el formulario, valida, guarda y redirige a `/reportes`. Si falta o falla un dato responde 400 |
| GET | `/estadisticas` | Conteo de reportes por categoría y por estado |
| GET | cualquier otra | Página 404 |

Valores de `categoria`: `vias`, `alumbrado`, `residuos`, `agua`, `espacio`, `seguridad`.

## Estructura del proyecto

```
reportabarrio/
├── package.json
├── index.js            servidor Express: rutas, validación y plantillas
├── README.md
└── public/
    ├── index.html
    ├── reportar.html
    ├── estilos.css
    └── img/logo.svg
```

Las vistas Reportes y Estadísticas las genera el servidor con template strings, por eso no son archivos HTML estáticos.

## Cómo probar cada caso de aceptación

1. `npm run dev` en la carpeta recién descargada (después de `npm install`): el servidor inicia y muestra la URL.
2. Abrir `http://localhost:3000/`: carga el inicio con el CSS aplicado.
3. Reducir el ancho de la ventana (o usar el modo móvil de las herramientas de desarrollo): la cuadrícula pasa a una columna y el menú se reorganiza.
4. Llenar el formulario con datos válidos: el reporte se guarda y el navegador va a `/reportes`, donde aparece primero.
5. Enviar con un campo vacío: el navegador bloquea el envío por el atributo `required`. Para probar la validación del servidor, usa una de estas dos opciones:
   - En las herramientas de desarrollo (clic derecho en el campo, Inspeccionar), borra el atributo `required` del campo y envía el formulario.
   - Desde la terminal:
     ```bash
     curl -i -X POST http://localhost:3000/reportes -d "titulo=&categoria=vias&barrio=Centro&descripcion=Prueba&urgencia=alta&contacto=a@b.co"
     ```
   El servidor responde 400 con un mensaje claro y el reporte no se guarda.
6. Abrir `/reportes?categoria=alumbrado`: solo aparecen los reportes de alumbrado.
7. Abrir `/reportes?categoria=residuos&barrio=Centro`: solo los que cumplen ambos filtros. Con una combinación sin resultados (por ejemplo `residuos` y `Boston`) se muestra un mensaje.
8. Abrir `/estadisticas` (conteos por categoría y estado) y `/xyz` (página 404).

## Notas de diseño

- Hay seis reportes de ejemplo al iniciar para que el listado y las estadísticas no estén vacíos.
- El correo de contacto se guarda en cada reporte pero no se muestra en las tarjetas, para no exponer datos personales.
- Todo el texto que escribe el usuario se escapa antes de mostrarse, para que no se interprete como HTML.
- La lista de barrios está en `index.js` (constante `BARRIOS`) y en `public/reportar.html`; si se cambia, hay que cambiarla en ambos.

## Enlaces

- Video de sustentación: [pegar aquí el enlace]
- Repositorio en GitHub (opcional): [pegar aquí el enlace]
