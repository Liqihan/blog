/*
 * @Author: grove.liqihan
 * @Date: 2017-12-21 19:40:16
 * @Desc: 点击穿透的解决方法
 */

const _ = require('src/util')
export default function (option) {
    const scrollSelector = option.scroll || '.scroller'
    const pos = {
        x: 0,
        y: 0
    }

    function stopEvent(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    function recordPosition(e) {
        pos.x = e.touches[0].clientX
        pos.y = e.touches[0].clientY
    }

    function watchTouchMove(e) {
        const target = e.target
        const parents = _.parents(target, scrollSelector)
        let el = null
        if (target.classList.contains(scrollSelector)) el = target
        else if (parents.length) el = parents[0]
        else return stopEvent(e)
        const dx = e.touches[0].clientX - pos.x
        const dy = e.touches[0].clientY - pos.y
        const direction = dy > 0 ? '10' : '01'
        const scrollTop = el.scrollTop
        const scrollHeight = el.scrollHeight
        const offsetHeight = el.offsetHeight
        const isVertical = Math.abs(dx) < Math.abs(dy)
        let status = '11'
        if (scrollTop === 0) {
            status = offsetHeight >= scrollHeight ? '00' : '01'
        } else if (scrollTop + offsetHeight >= scrollHeight) {
            status = '10'
        }
        if (status !== '11' && isVertical && !(parseInt(status, 2) & parseInt(direction, 2))) return stopEvent(e)
    }
    document.addEventListener('touchstart', recordPosition, false)
    document.addEventListener('touchmove', watchTouchMove, false)
}