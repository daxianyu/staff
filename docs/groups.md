School Admin 下新增一个新页面：  Group Assignment Requests（学生选课申请）

列表：
○ 获取所有学生的课程申请信息 （权限点 edit_classes or sales_admin) API done /api/groups/group_assign_list

table的几项：
Student name
Campus
Mentor
Exam
Class
Subject
Fulness	
Signup time
Note

顶上加上搜索全部字段
加上三个按钮功能：
1. download csv  前端下来
2. Delete request: 勾选，删除指定行
3. 全部删除

○ 删除assignment_request记录 （权限点 edit_classes or sales_admin) API done api/groups/delete_assign_group 
○ 清除所有的requests （权限点 edit_classes or sales_admin) API done api/groups/clear_all_request





=============== 更新 ===============
增加一个页面：ai-groups
但不用体现在菜单上，只需要在上面的页面中加个按钮链接跳转过来

页面主要功能如下：
○获取排课的setting配置信息 （权限点 edit_classes or sales_admin)  API done  api/groups/get_schedule_settings
○更新排课的setting配置信息 （权限点 edit_classes or sales_admin)  API done api/groups/update_schedule_settings
○获取排课group列表 （权限点 edit_classes or sales_admin)  API done api/groups/list
○新增单个group （权限点 edit_classes or sales_admin)  API done  api/groups/add_single_group
○批量新增group  （权限点 edit_classes or sales_admin)  API done  api/groups/add_batch_group/<campus_id>
○删除排课group （权限点 edit_classes or sales_admin) API done api/groups/delete (传参 delete_all为1时全部删除  删除指定就传record_ids)
○编辑排课group （权限点 edit_classes or sales_admin)   API done api/groups/edit
○获取busy信息  （权限点 edit_classes or sales_admin)   API done api/groups/get_busy/<campus_id>
○添加busy信息  （权限点 edit_classes or sales_admin)   API done  api/groups/add_busy
○删除busy信息 （权限点 edit_classes or sales_admin)    API done  api/groups/delete_busy
○开始排课  （core_user 为真） API done api/groups/start_smart_schedule/<campus_id>
○提交排课结果 （core_user 为真） API done api/groups/commit_schedule/<campus_id>


讨论的笔记：
group list进去叫 AI schedule
校区列表
基础数据下载 -》 返回

group Info
支持编辑
支持全量字段搜索


批量上传按钮
根据前面的group 模版，填充后，上传得到新的group 列表

排课结果页面
如果正在排课，就会返回一串提示文字

结束后展示列表 完全参考实现：https://www.allen.huayaopudong.com/office/ai-schedule-timeslots/1

这个页面不要分页，全量展示

最后的save schedule 先不动


