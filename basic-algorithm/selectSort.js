function selectSort(arr) {
    var result = arr.slice(0);
    var minIndex, temp;
    for (var i = 0; i < arr.length; i++) {
        minIndex = i;
        for (var j = i; j < arr.length; j++) {
            if (result[j] < result[minIndex]) {
                minIndex = j;
            }
        }
        temp = result[i];
        result[i] = result[minIndex];
        result[minIndex] = temp;
    }
    return result;
}
const result = selectSort([7, 2, 1, 3, 4, 5, 6]);
console.log(result);