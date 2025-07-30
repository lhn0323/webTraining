import { CellPosition, ExcelOptions } from './type'

export class ExcelData {
    options: ExcelOptions;
    numRows: number;
    numCols: number;
    rowHeights: number[];
    colWidths: number[];
    cellsData: string[][];
    selectedRows: Set<number>;
    selectedCols: Set<number>;
    selectionStartCell: CellPosition | null;
    selectionEndCell: CellPosition | null;
    constructor(options: ExcelOptions) {
        this.options = options;
        this.numRows = options.numRows;
        this.numCols = options.numCols;

        this.rowHeights = new Array(this.numRows).fill(options.defaultCellHeight);
        this.colWidths = new Array(this.numCols).fill(options.defaultCellWidth);

        this.cellsData = Array.from({ length: this.numRows }, () => new Array(this.numCols).fill(''));

        this.selectedRows = new Set();
        this.selectedCols = new Set();
        this.selectionStartCell = null;
        this.selectionEndCell = null;
    }

     getRowHeight(rowIndex:number): number{
        return this.rowHeights[rowIndex];
    }

    setRowHeight(rowIndex: number, height:number):void{
        this.rowHeights[rowIndex] = height;
    }

    getColWidth(colIndex:number) :number{
        return this.colWidths[colIndex];
    }

    setColWidth(colIndex:number, width:number) :void{
        this.colWidths[colIndex] = width;
    }

    getCellValue(row:number, col:number):string {
        if (row >= 0 && row < this.numRows && col >= 0 && col < this.numCols) {
            return this.cellsData[row][col];
        }
        return '';
    }

    setCellValue(row:number, col:number, value:string):void {
        if (row >= 0 && row < this.numRows && col >= 0 && col < this.numCols) {
            this.cellsData[row][col] = value;
        }
    }

    getTotalContentWidth() : number{
        return this.colWidths.reduce((sum, width) => sum + width, 0);
    }

    getTotalContentHeight() : number{
        return this.rowHeights.reduce((sum, height) => sum + height, 0);
    }

    setNumRows(newRows: number) :boolean{
        if (typeof newRows === 'number' && newRows > 0) {
            if (newRows > this.numRows) {
                const diff = newRows - this.numRows;
                for (let i = 0; i < diff; i++) {
                    this.rowHeights.push(this.options.defaultCellHeight);
                    this.cellsData.push(new Array(this.numCols).fill(''));
                }
            } else {
                this.rowHeights = this.rowHeights.slice(0, newRows);
                this.cellsData = this.cellsData.slice(0, newRows);
            }
            this.numRows = newRows;
            return true;
        } else {
            console.warn("无效的行数输入。");
            return false;
        }
    }

    setNumCols(newCols: number) :boolean{
        if (typeof newCols === 'number' && newCols > 0) {
            if (newCols > this.numCols) {
                const diff = newCols - this.numCols;
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
            this.numCols = newCols;
            return true;
        } else {
            console.warn("无效的列数输入。");
            return false;
        }
    }

    insertCol(index: number) {
        for (let i = 0; i < this.cellsData.length; i++) {
            this.cellsData[i].splice(index, 0, '');
        }
        this.colWidths.splice(index, 0, this.options.defaultCellWidth);
        this.numCols++;
        this.clearSelection();
    }

    deleteCol(index: number) {
        if (this.numCols <= 1) {
            alert("只剩一列，无法删除");
            return false;
        }
        for (let i = 0; i < this.cellsData.length; i++) {
            this.cellsData[i].splice(index, 1);
        }
        this.colWidths.splice(index, 1);
        this.numCols--;
        this.clearSelection();
        return true;
    }

    insertRow(index: number) {
        this.cellsData.splice(index, 0, new Array(this.numCols).fill(''));
        this.rowHeights.splice(index, 0, this.options.defaultCellHeight);
        this.numRows++;
        this.clearSelection();
    }

    deleteRow(index: number) :boolean{
        if (this.numRows <= 1) {
            alert("只剩一行，无法删除");
            return false;
        }
        this.rowHeights.splice(index, 1);
        this.cellsData.splice(index, 1);
        this.numRows--;
        this.clearSelection();
        return true;
    }

    clearSelection() {
        this.selectedRows.clear();
        this.selectedCols.clear();
        this.selectionStartCell = null;
        this.selectionEndCell = null;
    }

}
