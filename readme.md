## 模拟Excel
 - 有单元格、列头、行头，初始化支持指定的行数和列数，外观参考Excel
 - 支持Resize操作，可改变任意的行高或列宽
 - 支持单元格编辑，双击进入编辑状态，离开后保存值。可再次进入单元格修改值。
 - 支持选中行或列的插入、删除操作
 - 可选：支持右键菜单
 - 可选：支持多选效果
 - 可选：思考如何支持大量的行和列
## 设计
### 类设计
  - ExcelData
  - ExcelRender
  - ExcelInteraction
  - ExcelCanvas
  - AppManager
### ExcelData类设计
  - 管理excel的行高、列宽、单元格数据以及行/列的数量。
### ExcelRender类设计
  - 根据 ExcelData 和配置选项在 Canvas 上绘制表格
### ExcelInteraction类设计
  - 处理用户与 Canvas 的交互，如鼠标事件、键盘事件、双击编辑等。
### ExcelCanvas类设计
  - 提供外部接口
### AppManage类设计
  - app