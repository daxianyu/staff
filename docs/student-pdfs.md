点击报告生成按钮这部分的功能：

1. Expected grades
点击后弹出弹框，选择或者输入三部分数据
Graduation Date: 日期选择器，选择日期
Graduating Class Size : 输入框，输入数字
data列: 一共有四列，ALEVEL，日期，课程名，成绩
其中，ALEVEL是自己输入
日期是年月日
课程名从all_course字段的列表中填充，也支持自己填写
成绩自己输入
每个字段都是必填的
行数据可以进行增加或者删除。
[alevel, date, course, score]
点击下载将它们，加上student id组装成一个json数据进行发送

2. Certificate
Name:	
ID:	
Gender:	Male 
Birthday:	
Studied from:	
Graduation date:

数据从student_list 的每个student中获取预先填充进去，没有的可以自己手动填入或者选择


3. Transcript

Name (Pinyin):	
Name (Hanzi):	
Gender:	Male 
Birthday:	
Duration from:	
Graduation Date:	
IG time:	
AS time:	
AL time:

data 列表：
各个课程的分数课程名从transaction_list字段中选择获取，选过的不能再选。
一共以下几个维度的成绩，每个都是选择的：Course	IG Term 1	IG Term 2	AS Term 1	AS Term 2	AL Term 1	AL Term 2
成绩选项从transcript_grade_list中获取
这课程列表的前四项是默认选在那里，不能再被选或者删除。

4. 美本成绩单

Name (Pinyin):	
Gender:	Male 
Birthday:	
Enrolment Date:	
Graduation Date:	
Student Num:	
Grade 10 School Year	
Grade 11 School Year	
Grade 12 School Year

最后的data列表也是各个课程的分数课程名从america_subjects获取，一共以下几个维度的成绩，每个都是选择的：	Grade10 S1	Grade10 S2	Grade10 Final	Grade11 S1	Grade11 S2	Grade11 Final	Grade12 S1	Grade12 S2	Grade12 Final
成绩选项从am_grade_list中获取，每个成绩都可以删除增加，但不能重复。