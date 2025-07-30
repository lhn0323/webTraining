import { ExcelData } from './excelData.js';
import { ExcelRender} from './excelRender.js'
import { ExcelInteraction } from './excelInteraction.js'; 
import { ExcelOptions, MousePosition, CellPosition, CellRect, ResizeTarget, HeadInfo, ActiveHeader } from './type';

export class ExcelCanvas {
    private canvas: HTMLCanvasElement; 
    private ctx: CanvasRenderingContext2D | null; 
    private container: HTMLElement | null; 
    private options: ExcelOptions | null;
    private excelData: ExcelData |null;
    private excelRender: ExcelRender | null;
    private excelInteraction: ExcelInteraction | null;

    constructor(canvasId:string, options: Partial<ExcelOptions> = {}) {

        const defaultOptions :ExcelOptions= {
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

        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
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
        this.excelRender = new ExcelRender(this.canvas, this.ctx!, this.excelData, this.options);
        this.excelInteraction = new ExcelInteraction(this.canvas, this.container!, this.excelData, this.excelRender, this.options);
    }

    initDraw() {
        this.excelRender!.draw();
    }

    setRows(newRows:number) {
        if (this.excelData!.setNumRows(newRows)) {
            this.excelRender!.draw();
        }
    }

    setCols(newCols:number) {
        if (this.excelData!.setNumCols(newCols)) {
            this.excelRender!.draw();
        }
    }

    getNumRows() {
        return this.excelData!.numRows;
    }

    getNumCols() {
        return this.excelData!.numCols;
    }
}