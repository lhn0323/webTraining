class ExcelCanvas {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found.`);
            return;
        }
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
        };

        this.options = { ...defaultOptions, ...options };

        this.excelData = new ExcelData(this.options);
        this.excelRenderer = new ExcelRenderer(this.canvas, this.ctx, this.excelData, this.options);
        this.excelInteraction = new ExcelInteraction(this.canvas, this.container, this.excelData, this.excelRenderer, this.options);
    }

    initDraw() {
        this.excelRenderer.draw();
    }

    setRows(newRows) {
        if (this.excelData.setNumRows(newRows)) {
            this.excelRenderer.draw();
        }
    }

    setCols(newCols) {
        if (this.excelData.setNumCols(newCols)) {
            this.excelRenderer.draw();
        }
    }

    getNumRows() {
        return this.excelData.numRows;
    }

    getNumCols() {
        return this.excelData.numCols;
    }
}