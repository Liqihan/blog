function quickSort(arr) {
    if (arr.length < 2) {
        return arr;
    }
    var tmp = arr.splice(Math.floor(arr.length / 2), 1),
        arrRight = [],
        arrLeft = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] >= tmp) {
            arrRight.push(arr[i]);
        } else {
            arrLeft.push(arr[i]);
        }
    }
    return quickSort(arrLeft).concat(tmp, quickSort(arrRight));
}

const result = quickSort([7, 2, 1, 3, 4, 5, 6]);
console.log(result);
