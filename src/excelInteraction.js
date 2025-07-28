class ExcelInteraction {
    constructor(canvas, container, excelData, excelRender, options) {
        this.canvas = canvas;
        this.container = container;
        this.excelData = excelData;
        this.excelRender = excelRender;
        this.options = options;

        this.isEditing = false;
        this.editingCell = { row: -1, col: -1 };
        this.editorInput = null;

        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
        this.startX = 0;
        this.startY = 0;
        this.startSize = 0;

        this.isSelecting = false; 
        this.activeHeader = null; 
        this.contextMenu = null;

        this.addEventListeners();
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        this.canvas.addEventListener("contextmenu", this.handleContextMenu.bind(this));
        document.addEventListener('click',  this.hideContextMenu.bind(this)); 
    }

    // 鼠标的相对canvas坐标 = 浏览器窗口坐标 - canvas相对视口坐标
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    getCellIndex(mouseX, mouseY) {
        const { headerLetterHeight, headerNumberWidth } = this.options;
        if (mouseX < headerNumberWidth || mouseY < headerLetterHeight) {
            return null;
        }
        let colIndex = -1;
        let currentX = headerNumberWidth;
        for (let i = 0; i < this.excelData.numCols; i++) {
            currentX += this.excelData.colWidths[i];
            if (mouseX < currentX) {
                colIndex = i;
                break;
            }
        }
        let rowIndex = -1;
        let currentY = headerLetterHeight;
        for (let i = 0; i < this.excelData.numRows; i++) {
            currentY += this.excelData.rowHeights[i];
            if (mouseY < currentY) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex !== -1 && colIndex !== -1) {
            return { row: rowIndex, col: colIndex };
        }
        return null;
    }

    getCellRect(rowIndex, colIndex) {
        let x = this.options.headerNumberWidth;
        for (let i = 0; i < colIndex; i++) {
            x += this.excelData.colWidths[i];
        }
        x -= this.excelRender.scrollOffsetX;
        let y = this.options.headerLetterHeight;
        for (let i = 0; i < rowIndex; i++) {
            y += this.excelData.rowHeights[i];
        }
        y -= this.excelRender.scrollOffsetY;
        const width = this.excelData.colWidths[colIndex];
        const height = this.excelData.rowHeights[rowIndex];
        return { x, y, width, height };
    }

    getResizeTarget(mouseX, mouseY) {
        const { headerLetterHeight, headerNumberWidth, resizeThreshold } = this.options;

        if (mouseX >= 0 && mouseX <= headerNumberWidth) {
            let accumulatedHeight = headerLetterHeight;
            for (let i = 0; i < this.excelData.numRows; i++) {
                const rowBottomY = accumulatedHeight + this.excelData.rowHeights[i];
                if (Math.abs(mouseY - rowBottomY) <= resizeThreshold) {
                    return { type: 'row', index: i, startSize: this.excelData.rowHeights[i] };
                }
                accumulatedHeight += this.excelData.rowHeights[i];
            }
        }
        if (mouseY >= 0 && mouseY <= headerLetterHeight) {
            let accumulatedWidth = headerNumberWidth;
            for (let i = 0; i < this.excelData.numCols; i++) {
                const colRightX = accumulatedWidth + this.excelData.colWidths[i];
                if (Math.abs(mouseX - colRightX) <= resizeThreshold) {
                    return { type: 'col', index: i, startSize: this.excelData.colWidths[i] };
                }
                accumulatedWidth += this.excelData.colWidths[i];
            }
        }
        return null;
    }

    getHeadIndex(mouseX, mouseY) {
        const { headerLetterHeight, headerNumberWidth } = this.options;
        if (mouseX >= 0 && mouseX <= headerNumberWidth && mouseY >= 0 && mouseY <= headerLetterHeight) {
            return { type: 'all', index: -1 };
        }
        if (mouseX >= 0 && mouseX <= headerNumberWidth && mouseY > headerLetterHeight) {
            let currentY = headerLetterHeight;
            for (let i = 0; i < this.excelData.numRows; i++) {
                const rowBottomY = currentY + this.excelData.rowHeights[i];

                if (mouseY >= currentY && mouseY < rowBottomY) {
                    return { type: 'row', index: i };
                }
                currentY = rowBottomY;
            }
        }
        if (mouseY >= 0 && mouseY <= headerLetterHeight && mouseX > headerNumberWidth) {
            let currentX = headerNumberWidth;
            for (let i = 0; i < this.excelData.numCols; i++) {
                const colRightX = currentX + this.excelData.colWidths[i];

                if (mouseX >= currentX && mouseX < colRightX) {
                    return { type: 'col', index: i };
                }
                currentX = colRightX;
            }
        }
        return null;
    }

    handleMouseDown(event) {
        if (event.button !== 0) return; 

        const mousePos = this.getMousePos(event);

        const logicalX = mousePos.x + this.excelRender.scrollOffsetX;
        const logicalY = mousePos.y + this.excelRender.scrollOffsetY;

        this.excelData.clearSelection(); 
        this.hideContextMenu(); 

        const headInfo = this.getHeadIndex(logicalX, logicalY);
        if (headInfo) {
            if (headInfo.type === 'row') {
                this.excelData.selectedCols.add(headInfo.index); 
            } else if (headInfo.type === 'col') {
                this.excelData.selectedRows.add(headInfo.index); 
            } else if (headInfo.type === 'all') { 
                for (let i = 0; i < this.excelData.numRows; i++) {
                    this.excelData.selectedCols.add(i);
                }
                for (let i = 0; i < this.excelData.numCols; i++) {
                    this.excelData.selectedRows.add(i);
                }
            }
        }
        this.excelRender.draw();

        const resizeTarget = this.getResizeTarget(logicalX, logicalY);
        if (resizeTarget) {
            this.isResizing = true;
            this.resizeType = resizeTarget.type;
            this.resizeIndex = resizeTarget.index;
            this.startX = logicalX;
            this.startY = logicalY;
            this.startSize = resizeTarget.startSize;
            event.preventDefault(); 
            return; 
        }

        const clickedCell = this.getCellIndex(logicalX, logicalY);
        if (clickedCell) {
            this.isSelecting = true; 
            this.excelData.selectionStartCell = clickedCell;
            this.excelData.selectionEndCell = clickedCell;
            this.excelRender.draw();
        }
    }

    handleMouseMove(event) {
        const mousePos = this.getMousePos(event);
        const logicalX = mousePos.x + this.excelRender.scrollOffsetX;
        const logicalY = mousePos.y + this.excelRender.scrollOffsetY;

        if (this.isResizing) {
            const deltaX = logicalX - this.startX;
            const deltaY = logicalY - this.startY;
            let newSize;
            if (this.resizeType === 'row') {
                newSize = Math.max(this.options.minCellSize, this.startSize + deltaY);
            } else if (this.resizeType === 'col') {
                newSize = Math.max(this.options.minCellSize, this.startSize + deltaX);
            }
            this.excelRender.drawResizeGuideLine(newSize, this.resizeType, this.resizeIndex);
        } else if (this.isSelecting) {
            const currentCell = this.getCellIndex(logicalX, logicalY);
            if (currentCell) {
                this.excelData.selectionEndCell = currentCell;
                this.excelRender.draw();
            }
        } else {
            const resizeTarget = this.getResizeTarget(logicalX, logicalY);
            if (resizeTarget) {
                this.canvas.style.cursor = resizeTarget.type === 'row' ? 'ns-resize' : 'ew-resize';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    handleMouseUp(event) {
        if (this.isResizing) {
            const mousePos = this.getMousePos(event);
            const deltaX = mousePos.x + this.excelRender.scrollOffsetX - this.startX;
            const deltaY = mousePos.y + this.excelRender.scrollOffsetY - this.startY;

            if (this.resizeType === 'row') {
                const newHeight = Math.max(this.options.minCellSize, this.startSize + deltaY);
                this.excelData.setRowHeight(this.resizeIndex, newHeight);
            } else if (this.resizeType === 'col') {
                const newWidth = Math.max(this.options.minCellSize, this.startSize + deltaX);
                this.excelData.setColWidth(this.resizeIndex, newWidth);
            }
            this.isResizing = false;
            this.excelRender.draw(); 
            this.canvas.style.cursor = 'default';
        } else if (this.isSelecting) {
            this.isSelecting = false;
            this.excelRender.draw(); 
        }
    }

    handleDoubleClick(event) {
        if (this.isEditing) {
            return;
        }
        const mousePos = this.getMousePos(event);
        const logicalX = mousePos.x + this.excelRender.scrollOffsetX;
        const logicalY = mousePos.y + this.excelRender.scrollOffsetY;

        const cell = this.getCellIndex(logicalX, logicalY);
        if (cell) {
            const cellRect = this.getCellRect(cell.row, cell.col);
            if (!cellRect) return;

            this.isEditing = true;
            this.editingCell = cell;
            this.excelRender.setEditingCell(cell.row, cell.col); 

            this.editorInput = document.createElement('input');
            this.editorInput.type = 'text';
            this.editorInput.value = this.excelData.getCellValue(cell.row, cell.col);
            this.editorInput.classList.add('excel-editor-input');

            this.positionEditorInput();
            document.body.appendChild(this.editorInput);

            this.editorInput.focus();
            this.editorInput.select();


            this.editorInput.onblur = this.saveEditorValue.bind(this);
            this.editorInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.saveEditorValue();
                } else if (e.key === 'Escape') {
                    this.cancelEditor();
                }
            };

            this.excelRender.draw(); 
        }
    }

    positionEditorInput() {
        if (!this.isEditing || !this.editorInput) return;

        const { row, col } = this.editingCell;
        const cellRect = this.getCellRect(row, col);

        if (!cellRect) return;

        const containerRect = this.container.getBoundingClientRect();

        this.editorInput.style.left = (containerRect.left + cellRect.x - this.excelRender.scrollOffsetX) + 'px';
        this.editorInput.style.top = (containerRect.top + cellRect.y - this.excelRender.scrollOffsetY) + 'px';
        this.editorInput.style.width = (cellRect.width) + 'px';
        this.editorInput.style.height = (cellRect.height) + 'px';

        const inputLeft = cellRect.x - this.excelRender.scrollOffsetX;
        const inputTop = cellRect.y - this.excelRender.scrollOffsetY;
        const inputRight = inputLeft + cellRect.width;
        const inputBottom = inputTop + cellRect.height;

        const containerVisibleWidth = this.container.clientWidth;
        const containerVisibleHeight = this.container.clientHeight;

        if (inputRight < 0 || inputBottom < 0 || inputLeft > containerVisibleWidth || inputTop > containerVisibleHeight) {
            this.editorInput.style.display = 'none';
        } else {
            this.editorInput.style.display = 'block';
        }
    }

    saveEditorValue() {
        if (this.isEditing && this.editorInput) {
            this.excelData.setCellValue(this.editingCell.row, this.editingCell.col, this.editorInput.value);
            this.removeEditor();
            this.excelRender.draw();
        }
    }

    cancelEditor() {
        this.removeEditor();
        this.excelRender.draw();
    }

    removeEditor() {
        if (this.editorInput && this.editorInput.parentNode) {
            this.editorInput.remove();
        }
        this.editorInput = null;
        this.isEditing = false;
        this.editingCell = { row: -1, col: -1 };
        this.excelRender.clearEditingCell(); 
    }

    handleScroll() {
        const scrollOffsetX = this.container.scrollLeft;
        const scrollOffsetY = this.container.scrollTop;
        this.excelRender.setScrollOffset(scrollOffsetX, scrollOffsetY);
        this.excelRender.draw();

        if (this.isEditing && this.editorInput) {
            this.positionEditorInput();
        }
    }

    handleContextMenu(event) {
        event.preventDefault();
        const mousePos = this.getMousePos(event);
        const logicalX = mousePos.x + this.excelRender.scrollOffsetX;
        const logicalY = mousePos.y + this.excelRender.scrollOffsetY;

        const headInfo = this.getHeadIndex(logicalX, logicalY);
        this.hideContextMenu(); 

        if (headInfo && (headInfo.type === 'row' || headInfo.type === 'col')) {
            this.excelData.clearSelection(); 
            if (headInfo.type === 'row') {
                this.excelData.selectedCols.add(headInfo.index); 
            } else {
                this.excelData.selectedRows.add(headInfo.index); 
            }
            this.excelRender.draw();
            this.activeHeader = { type: headInfo.type, index: headInfo.index }; 
            this.showContextMenu(event.clientX, event.clientY, headInfo.type);
        } else {
            this.activeHeader = null;
            this.excelData.clearSelection(); 
            this.excelRender.draw();
        }
    }

    showContextMenu(x, y, type) {
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'excel-context-menu';
        this.contextMenu.style.position = 'fixed';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;

        this.contextMenu.addEventListener('click', (e) => e.stopPropagation());
        this.contextMenu.addEventListener('contextmenu', (e) => e.stopPropagation());

        const createMenuItem = (text, action) => {
            const item = document.createElement('div');
            item.className = 'excel-context-menu-item';
            item.textContent = text;
            item.onclick = (e) => {
                e.stopPropagation();
                action();
                this.hideContextMenu(); 
            };
            return item;
        };

        if (type === 'row') {
            this.contextMenu.appendChild(createMenuItem('在上方插入行', () => this.insertRow(this.activeHeader.index)));
            this.contextMenu.appendChild(createMenuItem('在下方插入行', () => this.insertRow(this.activeHeader.index + 1)));
            this.contextMenu.appendChild(createMenuItem('删除行', () => this.deleteRow(this.activeHeader.index)));
        } else if (type === 'col') {
            this.contextMenu.appendChild(createMenuItem('在左侧插入列', () => this.insertCol(this.activeHeader.index)));
            this.contextMenu.appendChild(createMenuItem('在右侧插入列', () => this.insertCol(this.activeHeader.index + 1)));
            this.contextMenu.appendChild(createMenuItem('删除列', () => this.deleteCol(this.activeHeader.index)));
        }

        document.body.appendChild(this.contextMenu);
    }

    hideContextMenu() {
        if (this.contextMenu && this.contextMenu.parentNode) {
            this.contextMenu.parentNode.removeChild(this.contextMenu);
            this.contextMenu = null;
            this.activeHeader = null; 
        }
    }

    insertCol(index) {
        this.excelData.insertCol(index);
        this.excelRender.draw();
    }


    deleteCol(index) {
        if (this.excelData.deleteCol(index)) { 
            this.excelRender.draw();
        }
    }

    insertRow(index) {
        this.excelData.insertRow(index);
        this.excelRender.draw();
    }

    deleteRow(index) {
        if (this.excelData.deleteRow(index)) {
            this.excelRender.draw();
        }
    }
}