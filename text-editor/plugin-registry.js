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

// Export para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PluginRegistry;
}
