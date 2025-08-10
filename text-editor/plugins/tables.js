/**
 * Tables Plugin - Complete table functionality
 * Includes grid selector, contextual menu, and all table operations
 */

class TablesPlugin {
    constructor(editor) {
        this.editor = editor;
        this.name = 'tables';
        this.savedSelection = null;
    }
    
    init() {
        this.addTableButton();
        this.setupGlobalEvents();
        this.setupTableHighlighting();
    }
    
    
    addTableButton() {
        // Crear split button wrapper
        const buttonWrapper = document.createElement('div');
        const buttonId = `table-btn-${this.editor.id}`;
        const mainButtonId = `${buttonId}-main`;
        const dropdownButtonId = `${buttonId}-dropdown`;
        const gridDropdownId = `${buttonId}-grid-dropdown`;
        const menuId = `${buttonId}-menu`;
        
        buttonWrapper.className = 'te-split-btn';
        buttonWrapper.innerHTML = `
            <button type="button" id="${mainButtonId}" class="te-split-btn-main" title="Insertar tabla">
                <img class="text-editor__icon" src="${this.editor.options.basePath}themes/${this.editor.options.theme}/icons/table.svg" alt="Tabla" />
            </button>
            <button type="button" id="${dropdownButtonId}" class="te-split-btn-dropdown" title="Opciones de tabla">
                <svg class="te-dropdown-arrow" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            </button>
            
            <!-- Grid Selector Dropdown -->
            <div id="${gridDropdownId}" class="te-table-grid-dropdown" style="display: none;">
                <div class="te-table-grid" id="${buttonId}-grid"></div>
                <div class="te-table-grid-label" id="${buttonId}-label">Selecciona tamaño</div>
            </div>
            
            <!-- Context Menu -->
            <div id="${menuId}" class="te-table-menu" style="display: none;">
                <button type="button" data-action="insertRowAbove">Insertar fila arriba</button>
                <button type="button" data-action="insertRowBelow">Insertar fila abajo</button>
                <button type="button" data-action="insertColLeft">Insertar columna izquierda</button>
                <button type="button" data-action="insertColRight">Insertar columna derecha</button>
                <div class="te-menu-separator"></div>
                <button type="button" data-action="deleteRow">Borrar fila</button>
                <button type="button" data-action="deleteCol">Borrar columna</button>
                <button type="button" data-action="deleteTable">Borrar tabla</button>
            </div>
        `;
        
        this.editor.toolbar.appendChild(buttonWrapper);
        
        // Crear grid 10x10
        this.createTableGrid(buttonId);
        
        // Setup eventos
        this.setupTableEvents(mainButtonId, dropdownButtonId, gridDropdownId, menuId, buttonWrapper);
    }
    
    
    createTableGrid(buttonId) {
        const gridContainer = document.getElementById(`${buttonId}-grid`);
        const gridRows = 10, gridCols = 10;
        
        // Crear celdas del grid
        for (let r = 1; r <= gridRows; r++) {
            for (let c = 1; c <= gridCols; c++) {
                const cell = document.createElement('div');
                cell.className = 'te-table-grid-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                cell.addEventListener('mouseenter', () => this.highlightGrid(buttonId, r, c));
                cell.addEventListener('mouseleave', () => this.clearGridLabel(buttonId));
                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.insertTable(r, c);
                    this.closeAllDropdowns(buttonId);
                });
                
                gridContainer.appendChild(cell);
            }
        }
    }
    
    setupTableEvents(mainButtonId, dropdownButtonId, gridDropdownId, menuId, buttonWrapper) {
        const mainButton = document.getElementById(mainButtonId);
        const dropdownButton = document.getElementById(dropdownButtonId);
        const menu = document.getElementById(menuId);
        
        // Botón principal: abrir grid selector
        mainButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.saveSelection();
            this.showGridSelector(gridDropdownId, menuId, buttonWrapper);
        });
        
        // Dropdown button: mostrar grid o menú según contexto
        dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const isInsideTable = this.isInsideTable();
            
            if (isInsideTable) {
                this.showTableMenu(menuId, gridDropdownId, buttonWrapper);
            } else {
                this.saveSelection();
                this.showGridSelector(gridDropdownId, menuId, buttonWrapper);
            }
        });
        
        // Eventos de menú contextual
        menu.addEventListener('click', (e) => {
            if (e.target.dataset.action) {
                e.stopPropagation();
                this.executeTableAction(e.target.dataset.action);
                this.closeAllDropdowns(mainButtonId.replace('-main', ''));
            }
        });
    }
    
    setupGlobalEvents() {
        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.te-split-btn')) {
                document.querySelectorAll('.te-table-grid-dropdown, .te-table-menu').forEach(dropdown => {
                    dropdown.style.display = 'none';
                    // Quitar clase activa del split button
                    const splitButton = dropdown.closest('.te-split-btn');
                    if (splitButton) {
                        splitButton.classList.remove('te-dropdown-active');
                    }
                });
            }
        });
    }
    
    setupTableHighlighting() {
        // Actualizar highlighting al hacer click
        this.editor.content.addEventListener('click', () => {
            this.updateTableHighlight();
        });
        
        // Actualizar highlighting al mover cursor con teclado
        this.editor.content.addEventListener('keyup', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                this.updateTableHighlight();
            }
        });
        
        // Actualizar highlighting al cambiar selección
        document.addEventListener('selectionchange', () => {
            // Solo procesar si la selección está dentro de este editor
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let node = range.commonAncestorContainer;
                if (node.nodeType === Node.TEXT_NODE) {
                    node = node.parentElement;
                }
                
                // Verificar si la selección está dentro del contenido de este editor
                if (this.editor.content.contains(node)) {
                    this.updateTableHighlight();
                }
            }
        });
    }
    
    updateTableHighlight() {
        // Limpiar highlights previos dentro de este editor
        this.editor.content.querySelectorAll('.cell-selected').forEach(cell => {
            cell.classList.remove('cell-selected');
        });
        this.editor.content.querySelectorAll('.table-active').forEach(table => {
            table.classList.remove('table-active');
        });
        
        // Obtener celda actual seleccionada
        const currentCell = this.getCurrentCell();
        if (currentCell) {
            // Resaltar celda seleccionada
            currentCell.classList.add('cell-selected');
            
            // Resaltar tabla activa
            const table = this.getTableFromCell(currentCell);
            if (table) {
                table.classList.add('table-active');
            }
        }
    }
    
    showGridSelector(gridDropdownId, menuId, buttonWrapper) {
        const gridDropdown = document.getElementById(gridDropdownId);
        const menu = document.getElementById(menuId);
        
        // Mostrar grid, ocultar menú
        gridDropdown.style.display = 'block';
        menu.style.display = 'none';
        
        // Agregar clase activa para z-index alto
        buttonWrapper.classList.add('te-dropdown-active');
        
        // Reset label
        const buttonId = gridDropdownId.replace('-grid-dropdown', '');
        this.updateGridLabel(buttonId, 'Selecciona tamaño');
    }
    
    showTableMenu(menuId, gridDropdownId, buttonWrapper) {
        const menu = document.getElementById(menuId);
        const gridDropdown = document.getElementById(gridDropdownId);
        
        // Mostrar menú, ocultar grid
        menu.style.display = 'block';
        gridDropdown.style.display = 'none';
        
        // Agregar clase activa para z-index alto
        buttonWrapper.classList.add('te-dropdown-active');
    }
    
    closeAllDropdowns(buttonId) {
        const gridDropdown = document.getElementById(`${buttonId}-grid-dropdown`);
        const menu = document.getElementById(`${buttonId}-menu`);
        
        if (gridDropdown) gridDropdown.style.display = 'none';
        if (menu) menu.style.display = 'none';
        
        // Quitar clase activa
        const wrapper = document.querySelector(`#${buttonId}-main`)?.closest('.te-split-btn');
        if (wrapper) wrapper.classList.remove('te-dropdown-active');
        
        // Reset grid
        this.clearGridHighlight(buttonId);
        this.updateGridLabel(buttonId, 'Selecciona tamaño');
    }
    
    highlightGrid(buttonId, rows, cols) {
        const gridContainer = document.getElementById(`${buttonId}-grid`);
        const cells = gridContainer.querySelectorAll('.te-table-grid-cell');
        
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            
            if (r <= rows && c <= cols) {
                cell.classList.add('te-grid-highlighted');
            } else {
                cell.classList.remove('te-grid-highlighted');
            }
        });
        
        this.updateGridLabel(buttonId, `${rows} × ${cols}`);
    }
    
    clearGridHighlight(buttonId) {
        const gridContainer = document.getElementById(`${buttonId}-grid`);
        if (gridContainer) {
            const cells = gridContainer.querySelectorAll('.te-table-grid-cell');
            cells.forEach(cell => cell.classList.remove('te-grid-highlighted'));
        }
    }
    
    clearGridLabel(buttonId) {
        this.updateGridLabel(buttonId, '');
    }
    
    updateGridLabel(buttonId, text) {
        const label = document.getElementById(`${buttonId}-label`);
        if (label) label.textContent = text;
    }
    
    insertTable(rows, cols) {
        // Calcular ancho de columnas
        const colWidth = (100 / cols).toFixed(2);
        
        let html = '<table style="border-collapse:collapse; width:100%; table-layout:fixed;">';
        html += '<colgroup>';
        for (let c = 0; c < cols; c++) {
            html += `<col style="width:${colWidth}%">`;
        }
        html += '</colgroup><tbody>';
        
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += '<td></td>';
            }
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        
        // Restaurar selección e insertar
        this.restoreSelection();
        this.editor.insertHTML(html);
        this.editor.focus();
    }
    
    saveSelection() {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            this.savedSelection = sel.getRangeAt(0).cloneRange();
        }
    }
    
    restoreSelection() {
        if (this.savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.savedSelection);
        }
    }
    
    isInsideTable() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;
        
        let node = selection.getRangeAt(0).commonAncestorContainer;
        
        // Si es un nodo de texto, obtener el elemento padre
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
        
        // Buscar tabla padre dentro del contenido del editor
        while (node && node !== this.editor.content && node !== document.body) {
            if (node.tagName === 'TABLE') {
                return true;
            }
            node = node.parentElement;
        }
        
        return false;
    }
    
    getCurrentCell() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;
        
        let node = selection.getRangeAt(0).commonAncestorContainer;
        
        // Si es un nodo de texto, obtener el elemento padre
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
        
        // Buscar celda padre
        while (node && node !== this.editor.content) {
            if (node.tagName === 'TD' || node.tagName === 'TH') {
                return node;
            }
            node = node.parentElement;
        }
        
        return null;
    }
    
    getCellIndex(cell) {
        const row = cell.parentElement;
        return Array.from(row.cells).indexOf(cell);
    }
    
    selectCell(cell) {
        if (!cell) return;
        
        // Limpiar selección actual
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        // Crear nueva selección en la celda
        const range = document.createRange();
        range.selectNodeContents(cell);
        range.collapse(true); // Colocar cursor al inicio
        
        selection.addRange(range);
        
        // Actualizar highlighting
        this.updateTableHighlight();
        
        // Enfocar el editor para mantener la funcionalidad del teclado
        this.editor.content.focus();
    }
    
    executeTableAction(action) {
        const cell = this.getCurrentCell();
        if (!cell) return;
        
        switch (action) {
            case 'insertRowAbove':
                this.insertRowAbove(cell);
                break;
            case 'insertRowBelow':
                this.insertRowBelow(cell);
                break;
            case 'insertColLeft':
                this.insertColLeft(cell);
                break;
            case 'insertColRight':
                this.insertColRight(cell);
                break;
            case 'deleteRow':
                this.deleteRow(cell);
                break;
            case 'deleteCol':
                this.deleteCol(cell);
                break;
            case 'deleteTable':
                this.deleteTable(cell);
                break;
        }
    }
    
    insertRowAbove(cell) {
        const row = cell.parentElement;
        const newRow = row.cloneNode(true);
        
        // Limpiar celdas nuevas
        Array.from(newRow.cells).forEach(td => {
            td.innerHTML = '';
            td.className = '';
            td.removeAttribute('style');
        });
        
        row.parentElement.insertBefore(newRow, row);
    }
    
    insertRowBelow(cell) {
        const row = cell.parentElement;
        const newRow = row.cloneNode(true);
        
        // Limpiar celdas nuevas
        Array.from(newRow.cells).forEach(td => {
            td.innerHTML = '';
            td.className = '';
            td.removeAttribute('style');
        });
        
        row.parentElement.insertBefore(newRow, row.nextSibling);
    }
    
    insertColLeft(cell) {
        const table = this.getTableFromCell(cell);
        if (!table) return;
        
        const cellIndex = this.getCellIndex(cell);
        
        Array.from(table.rows).forEach(row => {
            const referenceCell = row.cells[cellIndex];
            const newCell = document.createElement(referenceCell ? referenceCell.tagName.toLowerCase() : 'td');
            newCell.innerHTML = '';
            
            if (referenceCell) {
                row.insertBefore(newCell, referenceCell);
            } else {
                row.appendChild(newCell);
            }
        });
        
        this.updateColgroup(table);
    }
    
    insertColRight(cell) {
        const table = this.getTableFromCell(cell);
        if (!table) return;
        
        const cellIndex = this.getCellIndex(cell);
        
        Array.from(table.rows).forEach(row => {
            const referenceCell = row.cells[cellIndex];
            const newCell = document.createElement(referenceCell ? referenceCell.tagName.toLowerCase() : 'td');
            newCell.innerHTML = '';
            
            if (referenceCell && referenceCell.nextSibling) {
                row.insertBefore(newCell, referenceCell.nextSibling);
            } else {
                row.appendChild(newCell);
            }
        });
        
        this.updateColgroup(table);
    }
    
    deleteRow(cell) {
        const row = cell.parentElement;
        const tbody = row.parentElement;
        const table = this.getTableFromCell(cell);
        const cellIndex = this.getCellIndex(cell);
        
        // Si solo hay una fila, eliminar toda la tabla
        if (tbody.rows.length <= 1) {
            this.deleteTable(cell);
            return;
        }
        
        // Obtener índice de la fila actual
        const rowIndex = Array.from(tbody.rows).indexOf(row);
        let nextCell = null;
        
        // Intentar seleccionar la celda de la siguiente fila (misma columna)
        if (rowIndex < tbody.rows.length - 1) {
            const nextRow = tbody.rows[rowIndex + 1];
            nextCell = nextRow.cells[cellIndex] || nextRow.cells[nextRow.cells.length - 1];
        }
        // Si no hay siguiente fila, seleccionar la anterior
        else if (rowIndex > 0) {
            const prevRow = tbody.rows[rowIndex - 1];
            nextCell = prevRow.cells[cellIndex] || prevRow.cells[prevRow.cells.length - 1];
        }
        
        // Eliminar la fila
        row.remove();
        
        // Seleccionar la nueva celda
        if (nextCell) {
            setTimeout(() => {
                this.selectCell(nextCell);
            }, 10);
        }
    }
    
    deleteCol(cell) {
        const table = this.getTableFromCell(cell);
        if (!table) return;
        
        const cellIndex = this.getCellIndex(cell);
        const row = cell.parentElement;
        const rowIndex = Array.from(table.rows).indexOf(row);
        const totalCols = table.rows[0]?.cells.length || 0;
        
        // Si solo hay una columna, eliminar toda la tabla
        if (totalCols <= 1) {
            this.deleteTable(cell);
            return;
        }
        
        let nextCell = null;
        
        // Intentar seleccionar la celda de la siguiente columna (misma fila)
        if (cellIndex < totalCols - 1) {
            // Después de eliminar la columna, la siguiente estará en la misma posición
            nextCell = { rowIndex: rowIndex, cellIndex: cellIndex };
        }
        // Si no hay siguiente columna, seleccionar la anterior
        else if (cellIndex > 0) {
            nextCell = { rowIndex: rowIndex, cellIndex: cellIndex - 1 };
        }
        
        // Eliminar la columna de todas las filas
        Array.from(table.rows).forEach(row => {
            if (row.cells[cellIndex]) {
                row.deleteCell(cellIndex);
            }
        });
        
        // Actualizar colgroup
        this.updateColgroup(table);
        
        // Seleccionar la nueva celda
        if (nextCell && table.rows[nextCell.rowIndex]) {
            const targetCell = table.rows[nextCell.rowIndex].cells[nextCell.cellIndex];
            if (targetCell) {
                setTimeout(() => {
                    this.selectCell(targetCell);
                }, 10);
            }
        }
    }
    
    deleteTable(cell) {
        const table = this.getTableFromCell(cell);
        if (table) {
            table.remove();
        }
    }
    
    getTableFromCell(cell) {
        let node = cell;
        while (node && node !== this.editor.content) {
            if (node.tagName === 'TABLE') {
                return node;
            }
            node = node.parentElement;
        }
        return null;
    }
    
    updateColgroup(table) {
        const colgroup = table.querySelector('colgroup');
        if (colgroup) {
            const numCols = table.rows[0]?.cells.length || 0;
            const colWidth = (100 / numCols).toFixed(2);
            
            // Limpiar colgroup existente
            colgroup.innerHTML = '';
            
            // Crear nuevas columnas
            for (let i = 0; i < numCols; i++) {
                const col = document.createElement('col');
                col.style.width = `${colWidth}%`;
                colgroup.appendChild(col);
            }
        }
    }
    
    // Método de interfaz para limpiar contenido HTML antes de export/submit
    cleanContent(tempDiv) {
        // Remover clases de highlighting de tablas
        const highlightedElements = tempDiv.querySelectorAll('.table-active, .cell-selected');
        highlightedElements.forEach(element => {
            element.classList.remove('table-active', 'cell-selected');
        });
        
        // Limpiar cualquier otro estado temporal relacionado con tablas
        const tableGridElements = tempDiv.querySelectorAll('.te-table-grid, .te-table-grid-dropdown, .te-table-menu');
        tableGridElements.forEach(element => {
            element.remove();
        });
    }
    
    destroy() {
        // Cleanup si es necesario
    }
}

// Registrar plugin globalmente (compatibilidad hacia atrás)
if (typeof window !== 'undefined') {
    window.TablesPlugin = TablesPlugin;
    
    // Registrar en el Plugin Registry
    if (window.PluginRegistry) {
        window.PluginRegistry.register('tables', TablesPlugin);
    }
}
