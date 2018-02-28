// destructuringArray( [1,[2,4],3], "[a,[b],c]" );
// result
// { a:1, b:2, c:3 }
const targetArray = [1, [2, 3], 4];
const formater = "[a, [b], c]";
const formaterArray = ['a', ['b'], 'c'];
const destructuringArray = (values, keys) => {
    try {
        const obj = {}
        if (typeof keys === 'string') {
            keys = JSON.parse(keys.replace(/\w+/g, '"$&"'));
        }
        const iterate = (values, keys) => {
            keys.forEach((key, i) => {
                if (Array.isArray(key)) {
                    iterate(values[i], key)
                } else {
                    obj[key] = values[i];
                }
            });
        }
        iterate(targetArray, keys);
        return obj
    } catch (err) {
        console.error(err.message);
    } 
}
var a = destructuringArray(targetArray, formater)
console.log(a);