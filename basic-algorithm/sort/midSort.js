// 二分插入排序
function midSort(arr) {
    var result = arr.slice(0);
    var i, j, tmp, low, high, mid;
    for (var i = 1; i < arr.length; i++) {
        var tmp = arr[i];
        low = 0;
        high = i - 1;
        while (low <= high) {
            mid = parseInt((low + high) / 2, 10);
            if (result[mid] > high) {
                high = mid -1;
            } else {
                low = mid + 1;
            }
        }
        for (j = i - 1; j >= mid; j--) {
            result[j + 1] = result[j];
        }
        result[j + 1] = tmp;
    }
    return result;
}
const result = midSort([7, 2, 1, 3, 4, 5, 6]);
console.log(result);
