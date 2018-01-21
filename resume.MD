# 联系方式

* 手机：13732216740
* Email：grovelqh@gmail.com，liqi_han@163.com
* QQ：489420545

# 个人信息

* 李奇涵/男/1994
* 本科/华中农业大学(211)/信息与计算科学专业
* 双学位/武汉大学(985)/会计学
* 技术博客：https://github.com/Liqihan/blog
* Github：https://github.com/Liqihan
* 期望职位：前端开发，NodeJS开发

# 工作经历

## 杭州橙群网络科技有限公司 （ 2016年7月 ~ 至今 ）

### **本地头条App内Webview优化**

负责Webview中详情页性能加载优化，制定了一套App内的自定义页面跳转协议，参考主流App实现了一套Webview和原生交互的js-sdk，制定了一系列与App交互的方法。使产品的开发可以不受App发版的影响，快速迭代，H5页面可以调用系统方法，体验接近原生。

### **本地头条管理后台**

在此项目中主要协助管理后台的重构，整体上从jQuery + Bootstrap + Express迁移到了React全家桶 + GraphQL + grpc搭建的微服务中，用户体验上升，系统性能更加稳定，降低了后续集成新业务所带来的风险。负责后续本地圈模块的后台部分开发，支持产品线的推广。

### **本地头条Wap**

负责wap版本的前后端开发和维护，目前日均pv80w。使用Vue + Webpack重构，静态资源大小从400k+ 优化到了120k，并对核心接口做了防刷限制，开发了公司内部的NodeJS框架，最后接口的响应的速度从2s缩小到300ms，单CPU的QPS从30上升到了600。

### **其他项目**

* **文章正文数据清洗**：选择性过滤爬取文章中的样式和标签。前期阅读未处理的资讯文章数量24000+，分析得出需要优化的特征，先后三次改版，采用cheerio替换jsdom提升了4倍的处理性能，简化递归嵌套和冗余HTML代码提升页面的加载解析速度，处理文章正文样式、垃圾内容和二维码以提升阅读体验。
* **服务容器化**：配合运维负责组内项目的Docker迁移，编写项目的构建镜像脚本，编写基于Docker Swarn的部署脚本
* **前端日志异常监控**：针对被劫持和代码异常，基于AlloyLog二次开发了前端日志监控项目，并引入vConsole方便远程调试
* **广告系统的全栈开发**
* **投票抽奖转盘等营销活动**
* **[公司官网(http://welcome.benditoutiao.com)](http://welcome.benditoutiao.com)**
* **[本地头条PC版(http://www.benditoutiao.com)](http://www.benditoutiao.com)**
* **[本地头条Wap版(http://ifw.bdtoutiao.com)](https://ifw.bdtoutiao.com)**

# 部分项目和作品

## 个人项目

结合工作中遇到的问题和个人的兴趣及思考，做出的一些项目

* **rebit-运营活动自动搭建平台**：采用Vue.js + Express开发，拖拽转盘、投票、悬浮窗等组件即可搭建H5营销和活动页面，记录操作历史录，通过导出导入json文件和LocalStorage，配置文件可复用，避免重复搭建类似页面，节省开发时间，效率至上。
* **静态资源离线系统**：Hybrid App的缺点：web应用的性能和体验不及客户端。大js文件的执行下载拖延了页面的加载和可交互的速度。故此构思了一套静态资源离线方案，更新代码时，下发至App，使网络加载变成了本地加载，提升页面的加载速度。

## 开源项目

* [js-bridge](https://github.com/Liqihan/js-bridge)：混合开发框架，JSBridge提供核心Android、iOS功能
* [babel-plugin-transform-function-params-decorators](https://github.com/Liqihan/babel-plugin-transform-function-params-decorators)：babel插件开发，支持函数参数的装饰器
* [bd-guice](https://github.com/Liqihan/bd-guice)：用Node实现的一个简单依赖注入框架
* [router-control](https://github.com/Liqihan/router-control)：基于ES7装饰器实现的Express的路由控制
* [smile](https://github.com/Liqihan/smile)：基于Vue.js 2.0的 Mobile UI组件(开发中)
* [style-normalize](https://github.com/Liqihan/style-normalize)：上述文章清洗的简易代码实现

## 技术文章

* [单页应用中如何在微信页面中设置标题](https://github.com/Liqihan/blog/issues/2)
* [参考浏览器的操作记录前进and后退](https://github.com/Liqihan/blog/issues/7)

- - -

# 致谢

感谢阅读，希望能增加这份简历的厚度，期待能有机会和您共事。