# 关于Promise的一些理解

本文仅是阐述个人的一些理解，如有不对的地方，请指正

### 关于Promise

现在主流的Promise有很多，个人用过的有Q,bluebird等，有兴趣的可以了解，性能和写法也相差很多。

Promise规范有很多，现在最流行的是Promise/A+规范，ES6也是采用这个规范，具体可以参考:

[Promises/A+规范](http://www.ituring.com.cn/article/66566)

虽然规范很多，刨去一些细节，最核心的部分总结下来有以下几点：

- Promise内部有三种状态：pending、fulfilled、rejected。状态的变化只能从pending => fulfilled或者从pending => rejected。
- Promise的接收函数中只能执行一次resolve或者reject，如果没有调用，应该默认返回resolve。
- then方法默认返回一个promise的实例，比较流行的方式是返回一个新的promise以避免老的promsie中的状态被修改
- 值穿透



### 怎么实现一个简单的Promise

想看源码的可以直接戳[这里](https://github.com/Liqihan/blog/blob/master/lib/Promise.js)，里面加了些个人理解的注释。

Promise是一个类对象，在ES6中我们可以称为类，需要用new来实例化，简化下来（去除Promise.all和Promise.race等），一个最最简单的Promise需要有以下几个api:

```javascript
function Promise(resolver) {}

Promise.prototype.then = function() {}
Promise.prototype.catch = function() {}

Promise.resolve = function() {}
Promise.reject = function() {}
```

下面就具体一步步实现每个函数内部的一些功能

```javascript
// Promsie的三种状态
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var Promise = function(resolver) {
    if (!isFunction(resolver)) {
        throw new Error("resolver must be a function");
    }
    this.state = PENDING;
    this.value = undefined;
    this.queue = [];
    safelyResolveThen(this, resolver);
};
```

上面是一个Promise的构造函数，state用来存储promise实例中的状态，初始默认为PENDING，value用来存储resolver的返回值，当 state 是 FULFILLED 时存储返回值，当 state 是 REJECTED 时存储错误。queue是个数组用来存放回调事件。看下safelyResolveThen函数

```javascript
function safelyResolveThen(self, then) {
    var called = false;
    try {
        then(
            function(value) {
                if (called) {
                    return;
                }
                called = true;
                doResolve(self, value);
            },
            function(error) {
                if (called) {
                    return;
                }
                called = true;
                doReject(self, error);
            }
        );
    } catch (err) {
        if (called) {
            return;
        }
        called = true;
        doReject(self, err);
    }
}
```

顾名思义，此函数存在的意义就是安全的执行then函数，then中的两个参数就是resolve之后执行的函数和reject掉之后执行的函数，主要有下面3个作用👇：

- resolve或者reject只能被执行一次，用called来控制，多次调用没有意义
- try…catch捕获异常
- 正常情况下执行doResolve,错误情况下执行doReject

接下来看下doResolve和doReject函数



```javascript
// 具体成功的执行函数，返回一个promise
function doResolve(self, value) {
    try {
        var then = getThen(value);
        // 如果返回的还是一个promise的话，则把这个promise.then执行完
        if (then) {
            safelyResolveThen(self, then);
        } else {
            // 正常设置FULFILLED状态，然后进入.then方法中,这里把成功和失败的方法统一包装成了一个对象
            self.state = FULFILLED;
            self.value = value;
            self.queue.forEach(function(queueItem) {
                queueItem.callFulfilled(value);
            });
        }
        return self;
    } catch (err) {
        return doReject(self, err);
    }
}
function doReject(self, error) {
    // 有错误或者Reject掉的情况
    self.state = REJECTED;
    self.value = error;
    self.queue.forEach(function(queueItem) {
        queueItem.callRejected(error);
    });
    return self;
}
```

doResolve和doReejct主要是来改变promise实例中的state和value，即promise实例中内部的状态从PENDING =>FULFILLED或者PENDING =>REJECTED并且执行回调队列中queue对应的回调函数，并且返回自身。

getThen是一个辅助函数，如果返回值是一个promise对象的话，拿到then函数并且改写this的指向:

```javascript
// 辅助函数，获取then函数的
function getThen(obj) {
    var then = obj && obj.then;
    if (obj && (isObject(obj) || isFunction(obj)) && isFunction(then)) {
        return function applyThen() {
            then.apply(obj, arguments);
        };
    }
}
```

规范中规定：**如果 then 是函数，将 x（这里是 obj） 作为函数的 this 调用。**



doResolve和doReject中最后会执行queue中的回调函数`queueItem.callRejected(error)`or `queueItem.callFulfilled(value)`，queueitem也是一个对象，是下面构造函数QueueItem实例出的结果

```javascript
// then中onFulfilled,onRejected包装成了一个类对象
function QueueItem(promise, onFulfilled, onRejected) {
    this.promise = promise;
    // 为了兼容值穿透的情况，返回value
    this.callFulfilled = function(value) {
        doResolve(this.promise, value);
    };
    this.callRejected = function(error) {
        doReject(this.promise, error);
    };
    if (isFunction(onFulfilled)) {
        this.callFulfilled = function(value) {
            unwrap(this.promise, onFulfilled, value);
        };
    }
    if (isFunction(onRejected)) {
        this.callRejected = function(error) {
            unwrap(this.promise, onRejected, error);
        };
    }
}
```

有三个参数，promise是一个Promise的实例，因为最上面说到要返回一个新的promise，而后两个参数onFulfilled, onRejected则是then(resolve,reject)中的参数，把上面三个参数统一包装成了一个对象，进入queue队列中。如果对应的函数不存在，则初始化了一个默认的值，以此来兼容值穿透的情况。

#### 值穿透

```
promise.then('hehe').then(console.log)
```

then中包裹的不是函数，这样就造成了值穿透的情况，这种情况就需要特殊处理一下



unwap函数代码如下:

```javascript
function unwrap(promise, func, value) {
    // 执行异步操作
    setTimeout(function() {
        var returnValue;
        try {
            // promise的then中的回调结合返回值
            returnValue = func(value);
        } catch (error) {
            return doReject(promise, error);
        }
        if (returnValue === promise) {
            doReject(
                promise,
                new TypeError("Cannot resolve promise with itself")
            );
        } else {
            doResolve(promise, returnValue);
        }
    });
}
```

第一个参数是子 promise，第二个参数是父 promise 的 then 的回调（onFulfilled/onRejected），第三个参数是父 promise 的值（正常值/错误），使用setTimeout来执行异步操作，使用try...catch来捕获异常。



#### Promise.prototype.then 和 Promise.prototype.catch

```javascript
// then方法内默认返回一个新的promise
Promise.prototype.then = function(onFulfilled, onRejected) {
	// 如果是值穿透的情况
    if (
        (!isFunction(onFulfilled) && this.state === FULFILLED) ||
        (!isFunction(onRejected) && this.state === REJECTED)
    ) {
        return this;
    }
    // 创建一个新的promise，
    // 或者使用，var promise = new Promise(INTERNAL);
    var promise = new this.constructor(INTERNAL);
    if (this.state !== PENDING) {
        // 如Promse.resolve('234234').then(() => {}),或者reject的情况
        // 会创造一个新的Promise并且this.value指向234234
        var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
        // 直接执行回调了
        unwrap(promise, resolver, this.value);
    } else {
        // 正常进来都是PENDING状态，所以放到队列中，resolve或者reject掉之后返回
        this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
    }
    return promise;
};
Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};
```





#### Promise.resolve 和 Promise.reject

```javascript
Promise.resolve = function resolve(value) {
	// 当 Promise.resolve 参数是一个 promise 时，直接返回该值。
    if (value instanceof this) {
        return value;
    }
    return doResolve(new this(INTERNAL), value);
}

Promise.reject = function reject(reason) {
    var promise = new this(INTERNAL);
    return doReject(promise, reason);
}
```

这样基本上算是实现了一个简单的Promise,只有核心的部分，后续应该还会再加吧！

### 参考

深入 Promise(一)——Promise 实现详解: [https://zhuanlan.zhihu.com/p/25178630](https://zhuanlan.zhihu.com/p/25178630)

【翻译】Promises/A+规范[http://www.ituring.com.cn/article/66566](http://www.ituring.com.cn/article/66566)