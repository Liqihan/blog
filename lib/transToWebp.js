/*
 * @Author: grove.liqihan
 * @Desc: 当前环境是否支持webp，支持的话尽可能的转成webp格式
 */

import Uri from "jsuri";

/**
 * 检测是否支持 webp
 * @return {Boolean} true or false
 */
var checkWebp = function() {
    try {
        return (
            document
                .createElement("canvas")
                .toDataURL("image/webp")
                .indexOf("data:image/webp") === 0
        );
    } catch (err) {
        return false;
    }
};

var supportWebp = checkWebp();

export default function transformWebp(src) {
    // 如果是base64的直接返回
    if (!src || !supportWebp || src.indexOf('data:image') !== -1 || src.indexOf('benditoutiao') === -1 ) {
        return src;
    }
    // 避免重复
    // 阿里云转成webp格式
    return new Uri(src).deleteQueryParam('x-oss-process').addQueryParam('x-oss-process', 'image/format,webp').toString();
}