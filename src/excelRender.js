class ExcelRender {
    constructor(canvas, ctx, excelData, options) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.excelData = excelData; 
        this.options = options;
        this.alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.scrollOffsetX = 0;
        this.scrollOffsetY = 0;
        this.editingCell = { row: -1, col: -1 }; 
    }

    setScrollOffset(offsetX, offsetY) {
        this.scrollOffsetX = offsetX;
        this.scrollOffsetY = offsetY;
    }

    setEditingCell(row, col) {
        this.editingCell = { row, col };
    }

    clearEditingCell() {
        this.editingCell = { row: -1, col: -1 };
    }

    draw() {
        if (!this.ctx) return;

        const {
            headerLetterHeight, headerNumberWidth,
            borderColor, borderWidth, headerBgColor,
            textColor, font, selectionRowsOrCols
        } = this.options;

        const numRows = this.excelData.numRows;
        const numCols = this.excelData.numCols;
        const rowHeights = this.excelData.rowHeights;
        const colWidths = this.excelData.colWidths;
        const cellsData = this.excelData.cellsData;
        const selectedRows = this.excelData.selectedRows;
        const selectedCols = this.excelData.selectedCols;
        const selectionStartCell = this.excelData.selectionStartCell;
        const selectionEndCell = this.excelData.selectionEndCell;

        const totalContentWidth = this.excelData.getTotalContentWidth();
        const totalContentHeight = this.excelData.getTotalContentHeight();

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
                currentY += rowHeights[row];
            }
        }
        let currentX = headerNumberWidth;
        for (let col = 0; col <= numCols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(currentX, 0);
            this.ctx.lineTo(currentX, this.canvas.height);
            this.ctx.stroke();
            if (col < numCols) {
                currentX += colWidths[col];
            }
        }

        // --- 绘制文本 ---
        this.ctx.fillStyle = textColor;
        currentY = headerLetterHeight;
        for (let i = 0; i < numRows; i++) {
            const rowNum = i + 1;
            const y = currentY + rowHeights[i] / 2;
            const x = headerNumberWidth / 2;
            this.ctx.fillText(rowNum.toString(), x, y);
            currentY += rowHeights[i];
        }
        currentX = headerNumberWidth;
        for (let i = 0; i < numCols; i++) {
            let colLetter = "";
            let tempCol = i;
            while (tempCol >= 0) {
                colLetter = this.alpha[tempCol % 26] + colLetter;
                tempCol = Math.floor(tempCol / 26) - 1;
            }
            const x = currentX + colWidths[i] / 2;
            const y = headerLetterHeight / 2;
            this.ctx.fillText(colLetter, x, y);
            currentX += colWidths[i];
        }

        // ---绘制单元格---
        let cellY = headerLetterHeight;
        for (let r = 0; r < numRows; r++) {
            let cellX = headerNumberWidth;
            for (let c = 0; c < numCols; c++) {
                const cellValue = cellsData[r][c];
                if (cellValue !== '' && !(this.editingCell.row === r && this.editingCell.col === c)) {
                    this.ctx.fillText(cellValue, cellX + colWidths[c] / 2, cellY + rowHeights[r] / 2);
                }
                cellX += colWidths[c];
            }
            cellY += rowHeights[r];
        }

        // ---绘制选中整行和列---
        this.ctx.fillStyle = selectionRowsOrCols;
        let currrentYSelection = headerLetterHeight;
        for (let r = 0; r < numRows; r++) {
            if (selectedCols.has(r)) { 
                this.ctx.fillRect(headerNumberWidth, currrentYSelection, totalContentWidth, rowHeights[r]);
            }
            currrentYSelection += rowHeights[r];
        }
        let currentXForSelection = headerNumberWidth;
        for (let c = 0; c < numCols; c++) {
            if (selectedRows.has(c)) { 
                this.ctx.fillRect(currentXForSelection, headerLetterHeight, colWidths[c], totalContentHeight);
            }
            currentXForSelection += colWidths[c];
        }

        // --- 绘制选中区域 ---
        if (selectionStartCell && selectionEndCell) {
            const startR = Math.min(selectionStartCell.row, selectionEndCell.row);
            const endR = Math.max(selectionStartCell.row, selectionEndCell.row);
            const startC = Math.min(selectionStartCell.col, selectionEndCell.col);
            const endC = Math.max(selectionStartCell.col, selectionEndCell.col);

            let currentDrawY = headerLetterHeight;
            for (let r = 0; r < numRows; r++) {
                let currentDrawX = headerNumberWidth;
                for (let c = 0; c < numCols; c++) {
                    if (r >= startR && r <= endR && c >= startC && c <= endC) {
                        this.ctx.fillRect(currentDrawX, currentDrawY, colWidths[c], rowHeights[r]);
                    }
                    currentDrawX += colWidths[c];
                }
                currentDrawY += rowHeights[r];
            }
        }

        this.ctx.restore();
    }

    // 绘制尺寸调整辅助线
    drawResizeGuideLine(newSize, resizeType, resizeIndex) {
        this.ctx.save();
        this.draw(); 
        this.ctx.strokeStyle = this.options.resizeLineColor;
        this.ctx.lineWidth = this.options.resizeLineWidth;

        let linePos;
        if (resizeType === 'row') {
            linePos = this.getRowYPosition(resizeIndex) + newSize - this.scrollOffsetY;
            this.ctx.beginPath();
            this.ctx.moveTo(0, linePos);
            this.ctx.lineTo(this.canvas.width, linePos);
            this.ctx.stroke();
        } else if (resizeType === 'col') {
            linePos = this.getColXPosition(resizeIndex) + newSize - this.scrollOffsetX;
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
            if (i < this.excelData.rowHeights.length) {
                y += this.excelData.rowHeights[i];
            }
        }
        return y;
    }

    getColXPosition(colIndex) {
        let x = this.options.headerNumberWidth;
        for (let i = 0; i < colIndex; i++) {
            if (i < this.excelData.colWidths.length) {
                x += this.excelData.colWidths[i];
            }
        }
        return x;
    }
}