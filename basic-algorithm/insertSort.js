// 插入排序
function insertSort(arr) {
    var i, j, tmp;
    var result = arr.slice(0);
    for (i = 1; i < arr.length; i++) {
        tmp = result[i];
        j = i - 1;
        while (j >= 0 && tmp < result[j]) {
            result[j + 1] = result [j];
            j--;
        }
        result[j + 1] = tmp;
        console.log(result);
    }
    return result;
}
const result = insertSort([7,2,1,3,4,5,6]);
console.log(result);