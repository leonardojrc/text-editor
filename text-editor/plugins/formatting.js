/**
 * Formatting Plugin - Bold, Italic, Underline, Strikethrough
 */

class FormattingPlugin {
    constructor(editor) {
        this.editor = editor;
        this.name = 'formatting';
    }
    
    init() {
        // Agregar botones de formato
        this.addButtons();
        
        // Handler global para cerrar dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.te-split-btn')) {
                document.querySelectorAll('.te-color-dropdown').forEach(dropdown => {
                    dropdown.style.display = 'none';
                    // También quitar clase activa del split button
                    const splitButton = dropdown.closest('.te-split-btn');
                    if (splitButton) {
                        splitButton.classList.remove('te-dropdown-active'); // 🔥 Limpiar z-index alto
                    }
                });
            }
        });
    }
    
    addButtons() {
        // Bold
        this.editor.addButton({
            title: 'Negrita',
            icon: 'bold.svg',
            command: 'bold',
            onClick: (editor) => editor.execCommand('bold')
        });
        
        // Italic
        this.editor.addButton({
            title: 'Cursiva',
            icon: 'italic.svg',
            command: 'italic',
            onClick: (editor) => editor.execCommand('italic')
        });
        
        // Underline
        this.editor.addButton({
            title: 'Subrayado',
            icon: 'underline.svg',
            command: 'underline',
            onClick: (editor) => editor.execCommand('underline')
        });
        
        // Strikethrough
        this.editor.addButton({
            title: 'Tachado',
            icon: 'strikethrough.svg',
            command: 'strikeThrough',
            onClick: (editor) => editor.execCommand('strikeThrough')
        });

        // Separador antes de los colores
        this.editor.addSeparator();
        
        // Botones de color
        this.addTextColorButton();
        this.addBackgroundColorButton();
    }

    addTextColorButton() {
        // Crear botones separados para color de texto
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'te-split-btn';
        
        const mainButtonId = `text-color-main-${this.editor.id}`;
        const dropdownButtonId = `text-color-dropdown-${this.editor.id}`;
        const dropdownId = `text-color-panel-${this.editor.id}`;
        
        buttonWrapper.innerHTML = `
            <button type="button" id="${mainButtonId}" class="te-split-btn-main" title="Color del texto">
                <svg width="18" height="18" viewBox="0 0 36 40" stroke="currentColor">
                    <path d="M11.59,27.5H5.86L16.36,3.67a1.38,1.38,0,0,1,2.56,0L29.42,27.5H23.69l-1.86-4.25H13.45Zm3.22-8.83h5.66L18,11.75Z"/>
                    <path id="${mainButtonId}-underline" d="M3.06 37h30" stroke="#000000" stroke-width="8" stroke-linecap="round"/>
                </svg>
            </button>
            <button type="button" id="${dropdownButtonId}" class="te-split-btn-dropdown" title="Seleccionar color de texto">
                <svg class="te-dropdown-arrow" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            </button>
            <div id="${dropdownId}" class="te-color-dropdown" style="display: none;">
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
                    <button type="button" class="te-color-swatch" data-color="#000000" style="width: 20px; height: 20px; background: #000;"></button>
                    <button type="button" class="te-color-swatch" data-color="#e60000" style="width: 20px; height: 20px; background: #e60000;"></button>
                    <button type="button" class="te-color-swatch" data-color="#ff9900" style="width: 20px; height: 20px; background: #ff9900;"></button>
                    <button type="button" class="te-color-swatch" data-color="#ffff00" style="width: 20px; height: 20px; background: #ffff00;"></button>
                    <button type="button" class="te-color-swatch" data-color="#008a00" style="width: 20px; height: 20px; background: #008a00;"></button>
                    <button type="button" class="te-color-swatch" data-color="#0066cc" style="width: 20px; height: 20px; background: #0066cc;"></button>
                    <button type="button" class="te-color-swatch" data-color="#9933ff" style="width: 20px; height: 20px; background: #9933ff;"></button>
                    <button type="button" class="te-color-swatch" data-color="#ffffff" style="width: 20px; height: 20px; background: #fff;"></button>
                </div>
                <button type="button" class="te-color-swatch te-no-color" data-color="none" style="width: 100%; height: 24px; margin-bottom: 8px;">Sin color</button>
                <input type="color" class="te-custom-color" value="#000000" style="width: 100%; height: 28px;">
            </div>
        `;
        
        this.editor.toolbar.appendChild(buttonWrapper);
        this.setupTextColorEvents(mainButtonId, dropdownButtonId, dropdownId, buttonWrapper);
    }
    
    addBackgroundColorButton() {
        // Crear botones separados para color de fondo
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'te-split-btn';
        
        const mainButtonId = `bg-color-main-${this.editor.id}`;
        const dropdownButtonId = `bg-color-dropdown-${this.editor.id}`;
        const dropdownId = `bg-color-panel-${this.editor.id}`;
        
        buttonWrapper.innerHTML = `
            <button type="button" id="${mainButtonId}" class="te-split-btn-main" title="Color de fondo">
                <svg width="18" height="18" viewBox="0 0 36 40" stroke="currentColor">
                    <path d="M15.82,26.06a1,1,0,0,1-.71-.29L8.67,19.33a1,1,0,0,1-.29-.71,1,1,0,0,1,.29-.71L23,3.54a5.55,5.55,0,1,1,7.85,7.86L16.53,25.77A1,1,0,0,1,15.82,26.06Zm-5-7.44,5,5L29.48,10a3.54,3.54,0,0,0,0-5,3.63,3.63,0,0,0-5,0Z"/>
                    <path d="M10.38,28.28A1,1,0,0,1,9.67,28L6.45,24.77a1,1,0,0,1-.22-1.09l2.22-5.44a1,1,0,0,1,1.63-.33l6.45,6.44A1,1,0,0,1,16.2,26l-5.44,2.22A1.33,1.33,0,0,1,10.38,28.28ZM8.33,23.82l2.29,2.28,3.43-1.4L9.74,20.39Z"/>
                    <path d="M8.94,30h-5a1,1,0,0,1-.84-1.55l3.22-4.94a1,1,0,0,1,1.55-.16l3.21,3.22a1,1,0,0,1,.06,1.35L9.7,29.64A1,1,0,0,1,8.94,30ZM5.78,28H8.47L9,27.34l-1.7-1.7Z"/>
                    <path id="${mainButtonId}-underline" d="M3.06 37h30" stroke="transparent" stroke-width="8" stroke-linecap="round"/>
                </svg>
            </button>
            <button type="button" id="${dropdownButtonId}" class="te-split-btn-dropdown" title="Seleccionar color de fondo">
                <svg class="te-dropdown-arrow" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            </button>
            <div id="${dropdownId}" class="te-color-dropdown" style="display: none;">
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
                    <button type="button" class="te-color-swatch" data-color="#ffff00" style="width: 20px; height: 20px; background: #ffff00;"></button>
                    <button type="button" class="te-color-swatch" data-color="#fff2cc" style="width: 20px; height: 20px; background: #fff2cc;"></button>
                    <button type="button" class="te-color-swatch" data-color="#f4cccc" style="width: 20px; height: 20px; background: #f4cccc;"></button>
                    <button type="button" class="te-color-swatch" data-color="#d9ead3" style="width: 20px; height: 20px; background: #d9ead3;"></button>
                    <button type="button" class="te-color-swatch" data-color="#cfe2f3" style="width: 20px; height: 20px; background: #cfe2f3;"></button>
                    <button type="button" class="te-color-swatch" data-color="#ead1dc" style="width: 20px; height: 20px; background: #ead1dc;"></button>
                    <button type="button" class="te-color-swatch" data-color="#ffffff" style="width: 20px; height: 20px; background: #fff;"></button>
                </div>
                <button type="button" class="te-color-swatch te-no-color" data-color="none" style="width: 100%; height: 24px; margin-bottom: 8px;">Sin color</button>
                <input type="color" class="te-custom-color" value="#ffff00" style="width: 100%; height: 28px;">
            </div>
        `;
        
        this.editor.toolbar.appendChild(buttonWrapper);
        this.setupBackgroundColorEvents(mainButtonId, dropdownButtonId, dropdownId, buttonWrapper);
    }
    
    setupTextColorEvents(mainButtonId, dropdownButtonId, dropdownId, buttonWrapper) {
        // Usar querySelector en el wrapper en lugar de getElementById global
        const mainButton = buttonWrapper.querySelector(`#${mainButtonId}`);
        const dropdownButton = buttonWrapper.querySelector(`#${dropdownButtonId}`);
        const dropdown = buttonWrapper.querySelector(`#${dropdownId}`);
        const underline = buttonWrapper.querySelector(`#${mainButtonId}-underline`);
        
        if (!mainButton || !dropdownButton || !dropdown) {
            console.error('❌ Text color elements not found!');
            return;
        }
        
        let currentTextColor = '#000000';

        // Evento del botón principal - aplicar color actual o abrir dropdown
        mainButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const selection = window.getSelection();
            const hasSelection = selection && selection.rangeCount && !selection.isCollapsed;
            
            if (hasSelection) {
                // Si hay texto seleccionado, aplicar color
                this.editor.execCommand('foreColor', currentTextColor);
            } else {
                // Si no hay selección, toggle del dropdown
                this.toggleColorDropdown(dropdown);
            }
        });

        // Evento del botón dropdown - siempre abrir paleta
        dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleColorDropdown(dropdown);
        });

        // Eventos para seleccionar colores
        dropdown.querySelectorAll('.te-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = e.target.dataset.color;
                
                if (color === 'none') {
                    currentTextColor = '#000000';
                    if (underline) underline.setAttribute('stroke', '#000000');
                    this.editor.execCommand('foreColor', '#000000');
                } else {
                    currentTextColor = color;
                    if (underline) underline.setAttribute('stroke', color);
                    this.editor.execCommand('foreColor', color);
                }
                
                dropdown.style.display = 'none';
            });
        });

        // Evento del color custom
        const customColorInput = dropdown.querySelector('.te-custom-color');
        if (customColorInput) {
            customColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                currentTextColor = color;
                if (underline) underline.setAttribute('stroke', color);
                this.editor.execCommand('foreColor', color);
                dropdown.style.display = 'none';
            });
        }
    }

    setupBackgroundColorEvents(mainButtonId, dropdownButtonId, dropdownId, buttonWrapper) {
        // Usar querySelector en el wrapper en lugar de getElementById global
        const mainButton = buttonWrapper.querySelector(`#${mainButtonId}`);
        const dropdownButton = buttonWrapper.querySelector(`#${dropdownButtonId}`);
        const dropdown = buttonWrapper.querySelector(`#${dropdownId}`);
        const underline = buttonWrapper.querySelector(`#${mainButtonId}-underline`);
        
        if (!mainButton || !dropdownButton || !dropdown) {
            console.error('❌ Background color elements not found!');
            return;
        }
        
        let currentBgColor = '#ffff00';

        // Evento del botón principal - aplicar color actual o abrir dropdown
        mainButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const selection = window.getSelection();
            const hasSelection = selection && selection.rangeCount && !selection.isCollapsed;

            if (hasSelection && currentBgColor && currentBgColor !== 'none') {
                // Si hay texto seleccionado, aplicar color
                if (!this.editor.execCommand('hiliteColor', currentBgColor)) {
                    this.editor.execCommand('backColor', currentBgColor);
                }
            } else {
                // Si no hay selección, toggle del dropdown
                this.toggleColorDropdown(dropdown);
            }
        });

        // Evento del botón dropdown - siempre abrir paleta
        dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleColorDropdown(dropdown);
        });

        // Eventos para seleccionar colores
        dropdown.querySelectorAll('.te-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = e.target.dataset.color;
                
                if (color === 'none') {
                    // Remover color de fondo
                    if (!this.editor.execCommand('hiliteColor', 'transparent')) {
                        this.editor.execCommand('backColor', 'transparent');
                    }
                    currentBgColor = 'none';
                    if (underline) underline.setAttribute('stroke', 'transparent');
                } else {
                    if (!this.editor.execCommand('hiliteColor', color)) {
                        this.editor.execCommand('backColor', color);
                    }
                    currentBgColor = color;
                    if (underline) underline.setAttribute('stroke', color);
                }
                
                dropdown.classList.remove('te-dropdown-visible');
            });
        });

        // Evento del color custom
        const customColorInput = dropdown.querySelector('.te-custom-color');
        if (customColorInput) {
            customColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                if (!this.editor.execCommand('hiliteColor', color)) {
                    this.editor.execCommand('backColor', color);
                }
                currentBgColor = color;
                if (underline) underline.setAttribute('stroke', color);
                dropdown.style.display = 'none';
            });
        }
    }
    
    toggleColorDropdown(dropdown) {
        const isVisible = dropdown.style.display === 'block';
        const splitButton = dropdown.closest('.te-split-btn');
        
        if (isVisible) {
            // Ocultar
            dropdown.style.display = 'none';
            if (splitButton) {
                splitButton.classList.remove('te-dropdown-active'); // 🔥 Quitar z-index alto
            }
        } else {
            // Cerrar otros dropdowns primero
            document.querySelectorAll('.te-color-dropdown').forEach(dd => {
                if (dd !== dropdown) {
                    dd.style.display = 'none';
                    // También quitar clase activa de otros split buttons
                    const otherSplitButton = dd.closest('.te-split-btn');
                    if (otherSplitButton) {
                        otherSplitButton.classList.remove('te-dropdown-active');
                    }
                }
            });
            
            // Agregar clase activa al split button actual
            if (splitButton) {
                splitButton.classList.add('te-dropdown-active'); // 🔥 Agregar z-index alto
            }
            
            // Mostrar este dropdown con todos los estilos necesarios
            dropdown.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: absolute !important;
                top: 100% !important;
                left: 0 !important;
                background: white !important;
                border: 2px solid #ddd !important;
                border-radius: 4px !important;
                padding: 12px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
                z-index: 10000 !important;
                min-width: 180px !important;
                margin-top: 2px !important;
                pointer-events: auto !important;
            `;
        }
    }

    updateButtonState(buttonWrapper) {
        const selection = window.getSelection();
        const hasSelection = selection && selection.rangeCount && !selection.isCollapsed;
        
        if (hasSelection) {
            buttonWrapper.classList.add('has-selection');
        } else {
            buttonWrapper.classList.remove('has-selection');
        }
    }
    
    destroy() {
        // Cleanup si es necesario
    }
}

// Registrar plugin globalmente (compatibilidad hacia atrás)
window.FormattingPlugin = FormattingPlugin;

// Registrar en el Plugin Registry
if (window.PluginRegistry) {
    window.PluginRegistry.register('formatting', FormattingPlugin);
}
