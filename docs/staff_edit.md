
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


新增 重置密码按钮

页面操作逻辑:
1.在取消按钮左边新增一个红色 重置密码 按钮
2.当点击这个重置密码按钮 弹出一个对话框跟用户确认是否要重置密码
3.当用户确认了以后，调用post接口  /api/staff/reset_password/api/staff/reset_password 传入staff_id 会返回随机密码
4.然后把这个随机密码显示在弹框上，并且旁边有一个可复制的小图标，最下面一个确认字样的按钮



===============================================
更新内容
=================================================================
返回内容是这样的
{
    "status": 0,
    "message": "",
    "data": {
        "staff_info": {
            "id": 699,
            "campus_id": 1,
            "first_name": "fengfei",
            "middle_name": null,
            "last_name": "zhang",
            "name_search_cache": "zhangfengfei",
            "phone_0": "15990094220",
            "phone_1": "",
            "email": "xx1@qq.com",
            "email_verified": 0,
            "active": 1,
            "inactive_since": -1,
            "pay_model_id": -1,
            "zoom_id": null,
            "mentor_leader_id": 0,
            "company_email": "",
            "wework_id": "",
            "genders": -1
        },
        "mentor_info": [
            [
                699,
                "zhangfengfei"
            ],
            [
                698,
                "\u65b9\u51ef"
            ],
            [
                695,
                "\u53f6\u8f69"
            ],
            [
                694,
                "\u5f20\u4f73\u9896"
            ],
            [
                693,
                "\u4f55\u5065\u6052"
            ],
            [
                692,
                "\u5415\u601d\u777f"
            ],
            [
                691,
                "\u4f55\u5065\u6052"
            ],
            [
                690,
                "\u6bb7\u6d2a\u82b3"
            ],
            [
                689,
                "\u5434\u6770"
            ],
            [
                688,
                "\u5218\u8d85"
            ],
            [
                687,
                "\u8d6b\u6d0b\u6d0b"
            ],
            [
                686,
                "\u6c88\u96e8\u742a"
            ],
            [
                685,
                "\u90a2\u6817\u73ae"
            ],
            [
                684,
                "\u5b8b\u660e\u7487"
            ],
            [
                683,
                "\u5d14\u6615\u745c"
            ],
            [
                682,
                "\u9ec4\u5a49\u9752"
            ],
            [
                681,
                "\u8521\u4eba\u6770"
            ],
            [
                680,
                "\u5510\u7ff0\u6797"
            ],
            [
                679,
                "\u4fde\u6590\u5e06"
            ],
            [
                678,
                "\u5218\u5bc5\u864e"
            ],
            [
                677,
                "\u5218\u5955\u51b0"
            ],
            [
                676,
                "34dfa"
            ],
            [
                675,
                "\u675c\u5f66\u5112"
            ],
            [
                674,
                "\u6797\u7d2b\u654f"
            ],
            [
                673,
                "\u9648\u9896"
            ],
            [
                672,
                "\u82f1\u8bedRobot1"
            ],
            [
                671,
                "\u66f9\u4e45\u9752"
            ],
            [
                670,
                "\u5510\u667a\u51e1"
            ],
            [
                669,
                "\u6570\u5b66\u6392\u8bfeRobot2"
            ],
            [
                668,
                "\u6570\u5b66\u6392\u8bfeRobot1"
            ],
            [
                667,
                "\u6797\u949f\u6770"
            ],
            [
                666,
                "\u6b66\u5609\u665f"
            ],
            [
                665,
                "\u9b4f\u5b97\u534e"
            ],
            [
                663,
                "\u5b59\u5a1f\u6885"
            ],
            [
                662,
                "\u59da\u9e3f"
            ],
            [
                661,
                "MaClaire"
            ],
            [
                660,
                "\u9093\u7433\u5143"
            ],
            [
                659,
                "Mandy"
            ],
            [
                658,
                "\u80e1\u82b3\u857e"
            ],
            [
                657,
                "\u767d\u4e3d\u5929"
            ],
            [
                656,
                "\u81e7\u743c"
            ],
            [
                655,
                "Crystal"
            ],
            [
                654,
                "\u5f90\u6b63\u653e"
            ],
            [
                653,
                "ICT\u6392\u8bfeRobot"
            ],
            [
                652,
                "\u6797\u695a\u715c"
            ],
            [
                651,
                "\u8bb8\u65af\u777f"
            ],
            [
                650,
                "\u9c8d\u5723\u84c9"
            ],
            [
                649,
                "\u6b66\u5b50\u715c"
            ],
            [
                648,
                "\u6bb5\u4f1f"
            ],
            [
                647,
                "\u5434\u68a6\u8776"
            ],
            [
                645,
                "\u6d3b\u52a8\u8bfe\u8001\u5e08"
            ],
            [
                644,
                "\u4f53\u80b2\u5fc5\u4feerobot"
            ],
            [
                643,
                "\u4f53\u80b2\u6392\u8bferobot2"
            ],
            [
                642,
                "\u4f53\u80b2\u6392\u8bferobot"
            ],
            [
                641,
                "\u82f1\u8bed\u7ec4\u6392\u8bferobot"
            ],
            [
                640,
                "\u4e01\u4f73\u5349"
            ],
            [
                639,
                "\u82f1\u8bed\u7ec4"
            ],
            [
                638,
                "\u5b8b\u67f3"
            ],
            [
                637,
                "\u91d1\u9e4f"
            ],
            [
                636,
                "\u6866\u66dc\u6d4b\u8bd5"
            ],
            [
                634,
                "\u674e\u5c0f\u840c"
            ],
            [
                632,
                "\u59dc\u82e5\u95f2"
            ],
            [
                623,
                "\u8bb8\u5609\u835f"
            ],
            [
                622,
                "\u6768\u5609\u946b"
            ],
            [
                616,
                "\u5b89\u5b50\u7aef"
            ],
            [
                615,
                "\u66fe\u51ef\u5fb7"
            ],
            [
                614,
                "\u9648\u662d\u777f"
            ],
            [
                613,
                "\u4e01\u7433"
            ],
            [
                612,
                "\u5927\u5927"
            ],
            [
                611,
                "\u6731\u6602\u660e"
            ],
            [
                607,
                "\u7ae0\u97f5"
            ],
            [
                479,
                "\u8212\u8001\u5e08"
            ],
            [
                445,
                "\u80e1\u96c5\u96ef"
            ],
            [
                424,
                "\u9a6c\u5148\u751f"
            ],
            [
                411,
                "\u4e2a\u4eba\u5b66\u6821\u529e\u516c\u5ba4"
            ],
            [
                391,
                "\u7fdf\u6f47\u6770"
            ],
            [
                382,
                "\u9ec4\u5a77\u5a77"
            ],
            [
                373,
                "\u4ed8\u56fd\u5174"
            ],
            [
                280,
                "\u5f20\u6881\u9ed8"
            ],
            [
                227,
                "\u90ce\u7b71\u715c"
            ],
            [
                180,
                "\u59da\u946b"
            ],
            [
                78,
                "\u5434\u6069\u6148"
            ],
            [
                41,
                "\u6821\u957f\u529e\u516c\u5ba4"
            ],
            [
                33,
                "xxx"
            ],
            [
                24,
                "\u6c6a\u5f3a"
            ]
        ],
        "staff_group_names": "\u8d22\u52a1,\u5b66\u79d1\u7ec4\u957f,\u5bfc\u5e08",
        "staff_group": {
            "699": [
                {
                    "group_name": "\u8d22\u52a1",
                    "group_id": 6
                },
                {
                    "group_name": "\u5b66\u79d1\u7ec4\u957f",
                    "group_id": 1
                },
                {
                    "group_name": "\u5bfc\u5e08",
                    "group_id": 3
                }
            ]
        },
        "groups": {
            "1": "\u5b66\u79d1\u7ec4\u957f",
            "3": "\u5bfc\u5e08",
            "6": "\u8d22\u52a1",
            "12": "\u8d85\u7ea7\u7ba1\u7406\u5458",
            "14": "\u8d44\u6df1\u5bfc\u5e08",
            "15": "\u62db\u751f\u529e",
            "16": "\u884c\u653f\u7ba1\u7406"
        },
        "campus_info": [
            [
                1,
                "\u6d66\u4e1c\u534e\u66dc-P"
            ]
        ]
    }
}
mentor 和capmus 需要调整下