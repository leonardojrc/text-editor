/**
 * Images Plugin - Funcionalidad para insertar imágenes
 */

class ImagesPlugin {
    constructor(editor) {
        this.editor = editor;
        this.currentRange = null;
        this.originalImageAspectRatio = null;
    }

    init() {
        this.createButton();
        this.createModal();
    }

    createButton() {
        // Crear botón de imagen
        const imageButton = this.editor.createElement('button', 'text-editor__button');
        const iconPath = `${this.editor.options.basePath}themes/${this.editor.options.theme}/icons/image.svg`;
        imageButton.innerHTML = `<img src="${iconPath}" class="text-editor__icon" alt="Imagen">`;
        imageButton.title = 'Insertar imagen';
        imageButton.addEventListener('click', () => this.showModal());
        
        this.editor.addToToolbar(imageButton);
    }

    createModal() {
        // Crear modal
        this.modal = document.createElement('div');
        this.modal.className = 'te-modal-overlay';
        this.modal.innerHTML = `
            <div class="te-modal">
                <div class="te-modal-header">
                    <h3>Insertar imagen</h3>
                    <button type="button" class="te-modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="te-modal-body">
                    <div class="te-modal-field">
                        <label for="te-img-url-${this.editor.id}">URL de la imagen:</label>
                        <input type="url" id="te-img-url-${this.editor.id}" placeholder="https://ejemplo.com/imagen.jpg">
                    </div>
                    <div class="te-modal-field">
                        <label for="te-img-alt-${this.editor.id}">Texto alternativo (alt):</label>
                        <input type="text" id="te-img-alt-${this.editor.id}" placeholder="Descripción de la imagen (opcional)">
                    </div>
                    <div class="te-modal-row">
                        <div class="te-modal-field">
                            <label for="te-img-width-${this.editor.id}">Ancho (px):</label>
                            <input type="number" id="te-img-width-${this.editor.id}" placeholder="Auto" min="1">
                        </div>
                        <div class="te-modal-field">
                            <label for="te-img-height-${this.editor.id}">Alto (px):</label>
                            <input type="number" id="te-img-height-${this.editor.id}" placeholder="Auto" min="1">
                        </div>
                    </div>
                    <div class="te-modal-field">
                        <label class="te-modal-checkbox">
                            <input type="checkbox" id="te-img-keep-aspect-${this.editor.id}" checked>
                            <span>Mantener proporción original</span>
                        </label>
                    </div>
                </div>
                <div class="te-modal-footer">
                    <button type="button" class="te-modal-btn te-modal-btn-secondary">Cancelar</button>
                    <button type="button" class="te-modal-btn te-modal-btn-primary">Insertar imagen</button>
                </div>
            </div>
        `;

        // Agregar al body
        document.body.appendChild(this.modal);

        // Event listeners
        this.setupModalEvents();
    }

    setupModalEvents() {
        const closeBtn = this.modal.querySelector('.te-modal-close');
        const cancelBtn = this.modal.querySelector('.te-modal-btn-secondary');
        const insertBtn = this.modal.querySelector('.te-modal-btn-primary');
        const urlInput = this.modal.querySelector(`#te-img-url-${this.editor.id}`);
        const widthInput = this.modal.querySelector(`#te-img-width-${this.editor.id}`);
        const heightInput = this.modal.querySelector(`#te-img-height-${this.editor.id}`);
        const keepAspectCheckbox = this.modal.querySelector(`#te-img-keep-aspect-${this.editor.id}`);

        // Cerrar modal
        closeBtn.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        
        // Cerrar al hacer clic fuera
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Insertar imagen
        insertBtn.addEventListener('click', () => this.insertImage());

        // Enter para insertar
        this.modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
                this.insertImage();
            } else if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // Prevenir espacios en la URL
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
            }
        });

        // Auto-agregar https:// y cargar dimensiones
        urlInput.addEventListener('input', (e) => {
            let cleanUrl = e.target.value.replace(/\s/g, '');
            if (e.target.value !== cleanUrl) {
                e.target.value = cleanUrl;
            }

            // Auto-agregar https:// si parece una URL válida sin protocolo
            if (cleanUrl && !cleanUrl.match(/^https?:\/\//) && !cleanUrl.match(/^data:/)) {
                if (cleanUrl.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || cleanUrl.startsWith('www.')) {
                    cleanUrl = 'https://' + cleanUrl;
                    e.target.value = cleanUrl;
                }
            }

            // Cargar imagen para obtener dimensiones originales
            if (cleanUrl && (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:'))) {
                this.loadImageDimensions(cleanUrl);
            }
        });

        // Mantener proporción al cambiar ancho
        widthInput.addEventListener('input', (e) => {
            if (keepAspectCheckbox.checked && this.originalImageAspectRatio && e.target.value) {
                const width = parseInt(e.target.value);
                if (!isNaN(width)) {
                    const height = Math.round(width / this.originalImageAspectRatio);
                    heightInput.value = height;
                }
            }
        });

        // Mantener proporción al cambiar alto
        heightInput.addEventListener('input', (e) => {
            if (keepAspectCheckbox.checked && this.originalImageAspectRatio && e.target.value) {
                const height = parseInt(e.target.value);
                if (!isNaN(height)) {
                    const width = Math.round(height * this.originalImageAspectRatio);
                    widthInput.value = width;
                }
            }
        });

        // Auto-focus en URL
        urlInput.addEventListener('focus', () => urlInput.select());
    }

    // Cargar dimensiones automáticamente de la imagen
    loadImageDimensions(url) {
        const img = new Image();
        const widthInput = this.modal.querySelector(`#te-img-width-${this.editor.id}`);
        const heightInput = this.modal.querySelector(`#te-img-height-${this.editor.id}`);
        
        img.onload = () => {
            this.originalImageAspectRatio = img.width / img.height;
            
            // Si no hay dimensiones especificadas, sugerir las originales
            if (!widthInput.value && !heightInput.value) {
                // Limitar tamaño máximo sugerido
                let suggestedWidth = img.width;
                let suggestedHeight = img.height;
                
                const maxWidth = 600;
                const maxHeight = 400;
                
                if (suggestedWidth > maxWidth) {
                    suggestedWidth = maxWidth;
                    suggestedHeight = Math.round(maxWidth / this.originalImageAspectRatio);
                }
                
                if (suggestedHeight > maxHeight) {
                    suggestedHeight = maxHeight;
                    suggestedWidth = Math.round(maxHeight * this.originalImageAspectRatio);
                }
                
                widthInput.placeholder = suggestedWidth + 'px';
                heightInput.placeholder = suggestedHeight + 'px';
            }
        };
        
        img.onerror = () => {
            this.originalImageAspectRatio = null;
            widthInput.placeholder = 'Auto';
            heightInput.placeholder = 'Auto';
        };
        
        img.src = url;
    }

    showModal() {
        // Guardar rango de selección
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.currentRange = selection.getRangeAt(0).cloneRange();
        }

        // Limpiar campos y resetear aspect ratio
        this.modal.querySelector(`#te-img-url-${this.editor.id}`).value = '';
        this.modal.querySelector(`#te-img-alt-${this.editor.id}`).value = '';
        this.modal.querySelector(`#te-img-width-${this.editor.id}`).value = '';
        this.modal.querySelector(`#te-img-height-${this.editor.id}`).value = '';
        this.modal.querySelector(`#te-img-keep-aspect-${this.editor.id}`).checked = true;
        
        // Resetear placeholders y aspect ratio
        this.modal.querySelector(`#te-img-width-${this.editor.id}`).placeholder = 'Auto';
        this.modal.querySelector(`#te-img-height-${this.editor.id}`).placeholder = 'Auto';
        this.originalImageAspectRatio = null;

        // Mostrar modal
        this.modal.style.display = 'flex';
        
        // Enfocar en URL
        setTimeout(() => {
            this.modal.querySelector(`#te-img-url-${this.editor.id}`).focus();
        }, 100);
    }

    hideModal() {
        this.modal.style.display = 'none';
        this.editor.focus();
    }

    insertImage() {
        const urlInput = this.modal.querySelector(`#te-img-url-${this.editor.id}`);
        const altInput = this.modal.querySelector(`#te-img-alt-${this.editor.id}`);
        const widthInput = this.modal.querySelector(`#te-img-width-${this.editor.id}`);
        const heightInput = this.modal.querySelector(`#te-img-height-${this.editor.id}`);

        const url = urlInput.value.trim();
        const alt = altInput.value.trim();
        const width = widthInput.value.trim();
        const height = heightInput.value.trim();

        if (!url) {
            alert('Por favor ingresa una URL válida para la imagen');
            urlInput.focus();
            return;
        }

        // Restaurar selección
        if (this.currentRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.currentRange);
        }

        // Crear HTML de la imagen
        let imgHTML = `<img src="${url}"`;
        
        if (alt) {
            imgHTML += ` alt="${alt}"`;
        }

        let style = '';
        if (width) {
            style += `width: ${width}px; `;
        }
        if (height) {
            style += `height: ${height}px; `;
        }

        if (style) {
            imgHTML += ` style="${style}"`;
        }

        imgHTML += `>`;

        // Insertar la imagen
        this.editor.focus();
        this.editor.insertHTML(imgHTML);

        // Cerrar modal
        this.hideModal();

        // Agregar al historial
        if (this.editor.plugins.has('history')) {
            this.editor.plugins.get('history').saveState();
        }
    }

    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
}

// Registrar el plugin
window.PluginRegistry.register('images', ImagesPlugin);
