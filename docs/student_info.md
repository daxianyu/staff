这个页面有非常多的tab，很多放不下，编到同一个组里面。
修改的主要页面文件：src/app/mentee/student-detail/page.tsx

目前太乱了，读取前面100行，获取必要的接口信息，后面的都重写

Option
Classes
Class Assignment
Basic Info
University Choices
Feedback

Exam Info(组)，下面是下拉的更多选项
Exam Records
Student Remark
Student Cashin
Student Withdrawl
Exam Score
Language Score


1. Option
登记学生的请假（register student leave）    api/mentee/student_report_leave
跳转到student的schedule页面  /student/schedule
提交学生的投诉  api/mentee/update_complaint


2. Classes
api/mentee/get_classes/<student_id>
展示一个class列表，加上链接：/class-view/xxx/

3. Class Assignment
获取信息api/mentee/get_assignment/<student_id>

Exam	Class	Subject	Note	Sign up Time	Operate

4. Basic Info
/api/mentee/get_student_info/xx
直接展示为table, 按照顺序展示
Student information
Name	华小曜
Campus Name:	浦东华曜
Gender	Male
Birthday	July 16, 2025
Edexcel first time fee	未缴费
Pay Fee	
Exams	2025 June CIE IGCSE Chemistry
2025 June CIE IGCSE Mathematics
2025 Oct CIE Business AS
Entrollment Date	January 01, 2025
Graduation Date	January 09, 2027 
Year Fee	3.5
Subject Relative	None
Absence last 7 days	0
Absence last 30 days	0
Late last 7 days	0
Late last 30 days	0
Unauthorized absence last 7 days	0
Unauthorized absence last 30 days	0
English name	123
Student ID	202730001
Nationality	0
UCI number	95334B243338Y
CIE Center Number	
CIE Candidate number	
Phone Number	13248260782
Address	China, xiaoshan, jiajingtiancheng
Current School	safd
Current Grade	九年级
Father's Name	2
Father's Phone Number	13248260782
Mother's Name	13
Mother's Phone Number	13248260782





============== 最新 ================

1. Exam Record 需要实现
2. Exam Info 需要有添加考试信息的操作
3. Language Score 需要有添加语言考试成绩的操作

相关接口如下：
获取student的 exam info api/mentee/get_exams_info/<student_id>
○获取student的language exam信息 api/mentee/get_language_exam_table/<student_id>
○添加student的language exam信息 api/mentee/add_language_exam
○删除student的language exam 信息 api/mentee/delete_language_row
○获取student的大考信息   api/mentee/get_normal_exam_table/<student_id>
○添加大考  api/mentee/add_normal_exam
○删除大考   api/mentee/delete_normal_exam_row