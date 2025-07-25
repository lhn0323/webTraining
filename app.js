class AppManager {
    constructor() {
        this.excelCanvas = null;
        this.formatMenuTrigger = document.getElementById("format-menu-trigger");
        this.formatDropdownContent = document.getElementById("format-dropdown-content");
        this.menuRows = document.getElementById("menu-rows");
        this.menuCols = document.getElementById("menu-cols");
        this.menuApply = document.getElementById("menu-apply");
        this.menuCancel = document.getElementById("menu-cancel");

        this.init();
    }

    init() {
        this.excelCanvas = new excelCanvas("main-excel-canvas",  { numRows: 10, numCols: 8 });
        this.excelCanvas.initDraw();
        this.addEventListeners();
    }

    addEventListeners() {
        this.formatMenuTrigger.addEventListener("click", (event) => {
            event.stopPropagation(); 
            this.toggleDropdown();
        });

        this.menuApply.addEventListener("click", (event) => { 
            event.stopPropagation();
            this.applyChanges();
        });

        this.menuCancel.addEventListener("click", (event) => { 
            event.stopPropagation(); 
            this.hideDropdown();
        });

        document.addEventListener("click", (event) => {
            if (!this.formatMenuTrigger.contains(event.target) && !this.formatDropdownContent.contains(event.target)) {
                this.hideDropdown();
            }
        });

        // 阻止输入框、标签等元素内部点击事件冒泡到 document，防止被误判为“外部点击”而关闭菜单。
        // 为整个 dropdown-content 添加一个点击事件监听器，并阻止冒泡
        this.formatDropdownContent.addEventListener("click", (event) => {
             event.stopPropagation();
        });
    }

    toggleDropdown() {
        const isDisplayed = this.formatDropdownContent.style.display === "block";
        if (isDisplayed) {
            this.hideDropdown();
        } else {
            this.showDropdown();
        }
    }

    showDropdown() {
        this.formatDropdownContent.style.display = "block";
        this.formatMenuTrigger.classList.add("active");
        this.menuRows.value = this.excelCanvas.options.numRows;
        this.menuCols.value = this.excelCanvas.options.numCols;
    }

    hideDropdown() {
        this.formatDropdownContent.style.display = "none";
        this.formatMenuTrigger.classList.remove("active");
    }

    applyChanges() {
        const newRows = parseInt(this.menuRows.value);
        const newCols = parseInt(this.menuCols.value);

        let isValid = true;

        if (isNaN(newRows) || newRows <= 0) {
            alert("行数输入无效，请输入大于0的整数。");
            isValid = false;
        }

        if (isNaN(newCols) || newCols <= 0) {
            alert("列数输入无效，请输入大于0的整数。");
            isValid = false;
        }

        if (isValid) {
            this.excelCanvas.setRows(newRows);
            this.excelCanvas.setCols(newCols);
            this.hideDropdown(); 
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new AppManager();
});