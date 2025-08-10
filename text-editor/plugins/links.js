/**
 * Links P    createButton() {
        // Crear botón de enlace
        const linkButton = this.editor.createElement('button', 'text-editor__button');
        const iconPath = `${this.editor.options.basePath}themes/${this.editor.options.theme}/icons/link.svg`;
        linkButton.innerHTML = `<img src="${iconPath}" class="text-editor__icon" alt="Enlace">`;
        linkButton.title = 'Insertar enlace';
        linkButton.addEventListener('click', () => this.showModal());
        
        this.editor.addToToolbar(linkButton);
    }uncionalidad para insertar enlaces
 */

class LinksPlugin {
    constructor(editor) {
        this.editor = editor;
        this.currentRange = null;
    }

    init() {
        this.createButton();
        this.createModal();
    }

    createButton() {
        // Crear botón de enlace
        const linkButton = this.editor.createElement('button', 'text-editor__button');
        linkButton.innerHTML = `<img src="${this.editor.options.basePath}themes/${this.editor.options.theme}/icons/link.svg" class="text-editor__icon" alt="Enlace">`;
        linkButton.title = 'Insertar enlace';
        linkButton.addEventListener('click', () => this.showModal());
        
        this.editor.addToToolbar(linkButton);
    }

    createModal() {
        // Crear modal
        this.modal = document.createElement('div');
        this.modal.className = 'te-modal-overlay';
        this.modal.innerHTML = `
            <div class="te-modal">
                <div class="te-modal-header">
                    <h3>Insertar enlace</h3>
                    <button type="button" class="te-modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="te-modal-body">
                    <div class="te-modal-field">
                        <label for="te-link-url-${this.editor.id}">URL del enlace:</label>
                        <input type="url" id="te-link-url-${this.editor.id}" placeholder="https://ejemplo.com">
                    </div>
                    <div class="te-modal-field">
                        <label for="te-link-text-${this.editor.id}">Texto del enlace:</label>
                        <input type="text" id="te-link-text-${this.editor.id}" placeholder="Texto que se mostrará">
                    </div>
                    <div class="te-modal-field">
                        <label for="te-link-title-${this.editor.id}">Título (tooltip):</label>
                        <input type="text" id="te-link-title-${this.editor.id}" placeholder="Texto al pasar el mouse (opcional)">
                    </div>
                    <div class="te-modal-field">
                        <label for="te-link-target-${this.editor.id}">Abrir en:</label>
                        <select id="te-link-target-${this.editor.id}">
                            <option value="_self">Misma ventana</option>
                            <option value="_blank">Nueva ventana</option>
                        </select>
                    </div>
                </div>
                <div class="te-modal-footer">
                    <button type="button" class="te-modal-btn te-modal-btn-secondary">Cancelar</button>
                    <button type="button" class="te-modal-btn te-modal-btn-primary">Insertar enlace</button>
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
        const urlInput = this.modal.querySelector(`#te-link-url-${this.editor.id}`);
        const textInput = this.modal.querySelector(`#te-link-text-${this.editor.id}`);

        // Estado para sincronización automática de texto
        this.isTextAutoSynced = true;

        // Cerrar modal
        closeBtn.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        
        // Cerrar al hacer clic fuera
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Insertar enlace
        insertBtn.addEventListener('click', () => this.insertLink());

        // Enter para insertar
        this.modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
                this.insertLink();
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

        // Lógica avanzada de URL y sincronización de texto
        urlInput.addEventListener('input', (e) => {
            // Limpiar espacios de la URL
            let cleanUrl = e.target.value.replace(/\s/g, '');
            if (e.target.value !== cleanUrl) {
                e.target.value = cleanUrl;
            }

            // Auto-agregar https:// si parece una URL válida sin protocolo
            if (cleanUrl && !cleanUrl.match(/^https?:\/\//) && !cleanUrl.match(/^mailto:/) && !cleanUrl.match(/^tel:/)) {
                // Detectar si parece una URL (contiene punto y no es una ruta local)
                if (cleanUrl.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || cleanUrl.startsWith('www.')) {
                    cleanUrl = 'https://' + cleanUrl;
                    e.target.value = cleanUrl;
                }
            }

            // Sincronizar con el texto solo si está en modo automático
            if (this.isTextAutoSynced) {
                let displayText = cleanUrl;
                
                // Limpiar la URL para mostrarla más amigable
                displayText = displayText.replace(/^https?:\/\//, ''); // Quitar protocolo
                displayText = displayText.replace(/^www\./, ''); // Quitar www
                displayText = displayText.replace(/\/$/, ''); // Quitar slash final
                
                textInput.value = displayText;
                textInput.placeholder = displayText || 'Texto que se mostrará';
            }
        });

        // Detectar cuando el usuario modifica manualmente el texto
        textInput.addEventListener('input', () => {
            // Si el usuario está escribiendo en el campo de texto, desactivar sincronización
            this.isTextAutoSynced = false;
        });

        // Detectar cuando el campo de texto recibe foco manual
        textInput.addEventListener('focus', (e) => {
            // Si el usuario hace foco manualmente y hay contenido, desactivar sincronización
            if (e.target.value) {
                this.isTextAutoSynced = false;
            }
        });

        // Auto-focus y selección
        urlInput.addEventListener('focus', () => urlInput.select());
    }

    showModal() {
        // Guardar rango de selección y obtener texto seleccionado
        const selection = window.getSelection();
        let selectedText = '';
        let existingLink = null;
        
        if (selection.rangeCount > 0) {
            this.currentRange = selection.getRangeAt(0).cloneRange();
            selectedText = selection.toString().trim();
            
            // Detectar si el cursor está en un enlace existente
            existingLink = this.getExistingLink();
        }

        // Limpiar campos con valores por defecto
        let urlValue = '';
        let textValue = selectedText;
        let titleValue = '';
        let targetValue = '_self';

        // Si hay un enlace existente, pre-rellenar con sus valores
        if (existingLink) {
            urlValue = existingLink.href || '';
            textValue = existingLink.textContent || '';
            titleValue = existingLink.title || '';
            targetValue = existingLink.target || '_self';
        }

        // Establecer valores en los campos
        this.modal.querySelector(`#te-link-url-${this.editor.id}`).value = urlValue;
        this.modal.querySelector(`#te-link-text-${this.editor.id}`).value = textValue;
        this.modal.querySelector(`#te-link-title-${this.editor.id}`).value = titleValue;
        this.modal.querySelector(`#te-link-target-${this.editor.id}`).value = targetValue;

        // Resetear sincronización automática solo si no hay texto y no es edición
        this.isTextAutoSynced = !textValue && !existingLink;
        this.editingExistingLink = !!existingLink;
        this.currentEditingLink = existingLink; // Guardar referencia al enlace que estamos editando

        // Actualizar título del modal
        const modalTitle = this.modal.querySelector('h3');
        const insertButton = this.modal.querySelector('.te-modal-btn-primary');
        
        if (existingLink) {
            modalTitle.textContent = 'Editar enlace';
            insertButton.textContent = 'Actualizar enlace';
        } else {
            modalTitle.textContent = 'Insertar enlace';
            insertButton.textContent = 'Insertar enlace';
        }

        // Mostrar modal
        this.modal.style.display = 'flex';
        
        // Enfocar en URL
        setTimeout(() => {
            this.modal.querySelector(`#te-link-url-${this.editor.id}`).focus();
        }, 100);
    }

    // Detectar si el cursor está en un enlace existente
    getExistingLink() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        
        // Obtener elemento desde el punto de inicio del rango
        let element = range.startContainer;
        
        // Si es un nodo de texto, obtener su elemento padre
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }
        
        // Buscar hacia arriba hasta encontrar un enlace
        while (element && element !== this.editor.content) {
            if (element.tagName === 'A') {
                return element;
            }
            element = element.parentElement;
        }
        
        // Si no se encontró en el punto de inicio, buscar en el punto final
        element = range.endContainer;
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }
        
        while (element && element !== this.editor.content) {
            if (element.tagName === 'A') {
                return element;
            }
            element = element.parentElement;
        }
        
        // Buscar enlaces que intersecten con la selección
        const commonAncestor = range.commonAncestorContainer;
        if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
            const links = commonAncestor.querySelectorAll('a');
            for (let link of links) {
                // Crear un rango para el enlace
                const linkRange = document.createRange();
                linkRange.selectNodeContents(link);
                
                // Verificar si hay intersección entre los rangos
                if (range.compareBoundaryPoints(Range.END_TO_START, linkRange) <= 0 &&
                    range.compareBoundaryPoints(Range.START_TO_END, linkRange) >= 0) {
                    return link;
                }
            }
        }
        
        return null;
    }

    hideModal() {
        this.modal.style.display = 'none';
        this.editingExistingLink = false;
        this.currentEditingLink = null;
        this.editor.focus();
    }

    insertLink() {
        const urlInput = this.modal.querySelector(`#te-link-url-${this.editor.id}`);
        const textInput = this.modal.querySelector(`#te-link-text-${this.editor.id}`);
        const titleInput = this.modal.querySelector(`#te-link-title-${this.editor.id}`);
        const targetSelect = this.modal.querySelector(`#te-link-target-${this.editor.id}`);

        const url = urlInput.value.trim();
        const text = textInput.value.trim();
        const title = titleInput.value.trim();
        const target = targetSelect.value;

        if (!url) {
            alert('Por favor ingresa una URL válida');
            urlInput.focus();
            return;
        }

        if (!text) {
            alert('Por favor ingresa el texto del enlace');
            textInput.focus();
            return;
        }

        this.editor.focus();

        if (this.editingExistingLink) {
            // Editar enlace existente
            const existingLink = this.currentEditingLink || this.getExistingLink();
            if (existingLink) {
                // Seleccionar todo el enlace para asegurar que se actualice correctamente
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(existingLink);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Crear el HTML del enlace actualizado
                let linkHTML = `<a href="${url}"`;
                
                if (target === '_blank') {
                    linkHTML += ` target="_blank" rel="noopener noreferrer"`;
                }
                
                if (title) {
                    linkHTML += ` title="${title}"`;
                }
                
                linkHTML += `>${text}</a>`;
                
                // Reemplazar el enlace existente con el nuevo
                this.editor.insertHTML(linkHTML);
            }
        } else {
            // Crear nuevo enlace
            // Restaurar selección
            if (this.currentRange) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this.currentRange);
            }

            // Crear HTML del enlace
            let linkHTML = `<a href="${url}"`;
            
            if (target === '_blank') {
                linkHTML += ` target="_blank" rel="noopener noreferrer"`;
            }
            
            if (title) {
                linkHTML += ` title="${title}"`;
            }
            
            linkHTML += `>${text}</a>`;

            // Insertar el enlace
            this.editor.insertHTML(linkHTML);
        }

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
window.PluginRegistry.register('links', LinksPlugin);
