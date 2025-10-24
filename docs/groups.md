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