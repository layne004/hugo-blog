---
title: 服务器日志模块解析
weight: 10
---
# 服务器日志模块解析

从大三后期以来，我一直都比较着急，就像deadline就在后面追一般。慢速深入学习不要，快点，尽量再快点，最好速成；同时，我的大脑很懒很懒，不想转动。于是学习项目的方式就是理解各个类的作用，然后就开始一比一人工copy。  因为这样速度很快而且不用思考。  
但是，现在，重新开始的我发现这样学不到东西，或许能学到一点，但是太浅了。我不想做了很多，然而收效很少。完成都是表面的，心里明白其实根本不是很懂，所以才会讨厌吧。
我醒悟了。现在我不要直接得到答案，我要“一步 一步 往上爬，看着阳光...”（bushi
我要经历这个过程，自己亲自得到答案。

- 第一步：画出模块关系图
- 第二步：100行实现最简单日志系统
- 第三步：对比自己实现和源码实现
- 第四步：研究调用链
- 第五步：找设计模式
- 第六步：删功能
- 第七步：尝试扩展源码

本篇文章的日志模块参考[sylar高性能分布式服务器框架](https://github.com/zhongluqiang/sylar-from-scratch/tree/main)
## 模块关系图

通过查看[log.h](https://github.com/zhongluqiang/sylar-from-scratch/blob/main/sylar/log.h)，我们能够得出这样的一个关系图。
module_relationship.png
接着我们分析各个类的作用，以及为什么存在。

|       类       |   what   |   why    |
| :-----------: | :------: | :------: |
|   LogLevel    |  日志优先级   |  控制输出量   |
|   LogEvent    |   日志事件   | 封装一次日志数据 |
| LogFormatter  |   格式化    |  支持不同格式  |
|  LogAppender  |   输出日志   | 支持不同输出目标 |
|    Logger     |   组织日志   |  协调各组件   |
| LoggerManager | 管理Logger | 统一获取并配置  |

现在，我们对于各个类有基本了解。
但对于内部实现细节仍然知之甚少，没关系，我们慢慢来。

## 100行最简单日志系统
强烈建议大家自己先写！哪怕只写得出`class A{};`都没事。

最简日志系统目标：
- 区分日志优先级
- 支持不同输出目标
- 支持基本输出格式

根据目标，我分别写了  
枚举类型LogLevel  
类LogAppender，子类StdoutAppender、FileAppender  
类LogFormatter  
类Logger
```c++
// log.h：100行实现日志系统
#pragma once
#include <string>
#include <iostream>
#include <fstream>
#include <ctime>
#include <sstream>

std::string getFileName(const std::string& filepath)
{
	size_t pos = filepath.find_last_of("/\\");
	if (pos == std::string::npos)
	{
		return filepath;
	}

	return filepath.substr(pos + 1);
}

enum LogLevel {
	INFO,
	DEBUG,
	ERROR
};

static const char* levelStr[] = { "INFO", "DEBUG","ERROR" };

class LogFormatter {
public:
	// 时间+线程id+日志器名称+文件名+行号+loglevel+msg
	// 时间+文件名+行号+loglevel+msg（基本）
	LogFormatter() {};

	std::string format(std::string file, unsigned int line, std::string msg, LogLevel level) {
		// 获取时间
		std::time_t now = std::time(0);
		// 转换为本地时间
		std::tm now_tm{};
		char buffer[80];
		if (localtime_s(&now_tm, &now) == 0) {
			// 使用strftime格式化输出
			std::strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &now_tm);
		}
		else {
			std::cerr << "Failed to convert time.\n";
		}

		std::stringstream ss;
		ss << buffer << " " << file << ":" << line << "[" << levelStr[level] << "] " << msg << std::endl;

		return ss.str();
	}

private:
	// 目前的LogFormatter = LogEvent + Formatter
	//-LogEvent-
	//time_t m_time;
	//std::string m_filename;
	//unsigned int m_line; //和uint64区别是？
	//LogLevel m_logLevel;
	//std::string m_msg;
};

class LogAppender {
public:
	virtual void log(std::string file, unsigned int line, std::string msg, LogLevel level)=0;

protected:
	LogFormatter formatter;
};

class FileAppender : public LogAppender {
public:
	FileAppender(const std::string& path) :m_path(path) 
	{
		ofs.open(path, std::ios::out | std::ios::app);
		if (!ofs.is_open())
		{
			std::cerr << "Failed to open log file: " << path << std::endl;
		}
	}
	void log(std::string file, unsigned int line, std::string msg, LogLevel level) override{
		ofs << formatter.format(file, line, msg, level);
	}

private:
	std::string m_path;
	std::ofstream ofs;
};

class StdOutAppender :public LogAppender {
public:
	void log(std::string file, unsigned int line, std::string msg, LogLevel level) override{
		std::cout << formatter.format(file, line, msg, level);
	}
};

class Logger{
public:
	
	Logger(std::string name, LogLevel level)
		:m_name(name), m_level(level)
	{
		
		std::cout << "create logger[" << m_name << "]["<<levelStr[m_level]<<"]" << std::endl;
		// 输出loglevel字符串的方法：1.if-else/switch  2.利用枚举值从0递增的性质，设置静态字符串数组映射[但需要错误处理]
	}

	void stdoutLog(std::string file, unsigned int line, std::string msg, LogLevel level)
	{
		if (level >= m_level)
		{
			stdoutAppender.log(getFileName(file), line, msg, level);
		}

	}

	void fileLog(std::string file, unsigned int line, std::string msg, LogLevel level) {
		if(level >= m_level)
		{
			fileAppender.log(getFileName(file), line, msg, level);
		}
	}

private:
	std::string m_name;
	LogLevel m_level;
	FileAppender fileAppender{"log.txt"};
	StdOutAppender stdoutAppender;
};
```
下面是main.cpp
```c++
#include <iostream>
#include <string>
#include "log.h"

#define LOG_STDOUT(msg, level) logger.stdoutLog(__FILE__, __LINE__, msg, level)
#define LOG_FILE(msg, level) logger.fileLog(__FILE__, __LINE__, msg, level)

int main()
{
    Logger logger{ "test", LogLevel::DEBUG };

    std::string msg1{ "hello, world" };
    std::string msg2{ "the msg is ..." };
    std::string msg3{ "the program is error" };

    LOG_STDOUT(msg1, LogLevel::INFO);
    LOG_STDOUT(msg2, LogLevel::DEBUG);
    LOG_STDOUT(msg3, LogLevel::ERROR);

    LOG_FILE(msg1, LogLevel::INFO);
    LOG_FILE(msg2, LogLevel::DEBUG);
    LOG_FILE(msg3, LogLevel::ERROR);

    return 0;
}
```
日志器实例设置为`DEBUG`等级，所以`>=DEBUG`等级的`DEBUG、ERROR`都将输出
运行结果如下：

{{< image src="console_result.png" alt="console result" loading="lazy" >}}

{{< image src="file_result.png" alt="file result" loading="lazy" >}}

可以看到log内容成功地输出到终端和文件。

## 对比实现
下述的源码都指sylar版本，不是log4cpp版。

在编写自己的实现时，产生了如下疑问

a.输出LogLevel字符串时，
有switch/if-else方法，也有使用enum映射静态常量字符串数组的方法[需要错误处理]
b.写时间转换时想到，c语言总是有很多buf, sizeof(buf)，但是c++就没有，为什么  
c.代表时间的%Y-%m-%d是怎么转换的，为什么有的是大写字母，有的小写字母  
d.为行号决定数据类型时，正数->unsigned int->uint64_t，
unsigned int和uint64_t的区别是？怎么判断什么时候使用什么？size_t呢

{{% details "已解答" %}}
a.源码使用#define宏替换的方法  
b.因为c语言数组名作为实参会退化成指针，丢失长度信息；c++使用容器较多，而容器一般都把大小封装到对象中了，size()就能获取  
c.转换方式在format函数讲解里。不管大小写，每个字母都有自己的含义  
比如%Y代表完整年份，%y代表年份后两位；%m代表月份，%M代表分钟  
d.unsigned int一般32位，16位单片机上是16位；uint64_t固定64位；size_t在32位系统上32位，64位系统上64位
{{% /details %}}


### LogLevel
源码的`LogLevel`封装在类中，使用枚举level表示
有两个成员函数，ToString和FromString，用来把枚举值转换成字符串。

疑问：  
1.为什么要封装到类中  
2.为什么枚举设置成100递增

猜测：  
1.方便把日志等级转成对应字符串  
2.设置一定间隔，防止意外增减导致错误输出

### LogEvent
源码把日志数据封装成LogEvent类，我是手动写参数file、line、msg等。  
由此可见，把日志数据封装成一个类就不用写一长串的参数列表了。  
源码除了一长串的成员变量、对应的getter外，  
```
	/**
     * @brief 构造函数
     * @param[in] logger_name 日志器名称
     * @param[in] level 日志级别
     * @param[in] file 文件名
     * @param[in] line 行号
     * @param[in] elapse 从日志器创建开始到当前的累计运行毫秒
     * @param[in] thead_id 线程id
     * @param[in] fiber_id 协程id
     * @param[in] time UTC时间
     * @param[in] thread_name 线程名称
     */
```
还有两个写入日志的c风格函数`printf`和`vprintf`。  
疑问：  
1.为什么要在LogEvent里写“写入日志”的函数

猜测：  
1.方便终端调试，因为我看log4cpp的loggingEvent都没有print函数。
### LogFormatter
在源码中，最重要的就是构造函数的格式模板参数，以及模板的解析`init`函数。  
其他format函数，原理一样，只是参数变成了LogEvent::ptr。  
同时多了`FormatItem`基类，该类有虚函数`format(ostream, LogEvent::ptr)`，此基类用于派生出不同的格式化项。  
源码模版解析的`init`函数大致步骤：  
1. vector存储需要转义和不需转义的字段（顺序性）
2. map存储 模板字符 与 将格式符转换成str的函数 的键值对
3. 遍历vector，把转义后的字符串与无需转义的字符串按序输入`ostream`
4. 最后`return ss.str();`

### LogAppender
源码多了该类的共享指针、自旋锁和`ToYamlString`函数。
共享指针为资源的释放解放双手
I/O操作设置锁保证多线程的正常运行
`formatter`成员的添加使得我们可以自行设置
`ToYamlString`函数将日志输出目标的配置转成Yaml字符串

### Logger
源码相较于我的实现  
- 多了`Logger`类的共享指针、自旋锁
- constructor参数只有name，level变量有setter、getter
- 有个list，用于存储多个appender的指针，有add/del/clearAppender函数
- 有`ToYamlString`函数将日志器配置转成Yaml字符串

list可用于一次输出到多个目标

## 研究调用链
```c++
LOG_INFO(logger) << "hello";
```

这条语句的调用链是怎样的？

```
LOG_INFO宏展开

↓
创建LogEventWrap临时对象

↓
调用LogEventWrap::getLogEvent()->getSS()，获取日志流

↓
stringsream << "hello"; 字符串输入到event成员变量ss流中

↓
LogEventWrap临时对象销毁，调用~LogEventWrap

↓
析构函数中调用logger->log(event);

↓
本次log的等级高于logger的loglevel才输出
遍历appenders，依次i->log(event)

↓
if Stdout
有formatter就调用format(std::cout, event)
没有就调用defaultFormatter->format

if File
format(filestream, event)
```
正因为宏定义中最后`getSS()`返回流，所以才能`LOG_INFO(logger) << "hello";`这样写
又因为宏定义中`LogEventWrap`的对象在`if`语句中创建，`if`执行完就析构，日志对象也就被logger进行输出了，这一点非常的巧妙。

{{% details "format如何输出格式化日志内容？" %}}
对于有如此多信息（日志名、日志内容、日志等级、时间、文件名等）的日志信息怎么格式输出呢？我们可以看到最后是进入formatter的format函数。
```c++
std::ostream &LogFormatter::format(std::ostream &os, LogEvent::ptr event) {
    for(auto &i:m_items) {
        i->format(os, event);
    }
    return os;
}
```

可以看到这里遍历了m_items，然后依次把event日志信息输出到os流中

```c++
    // 解析后的格式模板数组
    std::vector<FormatItem::ptr> m_items;
```

FormatItem又是？

```c++
    /**
     * @brief 日志内容格式化项，虚基类，用于派生出不同的格式化项
     */
    class FormatItem {
    public:
        typedef std::shared_ptr<FormatItem> ptr;
        
        /**
         * @brief 析构函数
         */
        virtual ~FormatItem() {}

        /**
         * @brief 格式化日志事件
         */
        virtual void format(std::ostream &os, LogEvent::ptr event) = 0;
    };
```

可以看到`log.cpp`中每一项信息都有对应的`formatItem`来负责该项的格式化，并输出到os流中
```c++
// log.cpp
class MessageFormatItem : public LogFormatter::FormatItem {
public:
    MessageFormatItem(const std::string &str) {}
    void format(std::ostream &os, LogEvent::ptr event) override {
        os << event->getContent();
    }
};

class LevelFormatItem : public LogFormatter::FormatItem {
public:
    LevelFormatItem(const std::string &str) {}
    void format(std::ostream &os, LogEvent::ptr event) override {
        os << LogLevel::ToString(event->getLevel());
    }
};

class ElapseFormatItem : public LogFormatter::FormatItem {
public:
    ElapseFormatItem(const std::string &str) {}
    void format(std::ostream &os, LogEvent::ptr event) override {
        os << event->getElapse();
    }
};

class LoggerNameFormatItem : public LogFormatter::FormatItem {
public:
    LoggerNameFormatItem(const std::string &str) {}
    void format(std::ostream &os, LogEvent::ptr event) override {
        os << event->getLoggerName();
    }
};

...
```

看到这里可能会想，那这些信息项的顺序又是怎么决定的呢？

聪明的你可能想到了，我们是使用格式模板
`%%d{%%Y-%%m-%%d %%H:%%M:%%S}%%T%%t%%T%%N`

通过依次解析格式模版字符串中的各项参数，然后把对应的`FormatItem`的`ptr`添加到`m_items`，这样就可以完成优雅的日志信息格式化啦。
{{% /details %}}

## 找设计模式

### 单例模式
```c++
LoggerManager::GetInstance()
```
单例模式，获取全局唯一logger管理器
为什么这里要使用单例模式？
答：服务器一般有多个模块，每个模块需要有对应的logger，而持续持有并管理众多logger的责任就落到loggerManager身上。可想而知该Mgr需要有全局生命周期，同时我们应当能通过Mgr来访问到所有的logger，所以选用单例模式。

### 策略模式
```
LogAppender、StdoutAppender、FileAppender
```
策略模式，根据绑定不同的对象实现同一接口不同行为
策略模式用在什么场景？
答：对于同一接口，能够有不同策略选择的场景；用在有多态出现的场景

要注意：我们最应关注的不是这个类是什么模式，而是这个类解决了什么问题。

因为设计模式本质上只是：

> 对优秀设计经验起的名字。

而不是理解源码的起点。

## 删功能
## 尝试扩展源码