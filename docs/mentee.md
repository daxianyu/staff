新建一个mentee的menu组
底下有两个menu：
Mentee list
My Mentors

Mentee （Mentees 下的）
获取老师带的学生清单 (权限 user_type 是教师就行 ) API  done api/mentee/mentee_students
更新学生的状态（例如 suspend/ drop out / Graduate）API  done api/mentee/update_student
添加Complaint     api/mentee/update_complaint
Class assignment requests note的单个更新  api/mentee/update_single
mentor student info的select清单  api/mentee/get_student_info_select
获取学生的学期评语的清单 模考 期中 期末  api/mentee/get_evaluate_select
获取student 的class信息  API  done api/mentee/get_classes/<student_id>
获取student的Class assignment 信息  API  done api/mentee/get_assignment/<student_id>
获取student的base  info  API  done api/mentee/get_student_info/<student_id>
获取student 的course info API done  api/mentee/get_course_info/<student_id>
获取student的 feedback api/mentee/get_feed_back/<student_id>
获取student的 exam info api/mentee/get_exams_info/<student_id>
获取student的Remark 信息 api/mentee/load_student_remark/<student_id>
获取student的cashin信息  api/mentee/load_student_cashin/<student_id>
获取student的Withdrawl信息 api/mentee/load_student_withdrawal/<student_id>
获取student的language exam信息 api/mentee/get_language_exam_table/<student_id>
添加student的language exam信息 api/mentee/add_language_exam
删除student的language exam 信息 api/mentee/delete_language_row
获取student的大考信息   api/mentee/get_normal_exam_table/<student_id>
添加大考  api/mentee/add_normal_exam
删除大考   api/mentee/delete_normal_exam_row
获取我作为mentor leader下的导师所带的学生 api/mentee/get_my_mentor_students

Mentor Info 
获取每天的教室使用情况 api/room/day_overview/<day_num>/
获取所有的考试信息  api/exam/get_exam_list
获取所有的class signup信息  api/subjects/staff/list
获取所有的textbook列表  api/textbook/get_staff_list
获取当前用户的class change 清单
添加class change的记录
撤销class change  



============================================== 最新版本 ============================================== 


●Mentee （Mentees 下的）
○获取老师带的学生清单 (权限 user_type 是教师就行 ) API  done api/mentee/mentee_students
○更新学生的状态（例如 suspend/ drop out / Graduate）API  done api/mentee/update_student
○获取学生的学期评语的清单 模考 期中 期末  api/mentee/get_evaluate_select
○下载学生的成绩报告 API done  api/report/view_report
○获取学生请假页面的数据  API done api/mentee/get_student_lessons/<student_id>
○学生提交请假  API done api/mentee/student_report_leave
○添加Complaint     api/mentee/update_complaint
○Class assignment requests note的单个更新  api/mentee/update_single
○mentor student info的select清单  api/mentee/get_student_info_select
○获取student 的class信息  API  done api/mentee/get_classes/<student_id>
○获取student的Class assignment 信息  API  done api/mentee/get_assignment/<student_id>
○获取student的base  info  API  done api/mentee/get_student_info/<student_id>
○获取student 的course info API done  api/mentee/get_course_info/<student_id>
○获取student的 feedback api/mentee/get_feed_back/<student_id>
○获取student的 exam info api/mentee/get_exams_info/<student_id>
○获取student的Remark 信息 api/mentee/load_student_remark/<student_id>
○获取student的cashin信息  api/mentee/load_student_cashin/<student_id>
○获取student的Withdrawl信息 api/mentee/load_student_withdrawal/<student_id>
○获取student的language exam信息 api/mentee/get_language_exam_table/<student_id>
○添加student的language exam信息 api/mentee/add_language_exam
○删除student的language exam 信息 api/mentee/delete_language_row
○获取student的大考信息   api/mentee/get_normal_exam_table/<student_id>
○添加大考  api/mentee/add_normal_exam
○删除大考   api/mentee/delete_normal_exam_row
○获取我作为mentor leader下的导师所带的学生 api/mentee/get_my_mentor_students
●Mentor Info 
○获取每天的教室使用情况 api/room/day_overview/<day_num>/
○获取所有的考试信息  api/exam/get_exam_list
○获取所有的class signup信息  api/subjects/staff/list
○获取所有的textbook列表  api/textbook/get_staff_list
○获取当前用户的class change 清单  api/core/operator_list
○获取添加class change的select 信息  api/classroom/get_class_change_select
○添加class change的记录 api/classroom/class_change/add/
○撤销class change  api/classroom/class_change/update_status/