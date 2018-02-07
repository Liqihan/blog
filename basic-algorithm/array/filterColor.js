// 函数查找到这些敏感词，并将其字体颜色更改为红色
function filterColor(text, arr){
    return arr.reduce((result, word) => {
        return result.replace(new RegExp(word,"gm"), `<font color="red">${word}</font>`)
    }, text);
}