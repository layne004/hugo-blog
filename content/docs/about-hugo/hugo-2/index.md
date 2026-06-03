---
title: hugo图片加载与存放
weight: 3
---
# hugo图片加载与存放

首先，配置文件`hugo.toml`中的`baseURL`定义了网站地址。但它并不直接决定图片、CSS文件等资源的访问路径，资源的实际路径取决于资源的存放位置和引用方式。

我们使用github来托管网站后就需要把`baseURL`设置成`https://用户名.github.io/仓库名/`来正确加载资源。

一般，Hugo网站上的图片资源存放可以分为两类：
- 网站全局使用的图片，放 static
- 某篇文章独有的图片，放 Page Bundle

## Static 静态资源
一般我们将全局图片放在项目的`static`目录中，而网站在构建完成后会将生成好的.html和网页使用到的图片等资源放进`public`目录。

`static`目录的资源将直接被拷贝到`public`目录中，而不是`public/static/`。因此，我们在.md文件中引入`static`目录的图片时，不需要加`/static/`前缀。

下面举例说明如何正确引入static图片资源

假设我们baseURL是`https://layne.github.io/hugo/`，我们的项目结构如下
```
content/
├── _index.md
└── docs/
    ├── _index.md
    └── about-hugo/
        ├── _index.md
        ├── hugo-1/
        │   ├── hugo_ver.png
        │   └── index.md
        └── hugo-2/
            └── index.md
            
static/
└── test.png
```
如果我们想要在`content/docs/_index.md`中加载`static/test.png`，是不是`![test](test.png)`就可以了呢？

{{< image src="index_test.png" alt="test editing" loading="lazy" >}}

结果：

{{< image src="test_result.png" alt="test result" loading="lazy" >}}

显然不行。这又要讲到Hugo的路径解析了。
```
![test](/test.png)  --->  https://layne.github.io/test.png

![test](test.png)  --->  https://layne.github.io/hugo/docs/test.png
```
第一个例子`/test.png`使用绝对路径，`/`含义是 从网站根开始，而网站根是`https://layne.github.io/`，所以`/test.png`被解析为
`https://layne.github.io/test.png`

第二个例子`test.png`使用相对路径，因为`content/docs/_index.md`会被定位至`http://layne.github.io/hugo/docs/`，所以`test.png`被解析为`http://layne.github.io/hugo/docs/test.png`

然而我们的test.png
```
# 构建之前的结构
static/
└── test.png

# 构建之后的结构
public/
└── test.png
```
对应的网址是`baseURL + test.png`，即`https://layne.github.io/hugo/test.png`。所以上述两个例子都加载失败。

那么，想要加载`static/test.png`，我们可以手动拼接`![test](/hugo/test.png)` ，也可以使用Hugo提供的shortcode，`![test]({{</* relref "/" */>}}test.png)`。`{{</* relref "/" */>}}`将返回根目录的链接。

> relref 根据内容文件(Content Page)生成相对链接
>
> 一般这样使用  `{{</* relref "about.md" */>}}`

所以上面让 relref 来生成根目录的链接还有些大材小用。
## Page Bundle 资源
Page Bundle被译为页面包，或者页面捆绑。它是一种将页面资源进行分组的方法，分为leaf bundle 和 branch bundle。

在本文我们将其简单理解为对应页面的目录。我们以`content/docs/about-hugo/hugo-1/`为例。可以看到该目录下有`hugo_ver.png`这张图片，如果我们想在`/hugo-1/index.md`中引入这张图片该怎么做呢？

在网站构建时，hugo会把 bundle 中的资源发布到对应位置。`content/docs/about-hugo/hugo-1/`将被一起打包到`public/docs/about-hugo/hugo-1/`
```
content/
└── docs/
    └── about-hugo/
        └── hugo-1/
            ├── index.md
            └── hugo_ver.png

public/
└── docs/
    └── about-hugo/
        └── hugo-1/
            ├── index.html      # 由 index.md 生成
            └── hugo_ver.png    # 从页面资源复制而来
```
md文件和图片在同一目录，准确点说，因为处于同一个Page Bundle，所以我们在index.md中直接`![hugo version](hugo_ver.png)`相对路径就可以。

## 如何决策
上述两种图片存放方式，怎么选择呢？

建议Logo、favicon、首页背景等图片放在static；博客专用截图、教程配图放在对应Page Bundle。

## 参考文档

[目录结构](https://hugo.opendocs.io/getting-started/directory-structure/)

[内容组织和路径解析](https://hugo.opendocs.io/content-management/organization/)

[页面捆绑](https://hugo.opendocs.io/content-management/page-bundles/)