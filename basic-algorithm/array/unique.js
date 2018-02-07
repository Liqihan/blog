// es6
function unique(arr) {
    return [...new Set(arr)];
}
// es5
function unique1(arr) {
    var newArr = [];
    for (var i = 0; i < arr.length; i++) {
        if (newArr.indexOf(arr[i]) === -1) {
            newArr.push(arr[i]);
        }
    }
    return newArr;
}
console.log(unique([1, 2, 3, 4, 2, 3]));
console.log(unique1([1, 2, 3, 4, '4', 2, 3]));
