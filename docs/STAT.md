新增一个Menu组：STAS，其下有这些页面： 
Center List  
Mentee Dashboard  
Mentor Dashboard  
Teacher Hours  
Subject Relative  
Subject Relative Monthly  
Student Fullness  
Classroom Usage  
Teacher Monthly Hours  
Student Monthly Hours  
Student Attendance


STAS
获取考试中心的列表 （权限点 core_admin or finance） API done api/stas/get_center_list
Mentee Dashboard  （权限点 "stas", "sales_person", "finance"）API done /api/stas/get_mentee_list/<mtype>   mtype-0(按数量排序) mtype-1(按导师组排序)
Mentor Dashboard  （权限点 "stas", "sales_person", "finance"）API done /api/stas/get_mentor_list
获取所有老师的授课总小时数  （权限点 view_teaching_hours_overview
 or finance  or stas） API  done api/stas/get_teaching_hours_overview_total
Subject relative (权限点 "view_students", "finance", "stas" ) API done /api/stas/get_subject_relative
Subject relative Month (权限点 "view_students", "finance", "stas" ) API done /api/stas/get_subject_relative
Student fullness  (权限点 "view_students", "finance", "stas" ) API done /api/stas/get_student_fullness/<overview_month>
Classroom Usage  (权限点 "sales_person", "view_day_overview", "finance", "stas"） API  done   /api/stas/get_classroom_usage/<overview_month>
老师教学时长-月度  (权限点 "view_teaching_hours_overview", "finance", "core_admin"）API done /api/stas/get_teaching_hours_overview/<overview_month>
学生上课时长-月度  （权限点 "view_teaching_hours_overview", "finance", "core_admin"） API done /api/stas/get_students_hours_overview/<overview_month>
学生请假信息 （权限点  stas ） API done /api/stas/get_student_attendance/<overview_month>