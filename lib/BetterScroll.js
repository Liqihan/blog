var rAF =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
var cancelRAF =
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    clearTimeout;
class BetterScroll {
    constructor() {
        let sy = window.scrollY;
        this.scrollList = [];
        this.scrollEndList = [];
        this.scrollTimer = null;
        this.nowWsy = sy;
        this.lastY = sy;
        this.direction = 0;
        this.rafMark = null;
        this.rafingMark = false;
        this.gap = 0;
        // this.bindEvent();
    }
    onScroll(cb) {
        if (typeof cb !== "function") {
            return;
        }
        this.scrollList.push(cb);
    }
    onScrollEnd(cb) {
        if (typeof cb !== "function") {
            return;
        }
        this.scrollEndList.push(cb);
    }
    scrollEnd() {
        let winInfo = {
            sy: this.nowWsy,
            gap: Math.abs(this.gap),
            dir: this.direction
        };
        for (let i = 0, len = this.scrollEndList.length; i < len; i++) {
            try {
                this.scrollEndList[i](winInfo);
            } catch (err) {
                console.warn(err);
            }
        }
    }
    rafing () {
        this.nowWsy = window.scrollY;
        this.gap = this.nowWsy - this.lastY;
        // 1为向上滑动 -1 为向下滑动
        !!this.gap && (this.direction = (((this.gap >= 0) | 0 ) - 0.5) * 2);
        this.lastY = this.nowWsy;
        let winInfo = {
            sy : this.nowWsy, //当前window的scrollY
            gap : Math.abs(this.gap), //上次到这次滑动的距离
            dir : this.direction,  // 滑动方向
        }
        for (let i = 0, len = this.scrollList.length; i < len; i++) {
            try {
                this.scrollList[i](winInfo);
            } catch (error) {
                console.warn(error)
            }
        }
        this.startRaf();
    }
    startRaf() {
        let self = this;
        this.rafMark = rAF(function () {
            self.rafing();
        })
    }
    bindEvent() {
        let self = this;
        window.addEventListener('scroll', function () {
            clearTimeout(self.scrollTimer);
            if (!self.rafingMark) {
                self.startRaf();
                self.rafingMark = true;
            }
            self.scrollTimer = setTimeout(function () {
                cancelRAF(self.rafMark);
                self.scrollEnd();
                self.rafingMark = false;
            }, 50);
    
        }, 0)
    }
}
let btScroll = new BetterScroll();
export default btScroll;