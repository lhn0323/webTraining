function draw() {
    var canvas = document.getElementById("excel");
    if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        //绘制一个矩形的边框，边框色为当前的 strokeStyle
        ctx.strokeStyle = "rgba(0, 0, 0, 1)"
        ctx.strokeRect(0, 0, 200, 200);

        //fillRect(x, y, width, height)
        // fillRect() 方法绘制一个填充了内容的矩形，这个矩形的开始点（左上点）在 (x, y) ，
        // 它的宽度和高度分别由 width 和 height 确定，填充样式由当前的 fillStyle 决定。
        ctx.fillStyle = "rgba(200,0,0, 0.5)";
        ctx.fillRect(10, 10, 55, 50);

        ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
        ctx.fillRect(30, 30, 55, 50);

        //这个方法通过把像素设置为透明，以达到擦除一个矩形区域的效果。
        ctx.clearRect(100, 100, 10, 10);

        // 填充三角形
        ctx.fillStyle = "rgba(153, 184, 167, 0.5)";
        ctx.beginPath();
        ctx.moveTo(25, 25);//设置起点，绘制不连续的路径
        ctx.lineTo(105, 25); //绘制直线 25，25到105，25绘制一条从当前位置到指定坐标 (x,y) 的直线
        ctx.lineTo(25, 105);
        ctx.fill(); // 自动闭合路径


    }
}

document.addEventListener("DOMContentLoaded", draw);