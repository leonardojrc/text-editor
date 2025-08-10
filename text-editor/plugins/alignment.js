/**
 * Alignment Plugin - Left, Center, Right, Justify
 */

class AlignmentPlugin {
    constructor(editor) {
        this.editor = editor;
        this.name = 'alignment';
    }
    
    init() {
        this.addButtons();
    }
    
    addButtons() {
        // Align Left
        this.editor.addButton({
            title: 'Alinear a la izquierda',
            icon: 'align-left.svg',
            command: 'justifyLeft',
            onClick: (editor) => editor.execCommand('justifyLeft')
        });
        
        // Align Center
        this.editor.addButton({
            title: 'Centrar',
            icon: 'align-center.svg',
            command: 'justifyCenter',
            onClick: (editor) => editor.execCommand('justifyCenter')
        });
        
        // Align Right
        this.editor.addButton({
            title: 'Alinear a la derecha',
            icon: 'align-right.svg',
            command: 'justifyRight',
            onClick: (editor) => editor.execCommand('justifyRight')
        });
        
        // Justify
        this.editor.addButton({
            title: 'Justificar',
            icon: 'align-justify.svg',
            command: 'justifyFull',
            onClick: (editor) => editor.execCommand('justifyFull')
        });
        
        // Agregar separador
        this.editor.addSeparator();
    }
    
    destroy() {
        // Cleanup si es necesario
    }
}

// Registrar plugin globalmente (compatibilidad hacia atrás)
window.AlignmentPlugin = AlignmentPlugin;

// Registrar en el Plugin Registry
if (window.PluginRegistry) {
    window.PluginRegistry.register('alignment', AlignmentPlugin);
}
