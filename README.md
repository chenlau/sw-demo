# Service Worker 入门知识笔记



## 了解PWA

回首即将过去的2017年，PWA（Progressive Web Apps）渐进式网页应用已经成为Web应用新的风潮。

Progressive Web Apps 是 Google 提出的用前沿的 Web 技术为网页提供 App 般使用体验的一系列方案。

PWA的核心技术包括：

- Web App Manifest – 在主屏幕添加app图标，定义手机标题栏颜色之类
- Service Worker – 缓存，离线开发，以及地理位置信息处理等
- App Shell – 先显示APP的主结构，再填充主数据，更快显示更好体验
- Push Notification – 消息推送，可参考大神文档：[简单了解HTML5中的Web Notification桌面通知](http://www.zhangxinxu.com/wordpress/2016/07/know-html5-web-notification/)

有此可见，Service Worker仅仅是PWA技术中的一部分，但是又独立于PWA。

PWA参考资料：

[下一代 Web 应用模型 — Progressive Web App][https://zhuanlan.zhihu.com/p/25167289]

[如何看待 Progressive Web Apps 的发展前景？][https://www.zhihu.com/question/46690207]

[PWA 入门: 写个非常简单的 PWA 页面][https://zhuanlan.zhihu.com/p/25459319]

## Server Worker 应用场景

学习一个新东西，先得明白它被用来做什么，哪些场景能用到，用了有什么优点或好处？

Service Worker除了可以缓存和离线开发，其可以应用的场景还有很多，举几个例子（参考自[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)）：

- 后台数据同步
- 响应来自其它源的资源请求，
- 集中接收计算成本高的数据更新，比如地理位置和陀螺仪信息，这样多个页面就可以利用同一组数据
- 在客户端进行CoffeeScript，LESS，CJS/AMD等模块编译和依赖管理（用于开发目的）
- 后台服务钩子
- 自定义模板用于特定URL模式
- 性能增强，比如预取用户可能需要的资源，比如相册中的后面数张图片

未来service workers能够用来做更多使web平台接近原生应用的事。 值得关注的是，其他标准也能并且将会使用service worker，例如:

- [后台同步](https://github.com/slightlyoff/BackgroundSync)：启动一个service worker即使没有用户访问特定站点，也可以更新缓存
- [响应推送](https://developer.mozilla.org/zh-CN/docs/Web/API/Push_API)：启动一个service worker向用户发送一条信息通知新的内容可用
- 对时间或日期作出响应
- 进入地理栅栏

## Server Worker 简介

Service Worker直白翻译就是“服务人员”，看似不经意的翻译，实际上却正道出了Service Worker的精髓所在。

举个例子，如果我们想吃汉堡去金拱门消费，实际流程都是需要一个“服务人员”，客户点餐，付钱，服务人员提供食物，回到客户手上。

如果从最大化利用角度而言，这里的服务人员其实是多余的，客户直接付钱拿货更快捷，而这种直接请求的策略就是web请求的做法，客户端发送请求，服务器返回数据，客户端再显示。

这么多年下来，似乎web的这种数据请求策略没有任何问题，那为何现在要在中间加一个“服务人员”-Service Worker呢？

主要是用户应付一些特殊场景和需求，比方说离线处理（客官，这个卖完了），比方说消息推送（客官，你的汉堡好了……）等。而离线应用和消息推送正是目前native app相对于web app的优势所在。

所以，Service Worker出现的目的是让web app可以和native app开始真正意义上的竞争。

#### Service Worker概念和用法

我们平常浏览器窗口中跑的页面运行的是主JavaScript线程，DOM和window全局变量都是可以访问的。而Service Worker是走的另外的线程，可以理解为在浏览器背后默默运行的一个线程，脱离浏览器窗体，因此，window以及DOM都是不能访问的，此时我们可以使用`self`访问全局上下文。

由于Service Worker走的是另外的线程，因此，就算这个线程翻江倒海也不会阻塞主JavaScript线程，也就是不会引起浏览器页面加载的卡顿之类。同时，由于Service Worker设计为完全异步，同步API（如`XHR`和`localStorage`）不能在Service Worker中使用。

除了上面的些限制外，Service Worker对我们的协议也有要求，就是必须是`https`协议的，但本地开发也弄个`https`协议是很麻烦的，好在还算人性化，Service Worker在`http://localhost`或者`http://127.0.0.1`这种本地环境下的时候也是可以跑起来的。

最后，Service workers大量使用`Promise`，因为通常它们会等待响应后继续，并根据响应返回一个成功或者失败的操作，这些场景非常适合`Promise`。

#### Service Worker的生命周期

借助本地开发demo，我们可以看到：

installing → installed → activating → activated。

这个状态变化过程实际上就是Service Worker生命周期的反应

所以Service Worker注册时候的生命周期是这样的：

1. Download – 下载注册的JS文件
2. Install – 安装
3. Activate – 激活

而当我们修改了Service Worker注册JS，然后重载的时候旧的Service Worker还在跑，新的Service Worker已经安装等待激活。当前注册状态会是waiting

此时，我们页面强刷下会变成`activating 状态变化为activated`，进行了激活：

再次刷新又回到注册完毕`activated`状态。

这些对应的状态，Service Worker是有对应的事件名进行捕获的，为:

```
self.addEventListener('install', function(event) { /* 安装后... */ });
self.addEventListener('activate', function(event) { /* 激活后... */ });
```

最后，Service Worker还支持`fetch`事件，来响应和拦截各种请求。

```
self.addEventListener('fetch', function(event) { /* 请求后... */ });
```

基本上，目前Service Worker的所有应用都是基于上面3个事件的，demo就是这样实现。

下图展示了 Service Worker 的完整生命周期：

![img](https://mdn.mozillademos.org/files/12636/sw-lifecycle.png)

下图展示了 service worker 所有支持的事件：

![img](https://mdn.mozillademos.org/files/12632/sw-events.png)

#### Service Worker的兼容性

桌面端Chrome和Firefox可用，IE不可用。移动端Chrome可用，以后估计会快速支持。

## 关于Cache和CacheStorage

`Cache`和`CacheStorage`都是Service Worker API下的接口.

其中，`Cache`直接和请求打交道，`CacheStorage`和Cache对象打交道，我们可以直接使用全局的`caches`属性访问CacheStorage，例如，虽然API上显示的是`CacheStorage.open()`，但我们实际使用的时候，直接`caches.open()`就可以了。

`Cache`和`CacheStorage`的出现让浏览器的缓存类型又多了一个：之前有memoryCache和diskCache，现在又多了个ServiceWorker cache。

cache并不直接缓存字符串（想想localstorage），而是直接缓存资源请求（css、js、html等）。cache也是`key-value`形式，一般来说key就是**request**，value就是**response**;

#### Api

`caches.open(cacheName)` 打开一个cache，`caches`是*global*对象，返回一个带有cache返回值的`Promise`

`cache.keys()` 遍历cache中所有键，得到value的集合,返回一个带有value数组返回值的`Promise`

`cache.match(Request|url)` 在cache中匹配传入的request，返回`Promise`

`cache.matchAll`只有第一个参数与match不同，需要一个request的数组，当然返回的结果也是response的数组

`cache.add(Request|url)` 并不是单纯的add，因为传入的是request或者url，**在cache.add内部会自动去调用fetch取回request的请求结果**，然后才是把response存入cache

`cache.addAll`类似，通常在`sw` install的时候用`cache.addAll`把所有需要缓存的文件都请求一遍
`cache.put(Request, Response)` 这个相当于`cache.add`的第二步，即fetch到response后存入cache
`cache.delete(Request|url)` 删除缓存

参考fetch介绍：[Fetch][https://github.github.io/fetch/]

## Service Worker 的使用

1. 页面上注册一个Service Worker，如：

   ```
   if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('./sw-demo-cache.js');
   }
   ```

2. 注册sw-demo-cache.js， 在这个JS中完成sw的安装和使用：

   1) install事件定义一个callback，并决定想要缓存的文件：

   ```

   var VERSION = 'v1';
   var urlCacheArr = [
       './index.html',
       './css/base.css',
       './js/jquery.min.js',
       './img/star.jpg'
   ];
   // 缓存注入
   self.addEventListener('install', function(event) {
     event.waitUntil(
       caches.open(VERSION).then(function(cache) {
         return cache.addAll(urlCacheArr);
       })
     );
   });
   ```


​     注意：`在事件上接了一个`[`ExtendableEvent.waitUntil()`](https://developer.mozilla.org/zh-CN/docs/Web/API/ExtendableEvent/waitUntil)  方法——这会确保Service Worker 不会在 `waitUntil()` 里面的代码执行完毕之前安装完成。

​             在 `waitUntil()内，我们使用了` [`caches.open()`](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/open) 方法来创建了一个叫做 v1 的新的缓存，将会是我们的站点资源缓存的第一个版本。它返回了一个创建缓存的 promise，当它 resolved的时候，我们接着会调用在创建的缓存示例上的一个方法  `addAll()，这个方法的参数是一个由一组相对于 origin 的 URL 组成的数组，这些 URL 就是你想缓存的资源的列表。`

​      2)  当安装成功完成之后， service worker 就会激活。当版本发生变化，下一步是激活。当 service worker 安装完成后，会接收到一个激活事件(activate event)。 `onactivate `主要用途是清理先前版本的service worker 脚本中使用的资源。

  ```
   // 缓存更新, 删除旧缓存
   self.addEventListener('activate', function(event) {
     event.waitUntil(
       caches.keys().then(function(cacheNames) {
         return Promise.all(
           cacheNames.map(function(cacheName) {
             // 如果当前版本和缓存版本不一致
             if (cacheName !== VERSION) {
               return caches.delete(cacheName);
             }
           })
         );
       })
     );
   });
  ```


   3)  每次任何被 service worker 控制的资源被请求到时，都会触发 fetch 事件，这些资源包括了指定的 scope 内的文档，和这些文档内引用的其他任何资源（比如 index.html 发起了一个跨域的请求来嵌入一个图片，这个也会通过 service worker 。）  

  ```
  // 捕获请求并返回缓存数据
   self.addEventListener('fetch', function(event) {
     event.respondWith(
      caches.match(event.request).catch(function() {
        return fetch(event.request).then(function(response) {
          return caches.open(VERSION).then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });  
        });
      }).catch(function() {
        return caches.match('./img/star.jpg');
      })
    );
   });
  ```

注意：caches.match(event.request) 允许我们对网络请求的资源和 cache 里可获取的资源进行匹配，查看是否缓存中有相应的资源。

3. 把`cache.addAll()`方法中缓存文件数组换成你希望缓存的文件数组。

通过以上三大步，可以实现支持Service Worker缓存，甚至离线也可以自如访问，支持各种网站，PC和Mobile通杀，不支持的浏览器没有任何影响，支持的浏览器天然离线支持，想要更新缓存，`v1`换成`v2`就可以

更多资料参考：

[Server Worker MDN][https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API]

[Service Worker入门][http://web.jobbole.com/82247/]