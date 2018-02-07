// ES6的Promise对象优化下面代码
// var fs = require('fs');  
// fs.readFile('sample01.txt', 'utf8', function (err, data) {  
//     fs.readFile('sample02.txt', 'utf8', function (err,data) {  
//         fs.readFile('sample03.txt', 'utf8', function (err, data) {  
//             fs.readFile('sample04.txt', 'utf8', function (err, data) {  
  
//             });  
//         });  
//     });  
// }); 
var file = ["1.txt", "2.txt", "3.txt"];
var a = file.reduce((promise, filename) => {
    return new Promise((resolve, reject) => {
        promise.then((content) => {
            // 异步操作,改成读取文件这些
            setTimeout(() => {
                resolve(content.concat(filename));
            }, 1000);
        })
    });
}, Promise.resolve([]));

a.then(data => console.log(data));
