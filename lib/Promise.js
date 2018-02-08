"use strict";

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

var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;


function Promise(resolver) {
    if (!isFunction(resolver)) {
        throw new TypeError("resolver must be a function");
    }
    this.state = PENDING;
    this.value = void 0;
    this.queue = [];
    if (resolver !== INTERNAL) {
        safelyResolveThen(this, resolver);
    }
}
Promise.prototype.then = function(onFulfilled, onRejected) {
    if (
        (!isFunction(onFulfilled) && this.state === FULFILLED) ||
        (!isFunction(onRejected) && this.state === REJECTED)
    ) {
        return this;
    }
    var promise = new this.constructor(INTERNAL);
    if (this.state !== PENDING) {
        var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
        unwrap(promise, resolver, this.value);
    } else {
        this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
    }
    return promise;
};
Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};
Promise.resolve = resolve;
function resolve(value) {
    if (value instanceof this) {
        return value;
    }
    return doResolve(new this(INTERNAL), value);
}

Promise.reject = reject;
function reject(reason) {
    var promise = new this(INTERNAL);
    return doReject(promise, reason);
}
// 安全的执行 then 函数
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
function doResolve(self, value) {
    try {
        var then = getThen(value);
        if (then) {
            safelyResolveThen(self, then);
        } else {
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
    self.state = REJECTED;
    self.value = error;
    self.queue.forEach(function(queueItem) {
        queueItem.callRejected(error);
    });
    return self;
}
function getThen(obj) {
    var then = obj && obj.then;
    if (obj && (isObject(obj) || isFunction(obj)) && isFunction(then)) {
        return function applyThen() {
            then.apply(obj, arguments);
        };
    }
}
// 第一个参数是子 promise，第二个参数是父 promise 的 then 的回调（onFulfilled/onRejected），第三个参数是父 promise 的值（正常值/错误）。
function unwrap(promise, func, value) {
    setTimeout(function() {
        var returnValue;
        try {
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
function QueueItem(promise, onFulfilled, onRejected) {
    this.promise = promise;
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
