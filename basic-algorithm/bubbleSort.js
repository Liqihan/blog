function bubbleSort(arr) {
    var result = arr.slice(0);
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr.length; j++) {
            if (result[j] > result[j + 1]) {
                var temp = result[j];
                result[j] = result[j + 1];
                result[j + 1] = temp;
            }
        }
    }
    return result;
}
const result = bubbleSort([7, 2, 1, 3, 4, 5, 6]);
console.log(result);
