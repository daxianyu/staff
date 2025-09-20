新增一个Menu组：Master Admin，其下有这些页面：
View Complaints
Set Signup Time
Campuses
Class Topics


每个页面的接口分别是：
○查看Complaint （权限点 view_complaints）API api/complains/list
○回复Complaint （权限点 core_user 为真） API api/complains/send_complaint_mail

不要加删除的功能
○获取校区列表 （权限点 edit_campuses） API api/campus/get_all_campus
○获取单个校区信息 （权限点 edit_campuses） API api/campus/get_detail/<campus_id>
○新增校区 （权限点 edit_campuses） API api/campus/add
○删除校区 （权限点 edit_campuses） API api/campus/delete
○更新校区信息 （权限点 edit_campuses） API api/campus/edit

○获取topic的列表 （权限点 core_admin）API api/topic/list
○添加topic信息 （权限点 core_admin）API api/topic/add
○删除topic信息 （权限点 core_admin）API api/topic/delete
○更新topic信息 （权限点 core_admin）API api/topic/edit

file: class_signup.py
○获取选课时间段的列表 （权限点 tool_user为真） API api/signup/list
○添加选课的时间区间 （权限点 tool_user为真）API  api/signup/add
○删除选课的时间区间 （权限点 tool_user为真）API  api/signup/delete

