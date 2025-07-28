class ExcelRender {
    render() {

    }
}

class excelCanvas {

    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.container = this.canvas.parentElement;

        const defaultOptions = {
            defaultCellWidth: 110,
            defaultCellHeight: 30,
            minCellSize: 20,
            headerLetterHeight: 30,
            headerNumberWidth: 50,
            numRows: 33,
            numCols: 16,
            resizeThreshold: 5,
            borderColor: "#ccc",
            borderWidth: 1,
            headerBgColor: "#f6f7fa",
            textColor: "#000000ff",
            font: "14px Arial, sans-serif",
            resizeLineColor: "#1a73e8b9",
            resizeLineWidth: 2,
            selectionRowsOrCols: "rgba(181, 211, 190, 0.5)"
        }

        this.options = { ...defaultOptions, ...options };
        this.alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        this.rowHeights = new Array(this.options.numRows).fill(this.options.defaultCellHeight);
        this.colWidths = new Array(this.options.numCols).fill(this.options.defaultCellWidth);

        this.cellsData = Array.from({ length: this.options.numRows }, () => new Array(this.options.numCols).fill(''));

        this.isEditing = false;
        this.editingCell = { row: -1, col: -1 };
        this.eidtorInput = null;

        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
        this.startX = 0;
        this.startY = 0;
        this.startSize = 0;

        this.scrollOffsetX = 0;
        this.scrollOffsetY = 0;

        this.selectedRows = new Set();
        this.selectedCols = new Set();
        this.activeHeader = null;

        this.contextMenu = null;

        this.isSelecting = false;
        this.selectionStartCell = null; // {row, col} 鼠标按下时的单元格
        this.selectionEndCell = null; 

        this.addEventListeners();

        this.boundHideContextMenu = this.hideContextMenu.bind(this);
        document.addEventListener('click', this.boundHideContextMenu);
    }

    initDraw() {
        if (!this.ctx) return;

        const {
            headerLetterHeight, headerNumberWidth,
            numRows, numCols, borderColor, borderWidth, headerBgColor,
            textColor, font, selectionRowsOrCols
        } = this.options;

        let totalContentWidth = 0, totalContentHeight = 0;
        for (let i = 0; i < this.colWidths.length; i++) {
            totalContentWidth += this.colWidths[i];
        }
        for (let i = 0; i < this.rowHeights.length; i++) {
            totalContentHeight += this.rowHeights[i];
        }

        this.canvas.width = headerNumberWidth + totalContentWidth + borderWidth;
        this.canvas.height = headerLetterHeight + totalContentHeight + borderWidth;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = borderWidth;
        this.ctx.font = font;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        this.ctx.save();
        this.ctx.translate(-this.scrollOffsetX, -this.scrollOffsetY);

        // ---绘制表头背景色 ---
        this.ctx.fillStyle = headerBgColor;
        this.ctx.fillRect(0, 0, headerNumberWidth, headerLetterHeight);
        this.ctx.fillRect(0, headerLetterHeight, headerNumberWidth, this.canvas.height - headerLetterHeight);
        this.ctx.fillRect(headerNumberWidth, 0, this.canvas.width - headerNumberWidth, headerLetterHeight);


        // --- 绘制所有边框 ---
        let currentY = headerLetterHeight;
        for (let row = 0; row <= numRows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, currentY);
            this.ctx.lineTo(this.canvas.width, currentY);
            this.ctx.stroke();
            if (row < numRows) {
                currentY += this.rowHeights[row];
            }
        }
        let currentX = headerNumberWidth;
        for (let col = 0; col <= numCols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(currentX, 0);
            this.ctx.lineTo(currentX, this.canvas.height);
            this.ctx.stroke();
            if (col < numCols) {
                currentX += this.colWidths[col];
            }
        }

        // --- 绘制文本 ---
        this.ctx.fillStyle = textColor;
        currentY = headerLetterHeight;
        for (let i = 0; i < numRows; i++) {
            const rowNum = i + 1;
            const y = currentY + this.rowHeights[i] / 2;
            const x = headerNumberWidth / 2;
            this.ctx.fillText(rowNum.toString(), x, y);
            currentY += this.rowHeights[i];
        }
        currentX = headerNumberWidth;
        for (let i = 0; i < numCols; i++) {
            let colLetter = "";
            let tempCol = i;
            while (tempCol >= 0) {
                colLetter = this.alpha[tempCol % 26] + colLetter;
                tempCol = Math.floor(tempCol / 26) - 1;
            }
            const x = currentX + this.colWidths[i] / 2;
            const y = headerLetterHeight / 2;
            this.ctx.fillText(colLetter, x, y);
            currentX += this.colWidths[i];
        }

        // ---绘制单元格---
        let cellY = headerLetterHeight;
        for (let r = 0; r < numRows; r++) {
            let cellX = headerNumberWidth;
            for (let c = 0; c < numCols; c++) {
                const cellValue = this.cellsData[r][c];
                if (cellValue !== '' && !(this.isEditing && this.editingCell.row === r && this.editingCell.col === c)) {
                    this.ctx.fillText(cellValue, cellX + this.colWidths[c] / 2, cellY + this.rowHeights[r] / 2);
                }
                cellX += this.colWidths[c];
            }
            cellY += this.rowHeights[r];
        }

        // ---绘制选中整行和列---
        this.ctx.fillStyle = selectionRowsOrCols;
        let currrentYSelection = headerLetterHeight;
        for (let r = 0; r < numRows; r++) {
            if (this.selectedCols.has(r)) {
                this.ctx.fillRect(headerNumberWidth, currrentYSelection, totalContentWidth, this.rowHeights[r]);
            }
            currrentYSelection += this.rowHeights[r];
        }
        let currentXForSelection = headerNumberWidth;
        for (let c = 0; c < numCols; c++) {
            if (this.selectedRows.has(c)) {
                this.ctx.fillRect(currentXForSelection, headerLetterHeight, this.colWidths[c], totalContentHeight);
            }
            currentXForSelection += this.colWidths[c];
        }

        // --- 绘制选中区域 ---
        if (this.selectionStartCell && this.selectionEndCell) {
            const startR = Math.min(this.selectionStartCell.row, this.selectionEndCell.row);
            const endR = Math.max(this.selectionStartCell.row, this.selectionEndCell.row);
            const startC = Math.min(this.selectionStartCell.col, this.selectionEndCell.col);
            const endC = Math.max(this.selectionStartCell.col, this.selectionEndCell.col);

            let currentDrawY = headerLetterHeight;
            for (let r = 0; r < numRows; r++) {
                let currentDrawX = headerNumberWidth;
                for (let c = 0; c < numCols; c++) {
                    if (r >= startR && r <= endR && c >= startC && c <= endC) {
                        this.ctx.fillRect(currentDrawX, currentDrawY, this.colWidths[c], this.rowHeights[r]);
                    }
                    currentDrawX += this.colWidths[c];
                }
                currentDrawY += this.rowHeights[r];
            }
        }

        this.ctx.restore();
    }

    setRows(newRows) {
        if (typeof newRows === 'number' && newRows > 0) {
            if (newRows > this.options.numRows) {
                const diff = newRows - this.options.numRows;
                for (let i = 0; i < diff; i++) {
                    this.rowHeights.push(this.options.defaultCellHeight);
                    this.cellsData.push(new Array(this.options.numCols).fill(''));
                }
            } else {
                this.rowHeights = this.rowHeights.slice(0, newRows);
                this.cellsData = this.cellsData.slice(0, newRows);
            }
            this.options.numRows = newRows;
            this.initDraw();
        } else {
            console.warn("无效的行数输入。");
        }
    }

    setCols(newCols) {
        if (typeof newCols === 'number' && newCols > 0) {
            if (newCols > this.options.numCols) {
                const diff = newCols - this.options.numCols;
                for (let i = 0; i < diff; i++) {
                    this.colWidths.push(this.options.defaultCellWidth);
                }
                for (let r = 0; r < this.cellsData.length; r++) {
                    for (let i = 0; i < diff; i++) {
                        this.cellsData[r].push('');
                    }
                }
            } else {
                this.colWidths = this.colWidths.slice(0, newCols);
                for (let r = 0; r < this.cellsData.length; r++) {
                    this.cellsData[r] = this.cellsData[r].slice(0, newCols);
                }
            }
            this.options.numCols = newCols;
            this.initDraw();
        } else {
            console.warn("无效的列数输入。");
        }
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this))
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        this.canvas.addEventListener("contextmenu", this.handleContextMenu.bind(this));
    }

    handleContextMenu(event) {
        event.preventDefault();
        const mousePos = this.getMousePos(event);
        const headInfo = this.getHeadIndex(mousePos.x + this.scrollOffsetX, mousePos.y + this.scrollOffsetY);
        this.hideContextMenu();

        if (headInfo && (headInfo.type === 'row' || headInfo.type === 'col')) {
            this.selectedRows.clear();
            this.selectedCols.clear();
            if (headInfo.type === 'row') {
                this.selectedCols.add(headInfo.index);
            } else {
                this.selectedRows.add(headInfo.index);
            }
            this.initDraw();
            this.activeHeader = { type: headInfo.type, index: headInfo.index };
            this.showContextMenu(event.clientX, event.clientY, headInfo.type);
        } else {
            this.activeHeader = null;
            this.selectedRows.clear();
            this.selectedCols.clear();

        }
    }
    showContextMenu(x, y, type) {
        this.hideContextMenu();
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
            this.contextMenu.appendChild(createMenuItem('在上方插入行', this.insertRow.bind(this, this.activeHeader.index)));
            this.contextMenu.appendChild(createMenuItem('在下方插入行', this.insertRow.bind(this, this.activeHeader.index + 1)));
            this.contextMenu.appendChild(createMenuItem('删除行', this.deleteRow.bind(this, this.activeHeader.index)));
        } else if (type === 'col') {
            this.contextMenu.appendChild(createMenuItem('在左侧插入列', this.insertCol.bind(this, this.activeHeader.index)));
            this.contextMenu.appendChild(createMenuItem('在右侧插入列', this.insertCol.bind(this, this.activeHeader.index + 1)));
            this.contextMenu.appendChild(createMenuItem('删除列', this.deleteCol.bind(this, this.activeHeader.index)));
        }

        document.body.appendChild(this.contextMenu);
    }

    insertCol(index) {
        for (let i = 0; i < this.cellsData.length; i++) {
            this.cellsData[i].splice(index, 0, '');
        }
        this.colWidths.splice(index, 0, this.options.defaultCellWidth);
        this.options.numCols++;
        this.selectedRows.clear();
        this.selectedCols.clear();
        this.activeHeader = null;
        this.initDraw();
    }

    deleteCol(index) {
        if (this.options.numRows <= 1) {
            alert("只剩一列，无法删除")
            return;
        }
        for (let i = 0; i < this.cellsData.length; i++) {
            this.cellsData[i].splice(index, 1);
        }
        this.colWidths.splice(index, 1);
        this.options.numCols--;
        this.selectedRows.clear();
        this.selectedCols.clear();
        this.activeHeader = null;
        this.initDraw();
    }

    //行
    insertRow(index) {
        this.cellsData.splice(index, 0, new Array(this.options.numCols).fill(''));
        this.rowHeights.splice(index, 0, this.options.defaultCellHeight);
        this.options.numRows++;
        this.selectedRows.clear();
        this.selectedCols.clear();
        this.activeHeader = null;
        this.initDraw();
    }

    deleteRow(index) {
        if (this.options.numRows <= 1) {
            alert("只剩一行，无法删除")
            return;
        }
        this.rowHeights.splice(index, 1);
        this.cellsData.splice(index, 1);
        this.options.numRows--;
        this.selectedRows.clear();
        this.selectedCols.clear();
        this.activeHeader = null;
        this.initDraw();
    }

    hideContextMenu() {
        if (this.contextMenu && this.contextMenu.parentNode) {
            this.contextMenu.parentNode.removeChild(this.contextMenu);
            this.contextMenu = null;
            this.activeHeader = null;
        }
    }

    getHeadIndex(mouseX, mouseY) {
        const { headerLetterHeight, headerNumberWidth } = this.options;
        if (mouseX >= 0 && mouseX <= headerNumberWidth && mouseY >= 0 && mouseY <= headerLetterHeight) {
            return { type: 'all', index: -1 };
        }
        if (mouseX >= 0 && mouseX <= headerNumberWidth && mouseY > headerLetterHeight) {
            let currentY = headerLetterHeight;
            for (let i = 0; i < this.options.numRows; i++) {
                const rowBottomY = currentY + this.rowHeights[i];

                if (mouseY >= currentY && mouseY < rowBottomY) {
                    return { type: 'row', index: i, startSize: this.rowHeights[i] };
                }
                currentY = rowBottomY;
            }
        }
        if (mouseY >= 0 && mouseY <= headerLetterHeight && mouseX > headerNumberWidth) {
            let currentX = headerNumberWidth;
            for (let i = 0; i < this.options.numCols; i++) {
                const colRightX = currentX + this.colWidths[i];

                if (mouseX >= currentX && mouseX < colRightX) {
                    return { type: 'col', index: i, startSize: this.colWidths[i] };
                }
                currentX = colRightX;
            }
        }
        return null;
    }

    handleDoubleClick(event) {
        if (this.isEditing) {
            return;
        }
        const mousePos = this.getMousePos(event);
        const cell = this.getCellIndex(mousePos.x + this.scrollOffsetX, mousePos.y + this.scrollOffsetY);
        if (cell) {
            const cellRect = this.getCellRect(cell.row, cell.col);
            if (!cellRect) return;
            this.isEditing = true;
            this.editingCell = cell;

            this.editorInput = document.createElement('input');
            this.editorInput.type = 'text';
            this.editorInput.value = this.cellsData[cell.row][cell.col];

            this.editorInput.classList.add('excel-editor-input');

            this.positionEditorInput();
            document.body.appendChild(this.editorInput);

            this.editorInput.focus();
            this.editorInput.select();

            this.editorInput.onchange = this.saveEditorValue;

            this.initDraw();
        }
    }

    positionEditorInput() {
        if (!this.isEditing || !this.editorInput) return;

        const { row, col } = this.editingCell;
        const cellRect = this.getCellRect(row, col);

        if (!cellRect) return;

        const containerRect = this.container.getBoundingClientRect();

        this.editorInput.style.left = (containerRect.left + cellRect.x - this.scrollOffsetX) + 'px';
        this.editorInput.style.top = (containerRect.top + cellRect.y - this.scrollOffsetY) + 'px';
        this.editorInput.style.width = (cellRect.width) + 'px';
        this.editorInput.style.height = (cellRect.height) + 'px';

        const inputLeft = cellRect.x - this.scrollOffsetX;
        const inputTop = cellRect.y - this.scrollOffsetY;
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

    getCellIndex(mouseX, mouseY) {
        const { headerLetterHeight, headerNumberWidth } = this.options;
        if (mouseX < headerNumberWidth || mouseY < headerLetterHeight) {
            return;
        }
        let colIndex = -1;
        let currentX = headerNumberWidth;
        for (let i = 0; i < this.options.numCols; i++) {
            currentX += this.colWidths[i];
            if (mouseX < currentX) {
                colIndex = i;
                break;
            }
        }
        let rowIndex = -1;
        let currentY = headerLetterHeight;
        for (let i = 0; i < this.options.numRows; i++) {
            currentY += this.rowHeights[i];
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
            x += this.colWidths[i];
        }
        x -= this.scrollOffsetX;
        let y = this.options.headerLetterHeight;
        for (let i = 0; i < rowIndex; i++) {
            y += this.rowHeights[i];
        }
        y -= this.scrollOffsetY;
        const width = this.colWidths[colIndex];
        const height = this.rowHeights[rowIndex];
        return { x, y, width, height };
    }

    handleScroll() {
        this.scrollOffsetX = this.container.scrollLeft;
        this.scrollOffsetY = this.container.scrollTop;

        this.initDraw();

        if (this.isEditing && this.editorInput) {
            this.positionEditorInput();
        }
    }

    saveEditorValue = () => {
        if (this.isEditing && this.editorInput) {
            this.cellsData[this.editingCell.row][this.editingCell.col] = this.editorInput.value;
            this.editorInput.remove();
            this.editorInput = null;
            this.isEditing = false;
            this.editingCell = { row: -1, col: -1 };

            this.initDraw();
        }
    }

    //鼠标的相对canvas坐标= 浏览器窗口坐标-canvas相对视口坐标
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    getResizeTarget(mouseX, mouseY) {
        const { headerLetterHeight, headerNumberWidth, resizeThreshold } = this.options;

        if (mouseX >= 0 && mouseX <= headerNumberWidth) {
            let accumulatedHeight = headerLetterHeight;
            for (let i = 0; i < this.options.numRows; i++) {
                const rowBottomY = accumulatedHeight + this.rowHeights[i];
                if (Math.abs(mouseY - rowBottomY) <= resizeThreshold) {
                    return { type: 'row', index: i, startSize: this.rowHeights[i] };
                }
                accumulatedHeight += this.rowHeights[i];
            }
        }

        if (mouseY >= 0 && mouseY <= headerLetterHeight) {
            let accumulatedWidth = headerNumberWidth;
            for (let i = 0; i < this.options.numCols; i++) {
                const colRightX = accumulatedWidth + this.colWidths[i];
                if (Math.abs(mouseX - colRightX) <= resizeThreshold) {
                    return { type: 'col', index: i, startSize: this.colWidths[i] };
                }
                accumulatedWidth += this.colWidths[i];
            }
        }

        return null;
    }

    handleMouseDown(event) {
        if (event.button !== 0) return;
        const mousePos = this.getMousePos(event);
        const { x, y } = mousePos;

        if (this.isEditing) {
            const cell = this.getCellIndex(x, y);
            if (!cell || cell.row !== this.editingCell.row || cell.col !== this.editingCell.col) {
                this.saveEditorValue();
            }
        }
        this.selectionEndCell = null;
        this.activeHeader = null; 

        this.activeHeader = null;
        this.selectedCols.clear();
        this.selectedRows.clear();
        const headIndex = this.getHeadIndex(x + this.scrollOffsetX, y + this.scrollOffsetY);
        if (headIndex) {
            if (headIndex.type === 'row') {
                this.selectedCols.add(headIndex.index);
            } else if (headIndex.type === 'col') {
                this.selectedRows.add(headIndex.index);
            } else {
                for (let i = 0; i < this.options.numRows; i++) {
                    this.selectedRows.add(i);
                }
                for (let i = 0; i < this.options.numCols; i++) {
                    this.selectedCols.add(i);
                }
            }
        }
        this.initDraw();

        const resizeTarget = this.getResizeTarget(x + this.scrollOffsetX, y + this.scrollOffsetY);
        if (resizeTarget) {
            this.isResizing = true;
            this.resizeType = resizeTarget.type;
            this.resizeIndex = resizeTarget.index;
            this.startX = x + this.scrollOffsetX;
            this.startY = y + this.scrollOffsetY;
            this.startSize = resizeTarget.startSize;

            event.preventDefault();
        }

        const clickedCell = this.getCellIndex(x + this.scrollOffsetX, y + this.scrollOffsetY);
        if (clickedCell) {
            this.isCellSelecting = true; 
            this.selectionStartCell = clickedCell;
            this.selectionEndCell = clickedCell; 
            this.initDraw(); 
        }

    }

    handleMouseMove(event) {
        const mousePos = this.getMousePos(event);
        const { x, y } = mousePos;

        if (this.isResizing) {
            const deltaX = x + this.scrollOffsetX - this.startX;
            const deltaY = y + this.scrollOffsetY - this.startY;
            let newSize;
            if (this.resizeType === 'row') {
                newSize = Math.max(this.options.minCellSize, this.startSize + deltaY);
            } else if (this.resizeType === 'col') {
                newSize = Math.max(this.options.minCellSize, this.startSize + deltaX);
            }
            this.drawResizeGuideLine(newSize);
        } else if (this.isCellSelecting) { 
            const currentCell = this.getCellIndex(x + this.scrollOffsetX, y + this.scrollOffsetY);
            if (currentCell) {
                this.selectionEndCell = currentCell;
                this.initDraw();
            }
        }else {
            const resizeTarget = this.getResizeTarget(x + this.scrollOffsetX, y + this.scrollOffsetY);
            if (resizeTarget) {
                this.canvas.style.cursor = resizeTarget.type === 'row' ? 'ns-resize' : 'ew-resize';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    drawResizeGuideLine(newSize) {
        this.ctx.save();
        this.initDraw();
        this.ctx.strokeStyle = this.options.resizeLineColor;
        this.ctx.lineWidth = this.options.resizeLineWidth;

        let linePos;
        if (this.resizeType === 'row') {
            linePos = this.getRowYPosition(this.resizeIndex) + newSize - this.scrollOffsetY;
            this.ctx.beginPath();
            this.ctx.moveTo(0, linePos);
            this.ctx.lineTo(this.canvas.width, linePos);
            this.ctx.stroke();
        } else if (this.resizeType === 'col') {
            linePos = this.getColXPosition(this.resizeIndex) + newSize - this.scrollOffsetX;
            this.ctx.beginPath();
            this.ctx.moveTo(linePos, 0);
            this.ctx.lineTo(linePos, this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    getRowYPosition(rowIndex) {
        let y = this.options.headerLetterHeight;
        for (let i = 0; i < rowIndex; i++) {
            if (i < this.rowHeights.length) {
                y += this.rowHeights[i];
            }
        }
        return y;
    }

    getColXPosition(colIndex) {
        let x = this.options.headerNumberWidth;
        for (let i = 0; i < colIndex; i++) {
            if (i < this.colWidths.length) {
                x += this.colWidths[i];
            }
        }
        return x;
    }

    handleMouseUp(event) {
        if (this.isResizing) {
            const mousePos = this.getMousePos(event);
            const deltaX = mousePos.x + this.scrollOffsetX - this.startX;
            const deltaY = mousePos.y + this.scrollOffsetY - this.startY;

            this.updateSizeAndDraw(deltaX, deltaY);

            this.isResizing = false;
            this.resizeType = null;
            this.resizeIndex = -1;
            this.canvas.style.cursor = 'default';
        }else if (this.isCellSelecting) { 
            this.isCellSelecting = false;
            this.initDraw();
        }
    }

    updateSizeAndDraw(deltaX, deltaY) {
        if (this.resizeType === 'row') {
            const newHeight = Math.max(this.options.minCellSize, this.startSize + deltaY);
            this.rowHeights[this.resizeIndex] = newHeight;
        } else if (this.resizeType === 'col') {
            const newWidth = Math.max(this.options.minCellSize, this.startSize + deltaX);
            this.colWidths[this.resizeIndex] = newWidth;
        }
        this.initDraw();
    }

}