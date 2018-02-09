# Hybrid App框架架构思考



### 痛点

不想吐槽，App能干的活要`h5`做什么，要想在App投放一个`H5`活动简直难上加难，还是举个例子吧。比如说你要在`h5`中判断当前App用户是否登录，怎么办？在“套壳APP”中几乎无法实现。但是在一个`h5`页面权重还很大的App内，“沟通”的需求又显得尤为重要了。（当初开发的痛苦还历历在目，多么痛的领悟之后才决定必须推行此事）。



### 目标

- 一套API规范（统一`Android`与`IOS`），所有API异步调用（防止阻塞）
- 提供大部分原生功能的API（包括很多常用的功能给`H5`使用）
- 原生需要能调用到`H5`中注册的方法（用关于原生主动通知）



### 整理实现

Hybrid架构的核心就是JsBridge交互，即是桥接 `h5`与客户端的桥梁。[js-bridge](https://github.com/Liqihan/js-bridge)是内部实现的一个框架, 部分开源，就是统一Android和IOS之后提供给`H5`调用的，，底层针对两个系统有不同实现，客户端实现分别依赖于以下两个：

1、iOS 用到的开源方案：<https://github.com/marcuswestin/WebViewJavascriptBridge> 

2、Android 用到的开源方案：<https://github.com/lzyzsd/JsBridge> 

基于以上两个实现了上面js-bridge👆，后续应该会分析注入到Webview中的JS代码。



### 需要做哪些工作

- 制定如何交互的规则，约定接口的形式（规则）
- JsBridge的实现（怎么实现交流）
- 需要规划出哪些功能的API，并且应该怎么分类（需求是什么，短期，长期，`h5`调原生，原生调`h5`）
- 前端和客户端应该需要规划出哪些功能的功能（满足业务）
- 接口实现（没错，就是干）
- 优化完善（是否忘记了什么？）



### 原理

Native和`h5` 的原理在这就不详细叙述了，可以参考下面这篇文章👇：

[【quickhybrid】H5和Native交互原理](https://github.com/quickhybrid/quickhybrid/issues/10)

基本涵盖了个大主流的交互方法吧，各种权衡分析之后（主要那时候还要考虑兼容性吧，不考虑兼容性的话可以考虑上述链接中的方法），我们实现的js-bridge就是基本url scheme来实现交互的，具体实现有点类似`jsonp`，**基本原理：**

```
H5 -> 触发一个url（每一个功能代表的url都不同）-> Native端捕获到url

-> Native端分析属于哪一个功能并执行 -> Native端调用H5中的方法将执行结果回调给H5
```



### 实现

具体可以参考[js-bridge](https://github.com/Liqihan/js-bridge)，里面的注释包含了一些我个人的理解，已经很详细了，想直接看代码的可以点击。

```javascript
const userAgent = navigator.userAgent;
const isAndroid = userAgent.match(/(Android);?[\s\/]+([\d.]+)?/)
    ? true
    : false;
const isIpad = userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false;
const isIphone =
    !isIpad && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false;
const isIos = isIpad || isIphone;
const isMobile = isAndroid || isIos;
const os = isMobile ? (isIos ? 'ios' : 'android') : ''
const deviceTouch = (AppReg = /AppleWebKit\/(\d+(\.\d+){2})/ig) => {
    let appVersion = '';
    const isOwnApp = AppReg.test(userAgent);
    if (isOwnApp) {
        appVersion = RegExp.$1 || "";
    }
    device.isOwnApp = isOwnApp;
    device.appVersion = appVersion;
    return device;
};
const device = {
    os: os,
    android: isAndroid,
    ios: isIos,
    mobile: isMobile,
    // 默认设置为true吧
    supportedJsBridge: true,
    isOwnApp: false,
    appVersion: ''
    deviceTouch: deviceTouch
}
deviceTouch();
```

这部分没有必要过多的解释，主要是用来获取webview中设备相关的属性，`deviceTouch`可以通过传入正则表达式来判断是否是自己的App（不是的话，整个bridge都没有存在的意义）。

下面我们来看整个框架最核心的部分**JsBridge**的实现。

```javascript
class JsBridge {
  	constructor() {
        this.init();
    }
    // 是否开启调试
    debug = false;
    // 是否初始化中
    doReadying = true;
    // bridge 对象
    bridge = null;
    // 回调队列
    queue = [];
    // 注册队列
    registerQueue = {};
    // 支持的API
    supportedApi = [];
    //配置
    config = options => {
        this.debug = options.debug;
    };
	//初始化
	init = () => {};
    ready = (callback) => {};
	// 调用app 
	call = (options) => {};
	// 注册给App调动的方法
	register = (options) => {};
	// 调试时打印信息
    debugInfo = message => {
        this.debug && window.alert(message);
    };
}
```

以上就是jsBridge的基本骨架：

- debug用来打开是否是调试模式，线上默认是关闭状态
- doReading要来判断客户端注入的js代码WebViewJavascriptBridge是否初始化成功
- bridge即WebViewJavascriptBridge，开始状态下为空
- queue回调队列，如果在初始化完成之前调用客户端，就先缓存到queue中，等到初始化完成之后取出再调用。
- registerQueue注册给App调用，支持重复注册，会一起调用，不会覆盖
- supportedApi判断App是否支持方法（不同版本下方法可能不相同），第一次调用成功后进入supportedApi
- config函数，是否打开debug模式
- debugInfo调试模式下alert message的
- 剩下的在下面介绍吧介绍吧



```javascript
    // 初始化bridge模块
    init = () => {
        const self = this;
        // webviewJsBridge初始化成功或者注册之后的回调
        const callback = bridge => {
            // 兼容老代码，新的使用invoke,封装了一层，解析和调试用
            bridge.invoke = bridge.callNative = (method, params, cb) => {
                // 修改回调方法
                var fn = response => {
                    if (typeof response === "string") {
                        try {
                            response = JSON.parse(response);
                        } catch (e) {
                            callback(e);
                            self.debugInfo("can not parse data from App");
                        }
                    }
                    cb(response);
                    self.debugInfo(
                        `method: ${method}; request:${JSON.stringify(
                            params
                        )}; response:${JSON.stringify(response)}`
                    );
                };
                bridge.callHandler(method, params, fn);
            };
            // Android调用JS的时候有一步init的过程
            if (bridge.hasOwnProperty("init")) {
                bridge.init();
            }
            // 初始化完成;
            self.doReadying = false;
            self.bridge = bridge;
            // bridge未初始化完成之前的调用方法执行;
            for (var i = 0; i < self.queue.length; i++) {
                var cb = self.queue[i];
                cb(bridge);
            }
        };
        if (window.WebViewJavascriptBridge) {
            callback(window.WebViewJavascriptBridge);
            self.debugInfo("bridge ready success!");
            return;
        }
        // Android注册一个监听事件，等bridge初始化成功之后执行
        document.addEventListener(
            "WebViewJavascriptBridgeReady",
            function() {
                callback(window.WebViewJavascriptBridge);
                self.debugInfo("bridge ready success!");
            },
            false
        );
        // IOS先到WVJBCallbacks,如果bridge初始化成功之后再取出并执行
        if (window.WVJBCallbacks) {
            return window.WVJBCallbacks.push(callback);
        }
        window.WVJBCallbacks = [callback];
        var WVJBIframe = document.createElement("iframe");
        WVJBIframe.style.display = "none";
        WVJBIframe.src = "https://__bridge_loaded__";
        document.documentElement.appendChild(WVJBIframe);
        setTimeout(function() {
            document.documentElement.removeChild(WVJBIframe);
        }, 0);
        return this;
    };
```

init方法主要是初始化的时候执行的。主要有以下几个功能：

- 判断当前window.WebViewJavascriptBridge是否存在，存在即执行回调函数，如果不存在，在Android中是通过事件触发的，所以在这里注册了一个监听函数，触发了再执行，在Ios中即先放到WVJBCallbacks内，等Ios内window.WebViewJavascriptBridge初始化成功之后，再从WVJBCallbacks取出并执行。


- Callback把客户端注入的js中的bridge.callHandler封装成了bridge.invoke便于调试模式的调试，顺便解析客户端返回的参数。
- 把JsBridge的doReading改为false，并把window.WebViewJavascriptBridge赋值给jsBridge，并且执行queue中的回调方法。



```javascript
// bridge初始完完成调用
    ready = callback => {
        const { isOwnApp, supportedJsBridge } = $DT;
        if (!isOwnApp || !supportedJsBridge) {
            // 不是自己的app或者h5这边没有使用bridge
            return callback();
        }
        if (this.doReadying) {
            // 正在初始化，放到队列中
            this.queue.push(callback);
        } else {
            // 初始化完成，直接调用
            callback(this.bridge);
        }
    };
```

ready方法比较简单，判断是否在我们App内，如果不是，没的说，直接返回，如果是在初始化中，放到队列queue中，否则的话，一切正常，那就直接执行吧。

```javascript
call = options => {
        const self = this;
        self.ready(bridge => {
            const { method, params, success, error = () => {} } = options;
            if (!bridge) {
                return error();
            }
            // 当前方法已支持
            if (self.supportedApi.indexOf(method) > -1) {
                let newParams =
                    typeof params !== "string"
                        ? JSON.stringify(params)
                        : params;
                bridge.invoke(method, newParams, success);
	            self.debugInfo(`正在调用APP的方法:${method}`);
            } else {
                // bridge.callNative(options.method, options.params, options.success);
                // 调用checkJsApi判断该方法是否被APP支持,返回一个对象，包含bool值的
                bridge.invoke("checkJsApi", [method], function(re) {
                    if (re[method]) {
                        // 存储下该方法
                        self.supportedApi.push(method);
                        // 已经被支持
                        bridge.invoke(method, params, success);
                        self.debugInfo(`正在调用APP的方法:${method}`);
                    } else if (typeof error === "function") {
                        // 不支持该方法
                        error();
                        self.debugInfo(`当前APP不支持方法:${method}`);
                    }
                });
            }
        });
```

call方法是`h5`用来调用app的方法的，本质上最后还是调用了bridge.callHandle，第一次或默认调用`checkJsApi`方法， 这是让客户端同学实现的用来判断当前方法是否存在（版本问题），存在的话机会进入supportedApi数组中，下次直接取用，也加入了调试信息。

```javascript
register = options => {
        var self = this;
        const { method, callback } = options;
        if (method in this.registerQueue) {
            this.registerQueue[method].push(callback);
        } else {
            this.registerQueue[method] = [];
            this.registerQueue[method].push(callback);
            this.ready(function(bridge) {
                if (!bridge) {
                    self.debugInfo("jsBridge 没有被注册");
                    return;
                }
                bridge.registerHandler(method, function() {
                    var args = [].slice.call(arguments);
                    if (args[0] && typeof args[0] === "string") {
                        try {
                            args[0] = JSON.parse(args[0]);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    self.registerQueue[method].forEach(function(fn) {
                        fn.apply(bridge, args);
                    });
                    self.debugInfo(`APP调用H5方法: ${method}`);
                });
            });
        }
    };
```

register用来注册给客户端同学调用的方法。



至此，一个小而美的桥接框架已经开发完成，基本的功能已经完成了。



### TODO（不足之处）

- API类别需要包括事件监听（如网络变化），页面跳转（如打开页面，关闭通过回调回传值），UI显示（调用后立即执行）等（长期事件）
- 部分API需要支持`H5`环境（譬如`alert`需要在`Android`、`iOS`、浏览器中同时运行）
- 调用权限的划分



### 参考

quickhybrid[https://github.com/quickhybrid/quickhybrid](https://github.com/quickhybrid/quickhybrid)