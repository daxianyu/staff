新建一个menu组：

分别有这几个menu：
Classroom View 
Exam Signup
Class Signup
Textbook
Class Change

1. Classroom View
一个title 为 ：Daily classroom overview 的table
可以左右按钮切换day，还能直接选择日期，跳转到某个day
顶上是每个教室，左侧是时刻，半小时一格
接口：api/room/day_overview/<day_num>/



2. Exam Signup
直接照搬 /staff/exam 页面
只保留 考试管理 内容，且为纯展示


3. Class Signup
一个title 为 ：Available classes 的table
title : Class code 和	Campus

接口： api/subjects/staff/list

加上前端下载接口

4. Textbook
一个表格：四个列：Name	Board	Price	Inventory

接口：api/textbook/get_staff_list

5. Class Change
右上角按钮：新增一个Change，
三个参数：请选择学生，审批的组长，调课描述
/api/classroom/get_class_change_select

提交：api/classroom/class_change/add/

底下是列表：/api/core/operator_list

titles:

申请人
学生名字
申请描述
申请时间
状态
审批人
拒绝/撤销 理由
操作

最后的撤销可以撤销某条记录
接口：api/classroom/class_change/update_status/

