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
            numRows: 10,
            numCols: 8,
            resizeThreshold: 5,
            borderColor: "#ccc",
            borderWidth: 1,
            headerBgColor: "#f6f7fa",
            textColor: "#000000ff",
            font: "14px Arial, sans-serif",
            resizeLineColor: "#1a73e8b9",
            resizeLineWidth: 2
        }

        this.options = { ...defaultOptions, ...options };
        this.alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        this.rowHeights = new Array(this.options.numRows).fill(this.options.defaultCellHeight);
        this.colWidths = new Array(this.options.numCols).fill(this.options.defaultCellWidth);

        this.cellsData = Array.from({length:this.options.numRows},() => new Array(this.options.numCols).fill(''));

        this.isEditing = false;
        this.editingCell = {row:-1,col:-1};
        this.eidtorInput = null;

        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
        this.startX = 0;
        this.startY = 0;
        this.startSize = 0;

        this.scrollOffsetX = 0;
        this.scrollOffsetY = 0;


        this.addEventListeners();
    }

    initDraw() {
        if (!this.ctx) return;

        const {
            headerLetterHeight, headerNumberWidth,
            numRows, numCols, borderColor, borderWidth, headerBgColor,
            textColor, font
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
                cellX +=this.colWidths[c];
            }
            cellY += this.rowHeights[r];
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
                this.cellsData = this.cellsData.slice(0,newRows);
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
                for(let r = 0;r<this.cellsData.length;r++){
                    for(let i = 0; i < diff; i++){
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

    // setRowCount(rowCount) {
    //     if (typeof rowCount === 'number' && rowCount > 0) {
    //         this.options.numRows = rowCount;
    //         this.initDraw(); 
    //     } else {
    //         console.warn("无效的行数输入。");
    //     }
    // }
    // setColumnCount(colCount) {
    //     if (typeof colCount === 'number' && colCount > 0) {
    //         this.options.numCols = colCount;
    //         this.initDraw(); 
    //     } else {
    //         console.warn("无效的列数输入。");
    //     }
    // }

    // setRowHeight(row, height) {

    // }
    // getRowHeight(row) {

    // }
    // setColumnWidth(col, width) {

    // }
    // getColumnWidth(col) {

    // }
    // setValue (row, col, value) {

    // }
    // getValue(row, col) {

    // }

    // resize功能 鼠标事件按下 移动 释放
    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick',this.handleDoubleClick.bind(this))
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
    }
    handleDoubleClick(event){
        if(this.isEditing){
            return;
        }
        const mousePos = this.getMousePos(event);
        const cell = this.getCellIndex(mousePos.x,mousePos.y);
        if(cell){
            const cellRect = this.getCellRect(cell.row,cell.col);
            if(!cellRect) return;
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

        if (!cellRect)  return;

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

    getCellIndex(mouseX,mouseY){
        const{headerLetterHeight,headerNumberWidth} = this.options;
        if(mouseX <headerNumberWidth || mouseY <headerLetterHeight){
            return;
        }
        let colIndex = -1;
        let currentX = headerNumberWidth;
        for(let i = 0;i< this.options.numCols;i++){
            currentX += this.colWidths[i];
            if(mouseX < currentX){
                colIndex = i ;
                break;
            }
        }
        let rowIndex = -1;
        let currentY = headerLetterHeight;
        for(let i = 0;i< this.options.numRows;i++){
            currentY += this.rowHeights[i];
            if(mouseY < currentY){
                rowIndex = i ;
                break;
            }
        }

        if(rowIndex !== -1 && colIndex !==-1){
            return { row:rowIndex,col:colIndex};
        }
        return null;
    }
    getCellRect(rowIndex, colIndex){
        let x = this.options.headerNumberWidth;
        for(let i = 0;i<colIndex;i++){
            x+=this.colWidths[i];
        }
        let y = this.options.headerLetterHeight;
        for(let i = 0;i<rowIndex;i++){
            y+=this.rowHeights[i];
        }
        const width = this.colWidths[colIndex];
        const height = this.rowHeights[rowIndex];
        return {x,y,width,height };
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
            this.editingCell = {row:-1,col:-1};

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
        const resizeTarget = this.getResizeTarget(x, y);
        if (resizeTarget) {
            this.isResizing = true;
            this.resizeType = resizeTarget.type;
            this.resizeIndex = resizeTarget.index;
            this.startX = x;
            this.startY = y;
            this.startSize = resizeTarget.startSize;

            event.preventDefault();
        }

    }

    handleMouseMove(event) {
        const mousePos = this.getMousePos(event);
        const { x, y } = mousePos;

        if (this.isResizing) {
            const deltaX = x - this.startX;
            const deltaY = y - this.startY;
            let newSize;
            if (this.resizeType === 'row') {
                newSize = Math.max(this.options.minCellSize, this.startSize + deltaY);
            } else if (this.resizeType === 'col') {
                newSize = Math.max(this.options.minCellSize, this.startSize + deltaX);
            }
            this.drawResizeGuideLine(newSize);
        } else {
            const resizeTarget = this.getResizeTarget(x, y);
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
            linePos = this.getRowYPosition(this.resizeIndex) + newSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, linePos);
            this.ctx.lineTo(this.canvas.width, linePos);
            this.ctx.stroke();
        } else if (this.resizeType === 'col') {
            linePos = this.getColXPosition(this.resizeIndex) + newSize;
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
            const deltaX = mousePos.x - this.startX;
            const deltaY = mousePos.y - this.startY;

            this.updateSizeAndDraw(deltaX, deltaY);

            this.isResizing = false;
            this.resizeType = null;
            this.resizeIndex = -1;
            this.canvas.style.cursor = 'default';
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