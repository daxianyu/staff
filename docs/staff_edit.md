
# Staff Member Edit Page Design

## Basic Information
- **First name (名):**  
  []
- **Last name (姓):**  
  []
- **Campus (校区):**  
  []

## Contact Information
- **Phone number 1 (手机号码1):**  
  []
- **Phone number 2 (手机号码2):**  
  []
- **Email (邮箱):**  
  []
- **School email (学校邮箱):**  
  []
- **Zoom ID (Zoom ID):**  
  []

## Roles and Permissions
Check all that apply:
- [ ] Mentor (导师)
- [ ] Subject Leader (学科组长)
- [ ] Senior Mentor (资深导师)
- [ ] Admissions Office (招生办)
- [ ] Administrative Management (行政管理)
- [ ] Finance (财务)
- [✓] Super Administrator (超级管理员)

## Actions
- [Save Changes] [Cancel]  
- [Reset Password]


Design Notes:

1. Field labels follow the format: English Label (Chinese Translation)
2. Text input fields are indicated with square brackets []
3. Checkboxes are used for multiple permissions selection
4. Action buttons are grouped logically
5. The current user data is shown as placeholder content
6. Required fields could be marked with asterisks (*) if needed

GET 先要从这个接口/api/staff/info/staff_id去拿数据通过传入的staff id   
拿到如下参数填充{
  "status": 0,
  "message": "",
  "data": {
    "staff_info": {
      "id": 637,
      "campus_id": 1,
      "first_name": "鹏",
      "middle_name": null,
      "last_name": "金",
      "name_search_cache": "金鹏",
      "phone_0": "13516816073",
      "phone_1": "",
      "email": "allan_jin@ghqdedu.com",
      "email_verified": 1,
      "active": 1,
      "inactive_since": -1,
      "pay_model_id": -1,
      "zoom_id": "",
      "mentor_leader_id": 227,
      "company_email": "13516816073@163.com",
      "wework_id": "JinBenJin",
      "genders": 0
    },
    "staff_group_names": "导师",
    "staff_group": {
      "637": [
        {
          "group_name": "导师",
          "group_id": 3
        }
      ]
    },
    "groups": {
      "1": "学科组长",
      "3": "导师",
      "6": "财务",
      "12": "超级管理员",
      "14": "资深导师",
      "15": "招生办",
      "16，": "行政管理"
    },
    campus_info": {
            "1": "\u6d66\u4e1c\u534e\u66dc-P"
        }
  }
}


然后POST 调用接口​/api​/staff​/edit 返回
{
  "campus_id": 0,
  "company_email": "string",
  "email": 0,
  "first_name": 0,
  "group_ids": "string",
  "last_name": 0,
  "mentor_leader_id": 0,
  "phone_0": 0,
  "phone_1": 0,
  "record_id": 0
}

===============================================
更新内容
==================
新增 重置密码按钮

页面操作逻辑:
1.在取消按钮左边新增一个红色 重置密码 按钮
2.当点击这个重置密码按钮 弹出一个对话框跟用户确认是否要重置密码
3.当用户确认了以后，调用post接口  /api/staff/reset_password/api/staff/reset_password 传入staff_id 会返回随机密码
4.然后把这个随机密码显示在弹框上，并且旁边有一个可复制的小图标，最下面一个确认字样的按钮