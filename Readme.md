# sdbmonitor介绍 #
sdbmonitor 工具是一款由 shell 程序和 javascript 程序组成的脚本工具，主要目的是为了帮助用户快速检查 SequoiaDB 巨杉数据库的运行状况。

目前 sdbmonitor 工具支持监控 SequoiaDB 巨杉数据库以下内容：

* 数据库平均每秒数据读、数据写和数据索引读的数据
* 节点状态，包括协调节点、编目节点和数据节点
* 分区组状态
* Node 节点会话数
* 分区组内从节点与主节点的 LSN 差距
* Node 节点的各个 CollectionSpace 空间占用情况
* Node 节点慢操作，包括：Query、Update、Upsert、Count、Delete、LobQuery、LobInsert、LobDelete

## 参数说明 ##
sdbmonitor 工具的参数选项如下
```
./sdbmonitor --help
Usage: sdbmonitor [OPTIONS] 
         --hosts         host addresses(hostname:svcname), separated by ',', 
                         for example 'sdb1:11810,sdb2:11810,sdb3:11810',
                         default:'localhost:11810'
         -u              username, default:''
         -w              password, default:''
         --cm-service    sdbcm's service, default:'11790'
         -h, --help      print help info
```

参数介绍如下：

| 参数名 | 是否必填 | 默认值 | 说明 |
| ----- | ------- | ----- | --- |
| --hosts | 否 | localhost:11810 | 连接 SequoiaDB 数据库的 IP:SERVICE |
| -u | 否| | SequoiaDB 数据库的鉴权用户 |
| -w | 否 | | SequoiaDB 数据库的鉴权密码 |
| --cm-service | 否 | 11790 | SequoiaDB sdbcm 节点的端口 |
| -h --help | 否 | | 打印帮助信息 |

## 告警阈值 ##
conf/alarm.js 文件，采用 JavaScript 语言编写，允许用户灵活调整各个监控项的告警阈值。

告警阈值说明如下：

| 参数 | 默认值 | 说明 |
| --- | ------ | ---- |
| alarmSessionNum | 500 | Node 节点会话数过多普通告警 |
| seriousSessionNum | 800 | Node 节点会话数过多严重告警 |
| alarmLsnPercent | 0.6 | Node 从节点与 Node 主节点 LSN 差距过大普通告警 |
| seriousLsnPercent | 0.8 | Node 从节点与 Node 主节点 LSN 差距过大普通告警 |
| alarmCsSizePercent | 0.6| Node 节点的 CollectionSpace 占用空间过大普通告警 |
| seriousCsSizePercent | 0.8 | Node 节点的 CollectionSpace 占用空间过大严重告警 |
| maxAlarmRelativeTime | 1 | Node 节点执行任务超过告警阈值后进行普通告警，单位：秒 |
| maxSeriousRelativeTime | 5 | Node 节点执行任务超过告警阈值后进行严重告警，单位：秒 |

> Note :
> 
> 由于每个分区组的最大 LSN 值由节点 logfilesz 和 logfilenum 两个配置参数决定，所以 alarmLsnPercent 和 seriousLsnPercent 设置的告警阈值将计算该分区组的最大 LSN 后，再与 NodePercent 相乘
> 
> 每个 Node 节点的 CollectionSpace 最大空间上限为 2TB，所以 alarmCsSizePercent 和 seriousCsSizePercent 设置的百分比为 2TB * NodePercent

## 执行方式 ##
sdbmonitor 工具只支持运行于 Linux 系统，并且环境需要预先安装 SequoiaDB 巨杉数据库，因为 sdbmonitor 工具依赖 SequoiaDB 的 sdb client 客户端。

如果用户需要监控但前服务器的 SequoiaDB 巨杉数据库状态，可以执行
```
./sdbmonitor
coord|DATAREAD|null|1|11:45:41|null|0|null
coord|DATAWRITE|null|0|11:45:41|null|0|null
coord|INDEXREAD|null|1|11:45:41|null|0|null
sdb1:11810|SESSIONTIMEOUT|1|8|10:05:24|SESSIONID:10,GETCOUNT|2|ScanType:TBSCAN,Collection:foo.bar,Matcher:{"$and":[{"name":{"$et":"test"}},{"num":{"$et":123}}]}
```

如果用户系统监控远程 SequoiaDB 巨杉数据库状态，可以执行
```
./sdbmonitor --hosts "sdb1:11810,sdb2:11810,sdb3:11810" -u "sdbtest" -w "sdbtest"
```

> Note:
> 
> 用户执行完 sdbmonitor 工具后，会在执行路径生成 output 和 tmp 目录。output 目录主要用于保存每次工具收集的监控信息，tmp 目录则是工具执行过程中的临时文件。
> 
> 为了让 sdbmonitor 工具终端输出的告警信息尽可能简洁，所以对 SESSIONTIMEOUT 监控项的部分信息做了空格替换处理，如需查看原始信息，请查阅 output/alarm_last.csv 和 output/result_last.csv 文件。
> 
> 当 SESSIONTIMEOUT 监控项收集到多个 Node 节点执行相同操作时，工具将自动将其合并，并且在终端上打印`协调节点`发出的操作请求。各个 Node 节点的 SESSIONTIMEOUT 监控信息可以通过 output/result_last.csv 文件获取。

## 监控信息输出说明 ##
sdbmonitor 工具输出格式如下：

| Field1 | Field2 | Field3 | Field4 | Field5 | Field6 | Field7 | Field8 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| HOSTNAME + SERVICE | 监控项 | 告警阈值 | 当前值 | 时间 | 描述信息1 | 警告标记 | 描述信息2 |

sdbmonitor 监控项介绍说明

| 监控项 | 说明 |
| ----- | ---- |
| DATAREAD | 数据库集群每秒数据读 |
| DATAWRITE | 数据库集群每秒数据写 |
| INDEXREAD | 数据库集群每秒索引读 |
| CATALOG_LSN | 编目分区组主从 LSN 差距 |
| DATANODE_LSN | 数据分区组主从 LSN 差距 |
| CSSIZE | Node 节点 CollectionSpace 占用空间 |
| SESSIONNUM | Node 节点会话数 |
| GROUPSTATUS | 分区组状态 |
| NODESTATUS | Node 节点状态 |

> Note:
> 
> GROUPSTATUS 监控项中，SYSCoord 分区组只要存在一个节点失效，则警告标记设置为 alarm，如果所有 coord 节点均失效，则警告标记设置为 serious；CatalogGroup 和 DataGroup 分区组则是当分区组内存在失效节点，并且存活节点超过半数，则警告标记设置为 alarm，如果存活节点少于或者等于半数，则警告标记设置为 serious。
> 
> NODESTATUS 监控项，在 SequoiaDB 2.6 版本中，只能够监控该 Node 节点状态为 Normal、FullSync 和 Fault 三种状态；在 SequoiaDB 2.8 以后版本，则支持监控 Node 节点的 Normal、Fault、Rebuilding、FullSync、OfflineBackup 五种状态。
> 
> SESSIONTIMEOUT 监控项，在终端和 alarm_last.csv 中输出时，描述信息1中将以 COORD_SESSIONID,EXECTYPE 形式输出，例如：SESSIONID:10,GETCOUNT；
> 
> SESSIONTIMEOUT 监控项，如果在 result_last.csv 中输出时，描述信息1中将以 HOSTNAME:SERVICE:COORD_SESSIONID,EXECTYPE 形式输出，例如：sdb1:11810:10,GETCOUNT

sdbmonitor 监控工具执行后，将在本地路径生成 output 目录，该目录将归档保存每次执行收集到的监控信息。

output 的目录结构
```
|____backup
| |____alarm_20190408.095644.csv
| |____result_20190408.095644.csv
| |____alarm_20190408.114541.csv
| |____result_20190408.114541.csv
|____alarm_last.csv
|____result_last.csv
```

backup 目录用于保存归档的监控信息。

警告信息将保存在 alarm_last.csv 文件中，result_last.csv 文件则保存所有监控项统计、整理后的数据。

alarm_last.csv 和 result_last.csv 文件是每次执行 sdbmonitor 工具后的最新数据，格式为CSV格式，字段分隔符为 "|"，记录分隔符为 "\n"。

alarm_last.csv 文件的 demo 内容
```
sdb1:11810|SESSIONTIMEOUT|1|8|10:05:24|SESSIONID:10,GETCOUNT|2|ScanType:TBSCAN,Collection:foo.bar,Matcher:{ "$and": [ { "name": { "$et": "test" } }, { "num": { "$et": 123 } } ] }
```

result_last.csv 文件的 demo 内容
```
coord|DATAREAD|null|190091|10:05:24|null|0|null
coord|DATAWRITE|null|0|10:05:24|null|0|null
coord|INDEXREAD|null|1|10:05:24|null|0|null
sdb1:11820|CATALOG_LSN|8527|0|10:05:24|masterNode|0|null
sdb1:11840|DATANODE_LSN|799917492|0|10:05:24|masterNode|0|null
sdb1:11830|DATANODE_LSN|798410724|0|10:05:24|masterNode|0|null
sdb1:11850|DATANODE_LSN|799659343|0|10:05:24|masterNode|0|null
sdb1:11840|CSSIZE|2638827906662|1228996608|10:05:24|SYSSTAT|0|null
sdb1:11840|CSSIZE|2638827906662|1228996608|10:05:24|foo|0|null
sdb1:11830|CSSIZE|2638827906662|1228996608|10:05:24|SYSSTAT|0|null
sdb1:11830|CSSIZE|2638827906662|1228996608|10:05:24|foo|0|null
sdb1:11850|CSSIZE|2638827906662|155254784|10:05:24|SYSSTAT|0|null
sdb1:11850|CSSIZE|2638827906662|155254784|10:05:24|foo|0|null
sdb1:11850|CSSIZE|2638827906662|155254784|10:05:24|test|0|null
sdb1:11840|SESSIONNUM|500|43|10:05:24|null|0|null
sdb1:11830|SESSIONNUM|500|43|10:05:24|null|0|null
sdb1:11850|SESSIONNUM|500|43|10:05:24|null|0|null
SYSCoord|GROUPSTATUS|null|null|10:05:24|null|0|GroupIsNormal
SYSCatalogGroup|GROUPSTATUS|null|null|10:05:24|null|0|GroupIsNormal
group2|GROUPSTATUS|null|null|10:05:24|null|0|GroupIsNormal
group1|GROUPSTATUS|null|null|10:05:24|null|0|GroupIsNormal
group3|GROUPSTATUS|null|null|10:05:24|null|0|GroupIsNormal
sdb1:11810|NODESTATUS|null|null|10:05:24|Group:SYSCoord|0|nodeIsNormal
sdb1:11820|NODESTATUS|null|null|10:05:24|Group:SYSCatalogGroup|0|nodeIsNormal
sdb1:11840|NODESTATUS|null|null|10:05:24|Group:group2|0|nodeIsNormal
sdb1:11830|NODESTATUS|null|null|10:05:24|Group:group1|0|nodeIsNormal
sdb1:11850|NODESTATUS|null|null|10:05:24|Group:group3|0|nodeIsNormal
sdb1:11840|SESSIONTIMEOUT|1|8|10:05:24|sdb1:11810:10,GETCOUNT|2|ScanType:TBSCAN,Collection:foo.bar,Matcher:{ "$and": [ { "name": { "$et": "test" } }, { "num": { "$et": 123 } } ] }
sdb1:11830|SESSIONTIMEOUT|1|8|10:05:24|sdb1:11810:10,GETCOUNT|2|ScanType:TBSCAN,Collection:foo.bar,Matcher:{ "$and": [ { "name": { "$et": "test" } }, { "num": { "$et": 123 } } ] }
sdb1:11850|SESSIONTIMEOUT|1|8|10:05:24|sdb1:11810:10,GETCOUNT|2|ScanType:TBSCAN,Collection:foo.bar,Matcher:{ "$and": [ { "name": { "$et": "test" } }, { "num": { "$et": 123 } } ] }
```

## 附：工具组成说明 ##
sdbmonitor 工具的目录结构如下
```
|____script
| |____nodeInfo.js
| |____csstatus.js
| |____session.js
| |____node_rw_info.js
| |____groupInfo.js
| |____splitInfo.js
| |____printClass.js
| |____main.js
| |____function.js
| |____context.js
|____sdbmonitor
|____conf
| |____alarm.js
```
各个文件的作用如下：

| 文件名 | 开发语言 | 说明 |
| ----- | ------ | ---- |
| script/nodeInfo.js | JavaScript | 数据库 Node 节点的相关信息类 |
| script/csstatus.js | JavaScript | 数据库 CollectionSpace 的信息收集类 |
| script/session.js | JavaScript | 数据库快照 Session 的信息收集类 |
| script/node_rw_info.js | JavaScript | 数据库读、写数据库信息收集类 |
| script/groupInfo.js | JavaScript | 数据库分区组信息收集类 |
| script/splitInfo.js | JavaScript | 数据库读、写信息管理类 |
| script/printClass.js | JavaScript | JavaScript 程序输出类 |
| script/main.js | JavaScript | JavaScript 程序的 Main 方法 |
| script/function.js | JavaScript | JavaScript 程序的方法文件 |
| script/context.js | JavaScript | 数据库快照 Context 的信息收集类 |
| sdbmonitor | Shell | 工具执行程序，包含了 JavaScript 程序调用逻辑 |
| conf/alarm.js | JavaScript | 工具的告警阈值 |