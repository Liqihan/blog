"use strict";
// 类似noop函数
function INTERNAL() {}

function isFunction(func) {
    return typeof func === "function";
}

function isObject(obj) {
    return typeof obj === "object";
}

function isArray(arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
}
// Promsie的状态
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;


function Promise(resolver) {
    if (!isFunction(resolver)) {
        throw new TypeError("resolver must be a function");
    }
    this.state = PENDING;
    this.value = void 0;
    // 队列
    this.queue = [];
    if (resolver !== INTERNAL) {
        safelyResolveThen(this, resolver);
    }
}
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
// 安全的执行 then 函数,捕获异常，resolve或者reject只执行一次，没错执行doResolve,错误执行doReject
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
// 辅助函数，获取then函数的
function getThen(obj) {
    var then = obj && obj.then;
    if (obj && (isObject(obj) || isFunction(obj)) && isFunction(then)) {
        return function applyThen() {
            then.apply(obj, arguments);
        };
    }
}
//执行异步操作的地方， 第一个参数是子 promise，第二个参数是父 promise 的 then 的回调（onFulfilled/onRejected），第三个参数是父 promise 的值（正常值/错误）。
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
module.exports = Promise;
