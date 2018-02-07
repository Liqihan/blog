// 给 Array 对象增加一个原型方法，用于删除数组条目中重复的条目
Array.prototype.distinct = function() {
    var ret = [];
    for (var i = 0; i < this.length; i++) {
        for (var j = i + 1; j < this.length; ) {
            if (this[i] === this[j]) {
                ret.push(this.splice(j, 1)[0]);
            } else {
                j++;
            }
        }
    }
    return ret;
};
console.log([1, 2, 3, 4, 4, "4", 5].distinct());
