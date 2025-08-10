# Text Editor Library

Una librería moderna y modular para editores de texto enriquecido, construida con arquitectura de plugins y JavaScript puro.

## ✨ Características Principales

✅ **Arquitectura modular** - Carga solo los plugins que necesitas  
✅ **Cero dependencias** - JavaScript puro, sin librerías externas  
✅ **Vista de código integrada** - Modal e inline para editar HTML  
✅ **Integración con formularios** - Funciona con textarea/input existentes  
✅ **Múltiples editores** - Sin conflictos en la misma página  
✅ **Sistema automático de placeholder** - Actualización inteligente  
✅ **Temas personalizables** - CSS Variables y temas modulares  
✅ **Responsive design** - Optimizado para móviles y desktop  

## 🎮 Demo en Vivo

**[📝 Prueba la demo interactiva](https://leonardojrc.github.io/text-editor/demo.html)**

Experimenta con todas las funcionalidades directamente en tu navegador:
- ✏️ Formato de texto completo con colores
- 📊 Sistema de tablas avanzado
- 🔗 Inserción de enlaces e imágenes
- 📱 Responsive y optimizado para móvil
- 💻 Vista de código HTML integrada

## 🚀 Instalación Rápida

1. Descarga la carpeta `text-editor/` a tu proyecto
2. Incluye el script principal:

```html
<script src="text-editor/text-editor.js"></script>
```

3. ¡Listo para usar!

```html
<div id="mi-editor"></div>
<script>
new TextEditor('#mi-editor', {
    plugins: ['formatting', 'alignment', 'lists', 'tables', 'history'],
    codeView: 'modal'
});
</script>
```

## ⚙️ Configuración

### Opciones Principales

| Opción | Tipo | Predeterminado | Descripción |
|--------|------|----------------|-------------|
| `plugins` | Array | `['formatting', 'alignment', 'lists', 'tables', 'history']` | Plugins a cargar |
| `codeView` | String | - | Vista de código: `'modal'` o `'inline'`. Sin especificar = sin botón |
| `theme` | String | `'default'` | Tema visual a usar |
| `placeholder` | String | `'Escribe aquí tu contenido...'` | Texto del placeholder |
| `height` | Number | `300` | Altura mínima en píxeles |
| `basePath` | String | Auto-detectado | Ruta base de la librería |

### Vista de Código (Nueva Funcionalidad)

```javascript
// Modal de código (como editores clásicos)
new TextEditor('#editor1', {
    codeView: 'modal'  // Botón que abre ventana modal
});

// Vista inline (alternar en el mismo editor) 
new TextEditor('#editor2', {
    codeView: 'inline'  // Botón que alterna vista de código
});

// Sin vista de código (por defecto)
new TextEditor('#editor3', {
    // Sin codeView = sin botón de código
});
```

## 🔌 Plugins Disponibles

### 📝 **Formatting Plugin**
Formato básico de texto con colores avanzados.

**Funcionalidades:**
- Negrita, cursiva, subrayado, tachado
- Botones split de color (texto y fondo)
- Paleta de colores predefinida + selector personalizado

**Configuración:**
```javascript
plugins: ['formatting']
```

### 📐 **Alignment Plugin**
Alineación de párrafos y texto.

**Funcionalidades:**
- Alineación izquierda, centro, derecha
- Texto justificado

**Configuración:**
```javascript
plugins: ['alignment']
```

### 📋 **Lists Plugin**
Creación de listas estructuradas.

**Funcionalidades:**
- Listas con viñetas (ul)
- Listas numeradas (ol)

**Configuración:**
```javascript
plugins: ['lists']
```

### 📊 **Tables Plugin**
Sistema completo de tablas con interfaz avanzada.

**Funcionalidades:**
- Selector visual 10x10 para crear tablas
- Menú contextual inteligente (dentro/fuera de tabla)
- Insertar/eliminar filas y columnas
- Selección inteligente al eliminar
- Highlighting visual de tablas y celdas activas
- Auto-eliminación de tablas vacías

**Configuración:**
```javascript
plugins: ['tables']
```

**Características avanzadas:**
- **Split-button**: Botón principal + dropdown contextual
- **Grid selector**: Vista previa en tiempo real del tamaño
- **Smart selection**: Mantiene selección al modificar estructura
- **Visual feedback**: Highlighting con transiciones CSS

### 🖼️ **Images Plugin**
Inserción de imágenes con modal de configuración.

**Funcionalidades:**
- Subida por URL
- Texto alternativo
- Ajuste de dimensiones

**Configuración:**
```javascript
plugins: ['images']
```

### 🔗 **Links Plugin**
Gestión completa de enlaces.

**Funcionalidades:**
- Modal de creación/edición
- Validación de URLs
- Opción de abrir en nueva ventana
- Texto personalizable

**Configuración:**
```javascript
plugins: ['links']
```

### ⏰ **History Plugin**
Sistema de deshacer/rehacer avanzado.

**Funcionalidades:**
- Historial independiente por editor
- Stack configurable (50 acciones por defecto)
- Detección inteligente de cambios
- Optimización de performance

**Configuración:**
```javascript
plugins: ['history']
```

## 🛠️ Desarrollo de Plugins

### Interfaz de Limpieza de Contenido

Los plugins pueden implementar el método `cleanContent(tempDiv)` para limpiar elementos temporales antes de exportar/enviar el HTML:

```javascript
class MiPlugin {
    constructor(editor) {
        this.editor = editor;
    }
    
    init() {
        // Inicialización del plugin
    }
    
    // Método de interfaz para limpiar contenido HTML
    cleanContent(tempDiv) {
        // Remover clases temporales
        const elementsWithTempClass = tempDiv.querySelectorAll('.mi-clase-temporal');
        elementsWithTempClass.forEach(element => {
            element.classList.remove('mi-clase-temporal');
        });
        
        // Remover elementos UI temporales
        const tempElements = tempDiv.querySelectorAll('.mi-elemento-ui');
        tempElements.forEach(element => element.remove());
        
        // Limpiar atributos específicos
        const elementsWithTempAttr = tempDiv.querySelectorAll('[data-temp-id]');
        elementsWithTempAttr.forEach(element => {
            element.removeAttribute('data-temp-id');
        });
    }
}

// Registrar plugin
if (window.PluginRegistry) {
    window.PluginRegistry.register('mi-plugin', MiPlugin);
}
```

**¿Cuándo se ejecuta?**
- Al obtener contenido con `getCleanContent()`
- Antes de sincronizar con formularios (`syncWithOriginalInput`)
- Al mostrar código HTML (modal o inline)
- Al enviar formularios

**Ventajas:**
- ✅ Contenido HTML limpio sin elementos de interfaz
- ✅ Extensible para cualquier plugin
- ✅ Separación de responsabilidades
- ✅ No afecta la experiencia visual del usuario

## 💡 Ejemplos de Uso

### Editor Completo con Modal de Código
```javascript
new TextEditor('#editor-completo', {
    plugins: ['history', 'formatting', 'alignment', 'lists', 'tables', 'images', 'links'],
    codeView: 'modal',
    placeholder: 'Crea contenido increíble...',
    height: 400
});
```

### Editor para Documentos con Vista Inline
```javascript
new TextEditor('#editor-documentos', {
    plugins: ['formatting', 'alignment', 'lists', 'images', 'links'],
    codeView: 'inline',
    height: 350
});
```

### Editor Básico para Comentarios
```javascript
new TextEditor('#comentarios', {
    plugins: ['formatting'],
    height: 150
    // Sin codeView = interface minimalista
});
```

### Integración con Formularios
```html
<form>
    <label>Título:</label>
    <input type="text" name="titulo" placeholder="Título del artículo">
    
    <label>Contenido:</label>
    <textarea name="contenido" placeholder="Escribe aquí...">
        Contenido inicial desde base de datos...
    </textarea>
    
    <button type="submit">Guardar</button>
</form>

<script>
// ¡El editor toma automáticamente el placeholder y valor inicial!
new TextEditor('input[name="titulo"]', {
    plugins: ['formatting'],
    height: 40
});

new TextEditor('textarea[name="contenido"]', {
    plugins: ['formatting', 'alignment', 'lists'],
    codeView: 'modal',
    height: 300
});
</script>
```

## 📁 Estructura del Proyecto

```
text-editor/
├── text-editor.js              # Core + PluginRegistry
├── plugins/
│   ├── formatting.js           # Formato + colores
│   ├── alignment.js            # Alineación
│   ├── lists.js               # Listas
│   ├── tables.js              # Tablas completas
│   ├── images.js              # Imágenes
│   ├── links.js               # Enlaces
│   └── history.js             # Deshacer/Rehacer
└── themes/
    └── default/
        ├── theme.css          # Estilos principales
        └── icons/             # Iconos SVG
            ├── bold.svg
            ├── italic.svg
            ├── table.svg
            └── ...
```

## 🎨 Personalización de Temas

El sistema usa CSS Variables para fácil personalización:

```css
:root {
    /* Colores principales */
    --primary-color: #2196f3;
    --text-color: #333;
    --border-color: #ddd;
    --hover-bg: #f5f5f5;
    
    /* Botones */
    --te-button-bg: #fff;
    --te-button-hover: #f0f0f0;
    --te-button-active: #e3f2fd;
}
```

## 🔧 API Completa

### Constructor
```javascript
const editor = new TextEditor(selector, options);
```

### Métodos de Instancia
```javascript
// Contenido
editor.getContent()                    // Obtener HTML
editor.setContent('<p>Nuevo</p>')     // Establecer HTML
editor.getTextContent()               // Obtener texto plano

// Comandos
editor.execCommand('bold')            // Ejecutar comando
editor.insertHTML('<b>Texto</b>')     // Insertar HTML

// Control
editor.focus()                        // Enfocar editor
editor.destroy()                      // Limpiar y destruir

// Toolbar (para plugins)
editor.addButton(config)              // Agregar botón
editor.addSeparator()                 // Agregar separador
editor.createElement(tag, class, content)  // Crear elemento
```

### Plugin Registry (Global)
```javascript
// Registro de plugins
PluginRegistry.register('miPlugin', MiPluginClass);
PluginRegistry.getPlugin('miPlugin');
PluginRegistry.isAvailable('miPlugin');
```

## 🚀 Creando Plugins Personalizados

```javascript
class MiPlugin {
    constructor(editor) {
        this.editor = editor;
    }
    
    init() {
        this.addCustomButton();
    }
    
    addCustomButton() {
        const button = this.editor.createElement('button', 'mi-btn', 'Mi Acción');
        button.addEventListener('click', () => {
            this.editor.insertHTML('<span class="highlight">Texto destacado</span>');
        });
        this.editor.addToToolbar(button);
    }
}

// Registrar globalmente
PluginRegistry.register('MiPlugin', MiPlugin);

// Usar en editor
new TextEditor('#editor', {
    plugins: ['formatting', 'MiPlugin']
});
```

## 🌐 Compatibilidad

- **Chrome 60+** ✅
- **Firefox 55+** ✅  
- **Safari 11+** ✅
- **Edge 79+** ✅
- **Mobile browsers** ✅

## 🎯 Próximas Funcionalidades

- [ ] Plugin de imágenes con drag & drop
- [ ] Shortcuts de teclado personalizables  
- [ ] Modo de solo lectura
- [ ] Plugin de emojis
- [ ] Exportación a PDF/Word
- [ ] Colaboración en tiempo real

## 🤝 Contribuir

1. **Fork** el proyecto
2. **Crea** tu branch (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** al branch (`git push origin feature/nueva-funcionalidad`)
5. **Abre** un Pull Request

## 📄 Licencia

MIT License - Libre para uso comercial y personal.

## 📞 Soporte

- 🎮 **Demo**: [Prueba en vivo](https://leonardojrc.github.io/text-editor/demo.html)
- 🐛 **Bugs**: [Abrir issue](../../issues)
- 💡 **Ideas**: [Discussions](../../discussions)  

---

⭐ **¿Te gusta el proyecto?** ¡Dale una estrella en GitHub!

