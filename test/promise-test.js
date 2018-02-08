var Promise = require("../lib/Promise");
console.log(Promise);
var a = new Promise(function(resolve, reject) {
    console.log(1111);
    resolve();
})
    .then(function() {
        console.log(1211);
    })
    .then(() => {
        console.log(333);
    });
Promise.resolve("234234").then(data => {
    console.log(1231231231232);
    console.log(data);
});
function doSomething() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("something");
        }, 1000);
    });
}

function doSomethingElse() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("somethingElse");
        }, 1500);
    });
}
console.time("case 1");
doSomething()
    .then(() => {
        return doSomethingElse();
    })
    .then(function finalHandler(res) {
        console.log(res);
        console.timeEnd("case 1");
    });
console.time("case 2");
doSomething()
    .then(function() {
        doSomethingElse();
    })
    .then(function finalHandler(res) {
        console.log(res);
        console.timeEnd("case 2");
    });
console.time("case 3");
doSomething()
    .then(doSomethingElse())
    .then(function finalHandler(res) {
        console.log(res);
        console.timeEnd("case 3");
    });
console.time("case 4");
doSomething()
    .then(doSomethingElse)
    .then(function finalHandler(res) {
        console.log(res);
        console.timeEnd("case 4");
    });
