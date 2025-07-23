class ExcelCanvas {

    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

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
            font: "14px Arial, sans-serif" ,
            resizeLineColor: "#1a73e8b9",  
            resizeLineWidth: 2            
        }
        
        this.options = { ...defaultOptions, ...options };
        this.alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
     
        this.rowHeights = new Array(this.options.numRows).fill(this.options.defaultCellHeight);
        this.colWidths = new Array(this.options.numCols).fill(this.options.defaultCellWidth);

        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
        this.startX = 0;
        this.startY = 0;
        this.startSize = 0;

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
            currentY+=this.rowHeights[i];
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
    }

    setRows(newRows) {
        if (typeof newRows === 'number' && newRows > 0) {
            this.options.numRows = newRows;
            this.initDraw(); 
        } else {
            console.warn("无效的行数输入。");
        }
    }

    setCols(newCols) {
        if (typeof newCols === 'number' && newCols > 0) {
            this.options.numCols = newCols;
            this.initDraw(); 
        } else {
            console.warn("无效的列数输入。");
        }
    }

    // resize功能 鼠标事件按下 移动 释放
    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
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
            let currentY = headerLetterHeight;
            for (let i = 0; i < this.options.numRows; i++) {
                currentY += this.rowHeights[i];
                if (Math.abs(mouseY - currentY) <= resizeThreshold) {
                    return { type: 'row', index: i, startSize: this.rowHeights[i] };
                }
            }
        }

        if (mouseY >= 0 && mouseY <= headerLetterHeight) {
            let currentX = headerNumberWidth;
            for (let i = 0; i < this.options.numCols; i++) {
                currentX += this.colWidths[i];
                if (Math.abs(mouseX - currentX) <= resizeThreshold) {
                    return { type: 'col', index: i, startSize: this.colWidths[i] };
                }
            }
        }

        return null;
    }

    handleMouseDown(event) {
        if (event.button !== 0) return;
        const mousePos = this.getMousePos(event);
        const { x, y } = mousePos;
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

        if(this.isResizing){
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

    handleMouseUp(event){
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

    updateSizeAndDraw(deltaX, deltaY){
        if(this.resizeType === 'row'){
            const newHeight = Math.max(this.options.minCellSize,this.startSize+deltaY);
         this.rowHeights[this.resizeIndex] = newHeight;
        } else if (this.resizeType === 'col') {
            const newWidth = Math.max(this.options.minCellSize, this.startSize + deltaX);
            this.colWidths[this.resizeIndex] = newWidth;
        }
        this.initDraw();
    }

}