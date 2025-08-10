/**
 * Lists Plugin - Ordered and Unordered Lists
 */

class ListsPlugin {
    constructor(editor) {
        this.editor = editor;
        this.name = 'lists';
    }
    
    init() {
        this.addButtons();
    }
    
    addButtons() {
        // Unordered List (Bullet Points)
        this.editor.addButton({
            title: 'Lista con viñetas',
            icon: 'list.svg',
            command: 'insertUnorderedList',
            onClick: (editor) => editor.execCommand('insertUnorderedList')
        });
        
        // Ordered List (Numbers)
        this.editor.addButton({
            title: 'Lista numerada',
            icon: 'list-ordered.svg',
            command: 'insertOrderedList',
            onClick: (editor) => editor.execCommand('insertOrderedList')
        });
        
        // Agregar separador
        this.editor.addSeparator();
    }
    
    destroy() {
        // Cleanup si es necesario
    }
}

// Registrar plugin globalmente (compatibilidad hacia atrás)
window.ListsPlugin = ListsPlugin;

// Registrar en el Plugin Registry
if (window.PluginRegistry) {
    window.PluginRegistry.register('lists', ListsPlugin);
}
