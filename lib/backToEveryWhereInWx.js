pushHistory(); 
window.addEventListener("popstate", function(e) { 
    alert("我监听到了浏览器的返回按钮事件啦");//根据自己的需求实现自己的功能 
}, false); 
function pushHistory() { 
    var state = { 
        title: "title", 
        url: "#"
    }; 
    window.history.pushState(state, "title", "#"); 
} 