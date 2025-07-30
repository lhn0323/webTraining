import { ExcelData } from './excelData.js';
import { ExcelRender } from './excelRender.js';
import { ExcelInteraction } from './excelInteraction.js';
export class ExcelCanvas {
    constructor(canvasId, options = {}) {
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
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.ctx = null;
            this.container = null;
            this.excelData = null;
            this.excelRender = null;
            this.excelInteraction = null;
            return;
        }
        this.ctx = this.canvas.getContext("2d");
        this.container = this.canvas.parentElement;
        this.excelData = new ExcelData(this.options);
        this.excelRender = new ExcelRender(this.canvas, this.ctx, this.excelData, this.options);
        this.excelInteraction = new ExcelInteraction(this.canvas, this.container, this.excelData, this.excelRender, this.options);
    }
    initDraw() {
        this.excelRender.draw();
    }
    setRows(newRows) {
        if (this.excelData.setNumRows(newRows)) {
            this.excelRender.draw();
        }
    }
    setCols(newCols) {
        if (this.excelData.setNumCols(newCols)) {
            this.excelRender.draw();
        }
    }
    getNumRows() {
        return this.excelData.numRows;
    }
    getNumCols() {
        return this.excelData.numCols;
    }
}
