var Promise = require('../lib/Promise');
console.log(Promise);
var a = new Promise(function(resolve, reject) {
    console.log(1111);
    resolve();
}).then(function() {
    console.log(1211);
}).then(() => {
    console.log(333);
})
Promise.resolve('234234').then((data) => {
    console.log(1231231231232);
    console.log(data);
})