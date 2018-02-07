// You're given strings J representing the types of stones that are jewels, and S representing the stones you have.  Each character in S is a type of stone you have.  You want to know how many of the stones you have are also jewels.

// The letters in J are guaranteed distinct, and all characters in J and S are letters. Letters are case sensitive, so "a" is considered a different type of stone from "A".

/**
 * @param {string} J
 * @param {string} S
 * @return {number}
 */
var numJewelsInStones = function(J, S) {
    var output = 0;
    for (const i of S) {
        if (J.indexOf(i) !== -1) {
            output++;
        }
    }
    return output;
};

console.log(numJewelsInStones('aA', "aAAbbbb"))