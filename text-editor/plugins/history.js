/**
 * History Plugin - Undo/Redo functionality
 */

class HistoryPlugin {
    constructor(editor) {
        this.editor = editor;
        this.name = 'history';
        this.history = {
            stack: [],
            index: -1,
            maxSize: 50
        };
        
        this.isUndoRedo = false;
        this.saveTimeout = null;
    }
    
    init() {
        this.addButtons();
        this.initializeHistoryTracking();
        
        // Asegurar que los botones estén deshabilitados inicialmente
        this.updateButtonStates();
        
        // Guardar estado inicial después de un breve delay
        setTimeout(() => this.saveState(), 100);
    }
    
    addButtons() {
        // Undo
        const undoBtn = this.editor.addButton({
            title: 'Deshacer',
            icon: 'undo.svg',
            onClick: (editor) => this.undo()
        });
        if (undoBtn) {
            undoBtn.id = `undo-btn-${this.editor.id}`;
            undoBtn.disabled = true; // Iniciar deshabilitado
        }
        
        // Redo
        const redoBtn = this.editor.addButton({
            title: 'Rehacer',
            icon: 'redo.svg',
            onClick: (editor) => this.redo()
        });
        if (redoBtn) {
            redoBtn.id = `redo-btn-${this.editor.id}`;
            redoBtn.disabled = true; // Iniciar deshabilitado
        }
        
        // Agregar separador
        this.editor.addSeparator();
        
        // Registrar manejador de estado para los botones de historial
        this.editor.registerStateHandler('history', () => this.updateButtonStates());
    }
    
    initializeHistoryTracking() {
        // Capturar cambios en el contenido
        this.editor.content.addEventListener('input', () => {
            if (!this.isUndoRedo) {
                // Verificar si es un cambio real desde el modo código
                if (this.editor.lastCodeModeChange && 
                    Date.now() - this.editor.lastCodeModeChange.timestamp < 100) {
                    // Es un cambio desde modo código, guardar inmediatamente si realmente cambió
                    this.saveState();
                    this.editor.lastCodeModeChange = null; // Limpiar la marca
                } else {
                    // Cambio normal del usuario
                    this.scheduleStateSave();
                }
            }
        });
        
        // Capturar comandos de formato
        this.editor.content.addEventListener('keydown', (e) => {
            // Capturar shortcuts comunes (Ctrl+B, Ctrl+I, etc.)
            if (e.ctrlKey && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
                setTimeout(() => {
                    if (!this.isUndoRedo) {
                        this.saveState();
                    }
                }, 10);
            }
        });
        
        // Capturar cambios de formato desde botones de la toolbar
        if (this.editor.toolbar) {
            this.editor.toolbar.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (button && !button.disabled && !this.isUndoRedo) {
                    // Delay para que el comando se ejecute primero
                    setTimeout(() => {
                        this.saveState();
                    }, 10);
                }
            });
        }
    }
    
    scheduleStateSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveState();
        }, 500);
    }
    
    saveState() {
        const content = this.editor.content.innerHTML;
        
        // Si es la primera vez que se guarda un estado y no está vacío,
        // y hay un valor inicial, usar ese como estado base
        if (this.history.stack.length === 0 && content.trim() !== '') {
            const initialState = this.editor.initialValue || '';
            this.history.stack.push(initialState);
            this.history.index = 0;
        }
        
        // No guardar contenido igual al anterior
        if (content === this.history.stack[this.history.index]) {
            return;
        }
        
        // Eliminar historial después del índice actual
        this.history.stack = this.history.stack.slice(0, this.history.index + 1);
        
        // Agregar nuevo estado
        this.history.stack.push(content);
        this.history.index++;
        
        // Mantener límite del historial
        if (this.history.stack.length > this.history.maxSize) {
            this.history.stack.shift();
            this.history.index--;
        }
        
        this.updateButtonStates();
    }
    
    undo() {
        if (this.history.index <= 0) return;
        
        this.isUndoRedo = true;
        
        this.history.index--;
        const content = this.history.stack[this.history.index];
        
        this.editor.content.innerHTML = content;
        this.editor.focus();
        
        // Mover cursor al final
        this.moveCaretToEnd();
        
        this.updateButtonStates();
        this.editor.updateToolbarState();
        
        setTimeout(() => {
            this.isUndoRedo = false;
        }, 10);
    }
    
    redo() {
        if (this.history.index >= this.history.stack.length - 1) return;
        
        this.isUndoRedo = true;
        
        this.history.index++;
        const content = this.history.stack[this.history.index];
        
        this.editor.content.innerHTML = content;
        this.editor.focus();
        
        // Mover cursor al final
        this.moveCaretToEnd();
        
        this.updateButtonStates();
        this.editor.updateToolbarState();
        
        setTimeout(() => {
            this.isUndoRedo = false;
        }, 10);
    }
    
    moveCaretToEnd() {
        const range = document.createRange();
        const sel = window.getSelection();
        
        range.selectNodeContents(this.editor.content);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    
    updateButtonStates() {
        // Usar ID si está disponible, sino usar título como fallback
        const undoBtn = this.editor.toolbar.querySelector(`#undo-btn-${this.editor.id}`) || 
                       this.editor.toolbar.querySelector('[title="Deshacer"]');
        const redoBtn = this.editor.toolbar.querySelector(`#redo-btn-${this.editor.id}`) || 
                       this.editor.toolbar.querySelector('[title="Rehacer"]');
        
        const canUndo = this.history.index > 0;
        const canRedo = this.history.index < this.history.stack.length - 1;
        
        if (undoBtn) {
            undoBtn.disabled = !canUndo;
            // Actualizar estilos visuales si es necesario
            if (canUndo) {
                undoBtn.classList.remove('disabled');
            } else {
                undoBtn.classList.add('disabled');
            }
        }
        
        if (redoBtn) {
            redoBtn.disabled = !canRedo;
            // Actualizar estilos visuales si es necesario
            if (canRedo) {
                redoBtn.classList.remove('disabled');
            } else {
                redoBtn.classList.add('disabled');
            }
        }
    }
    
    // Método público para limpiar historial
    clearHistory() {
        this.history.stack = [];
        this.history.index = -1;
        this.updateButtonStates();
    }
    
    destroy() {
        clearTimeout(this.saveTimeout);
    }
}

// Registrar plugin globalmente (compatibilidad hacia atrás)
window.HistoryPlugin = HistoryPlugin;

// Registrar en el Plugin Registry
if (window.PluginRegistry) {
    window.PluginRegistry.register('history', HistoryPlugin);
}
