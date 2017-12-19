module.exports = function (title) {
    document.title = title;
    var mobile = navigator.userAgent.toLowerCase();
    // 针对微信
    if (/iphone|ipad|ipod/.test(mobile)) {
        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        // 替换成站标favicon路径或者任意存在的较小的图片即可,建议不要使用阿里云cdn的地址，会被微信封掉
        iframe.setAttribute('src', 'xxx.png');
        var iframeCallback = function () {
            setTimeout(function () {
                iframe.removeEventListener('load', iframeCallback);
                document.body.removeChild(iframe);
            }, 0);
        };
        iframe.addEventListener('load', iframeCallback);
        document.body.appendChild(iframe);
    }
};
