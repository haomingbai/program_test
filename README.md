# CTC 程序设计考试报名 -- 西瓜报名

写这些代码的时候, 我还在上大一, 修读的专业是 “材料科学与工程”, 在全英文班上课. 那会儿的 AI 能力还相当有限, 几乎无法从事严肃的工作.
当时 [ShanJing](https://github.com/bgbigdog) 有一个不错的界面, 于是我在他的基础上, 填充代码, 实现了功能, 同时去掉了我看不懂的一些界面元素.

在程序刚刚投入使用的两个学期, 分别出现过两次较大范围的故障, 很多操作直到现在也全都依赖手工. 但是不管怎么样, 程序总是颤颤巍巍跑起来, 扛住了一次又一次.
后来, 开发时用到的 npm package 开始慢慢过时, GitHub 上隔三差五就能收到警告邮件, 项目的生命周期也开始进入维护阶段.
有一天这程序会变老, 就像老杨树上的枝桠. 缺乏维护, 或者维护成本渐渐变高, 最终废弃, 这是自然的道理.
很感谢当时受到程序故障 (根因为 xlsx-JS 对象转换时的类型错误) 影响的同学, 保持了修养, 没有打爆我的电话, 冲坏我的邮箱.

第一次投入生产环境, 当时就觉得要重写一遍. 但是即使知识和工作效率越发增加, 当年一鼓作气的心气, 却再也没有了.

---

云环境是和小程序的 appId 绑定的, 每个学期续费即可.

在 AI 的帮助下新增了一个 UIS 的功能, 以后可以用统一认证登陆, 而不使用密码了.

云数据库的权限, 记得全都设置成可读的, 如果使用时出错, 记得设置为可写.

和表格上传下载相关的, 还有获取考试列表的功能, 请将超时设置到 20-60s.

数据库表有五个:
- `admin_insertForm` 用来存放管理员的登陆信息
- `content` 用来处理内容显示
- `student_reserve` 存放了学生信息, 学生的选课信息和考场资料
- `test_partInfo` 用来存放考场信息
- `test_studentForm` 放着每个考场的学生表

写这个代码的时候, 我还没有数据库的知识, 更不知道什么 "nosql", 只知道要把功能做出来. 现在要想写, 光技术评估就要好几个月, 从引用的库的稳定性, 到抽象模型, 运行效率, 都要注意.
当年真是 “初生牛犊不怕虎”, 敢下手, 敢交付. 果然干什么事情, 都得趁早, 都得一鼓作气.

---

## 数据结构与座位号 (2026 年 10 月补记)

### 五个集合的实际字段

- `admin_insertForm`: `{accountInfo, password}`, 管理员账号, 无加密.
- `content`: 固定三个文档, `_id` 分别为 `index` / `showIndexButton` / `text`, 分别存机构名, 各按钮开关, 文案提醒.
- `test_partInfo`: `{courseID, testTime, roomInfo, teacherID, teacherPassword}`, 每行一个考场, `_id` 随机.
- `test_studentForm`: `{roomVolume, student}`, `_id` 为 `courseID + testTime + roomInfo` 直接拼接 (三段写入前均已 trim). `student` 数组每项为 `{_id: 学号, name, isSigned, seat?}`.
- `student_reserve`: `{name, password, selectedCourses, roomID, school, identityType, classID}`, `_id` 为学号. `password` 原始规则是 `学号 + 班级`. `roomID` 数组每项为 `{_id, courseID, roomInfo, testTime}`, 其中 `_id` 就是 `test_partInfo` 的 `_id` (2026 年 1 月生产库 5613/5613 全量命中, 可信).

关联关系两条: 学生预约时 `reserveTest` 把学生 push 进 `test_studentForm.student`, 同时把考场信息 push 进 `student_reserve.roomID`. 场次变更历史上有 `getInfo` 云函数直接改 `roomID[].testTime`.

### 座位号字段设计 (本次新增)

字段名 `seat`, 挂在 `test_studentForm.student[]` 每一项上, 数字类型, 从 1 开始. 生成规则: 该考场全体学生按学号升序排序后依次编号, 然后整个数组覆盖写回. 因此重复调用 `generateSeatNumber` 即为重新生成, 结果幂等; 预约中途新增的学生会在下一次生成时获得编号.

按学号排序的一个副作用: 签到表导出的顺序从 "预约顺序" 变成了 "学号序". 我认为名单整齐比预约先后更重要, 就这么定了.

消费方三处, 各自的容错逻辑:

- `generateSeatNumber` 云函数 (新增): 传入 `testInfo` (即 `test_studentForm` 的 `_id`), 单场生成. 批量由小程序端循环调用, 云函数内不做全表循环, 避免超时.
- `downloadTestPartInfo` 云函数: 签到表 "座位号" 列永远存在; 学生项没有 `seat` 字段时 (尚未生成) 该格留空. 不再像旧版那样导出时临时编号——临时编号与真实座位对不上, 是要出事的.
- 学生端 `testInfo` 页面: 用 `courseID + testTime + roomInfo` 拼出考场表 `_id`, 找到本人记录, 有 `seat` 才显示 "座位号" 条目, 没有就整条隐藏. 页面查不到考场表时静默降级.

### 两个坑, 记下来

1. `studentSignIn` 是按 `student.<index>` 下标更新签到状态的. `generateSeatNumber` 会重排数组, 所以签到进行期间不要重新生成座位号, 存在下标竞态.
2. 管理端 "下载全部签到表" 现在是先逐场生成座位号再导出; 单场生成失败不中断, 对应表格座位号留空, 结束时 toast 会提示失败场次数. 另有独立的 "生成全部座位号" 按钮可单独执行.

