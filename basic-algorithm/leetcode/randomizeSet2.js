/**
Design a data structure that supports all following operations in average O(1) time.

Note: Duplicate elements are allowed.
insert(val): Inserts an item val to the collection.
remove(val): Removes an item val from the collection if present.
getRandom: Returns a random element from current collection of elements. The probability of each element being returned is linearly related to the number of same value the collection contains.
 */

/**
 * Initialize your data structure here.
 */
var RandomizedCollection = function() {
    this.set = [];
};

/**
 * Inserts a value to the set. Returns true if the set did not already contain the specified element.
 * @param {number} val
 * @return {boolean}
 */
RandomizedCollection.prototype.insert = function(val) {
    var check = false;
    if (this.set.indexOf(val) === -1) {
        check = true;
    }
    this.set.push(val);
    return check;
};

/**
 * Removes a value from the set. Returns true if the set contained the specified element.
 * @param {number} val
 * @return {boolean}
 */
RandomizedCollection.prototype.remove = function(val) {
    var index = this.set.indexOf(val);
    if (index === -1) {
        return false;
    }
    this.set.splice(index, 1);
    return true;
};

/**
 * Get a random element from the set.
 * @return {number}
 */
RandomizedCollection.prototype.getRandom = function() {
    return this.set[Math.floor(this.set.length * Math.random())];
};
/**
 * Your RandomizedCollection object will be instantiated and called as such:
 * var obj = Object.create(RandomizedCollection).createNew()
 * var param_1 = obj.insert(val)
 * var param_2 = obj.remove(val)
 * var param_3 = obj.getRandom()
 */
