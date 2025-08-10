/**
 * Plugin Registry - Maneja la carga y disponibilidad de plugins de forma centralizada
 */
class PluginRegistry {
    constructor() {
        this.plugins = new Map(); // pluginName -> constructor
        this.loadingPromises = new Map(); // pluginName -> Promise
        this.loadedScripts = new Set(); // URLs ya cargadas
        this.basePath = 'text-editor/';
    }

    /**
     * Registrar un plugin (llamado desde los archivos de plugin)
     */
    register(name, constructor) {
        console.log(`📋 Plugin registered: ${name}`);
        this.plugins.set(name, constructor);
    }

    /**
     * Obtener un plugin (espera a que esté disponible)
     */
    async getPlugin(name) {
        // Si ya está registrado, devolverlo inmediatamente
        if (this.plugins.has(name)) {
            return this.plugins.get(name);
        }

        // Si ya se está cargando, esperar a que termine
        if (this.loadingPromises.has(name)) {
            await this.loadingPromises.get(name);
            return this.plugins.get(name);
        }

        // Iniciar la carga del plugin
        const loadingPromise = this.loadPlugin(name);
        this.loadingPromises.set(name, loadingPromise);

        try {
            await loadingPromise;
            return this.plugins.get(name);
        } finally {
            this.loadingPromises.delete(name);
        }
    }

    /**
     * Cargar un plugin desde su archivo
     */
    async loadPlugin(name) {
        const scriptUrl = `${this.basePath}plugins/${name}.js`;

        // Evitar cargar el mismo script múltiples veces
        if (this.loadedScripts.has(scriptUrl)) {
            return;
        }

        console.log(`📦 Loading plugin script: ${scriptUrl}`);

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            
            script.onload = () => {
                console.log(`✅ Plugin script loaded: ${scriptUrl}`);
                this.loadedScripts.add(scriptUrl);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ Failed to load plugin script: ${scriptUrl}`);
                reject(new Error(`Failed to load plugin: ${name}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Cargar múltiples plugins en paralelo
     */
    async loadPlugins(pluginNames) {
        console.log('📦 Loading plugins:', pluginNames);
        
        const promises = pluginNames.map(name => this.getPlugin(name));
        const constructors = await Promise.all(promises);
        
        const result = {};
        pluginNames.forEach((name, index) => {
            result[name] = constructors[index];
        });
        
        console.log('✅ All plugins loaded successfully');
        return result;
    }

    /**
     * Verificar si un plugin está disponible
     */
    isAvailable(name) {
        return this.plugins.has(name);
    }

    /**
     * Obtener lista de plugins disponibles
     */
    getAvailablePlugins() {
        return Array.from(this.plugins.keys());
    }

    /**
     * Configurar la ruta base para los plugins
     */
    setBasePath(basePath) {
        this.basePath = basePath.endsWith('/') ? basePath : basePath + '/';
    }
}

// Crear instancia global del registry
window.PluginRegistry = window.PluginRegistry || new PluginRegistry();

/**
 * TextEditor - Modular Rich Text Editor
 * Una librería simple y extensible para editores de texto enriquecido
 */

class TextEditor {
    constructor(selector, options = {}) {
        this.options = {
            theme: 'default',
            plugins: ['formatting', 'alignment', 'lists', 'tables', 'history'],
            placeholder: 'Escribe aquí tu contenido...',
            height: 300,
            basePath: this.getBasePath(),
            // codeView: 'modal' | 'inline' - Si no se especifica, no se muestra el botón
            ...options
        };
        
        this.container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (!this.container) {
            throw new Error(`Element not found: ${selector}`);
        }

        // Detectar si es un textarea o input para integración con formularios
        this.originalInput = null;
        this.initialValue = '';
        
        if (this.container.tagName === 'TEXTAREA' || 
            (this.container.tagName === 'INPUT' && this.container.type === 'text')) {
            this.originalInput = this.container;
            this.initialValue = this.container.value || '';
            
            // Usar placeholder del elemento si existe
            if (this.container.placeholder && !options.placeholder) {
                this.options.placeholder = this.container.placeholder;
            }
            
            // Crear wrapper y ocultar el input original
            const wrapper = document.createElement('div');
            wrapper.className = 'text-editor-wrapper';
            this.container.parentNode.insertBefore(wrapper, this.container);
            this.container.style.display = 'none';
            this.container = wrapper;
        }
        
        this.id = 'te_' + Math.random().toString(36).substr(2, 9);
        this.plugins = new Map();
        this.pluginStateHandlers = new Map(); // Para manejar el estado de botones por plugin
        this.isCodeMode = false;
        this.history = {
            stack: [],
            index: -1,
            maxSize: 50
        };
        
        this.init();
    }
    
    // Detectar la ruta base de la librería automáticamente
    getBasePath() {
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src && script.src.includes('text-editor.js')) {
                return script.src.replace('/text-editor.js', '') + '/';
            }
        }
        return 'text-editor/'; // fallback
    }
    
    async init() {
        try {
            // 1. Cargar tema
            await this.loadTheme();
            
            // 2. Crear estructura HTML
            this.createEditor();
            
            // 3. Cargar plugins
            await this.loadPlugins();
            
            // 4. Inicializar funcionalidad
            this.initializeEvents();
            
            console.log('✅ TextEditor initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing TextEditor:', error);
        }
    }
    
    // Cargar CSS del tema
    async loadTheme() {
        const themeUrl = `${this.options.basePath}themes/${this.options.theme}/theme.css`;
        
        // Verificar si ya está cargado
        if (document.querySelector(`link[href="${themeUrl}"]`)) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = themeUrl;
        
        return new Promise((resolve, reject) => {
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load theme: ${this.options.theme}`));
            document.head.appendChild(link);
        });
    }
    
    // Crear la estructura HTML del editor
    createEditor() {
        this.container.innerHTML = `
            <div class="text-editor" id="${this.id}">
                <div class="text-editor__toolbar" id="${this.id}_toolbar">
                    <!-- Los plugins llenarán esto -->
                </div>
                <div class="text-editor__divider"></div>
                <div class="text-editor__editor-wrapper">
                    <div 
                        class="text-editor__content" 
                        contenteditable="true" 
                        id="${this.id}_content"
                        style="min-height: ${this.options.height}px"
                    ></div>
                    <div class="text-editor__placeholder" id="${this.id}_placeholder">
                        ${this.options.placeholder}
                    </div>
                </div>
            </div>
        `;
        
        this.toolbar = document.getElementById(`${this.id}_toolbar`);
        this.content = document.getElementById(`${this.id}_content`);
        this.placeholder = document.getElementById(`${this.id}_placeholder`);
    }
    
    // Cargar plugins dinámicamente usando Plugin Registry
    async loadPlugins() {
        console.log(`🔄 Loading plugins for editor ${this.id}:`, this.options.plugins);
        
        try {
            // Configurar la ruta base en el registry
            window.PluginRegistry.setBasePath(this.options.basePath);
            
            // Cargar todos los plugins usando el registry
            const pluginConstructors = await window.PluginRegistry.loadPlugins(this.options.plugins);
            
            // Crear instancias para este editor específico
            console.log(`🔧 Creating plugin instances for editor: ${this.id}`);
            for (const [pluginName, PluginConstructor] of Object.entries(pluginConstructors)) {
                if (PluginConstructor && typeof PluginConstructor === 'function') {
                    // Crear instancia del plugin para este editor
                    const plugin = new PluginConstructor(this);
                    this.plugins.set(pluginName, plugin);
                    
                    // Inicializar el plugin
                    console.log(`🔧 Initializing plugin ${pluginName} for editor: ${this.id}`);
                    if (plugin.init && typeof plugin.init === 'function') {
                        plugin.init();
                        console.log(`✅ Plugin ${pluginName} initialized for editor: ${this.id}`);
                    }
                    
                    console.log(`✅ Plugin loaded for ${this.id}: ${pluginName}`);
                } else {
                    console.error(`❌ Invalid plugin constructor for ${pluginName}`);
                }
            }
            
        } catch (error) {
            console.error(`❌ Error loading plugins for ${this.id}:`, error);
        }
    }
    
    // Cargar script dinámicamente
    loadScript(url) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (document.querySelector(`script[src="${url}"]`)) {
                console.log(`📦 Script already loaded: ${url}`);
                resolve();
                return;
            }
            
            console.log(`📦 Loading script: ${url}`);
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                console.log(`✅ Script loaded successfully: ${url}`);
                resolve();
            };
            script.onerror = (error) => {
                console.error(`❌ Failed to load script: ${url}`, error);
                reject(new Error(`Failed to load script: ${url}`));
            };
            document.head.appendChild(script);
        });
    }
    
    // Inicializar eventos del editor
    initializeEvents() {
        // Establecer contenido inicial si viene de un textarea/input
        if (this.initialValue) {
            this.content.innerHTML = this.initialValue;
        }
        
        // Crear botón de vista de código según configuración
        if (this.options.codeView) {
            this.createCodeViewButton();
        }
        
        // Configurar observador automático del placeholder
        this.setupPlaceholderObserver();
        
        // Manejar eventos de focus/blur para el placeholder
        this.content.addEventListener('focus', () => this.updatePlaceholder());
        this.content.addEventListener('blur', () => this.updatePlaceholder());
        this.content.addEventListener('input', () => {
            // No necesitamos llamar updatePlaceholder aquí porque el observer lo hace automáticamente
            this.syncWithOriginalInput();
        });
        
        // Actualizar placeholder inicial
        this.updatePlaceholder();
        
        // Actualizar estado de botones
        this.content.addEventListener('keyup', () => this.updateToolbarState());
        this.content.addEventListener('mouseup', () => this.updateToolbarState());
        this.content.addEventListener('focus', () => this.updateToolbarState());
    }
    
    // Configurar observador automático para el placeholder
    setupPlaceholderObserver() {
        // Crear MutationObserver que detecta cambios en el contenido
        this.contentObserver = new MutationObserver((mutations) => {
            let contentChanged = false;
            
            mutations.forEach((mutation) => {
                // Detectar cambios en el contenido (texto, nodos agregados/removidos)
                if (mutation.type === 'childList' || 
                    mutation.type === 'characterData' || 
                    (mutation.type === 'attributes' && mutation.attributeName === 'innerHTML')) {
                    contentChanged = true;
                }
            });
            
            if (contentChanged) {
                // Actualizar placeholder automáticamente
                this.updatePlaceholder();
                // Sincronizar con input original si existe
                this.syncWithOriginalInput();
            }
        });
        
        // Observar cambios en el contenido del editor
        this.contentObserver.observe(this.content, {
            childList: true,           // Detectar nodos agregados/removidos
            subtree: true,            // Observar toda la jerarquía
            characterData: true,      // Detectar cambios en el texto
            attributes: true,         // Detectar cambios en atributos
            attributeOldValue: true   // Incluir valores anteriores
        });
        
        console.log(`🔍 Placeholder observer configured for editor: ${this.id}`);
    }
    
    // Verificar si el editor está vacío
    isEmpty() {
        const content = this.content.innerHTML.trim();
        return content === '' || 
               content === '<br>' || 
               content === '<p><br></p>' ||
               content === '<div><br></div>';
    }
    
    // Normalizar contenido para comparación
    normalizeContent(content) {
        const trimmed = content.trim();
        // Si está vacío según nuestra definición, retornar cadena vacía
        if (trimmed === '' || 
            trimmed === '<br>' || 
            trimmed === '<p><br></p>' ||
            trimmed === '<div><br></div>') {
            return '';
        }
        return trimmed;
    }
    
    // Actualizar visibilidad del placeholder
    updatePlaceholder() {
        if (this.placeholder) {
            // En modo código, el placeholder nunca debe ser visible
            if (this.isCodeMode) {
                this.placeholder.style.display = 'none';
            } else if (this.isEmpty()) {
                this.placeholder.style.display = 'block';
            } else {
                this.placeholder.style.display = 'none';
            }
        }
    }
    
    // Sincronizar contenido con el input/textarea original (para formularios)
    syncWithOriginalInput() {
        if (this.originalInput) {
            this.originalInput.value = this.getCleanContent();
        }
    }
    
    // Actualizar estado visual de botones de la toolbar
    updateToolbarState() {
        // No actualizar estado si estamos en modo código
        if (this.isCodeMode) {
            return;
        }
        
        const buttons = this.toolbar.querySelectorAll('.text-editor__button[data-command]');
        buttons.forEach(button => {
            const command = button.dataset.command;
            try {
                const isActive = document.queryCommandState(command);
                button.setAttribute('aria-pressed', isActive);
            } catch (e) {
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }
    
    // API para que los plugins agreguen botones
    addButton(config) {
        if (!this.toolbar) {
            console.warn('⚠️  Toolbar not ready for editor:', this.id);
            return null;
        }
        
        const button = document.createElement('button');
        button.type = 'button'; // 🔥 CRÍTICO: Evitar submit accidental en formularios
        button.className = 'text-editor__button';
        button.title = config.title;
        button.setAttribute('aria-label', config.title);
        
        if (config.command) {
            button.dataset.command = config.command;
        }
        
        if (config.icon) {
            const iconPath = `${this.options.basePath}themes/${this.options.theme}/icons/${config.icon}`;
            button.innerHTML = `<img class="text-editor__icon" src="${iconPath}" alt="${config.title}" />`;
        } else if (config.text) {
            button.textContent = config.text;
        }
        
        if (config.onClick) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                config.onClick(this);
            });
        }
        
        this.toolbar.appendChild(button);
        console.log(`🔘 Button added to ${this.id}: ${config.title}`);
        return button;
    }
    
    // API para agregar separadores
    addSeparator() {
        if (!this.toolbar) {
            console.warn('⚠️  Toolbar not ready for editor:', this.id);
            return null;
        }
        
        const separator = document.createElement('div');
        separator.className = 'text-editor__separator';
        this.toolbar.appendChild(separator);
        console.log(`📏 Separator added to ${this.id}`);
        return separator;
    }
    
    // API para crear elementos HTML (usado por plugins)
    createElement(tagName, className = '', content = '') {
        const element = document.createElement(tagName);
        
        // 🔥 CRÍTICO: Prevenir submit accidental en formularios
        if (tagName.toLowerCase() === 'button') {
            element.type = 'button';
        }
        
        if (className) {
            element.className = className;
        }
        if (content) {
            element.innerHTML = content;
        }
        return element;
    }
    
    // API para agregar elementos al toolbar (usado por plugins)
    addToToolbar(element) {
        if (!this.toolbar) {
            console.warn('⚠️  Toolbar not ready for editor:', this.id);
            return null;
        }
        
        this.toolbar.appendChild(element);
        return element;
    }
    
    // API para que plugins registren manejadores de estado de botones
    registerStateHandler(pluginName, handler) {
        this.pluginStateHandlers.set(pluginName, handler);
    }
    
    // Actualizar estado de todos los botones usando los manejadores registrados
    updateAllButtonStates() {
        this.pluginStateHandlers.forEach((handler, pluginName) => {
            try {
                handler();
            } catch (error) {
                console.warn(`⚠️  Error updating button state for plugin ${pluginName}:`, error);
            }
        });
    }
    
    // Ejecutar comando de edición
    execCommand(command, value = null) {
        this.content.focus();
        document.execCommand(command, false, value);
        
        // Actualizar toolbar y sincronizar después de ejecutar comando
        setTimeout(() => {
            this.updateToolbarState();
            this.syncWithOriginalInput();
        }, 10);
    }
    
    // Insertar HTML
    insertHTML(html) {
        this.execCommand('insertHTML', html);
    }
    
    // Obtener contenido del editor
    getContent() {
        return this.content.innerHTML;
    }
    
    // Obtener contenido HTML limpio (sin clases de highlighting)
    getCleanContent() {
        // Crear una copia temporal del contenido
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.content.innerHTML;
        
        // Llamar a todos los plugins que tengan método cleanContent
        this.plugins.forEach((plugin, pluginName) => {
            if (plugin.cleanContent && typeof plugin.cleanContent === 'function') {
                try {
                    plugin.cleanContent(tempDiv);
                    console.log(`🧹 Content cleaned by plugin: ${pluginName}`);
                } catch (error) {
                    console.warn(`⚠️ Error cleaning content in plugin ${pluginName}:`, error);
                }
            }
        });
        
        // Limpiar atributos class vacíos
        const elementsWithEmptyClass = tempDiv.querySelectorAll('[class=""]');
        elementsWithEmptyClass.forEach(element => {
            element.removeAttribute('class');
        });
        
        return tempDiv.innerHTML;
    }
    
    // Establecer contenido del editor
    setContent(html) {
        this.content.innerHTML = html;
        // El observer se encargará automáticamente de updatePlaceholder() y syncWithOriginalInput()
    }
    
    // Obtener contenido como texto plano
    getTextContent() {
        return this.content.textContent;
    }
    
    // Enfocar el editor
    focus() {
        this.content.focus();
    }
    
    // Crear botón de vista de código
    createCodeViewButton() {
        // Agregar separador
        const separator = this.createElement('div', 'text-editor__separator');
        this.toolbar.appendChild(separator);
        
        if (this.options.codeView === 'modal') {
            // Crear botón simple para modal
            const codeButton = this.createElement('button', 'text-editor__button');
            codeButton.title = 'Ver código HTML en modal';
            codeButton.innerHTML = `<img class="text-editor__icon" src="${this.options.basePath}themes/${this.options.theme}/icons/code.svg" alt="Código HTML" />`;
            codeButton.addEventListener('click', () => this.showCodeModal());
            this.toolbar.appendChild(codeButton);
        } else if (this.options.codeView === 'inline') {
            // Crear botón toggle para vista inline
            const codeButton = this.createElement('button', 'text-editor__button');
            codeButton.title = 'Alternar vista de código';
            codeButton.innerHTML = `<img class="text-editor__icon" src="${this.options.basePath}themes/${this.options.theme}/icons/code.svg" alt="Código HTML" />`;
            codeButton.setAttribute('data-code-toggle', 'true');
            codeButton.addEventListener('click', () => this.toggleCodeMode());
            this.toolbar.appendChild(codeButton);
        }
    }
    
    // Alternar entre modo visual y código HTML
    toggleCodeMode() {
        const codeButton = this.toolbar.querySelector('[data-code-toggle="true"]');
        
        if (!this.isCodeMode) {
            // Cambiar a modo código
            this.isCodeMode = true;
            
            // Obtener contenido HTML limpio 
            let htmlContent = this.getCleanContent().trim();
            
            // Ocultar placeholder cuando cambiamos a modo código
            this.updatePlaceholder();
            
            // Crear textarea para el código HTML
            this.content.style.display = 'none';
            this.codeTextarea = document.createElement('textarea');
            this.codeTextarea.className = 'text-editor__code-textarea';
            this.codeTextarea.style.cssText = `
                width: 100%;
                height: ${this.options.height}px;
                min-height: ${this.options.height}px;
                font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                font-size: 13px;
                padding: 10px;
                border: none;
                outline: none;
                resize: vertical;
                background: #f8f9fa;
                color: #333;
                line-height: 1.4;
            `;
            this.codeTextarea.value = this.formatHtml(htmlContent);
            this.content.parentNode.appendChild(this.codeTextarea);
            
            // Actualizar botón
            codeButton.classList.add('text-editor__button--active');
            codeButton.title = 'Volver a modo visual';
            
            // Deshabilitar TODOS los otros botones (incluyendo botones split de color)
            this.toolbar.querySelectorAll('button:not([data-code-toggle])').forEach(btn => {
                btn.disabled = true;
            });
            
            // También deshabilitar contenedores de split buttons
            this.toolbar.querySelectorAll('.te-split-btn').forEach(splitBtn => {
                splitBtn.classList.add('disabled');
            });
        } else {
            // Cambiar a modo visual
            this.isCodeMode = false;
            
            // Guardar el contenido actual para comparar (normalizado)
            const currentContent = this.normalizeContent(this.content.innerHTML);
            
            // Actualizar contenido del editor
            const newContent = this.codeTextarea.value.trim();
            this.content.innerHTML = newContent;
            this.content.style.display = '';
            this.codeTextarea.remove();
            this.codeTextarea = null;
            
            // Normalizar el nuevo contenido para comparación
            const normalizedNewContent = this.normalizeContent(newContent);
            
            // Si el contenido realmente cambió, forzar guardado de estado
            if (currentContent !== normalizedNewContent) {
                this.lastCodeModeChange = { 
                    from: currentContent, 
                    to: normalizedNewContent, 
                    timestamp: Date.now() 
                };
            }
            
            // Actualizar placeholder según el contenido
            this.updatePlaceholder();
            this.syncWithOriginalInput();
            
            // Actualizar botón
            codeButton.classList.remove('text-editor__button--active');
            codeButton.title = 'Ver/Editar código HTML';
            
            // Rehabilitar TODOS los otros botones
            this.toolbar.querySelectorAll('button:not([data-code-toggle])').forEach(btn => {
                btn.disabled = false;
            });
            
            // También rehabilitar contenedores de split buttons
            this.toolbar.querySelectorAll('.te-split-btn').forEach(splitBtn => {
                splitBtn.classList.remove('disabled');
            });
            
            // Actualizar estado de cada botón usando sus manejadores específicos
            this.updateAllButtonStates();
        }
    }
    
    // Formatear HTML para mejor legibilidad
    formatHtml(html) {
        if (!html || !html.trim()) return '';
        
        // Primero limpiar espacios extra y normalizar
        let clean = html.replace(/\s+/g, ' ').trim();
        
        // Separar etiquetas en líneas diferentes, pero mantener contenido inline junto
        let formatted = clean
            .replace(/></g, '>\n<')  // Separar etiquetas adyacentes
            .replace(/(<\/[^>]+>)/g, '$1\n')  // Nueva línea después de etiquetas de cierre
            .replace(/(<[^/][^>]*>)([^<])/g, '$1$2')  // Mantener contenido inline con su etiqueta
            .replace(/([^>])(<\/)/g, '$1$2'); // Mantener contenido inline con su etiqueta de cierre
        
        const lines = formatted.split('\n');
        let indentLevel = 0;
        const indentSize = '  ';
        const result = [];
        
        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Contar etiquetas de apertura y cierre en esta línea
            const openTags = (trimmed.match(/<[^\/][^>]*>/g) || [])
                .filter(tag => !this.isSelfClosingTag(tag) && !tag.endsWith('/>'));
            const closeTags = trimmed.match(/<\/[^>]*>/g) || [];
            
            // Si hay más etiquetas de cierre que de apertura, reducir indentación primero
            const netClosing = closeTags.length - openTags.length;
            if (netClosing > 0) {
                indentLevel = Math.max(0, indentLevel - netClosing);
            }
            
            // Agregar la línea con la indentación actual
            result.push(indentSize.repeat(indentLevel) + trimmed);
            
            // Si hay más etiquetas de apertura que de cierre, aumentar indentación
            const netOpening = openTags.length - closeTags.length;
            if (netOpening > 0) {
                indentLevel += netOpening;
            }
        }
        
        return result.join('\n');
    }
    
    // Verificar si es una etiqueta que se cierra a sí misma
    isSelfClosingTag(tagString) {
        // Etiquetas HTML que se cierran a sí mismas
        const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        
        // Extraer el nombre de la etiqueta
        const tagMatch = tagString.match(/<\s*(\w+)/);
        if (!tagMatch) return false;
        
        const tagName = tagMatch[1].toLowerCase();
        return selfClosingTags.includes(tagName);
    }
    
    // Mostrar modal de código HTML
    showCodeModal() {
        // Crear modal si no existe
        if (!this.codeModal) {
            this.createCodeModal();
        }
        
        // Obtener HTML formateado y limpio
        const htmlContent = this.formatHtml(this.getCleanContent());
        
        // Mostrar en textarea
        this.codeModal.querySelector('.te-modal-textarea').value = htmlContent;
        
        // Mostrar modal
        this.codeModal.style.display = 'flex';
        
        // Enfocar textarea
        setTimeout(() => {
            this.codeModal.querySelector('.te-modal-textarea').focus();
        }, 100);
    }
    
    // Crear modal de código HTML
    createCodeModal() {
        this.codeModal = document.createElement('div');
        this.codeModal.className = 'te-modal-overlay';
        this.codeModal.innerHTML = `
            <div class="te-modal" style="max-width: 800px; width: 90vw;">
                <h3>Código HTML</h3>
                <div class="te-modal-field">
                    <label>HTML del editor:</label>
                    <textarea class="te-modal-textarea" rows="20" style="font-family: 'Courier New', monospace; font-size: 13px; resize: vertical; width: 100%; box-sizing: border-box; min-height: 400px;"></textarea>
                </div>
                <div class="te-modal-buttons">
                    <button type="button" class="te-modal-btn te-modal-btn-secondary">Cerrar</button>
                    <button type="button" class="te-modal-btn te-modal-btn-primary">Aplicar cambios</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.codeModal);
        
        // Eventos del modal
        const closeBtn = this.codeModal.querySelector('.te-modal-btn-secondary');
        const applyBtn = this.codeModal.querySelector('.te-modal-btn-primary');
        const textarea = this.codeModal.querySelector('.te-modal-textarea');
        
        // Cerrar modal
        closeBtn.addEventListener('click', () => {
            this.codeModal.style.display = 'none';
        });
        
        // Cerrar al hacer clic en overlay
        this.codeModal.addEventListener('click', (e) => {
            if (e.target === this.codeModal) {
                this.codeModal.style.display = 'none';
            }
        });
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.codeModal.style.display === 'flex') {
                this.codeModal.style.display = 'none';
            }
        });
        
        // Aplicar cambios
        applyBtn.addEventListener('click', () => {
            const confirmed = confirm('¿Aplicar los cambios al editor? Esto reemplazará el contenido actual.');
            if (confirmed) {
                this.content.innerHTML = textarea.value;
                this.codeModal.style.display = 'none';
                // El observer se encargará automáticamente de updatePlaceholder() y syncWithOriginalInput()
            }
        });
    }
    
    // Destruir el editor
    destroy() {
        // Limpiar el observer del placeholder
        if (this.contentObserver) {
            this.contentObserver.disconnect();
            this.contentObserver = null;
        }
        
        // Limpiar plugins
        this.plugins.forEach(plugin => {
            if (plugin.destroy) {
                plugin.destroy();
            }
        });
        this.plugins.clear();
        
        // Limpiar HTML
        this.container.innerHTML = '';
    }
}

// Hacer disponible globalmente
window.TextEditor = TextEditor;
