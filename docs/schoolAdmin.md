新增一个Menu组：School Admin，其下有这些页面：
Staff
Students
Parents
Classes
Self Signup Classes
Group Assignment Requests
Subjects
Classrooms
Exams
SMS
Dormitory SMS
Textbooks
Edit Tests
Edit Surveys
Services
Lockers
MentorProfile
Transcript Manager
Polish Overview
Certificate Overview
Locker Return Overview
Free Search
Warning Overview
Weekend Plan Overview
Weekend Special Date


其他的页面先建立空白的page.tsx文件：
先帮我实现以下几个页面:
●警告信息 （School Admin  下面的  Warning Overview ）
pythonAPI实现：handler/office/warning.py
○获取添加警告的下拉选项 （权限点为 operation_right 为21 or core_user为真） API done   api/warning/get_warning_select
○新增警告 （权限点为 operation_right 为21 or core_user为真） API done   api/warning/add_warning
○获取警告列表 （权限点为 operation_right 为21 or core_user为真） API done   api/warning/get_warning_list
○警告的编辑 （权限点为 operation_right 为21 or core_user为真） API done   api/warning/edit_warning
○删除指定的警告 （权限点为 operation_right 为21 or core_user为真） API done   api/warning/del_warning


●周末计划 (School Admin 下的 Weekend Plan Overview 和 'Weekend Special Date)
pythonAPI实现：handler/office/weekend.py
○周末节假日的统计汇总 （权限点为 operation_right 为17 or core_user为真） API done  api/weekend/get_student_weekend_time_table
○节假日的配置清单 （权限点为 operation_right 为22 or core_user为真） API done  api/weekend/special_date_table
○添加节假日（权限点为 operation_right 为22 or core_user为真） API done  api/weekend/add_weekend_date
○删除节假日（权限点为 operation_right 为22 or core_user为真） API done  api/weekend/delete_weekend_date


●空闲信息（School Admin 下的 Free Search）
pythonAPI实现：handler/office/tools.py
○获取老师或者学生的空闲时间（权限点为 tool_user or core_user） API done api/tools/free_search

●Self signup class (School Admin 下的 Self Signup Classes)
pythonAPI实现：handler/office/classes.py
○获取添加self signup class 的选项清单（权限点 edit_classes or sales_admin) API done   api/class/get_signup_class_select
○获取Current classes 列表 （权限点 edit_classes or sales_admin)  API done  api/class/self_signup_class/list
○添加self signup class （权限点 edit_classes or sales_admin)  API  done /api/class/self_signup_class/add
○删除 self signup class 记录 （权限点 edit_classes or sales_admin)  API  done  api/class/self_signup_class/delete
○批量增加self signup class 记录  （权限点 edit_classes or sales_admin)  API done api/class/self_signup_class/upload
○signup class 基础数据的下 （权限点 edit_classes or sales_admin)  API done  api/class/self_signup_class/download 




============ 更新内容 ============
●Self signup class (School Admin 下的 Self Signup Classes)
○获取添加self signup class 的选项清单（权限点 edit_classes or sales_admin) API done   api/class/get_signup_class_select
○获取Current classes 列表 （权限点 edit_classes or sales_admin)  API done  api/class/self_signup_class/list
○添加self signup class （权限点 edit_classes or sales_admin)  API  done /api/class/self_signup_class/add
○删除 self signup class 记录 （权限点 edit_classes or sales_admin)  API  done  api/class/self_signup_class/delete
○批量增加self signup class 记录  （权限点 edit_classes or sales_admin)  API done api/class/self_signup_class/upload
○signup class 基础数据的下 （权限点 edit_classes or sales_admin)  API done  api/class/self_signup_class/download 
○获取signup class的编辑的信息 （权限点 edit_classes or sales_admin)  API done  api/class/self_signup_class/get_edit_info/<record_id>
○删除并新增一个signup class （权限点 edit_classes or sales_admin)  API done  api/class/self_signup_class/add_new
○编辑signup class （权限点 edit_classes or sales_admin)  API done api/class/self_signup_class/edi
○删除signup class 下的学生 （权限点 edit_classes or sales_admin)  API done   api/class/self_signup_class/delete_student
