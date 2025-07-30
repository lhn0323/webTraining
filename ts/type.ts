interface ExcelOptions {
    defaultCellWidth: number;
    defaultCellHeight: number;
    minCellSize: number;
    headerLetterHeight: number;
    headerNumberWidth: number;
    numRows: number;
    numCols: number;
    resizeThreshold: number;
    borderColor: string;
    borderWidth: number;
    headerBgColor: string;
    textColor: string;
    font: string;
    resizeLineColor: string;
    resizeLineWidth: number;
    selectionRowsOrCols: string
}

interface CellPosition{
    row:number;
    col:number;
}

interface CellRect{
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MousePosition {
    x: number;
    y: number;
}

interface ResizeTarget {
    type: 'row' | 'col';
    index: number;
    startSize: number;
}

interface HeadInfo {
    type: 'row' | 'col' | 'all';
    index: number; // For 'row' or 'col', it's the index; for 'all', it's -1
}

interface ActiveHeader {
    type: 'row' | 'col';
    index: number;
}
export{ExcelOptions, CellPosition, CellRect, MousePosition, ResizeTarget, HeadInfo, ActiveHeader}