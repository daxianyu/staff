GET /api/staff/list

status - 0 离职的
status - 1 在职的

列表搜索

能看到这个页面的权限（其一）：
view_staff
finance
sales_person


POST /api/staff/add

权限:
edit_staff

POST /api/staff/edit

权限:
edit_staff


POST /api/staff/delete

权限:
delete_staff


按钮组：


前五个按钮都需要以下权限：

权限:
view_staff


disable_account
权限:
edit_staff



老师默认的
GET /api/staff/teacher_default_availability/{staff_id}

0-teacher_default_schedule的空闲  1-teacher_schedule的空闲  2-lesson的占用


获取老师的课表
/api/staff/schedule/{staff_id}/{week_num} 
