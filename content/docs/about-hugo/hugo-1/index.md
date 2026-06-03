---
title: "使用Hugo搭建个人博客"
weight: 2
---
# 使用Hugo搭建个人博客
**背景**：之前在vivo外包使用的**confluence**网站来构建知识库非常好用，在平时也想记录学习的点滴。然而从零开始搭建网站对于自己来说成本又太高了，于是询问deepseek有没有推荐的方式。

**方法**：ds推荐使用 **Hugo/Hexo** 等静态网站生成器，在本地用 Markdown 写文章，然后通过 **Git** 一键推送到 **GitHub Pages** 或 **Cloudflare Pages** 等免费托管服务上。

市面上有很多可以用于搭建个人博客的框架，**Hexo**、**Hugo**、**Wordpress**、**Halo**等等。大家可以自行上网查询资料，查看不同框架的优劣势，从而选择最适合自己的。此处我以**Hugo**为例。

## 安装Hugo并创建博客

### 安装Hugo
#### Windows安装Hugo
以管理员权限打开cmd，然后执行以下命令
1. 先安装包管理器chocolatey。
```bash
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```
运行完，可以另开一个窗口，执行`choco --version`看是否安装成功

2. 使用 choco 安装 Hugo
```bash
choco install hugo -confirm
```
#### Linux安装Hugo
在Linux中可以使用snap管理器来安装
```
snap install hugo
```
#### macOS安装Hugo
使用 brew 命令安装
```
brew install hugo
```

#### 验证是否安装成功
```
hugo version
```
{{< image src="hugo_ver.png" alt="hugo version" loading="lazy" >}}

执行`hugo version`后正常显示版本信息就算安装成功了。

如果遇到下面类似问题，可以通过关闭 Windows安全中心防护 或者 添加防护排除项并重启来解决。
'C:\ProgramData\chocolatey\bin\hugo.exe'已被组织的 Device Guard 策略阻止。 有关详细信息，请与支持人员联系。
### 创建网站
#### 创建目录结构
```bash
hugo new site blog # 这会创建一个叫做blog的目录
```
blog目录结构大致如下
```bash
├── archetypes
│   └── default.md
├── hugo.toml           # 博客站点的配置文件
├── content             # 博客文章所在目录
├── data                
├── layouts             # 网站布局
├── static              # 一些静态内容(图片、css文件等)
└── themes              # 博客主题
```
#### 选择hugo主题
在blog目录下执行以下命令
```
git init
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke
echo theme = 'ananke' >> hugo.toml
hugo server
```
命令依次为
初始化git仓库；
将ananke主题克隆至themes目录下，将其作为git子模块添加到项目中；
向配置文件追加一行，指示当前主题；
启动hugo服务器以查看网站；

最后执行`hugo server`，cmd界面如下：

{{< image src="hugo_server.png" alt="hugo server" loading="lazy" >}}

浏览器访问`http://localhost:1313/`，得到如下界面

{{< image src="hugo_interface.png" alt="hugo server" loading="lazy" >}}

## 托管至Github Pages
### 创建github仓库并推送
接下来我们需要在github上创建新仓库，把本地仓库推送至远程仓库。
可以在本地git仓库创建一个`.gitignore`文件忽略某些文件或目录

我的.gitignore文件内容如下：
```
public/
resources/
.hugo_build.lock
```
在blog目录执行命令
```
git add .
git commit -m"hugo new site"
git remote add origin 自己仓库的HTTPS/SSH
git push -u origin main
```
### 配置github仓库并添加工作流
在github仓库主页进入 settings > pages 

{{< image src="github_settings.png" alt="github settings" loading="lazy" >}}

将 Source 更改为`GitHub Actions`

{{< image src="pages_build_deploy.png" alt="build&deploy" loading="lazy" >}}

在本地仓库创建`.github/workflows/hugo.yaml`
将下面的yaml代码复制粘贴到刚创建的文件里，根据需要更改hugo版本和分支名
```yaml
# 用于构建和部署Hugo网站到GitHub Pages的示例工作流程
name: 发布Hugo网站到Pages

on:
  # 在目标为默认分支的推送上运行
  push:
    branches:
      - main

  # 允许您手动从“Actions”标签运行此工作流程
  workflow_dispatch:

# 设置GITHUB_TOKEN的权限，以允许部署到GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# 仅允许一个并发部署，跳过在进行中的运行与最新排队的运行之间排队的运行。
# 但是，请不要取消进行中的运行，因为我们希望这些生产部署能够完成。
concurrency:
  group: "pages"
  cancel-in-progress: false

# 默认使用bash
defaults:
  run:
    shell: bash

jobs:
  # 构建作业
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.120.2
    steps:
      - name: 安装Hugo CLI
        run: |
          wget -O ${{ runner.temp }}/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
          && sudo dpkg -i ${{ runner.temp }}/hugo.deb          
      - name: 安装Dart Sass
        run: sudo snap install dart-sass
      - name: 检出
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0
      - name: 设置Pages
        id: pages
        uses: actions/configure-pages@v5
      - name: 安装Node.js依赖
        run: "[[ -f package-lock.json || -f npm-shrinkwrap.json ]] && npm ci || true"
      - name: 使用Hugo构建
        env:
          # 为了与Hugo模块的最大向后兼容性
          HUGO_ENVIRONMENT: production
          HUGO_ENV: production
        run: |
          hugo \
            --gc \
            --minify \
            --baseURL "${{ steps.pages.outputs.base_url }}/"          
      - name: 上传构建产物
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  # 部署作业
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: 部署到GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
由于我的hugo版本是`0.161.0`，所以上述`HUGO_VERSION: 0.120.2`需要改成`HUGO_VERSION: 0.161.0`；我默认是main分支，所以不需要改上述的branches。

接下来提交刚才所做更改并推送到github，执行命令
```
git add .
git commit -m"Add workflows"
git push
```

在Github仓库主页选择 Actions，你会看到如下内容：

{{< image src="add_workflow.png" alt="action" loading="lazy" >}}

当GitHub完成构建和部署我们的站点后，状态指示器的颜色将变为绿色。

{{< image src="add_workflow_green.png" alt="action ok" loading="lazy" >}}

点击该消息，我们可以看到

{{< image src="add_workflow_detail.png" alt="deploy" loading="lazy" >}}

deploy步骤下的链接就是我们在线站点的链接。
链接一般是是`https://用户名.github.io/仓库名/`
之后，每当我们从本地仓库推送更改时，GitHub都会重新构建站点并部署更改。

Github托管后，我们就可以像访问其他网站一样从该链接访问到我们的网站了！
## 参考网址
[在Windows上装Chocolatey](https://blog.csdn.net/qq_43961619/article/details/153776407)

[什么是Hugo](https://hugo.opendocs.io/about/what-is-hugo/)

[在Github Pages上托管](https://hugo.opendocs.io/hosting-and-deployment/hosting-on-github/)

[如何用hugo 搭建博客 - 知乎](https://zhuanlan.zhihu.com/p/126298572)