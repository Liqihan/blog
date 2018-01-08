// getComputedStyle读取到的 transform却是matrix，转换成translate/rotate/scale
function matrixTo(matrix){
    let arr = (matrix.replace('matrix(','').replace(')','')).split(',');
    let cos = arr[0],
        sin = arr[1],
        tan = sin / cos,
        rotate = Math.atan( tan ) * 180 / Math.PI,
        scale = cos / ( Math.cos( Math.PI / 180 * rotate )),
        trans;
    trans = {
        x:parseInt(arr[4]),
        y:parseInt(arr[5]),
        scale,
        rotate,
    };
    return trans;
}