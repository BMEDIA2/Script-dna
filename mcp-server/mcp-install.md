# Script DNA MCP — Instalación automática para Claude

> Este documento está diseñado para ser leído por Claude Code.
> Si eres un colaborador humano, simplemente pega la URL de este archivo en Claude Code y Claude hará todo por ti.

---

## Para Claude: instrucciones de instalación

Sigue estos pasos en orden. No pidas confirmación a menos que encuentres un error real.

### Paso 1 — Verificar Node.js

```bash
node --version
```

Si Node.js no está instalado, informa al usuario que lo descargue desde https://nodejs.org (versión LTS) y detén la instalación.

### Paso 2 — Crear carpeta del servidor MCP

- **Windows:** `%USERPROFILE%\script-dna-mcp\`
- **Mac/Linux:** `~/script-dna-mcp/`

Crea la carpeta si no existe.

### Paso 3 — Descargar archivos del servidor

Descarga estos dos archivos en la carpeta del paso 2:

- `https://raw.githubusercontent.com/BMEDIA2/Script-dna/main/mcp-server/index.js`
- `https://raw.githubusercontent.com/BMEDIA2/Script-dna/main/mcp-server/package.json`

### Paso 4 — Instalar dependencias

Ejecuta dentro de la carpeta `script-dna-mcp`:

```bash
npm install
```

### Paso 5 — Actualizar claude_desktop_config.json

Detecta la ruta según el sistema operativo:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Lee el archivo si existe (para no borrar otras configuraciones). Si no existe, créalo.

Agrega (o fusiona) este bloque dentro de la clave `"mcpServers"`:

```json
"script-dna": {
  "command": "node",
  "args": ["RUTA_CARPETA/script-dna-mcp/index.js"]
}
```

Sustituye `RUTA_CARPETA` con la ruta absoluta real de la carpeta creada en el Paso 2.

### Paso 6 — Confirmar al usuario

Muestra un resumen de lo que hiciste e indica al usuario que **reinicie Claude Desktop** para que el servidor MCP quede activo.

Una vez reiniciado, el colaborador puede escribir en cualquier chat de Claude Desktop:
> *"Lista los clones de Script DNA"* o *"Sube este contenido al DNA del clon [nombre]: [texto]"*

---

## Herramientas disponibles tras la instalación

| Herramienta | Descripción |
|---|---|
| `list_personas` | Lista todos los clones disponibles |
| `add_context` | Sube un bloque de texto al DNA de un clon |
| `get_context` | Consulta el contexto ya guardado de un clon |
