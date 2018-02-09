/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findMaxAverage = function(nums, k) {
    var length = nums.length;
    var maxTotal = void 0;
    for (var i = 0; i <= length - k; i++) {
        var total = 0;
        for (var j = 0; j < k; j++) {
            total += nums[i + j];
        }
        if (!maxTotal) {
            maxTotal = total;
        } else if (maxTotal < total) {
            maxTotal = total;
        }
    }
    return maxTotal / 4;
};
