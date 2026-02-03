'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
    getSalesInfo,
    sendEntranceAdmission,
    sendEntranceReject,
    addSalesToStudent,
    updateSalesInfo,
    getAllCampus,
    uploadSalesImage,
    generateContractPreview,
    finalizeSigningRequest,
    type SalesInfo,
    type UpdateSalesParams,
    type Campus,
    type AdmissionMailParams,
    type RejectMailParams,
    type ContractPreviewData,
} from '@/services/auth';
import { getSiteConfig, type SiteConfig } from '@/services/modules/tools';
import { getApiBaseUrl } from '@/config/env';
import {
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    UserPlusIcon,
    XMarkIcon,
    CheckCircleIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// 将时间戳转换为日期输入格式 (yyyy-MM-dd)
function toDateInput(timestamp: number | undefined): string {
    if (!timestamp || timestamp === -1) return '';
    try {
        const date = new Date(timestamp * 1000);
        if (isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    } catch {
        return '';
    }
}

// 将日期输入格式转换为时间戳
function toTimestamp(dateInput: string): number {
    if (!dateInput) return -1;
    try {
        const date = new Date(dateInput + 'T00:00:00');
        if (isNaN(date.getTime())) return -1;
        return Math.floor(date.getTime() / 1000);
    } catch {
        return -1;
    }
}

// 解析用户输入/粘贴的日期文本为时间戳（秒）
// 支持：yyyy-MM-dd / yyyy/M/d / yyyy.MM.dd / "yyyy-MM-dd HH:mm:ss"（会取日期部分）
function parseDateTextToTimestamp(raw: string): number {
    const text = (raw || '').trim();
    if (!text) return -1;

    // 尝试提取年月日
    const m = text.match(/(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/);
    if (!m) return -1;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return -1;
    if (mo < 1 || mo > 12) return -1;
    if (d < 1 || d > 31) return -1;

    // 用 Date 做合法性校验（避免 2025-02-31 这种溢出）
    const date = new Date(y, mo - 1, d, 0, 0, 0, 0);
    if (isNaN(date.getTime())) return -1;
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return -1;
    return Math.floor(date.getTime() / 1000);
}

function normalizeDateText(raw: string): string {
    const ts = parseDateTextToTimestamp(raw);
    if (!ts || ts === -1) return (raw || '').trim();
    return toDateInput(ts);
}

// 格式化时间戳为可读的日期时间格式
function formatTimestamp(timestamp: number): string {
    if (!timestamp || timestamp === -1) return '';
    try {
        const date = new Date(timestamp * 1000);
        if (isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    } catch {
        return '';
    }
}

// 必填字段标记组件
const RequiredMark = () => <span className="text-red-500 ml-1">*</span>;

function PasteableDateInput(props: {
    value: number | undefined;
    onChangeTimestamp: (ts: number) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}) {
    const { value, onChangeTimestamp, disabled, className, placeholder } = props;
    const [text, setText] = useState<string>(toDateInput(value));

    useEffect(() => {
        setText(toDateInput(value));
    }, [value]);

    const parsedTs = parseDateTextToTimestamp(text);
    const isInvalid = Boolean(text.trim()) && parsedTs === -1;

    return (
        <div className="space-y-1">
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholder || 'YYYY-MM-DD'}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                    }}
                    onBlur={() => {
                        const v = text.trim();
                        if (!v) {
                            onChangeTimestamp(-1);
                            setText('');
                            return;
                        }
                        const ts = parseDateTextToTimestamp(v);
                        if (ts !== -1) {
                            onChangeTimestamp(ts);
                            setText(toDateInput(ts));
                        }
                    }}
                    onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        if (!pasted) return;
                        e.preventDefault();
                        const normalized = normalizeDateText(pasted);
                        setText(normalized);
                        const ts = parseDateTextToTimestamp(normalized);
                        if (ts !== -1) onChangeTimestamp(ts);
                    }}
                    className={`${className || ''} pr-12 ${isInvalid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    disabled={disabled}
                />

                {/* 日历图标（视觉） */}
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <CalendarDaysIcon className="h-5 w-5" />
                </div>

                {/* 原生日期选择器（透明覆盖在图标区域上，保证手机/桌面都能点开） */}
                <input
                    type="date"
                    value={toDateInput(value)}
                    onChange={(e) => {
                        const v = e.target.value;
                        const ts = parseDateTextToTimestamp(v);
                        if (ts !== -1) {
                            onChangeTimestamp(ts);
                            setText(toDateInput(ts));
                        }
                    }}
                    disabled={disabled}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 opacity-0 cursor-pointer"
                    aria-label="打开日期选择器"
                    tabIndex={disabled ? -1 : 0}
                />
            </div>
            {isInvalid && <p className="text-xs text-red-600">日期格式不正确，请输入 YYYY-MM-DD</p>}
        </div>
    );
}

export default function SalesEditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { hasPermission } = useAuth();

    const contractId = searchParams.get('id');

    // 权限检查
    const canView = hasPermission(PERMISSIONS.VIEW_SALES_INFO) ||
        hasPermission(PERMISSIONS.VIEW_CONTRACTS_INFO);
    const canEdit = hasPermission(PERMISSIONS.VIEW_SALES_INFO) ||
        hasPermission(PERMISSIONS.VIEW_CONTRACTS_INFO);

    // 状态管理
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [salesInfo, setSalesInfo] = useState<SalesInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [campusList, setCampusList] = useState<Campus[]>([]);

    // 表单数据
    const [formData, setFormData] = useState<Partial<UpdateSalesParams>>({});

    // 图片上传相关状态
    const [idCardFrontPreview, setIdCardFrontPreview] = useState<string>('');
    const [idCardBackPreview, setIdCardBackPreview] = useState<string>('');
    const [recentPhotoPreview, setRecentPhotoPreview] = useState<string>('');
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

    // 操作状态
    const [sendingAdmission, setSendingAdmission] = useState(false);
    const [sendingReject, setSendingReject] = useState(false);
    const [addingToStudent, setAddingToStudent] = useState(false);
    const [showContractPreviewModal, setShowContractPreviewModal] = useState(false);
    const [contractPreviewData, setContractPreviewData] = useState<ContractPreviewData | null>(null);
    const [loadingContractPreview, setLoadingContractPreview] = useState(false);
    const [sendingContract, setSendingContract] = useState(false);
    const [contractError, setContractError] = useState<string | null>(null);
    
    // 网站配置
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

    // 确认模态框状态
    const [showAdmissionModal, setShowAdmissionModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAddToStudentModal, setShowAddToStudentModal] = useState(false);
    const [showStudentAccountModal, setShowStudentAccountModal] = useState(false);
    const [studentAccount, setStudentAccount] = useState<{ email: string; password: string } | null>(null);

    // 模态框独立错误状态
    const [admissionError, setAdmissionError] = useState<string | null>(null);
    const [rejectError, setRejectError] = useState<string | null>(null);

    // 录取通知邮件参数
    const [admissionParams, setAdmissionParams] = useState<Partial<AdmissionMailParams & { year_of_study?: string }>>({
        school_year: '',
        semester: '',
        english_score: '',
        math_score: '',
        campuses: '',
        year_num: '',
        year_of_study: '',
    });
    const [admissionCampusId, setAdmissionCampusId] = useState<number>(0);

    // 拒信邮件参数
    const [rejectParams, setRejectParams] = useState<Partial<RejectMailParams>>({
        school_year: '',
        english_score: '',
        math_score: '',
    });

    // 权限检查页面
    if (!canView) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
                    <p className="mt-1 text-sm text-gray-500">您没有权限查看Sales信息</p>
                </div>
            </div>
        );
    }

    // 加载校区列表
    useEffect(() => {
        const loadCampusList = async () => {
            try {
                const result = await getAllCampus();
                if (result.status === 200 && result.data) {
                    setCampusList(result.data);
                }
            } catch (err) {
                console.error('加载校区列表失败:', err);
            }
        };
        loadCampusList();
    }, []);

    // 加载数据
    useEffect(() => {
        if (!contractId) {
            setError('缺少合同ID参数');
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getSalesInfo(Number(contractId));
                if (result.code === 200 && result.data) {
                    setSalesInfo(result.data);
                    const info = result.data.info;
                    // 初始化表单数据
                    setFormData({
                        contract_id: Number(contractId),
                        student_name: info.student_name || '',
                        student_first_name_pinyin: info.student_first_name_pinyin || '',
                        student_last_name_pinyin: info.student_last_name_pinyin || '',
                        student_sfz: info.student_sfz || '',
                        // 性别：0=男 1=女 2=未设置（后端返回 0 也要保留）
                        gender: info.gender ?? 2,
                        email: info.email || '',
                        phone: info.phone || '',
                        wechat: info.wechat || '',
                        address: info.address || '',
                        province: info.province || '',
                        city: info.city || '',
                        current_school: info.current_school || '',
                        grade: info.grade || '',
                        current_lesson: info.current_lesson || '',
                        guardian_name: info.guardian_name || '',
                        guardian_sfz: info.guardian_sfz || '',
                        relationship: info.relationship || '',
                        assigned_staff: info.assigned_staff || 0,
                        sales_status: info.sales_status || 0,
                        source: info.source || '',
                        fee: info.fee || 0,
                        year_fee: info.year_fee || 0,
                        course: info.course || 0,
                        channel: info.channel || 0,
                        campus_id: info.campus_id || 0,
                        apply_course: info.apply_courses || 0,
                        follow_up_1: info.follow_up_1 || '',
                        follow_up_2: info.follow_up_2 || '',
                        follow_up_3: info.follow_up_3 || '',
                        hobbies: info.hobbies || '',
                        awards: info.awards || '',
                        evaluation: info.evaluation || '',
                        registration_time: info.registration_time || -1,
                        birthday: info.birthday || -1,
                        enrolment_date: info.enrolment_date || -1,
                        sales_pay_date: info.sales_pay_date || -1,
                        graduation_date: info.graduation_date || -1,
                        year_fee_reminder_time_1: info.year_fee_reminder_time_1 || -1,
                        year_fee_reminder_time_2: info.year_fee_reminder_time_2 || -1,
                        year_fee_reminder_time_3: info.year_fee_reminder_time_3 || -1,
                        id_front_path: info.id_card_front || '',
                        id_back_path: info.id_card_back || '',
                        id_card_recent: info.recent_front || '',
                        password: info.password || '',
                        study_year: info.study_year || '',
                        math_type: info.math_type || '',
                        signing_request_state: info.signing_request_state || 0,
                    });

                    // 设置图片预览
                    if (info.id_card_front) {
                        setIdCardFrontPreview(info.id_card_front);
                    }
                    if (info.id_card_back) {
                        setIdCardBackPreview(info.id_card_back);
                    }
                    if (info.recent_front) {
                        setRecentPhotoPreview(info.recent_front);
                    }
                } else {
                    setError(result.message || '获取Sales信息失败');
                }
            } catch (err) {
                console.error('加载数据失败:', err);
                setError(err instanceof Error ? err.message : '加载数据失败');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [contractId]);

    // 加载网站配置
    useEffect(() => {
        const loadSiteConfig = async () => {
            try {
                const result = await getSiteConfig();
                if (result.code === 200 && result.data) {
                    setSiteConfig(result.data);
                }
            } catch (error) {
                console.error('加载网站配置失败:', error);
            }
        };
        loadSiteConfig();
    }, []);

    // 处理输入变化
    const handleInputChange = (field: keyof UpdateSalesParams, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setSuccessMessage(null);
    };

    // 文件上传处理
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'idCardFront' | 'idCardBack' | 'recentPhoto') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // 文件大小检查（10MB）
        if (file.size > 10 * 1024 * 1024) {
            setError('文件大小不能超过10MB');
            return;
        }

        // 文件类型检查
        if (!file.type.startsWith('image/')) {
            setError('只能上传图片文件');
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            const preview = reader.result as string;
            if (fileType === 'idCardFront') {
                setIdCardFrontPreview(preview);
            } else if (fileType === 'idCardBack') {
                setIdCardBackPreview(preview);
            } else if (fileType === 'recentPhoto') {
                setRecentPhotoPreview(preview);
            }
        };

        reader.readAsDataURL(file);

        // 上传文件到服务器
        try {
            setUploadingImage(fileType);
            setError(null);

            let field: 'sfz_front' | 'sfz_back' | 'recent_front_photo';
            if (fileType === 'idCardFront') field = 'sfz_front';
            else if (fileType === 'idCardBack') field = 'sfz_back';
            else field = 'recent_front_photo';

            const res = await uploadSalesImage(field, file);
            if (res.code === 200 && res.data) {
                const filePath = res.data;
                if (fileType === 'idCardFront') {
                    handleInputChange('id_front_path', filePath);
                } else if (fileType === 'idCardBack') {
                    handleInputChange('id_back_path', filePath);
                } else if (fileType === 'recentPhoto') {
                    handleInputChange('id_card_recent', filePath);
                }
                setSuccessMessage('图片上传成功');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError('上传图片失败：' + (res.message || '未知错误'));
            }
        } catch (err) {
            console.error('上传图片出错:', err);
            setError('上传图片时发生错误，请稍后重试');
        } finally {
            setUploadingImage(null);
        }
    };

    // 获取当前签署状态（服务协议）
    const getSigningState = (): number => {
        return formData.signing_request_state ?? salesInfo?.info?.signing_request_state ?? 0;
    };

    // 获取咨询协议签署状态
    const getSigningState2 = (): number => {
        return salesInfo?.info?.signing_request_state_2 ?? 0;
    };

    // 判断是否可以请求签署合同（两个状态都为0）
    const canRequestSigning = (): boolean => {
        return getSigningState() === 0 && getSigningState2() === 0;
    };

    // 获取状态文本
    const getSigningStateText = (): string => {
        const state = getSigningState();
        switch (state) {
            case 0:
                return '待签署';
            case 1:
                return '正在签署合同';
            case 2:
                return '已签署完成';
            default:
                return '未知状态';
        }
    };

    // 获取状态颜色
    const getSigningStateColor = (): string => {
        const state = getSigningState();
        switch (state) {
            case 0:
                return 'bg-yellow-100 text-yellow-800';
            case 1:
                return 'bg-blue-100 text-blue-800';
            case 2:
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // 判断字段是否需要校验（当 signing_request_state = 0 时）
    const isFieldRequired = (fieldName: string): boolean => {
        if (!canRequestSigning()) return false; // 不是待签署状态，不校验

        // 需要校验的字段列表
        const requiredFields = [
            'email',
            'gender',
            'student_sfz',
            'grade',
            'guardian_name',
            'relationship',
            'guardian_sfz',
            'address',
            'phone',
            'student_name',
            'student_first_name_pinyin',
            'student_last_name_pinyin',
            'campus_id',
            'id_back_path',
            'id_front_path',
        ];
        return requiredFields.includes(fieldName);
    };

    // 判断字段是否有错误（待签署状态且字段为空）
    const isFieldError = (fieldName: string): boolean => {
        if (!canRequestSigning()) return false; // 不是待签署状态，不显示错误
        
        if (!isFieldRequired(fieldName)) return false;
        
        const value = formData[fieldName as keyof UpdateSalesParams];
        // 字段级别判空规则
        if (fieldName === 'gender') {
            // 0=男/1=女 为有效值，2=未设置 视为未填
            return value === undefined || value === null || value === 2;
        }
        if (typeof value === 'number') {
            return value === 0 || value === -1;
        }
        if (typeof value === 'string') {
            return value.trim() === '';
        }
        return !value;
    };

    // 获取缺失的必填字段列表（用于显示错误提示）
    const getMissingFields = (): string[] => {
        if (!canRequestSigning()) return [];
        
        const fieldMap: Record<string, string> = {
            'email': '邮箱',
            'gender': '性别',
            'student_sfz': '学生身份证号',
            'grade': '年级',
            'guardian_name': '监护人姓名',
            'relationship': '关系',
            'guardian_sfz': '监护人身份证号',
            'address': '地址',
            'phone': '电话',
            'student_name': '学生姓名',
            'student_first_name_pinyin': '姓名拼音（名）',
            'student_last_name_pinyin': '姓名拼音（姓）',
            'campus_id': '校区',
            'id_back_path': '身份证反面',
            'id_front_path': '身份证正面',
        };

        const missingFields: string[] = [];
        Object.keys(fieldMap).forEach(field => {
            if (isFieldError(field)) {
                missingFields.push(fieldMap[field]);
            }
        });

        return missingFields;
    };

    // 获取输入框的样式类名（根据是否有错误）
    const getInputClassName = (fieldName: string, baseClassName: string = 'w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-blue-500'): string => {
        const hasError = isFieldError(fieldName);
        if (hasError) {
            return `${baseClassName} border-red-500 focus:ring-red-500 focus:border-red-500`;
        }
        return `${baseClassName} border-gray-300 focus:ring-blue-500`;
    };

    // 校验必填字段
    // forceValidate: 是否强制校验（忽略状态判断），用于发送合同时
    const validateRequiredFields = (forceValidate: boolean = false): string | null => {
        const state = getSigningState();

        // 如果不强制校验，且 signing_request_state = 2 时，不校验
        if (!forceValidate && state === 2) {
            return null;
        }

        // 强制校验或 signing_request_state = 0 时，校验指定字段
        if (forceValidate || state === 0) {
            const requiredFields = [
                { field: 'email', name: '邮箱' },
                { field: 'gender', name: '性别' },
                { field: 'student_sfz', name: '学生身份证号' },
                { field: 'grade', name: '年级' },
                { field: 'guardian_name', name: '监护人姓名' },
                { field: 'relationship', name: '关系' },
                { field: 'guardian_sfz', name: '监护人身份证号' },
                { field: 'address', name: '地址' },
                { field: 'phone', name: '电话' },
                { field: 'student_name', name: '学生姓名' },
                { field: 'student_first_name_pinyin', name: '姓名拼音（名）' },
                { field: 'student_last_name_pinyin', name: '姓名拼音（姓）' },
                { field: 'campus_id', name: '校区' },
                { field: 'id_back_path', name: '身份证反面' },
                { field: 'id_front_path', name: '身份证正面' },
            ];

            for (const { field, name } of requiredFields) {
                const value = formData[field as keyof UpdateSalesParams];
                // 字段级别判空规则（与 isFieldError 保持一致）
                if (field === 'gender') {
                    if (value === undefined || value === null || value === 2) {
                        return `请填写${name}`;
                    }
                    continue;
                }
                if (typeof value === 'number') {
                    if (value === 0 || value === -1) {
                        return `请填写${name}`;
                    }
                    continue;
                }
                if (typeof value === 'string') {
                    if (value.trim() === '') {
                        return `请填写${name}`;
                    }
                    continue;
                }
                if (!value) {
                    return `请填写${name}`;
                }
            }
        }

        return null;
    };

    // 保存表单
    const handleSave = async () => {
        if (!contractId || !canEdit) return;

        // 不再校验字段，直接保存
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const params: UpdateSalesParams = {
                contract_id: Number(contractId),
                ...formData,
            };

            const result = await updateSalesInfo(params);
            if (result.code === 200) {
                setSuccessMessage('保存成功');
                // 重新加载数据
                const refreshResult = await getSalesInfo(Number(contractId));
                if (refreshResult.code === 200 && refreshResult.data) {
                    setSalesInfo(refreshResult.data);
                }
                // 3秒后清除成功消息
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(result.message || '保存失败');
            }
        } catch (err) {
            console.error('保存失败:', err);
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 发送录取通知
    const handleSendAdmission = async () => {
        if (!contractId) return;

        // 校验模态框中的必填字段
        if (!admissionParams.school_year || !admissionParams.semester ||
            !admissionParams.english_score || !admissionParams.math_score ||
            !admissionCampusId || !admissionParams.year_num || !admissionParams.year_of_study) {
            setAdmissionError('请填写所有必填字段');
            return;
        }

        setSendingAdmission(true);
        setAdmissionError(null);
        try {
            const campusName = campusList.find((c) => c.id === admissionCampusId)?.name || '';
            if (!campusName) {
                setAdmissionError('请选择校区');
                setSendingAdmission(false);
                return;
            }
            const params: AdmissionMailParams = {
                contract_id: Number(contractId),
                school_year: admissionParams.school_year!,
                semester: admissionParams.semester!,
                english_score: admissionParams.english_score!,
                math_score: admissionParams.math_score!,
                campuses: campusName,
                year_num: admissionParams.year_num!,
                year_of_study: admissionParams.year_of_study || '',
            };

            const result = await sendEntranceAdmission(params);
            if (result.code === 200) {
                alert('录取通知发送成功');
                setShowAdmissionModal(false);
                setAdmissionError(null);
                setAdmissionParams({
                    school_year: '',
                    semester: '',
                    english_score: '',
                    math_score: '',
                    campuses: '',
                    year_num: '',
                    year_of_study: '',
                });
                setAdmissionCampusId(0);
                const refreshResult = await getSalesInfo(Number(contractId));
                if (refreshResult.code === 200 && refreshResult.data) {
                    setSalesInfo(refreshResult.data);
                }
            } else {
                setAdmissionError('发送失败: ' + result.message);
            }
        } catch (err) {
            console.error('发送录取通知失败:', err);
            setAdmissionError('发送失败');
        } finally {
            setSendingAdmission(false);
        }
    };

    // 发送拒信
    const handleSendReject = async () => {
        if (!contractId) return;

        // 校验必填字段
        if (!rejectParams.school_year || !rejectParams.english_score || !rejectParams.math_score) {
            setRejectError('请填写所有必填字段');
            return;
        }

        setSendingReject(true);
        setRejectError(null);
        try {
            const params: RejectMailParams = {
                contract_id: Number(contractId),
                school_year: rejectParams.school_year!,
                english_score: rejectParams.english_score!,
                math_score: rejectParams.math_score!,
            };

            const result = await sendEntranceReject(params);
            if (result.code === 200) {
                alert('拒信发送成功');
                setShowRejectModal(false);
                setRejectError(null);
                setRejectParams({
                    school_year: '',
                    english_score: '',
                    math_score: '',
                });
                const refreshResult = await getSalesInfo(Number(contractId));
                if (refreshResult.code === 200 && refreshResult.data) {
                    setSalesInfo(refreshResult.data);
                }
            } else {
                setRejectError('发送失败: ' + result.message);
            }
        } catch (err) {
            console.error('发送拒信失败:', err);
            setRejectError('发送失败');
        } finally {
            setSendingReject(false);
        }
    };

    // 添加到Students
    const handleAddToStudent = async () => {
        if (!contractId) return;

        setAddingToStudent(true);
        try {
            const result = await addSalesToStudent(Number(contractId));
            if (result.code === 200) {
                const account = result.data;
                setShowAddToStudentModal(false);
                if (account?.email && account?.password) {
                    setStudentAccount({ email: account.email, password: account.password });
                    setShowStudentAccountModal(true);
                } else {
                    alert('已成功添加到Students');
                }
                const refreshResult = await getSalesInfo(Number(contractId));
                if (refreshResult.code === 200 && refreshResult.data) {
                    setSalesInfo(refreshResult.data);
                }
            } else {
                alert('添加失败: ' + result.message);
            }
        } catch (err) {
            console.error('添加到Students失败:', err);
            alert('添加失败');
        } finally {
            setAddingToStudent(false);
        }
    };

    // 返回列表页
    const handleBack = () => {
        router.push('/admission-admin/sales');
    };

    // 打开合同预览模态框
    const handleRequestSigning = async () => {
        if (!contractId) return;

        // 校验必填字段
        const validationError = validateRequiredFields(true);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoadingContractPreview(true);
        setError(null);
        setContractError(null);
        try {
            const result = await generateContractPreview(Number(contractId));
            if (result.code === 200 && result.data) {
                // 确保 iframe URL 是完整的绝对路径，避免相对路径导致无限嵌套
                const data = result.data;
                
                // 处理 iframe1 和 iframe2 的 URL
                const normalizeIframeUrl = (url: string): string => {
                    if (!url) return '';
                    // 如果已经是完整 URL，直接返回
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                    }
                    // 如果是相对路径，转换为绝对路径
                    // 在客户端使用 window.location.origin，确保 iframe 加载正确的域名
                    if (url.startsWith('/')) {
                        const baseUrl = typeof window !== 'undefined' 
                            ? window.location.origin 
                            : getApiBaseUrl();
                        return `${baseUrl}${url}`;
                    }
                    // 其他情况直接返回
                    return url;
                };
                
                setContractPreviewData({
                    ...data,
                    iframe1: normalizeIframeUrl(data.iframe1),
                    iframe2: normalizeIframeUrl(data.iframe2),
                });
                setShowContractPreviewModal(true);
            } else {
                setError('生成合同预览失败: ' + result.message);
            }
        } catch (err) {
            console.error('生成合同预览失败:', err);
            setError('生成合同预览失败');
        } finally {
            setLoadingContractPreview(false);
        }
    };

    // 发送合同
    const handleSendContract = async () => {
        if (!contractId || !contractPreviewData) return;

        // 从link中解析fileIds和subCompany
        // link格式: /api/sales/finalize_signing_request/<contract_id>/<file_ids>/<version>?sub_company=<sub_company>
        const link = contractPreviewData.link;
        const match = link.match(/\/finalize_signing_request\/(\d+)\/([^\/]+)\/(\d+)(?:\?sub_company=(.+))?/);

        let fileIds = match?.[2] || '';
        const version = parseInt(match?.[3] || '0', 10);
        const subCompany = match?.[4] || undefined;

        // 如果配置了简化模式，则只取第一个 fileId（只发送服务协议）
        if (siteConfig?.sales_simplified_mode && fileIds.includes('--')) {
            fileIds = fileIds.split('--')[0];
        }

        setSendingContract(true);
        setContractError(null);
        try {
            const result = await finalizeSigningRequest({
                contractId: Number(contractId),
                fileIds,
                version,
                subCompany,
            });
            if (result.code === 200) {
                alert('合同发送成功');
                setShowContractPreviewModal(false);
                setContractPreviewData(null);
                setContractError(null);
                // 重新加载数据
                const refreshResult = await getSalesInfo(Number(contractId));
                if (refreshResult.code === 200 && refreshResult.data) {
                    const refreshData = refreshResult.data;
                    setSalesInfo(refreshData);
                    // 同步更新 formData 中的 signing_request_state 和 signing_request_state_2，确保按钮状态正确更新
                    // 发送合同后，这两个状态会从 0 变为非 0，按钮会自动隐藏
                    setFormData(prev => ({
                        ...prev,
                        signing_request_state: refreshData.info.signing_request_state,
                        signing_request_state_2: refreshData.info.signing_request_state_2
                    }));
                }
            } else {
                setContractError(result.message || '发送合同失败');
            }
        } catch (err) {
            console.error('发送合同失败:', err);
            setContractError('发送合同失败');
        } finally {
            setSendingContract(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !salesInfo) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center">
                            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
                            <p className="mt-1 text-sm text-gray-500">{error}</p>
                            <button
                                onClick={handleBack}
                                className="mt-4 inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                                返回列表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!salesInfo || !salesInfo.info) {
        return null;
    }

    const info = salesInfo.info;
    const yearList = salesInfo.year_list || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 页面标题和操作按钮 */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales信息编辑</h1>
                        {/* <div className="mt-2 flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSigningStateColor()}`}>
                                {getSigningStateText()}
                            </span>
                        </div> */}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            返回列表
                        </button>
                        {canEdit && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? '保存中...' : '保存'}
                            </button>
                        )}
                    </div>
                </div>

                {/* 成功/错误消息 */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        {error}
                    </div>
                )}
                {/* 待签署状态下的必填字段提示 */}
                {canRequestSigning() && getMissingFields().length > 0 && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                        <div className="flex items-start">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium mb-1">请填写以下必填字段后才能请求签署合同：</p>
                                <ul className="list-disc list-inside text-sm">
                                    {getMissingFields().map((field, index) => (
                                        <li key={index} className="text-red-700">{field}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 操作按钮区域 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* 请求签署合同按钮 - 只在校验通过且两个状态都为0时显示 */}
                        {canRequestSigning() && validateRequiredFields(true) === null && (
                            <button
                                onClick={handleRequestSigning}
                                disabled={loadingContractPreview}
                                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                {loadingContractPreview ? '生成中...' : '请求签署合同'}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setAdmissionError(null);
                                // 默认带入页面已选校区，减少重复选择
                                const currentCampusId = Number(formData.campus_id || info.campus_id || 0);
                                setAdmissionCampusId(currentCampusId);
                                const currentCampusName = campusList.find((c) => c.id === currentCampusId)?.name || '';
                                setAdmissionParams((prev) => ({
                                    ...prev,
                                    campuses: currentCampusName,
                                    // 默认带入学年下拉第一项，避免必填校验卡住
                                    school_year: prev.school_year || yearList[0] || '',
                                }));
                                setShowAdmissionModal(true);
                            }}
                            disabled={sendingAdmission}
                            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <EnvelopeIcon className="h-5 w-5 mr-2" />
                            {sendingAdmission ? '发送中...' : '发送录取通知'}
                        </button>
                        <button
                            onClick={() => {
                                setRejectError(null);
                                setRejectParams((prev) => ({
                                    ...prev,
                                    school_year: prev.school_year || yearList[0] || '',
                                }));
                                setShowRejectModal(true);
                            }}
                            disabled={sendingReject}
                            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <EnvelopeIcon className="h-5 w-5 mr-2" />
                            {sendingReject ? '发送中...' : '发送拒信'}
                        </button>
                        {salesInfo.can_add_students === 1 && (
                            <button
                                onClick={() => setShowAddToStudentModal(true)}
                                disabled={addingToStudent}
                                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <UserPlusIcon className="h-5 w-5 mr-2" />
                                {addingToStudent ? '添加中...' : '添加到Students'}
                            </button>
                        )}
                    </div>
                </div>

                {/* 邮件发送记录 */}
                {salesInfo.mail_result &&
                    ((salesInfo.mail_result[0] && salesInfo.mail_result[0].length > 0) ||
                        (salesInfo.mail_result[1] && salesInfo.mail_result[1].length > 0)) && (
                    <div className="bg-white rounded-lg shadow mb-6 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">邮件发送记录</h2>
                        <div className="space-y-4">
                            {/* 录取通知记录 */}
                            {salesInfo.mail_result[0] && salesInfo.mail_result[0].length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">录取通知</h3>
                                    <div className="space-y-2">
                                        {salesInfo.mail_result[0].map((record, index) => {
                                            const [status, sendTime] = record;
                                            const isSuccess = status === 1;
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                                        isSuccess
                                                            ? 'bg-green-50 border border-green-200'
                                                            : 'bg-red-50 border border-red-200'
                                                    }`}
                                                >
                                                    {isSuccess ? (
                                                        <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                    ) : (
                                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1">
                                                        <span
                                                            className={`text-sm font-medium ${
                                                                isSuccess ? 'text-green-800' : 'text-red-800'
                                                            }`}
                                                        >
                                                            {isSuccess ? '发送成功' : '发送失败'} {sendTime}
                                                        </span>
                                                        <span className="text-sm text-gray-600 ml-2">
                                                            {formatTimestamp(sendTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 拒信通知记录 */}
                            {salesInfo.mail_result[1] && salesInfo.mail_result[1].length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">拒信通知</h3>
                                    <div className="space-y-2">
                                        {salesInfo.mail_result[1].map((record, index) => {
                                            const [status, sendTime] = record;
                                            const isSuccess = status === 1;
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                                        isSuccess
                                                            ? 'bg-green-50 border border-green-200'
                                                            : 'bg-red-50 border border-red-200'
                                                    }`}
                                                >
                                                    {isSuccess ? (
                                                        <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                    ) : (
                                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1">
                                                        <span
                                                            className={`text-sm font-medium ${
                                                                isSuccess ? 'text-green-800' : 'text-red-800'
                                                            }`}
                                                        >
                                                            {isSuccess ? '发送成功' : '发送失败'} {sendTime}
                                                        </span>
                                                        <span className="text-sm text-gray-600 ml-2">
                                                            {formatTimestamp(sendTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {salesInfo.student_repeat_info && (<div className="bg-white rounded-lg shadow mb-6 p-6">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                        <p className="text-sm font-medium">注意</p>
                        <p className="text-sm mt-1">{salesInfo.student_repeat_info}</p>
                    </div>
                </div>)}

                {/* 基本信息表单 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                学生姓名
                                {isFieldRequired('student_name') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.student_name || ''}
                                onChange={(e) => handleInputChange('student_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                姓名拼音（姓）
                                {isFieldRequired('student_last_name_pinyin') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.student_last_name_pinyin || ''}
                                onChange={(e) => handleInputChange('student_last_name_pinyin', e.target.value)}
                                className={getInputClassName('student_last_name_pinyin')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                姓名拼音（名）
                                {isFieldRequired('student_first_name_pinyin') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.student_first_name_pinyin || ''}
                                onChange={(e) => handleInputChange('student_first_name_pinyin', e.target.value)}
                                className={getInputClassName('student_first_name_pinyin')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                学生身份证号
                                {isFieldRequired('student_sfz') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.student_sfz || ''}
                                onChange={(e) => handleInputChange('student_sfz', e.target.value)}
                                className={getInputClassName('student_sfz')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">登录密码</label>
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                                {formData.password}
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                身份证正面
                                {isFieldRequired('id_front_path') && <RequiredMark />}
                            </label>
                            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isFieldError('id_front_path') ? 'border-red-500' : 'border-gray-300'}`}>
                                <div className="space-y-1 text-center">
                                    {idCardFrontPreview ? (
                                        <div className="relative w-full flex justify-center items-center max-h-80 overflow-hidden">
                                            <img
                                                src={idCardFrontPreview}
                                                alt="身份证正面预览"
                                                className="max-w-full max-h-80 object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="idCardFront" className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${!canEdit || uploadingImage === 'idCardFront' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <span>{uploadingImage === 'idCardFront' ? '上传中...' : '上传文件'}</span>
                                            <input
                                                id="idCardFront"
                                                name="idCardFront"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                disabled={!canEdit || uploadingImage === 'idCardFront'}
                                                onChange={(e) => handleFileChange(e, 'idCardFront')}
                                            />
                                        </label>
                                        <p className="pl-1">或拖拽到此处</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                身份证反面
                                {isFieldRequired('id_back_path') && <RequiredMark />}
                            </label>
                            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isFieldError('id_back_path') ? 'border-red-500' : 'border-gray-300'}`}>
                                <div className="space-y-1 text-center">
                                    {idCardBackPreview ? (
                                        <div className="relative w-full flex justify-center items-center max-h-80 overflow-hidden">
                                            <img
                                                src={idCardBackPreview}
                                                alt="身份证反面预览"
                                                className="max-w-full max-h-80 object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="idCardBack" className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${!canEdit || uploadingImage === 'idCardBack' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <span>{uploadingImage === 'idCardBack' ? '上传中...' : '上传文件'}</span>
                                            <input
                                                id="idCardBack"
                                                name="idCardBack"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                disabled={!canEdit || uploadingImage === 'idCardBack'}
                                                onChange={(e) => handleFileChange(e, 'idCardBack')}
                                            />
                                        </label>
                                        <p className="pl-1">或拖拽到此处</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">近照</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    {recentPhotoPreview ? (
                                        <div className="relative w-full flex justify-center items-center max-h-80 overflow-hidden">
                                            <img
                                                src={recentPhotoPreview}
                                                alt="近照预览"
                                                className="max-w-full max-h-80 object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="recentPhoto" className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${!canEdit || uploadingImage === 'recentPhoto' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <span>{uploadingImage === 'recentPhoto' ? '上传中...' : '上传文件'}</span>
                                            <input
                                                id="recentPhoto"
                                                name="recentPhoto"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                disabled={!canEdit || uploadingImage === 'recentPhoto'}
                                                onChange={(e) => handleFileChange(e, 'recentPhoto')}
                                            />
                                        </label>
                                        <p className="pl-1">或拖拽到此处</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
                                </div>
                            </div>
                        </div>
                        {/* 标化成绩单 */}
                        {salesInfo.sales_standard_score_data && salesInfo.sales_standard_score_data.length > 0 && (
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">标化成绩单</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {salesInfo.sales_standard_score_data.map((item, index) => (
                                        <div key={index} className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                                <p className="text-sm font-medium text-gray-700">
                                                    考试日期: {item.exam_day || '-'}
                                                </p>
                                            </div>
                                            <div className="relative w-full bg-gray-100 flex items-center justify-center" style={{ minHeight: '200px', maxHeight: '400px' }}>
                                                <img
                                                    src={item.link_url}
                                                    alt={`标化成绩单 ${index + 1}`}
                                                    className="w-full h-auto max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(item.link_url, '_blank')}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            const errorDiv = document.createElement('div');
                                                            errorDiv.className = 'text-gray-400 text-sm p-4 text-center';
                                                            errorDiv.textContent = '图片加载失败';
                                                            parent.innerHTML = '';
                                                            parent.appendChild(errorDiv);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                性别
                                {isFieldRequired('gender') && <RequiredMark />}
                            </label>
                            <select
                                value={formData.gender ?? 2}
                                onChange={(e) => handleInputChange('gender', Number(e.target.value))}
                                className={getInputClassName('gender')}
                                disabled={!canEdit}
                            >
                                <option value={2}>未设置</option>
                                <option value={0}>男</option>
                                <option value={1}>女</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">生日</label>
                            <PasteableDateInput
                                value={formData.birthday}
                                onChangeTimestamp={(ts) => handleInputChange('birthday', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                邮箱
                                {isFieldRequired('email') && <RequiredMark />}
                            </label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={getInputClassName('email')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                电话
                                {isFieldRequired('phone') && <RequiredMark />}
                            </label>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={getInputClassName('phone')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">微信</label>
                            <input
                                type="text"
                                value={formData.wechat || ''}
                                onChange={(e) => handleInputChange('wechat', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 省份 + 城市一行 */}
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">省份</label>
                                <input
                                    type="text"
                                    value={formData.province || ''}
                                    onChange={(e) => handleInputChange('province', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={!canEdit}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                                <input
                                    type="text"
                                    value={formData.city || ''}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        {/* 地址 textarea 独占一行 */}
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                地址
                                {isFieldRequired('address') && <RequiredMark />}
                            </label>
                            <textarea
                                value={formData.address || ''}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className={getInputClassName('address')}
                                disabled={!canEdit}
                                rows={3}
                                placeholder="请输入详细地址"
                            />
                        </div>
                    </div>
                </div>

                {/* 学校信息表单 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">学校信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">当前学校</label>
                            <input
                                type="text"
                                value={formData.current_school || ''}
                                onChange={(e) => handleInputChange('current_school', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                年级
                                {isFieldRequired('grade') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.grade || ''}
                                onChange={(e) => handleInputChange('grade', e.target.value)}
                                className={getInputClassName('grade')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">当前就读课程</label>
                            <input
                                type="text"
                                value={formData.current_lesson || ''}
                                onChange={(e) => handleInputChange('current_lesson', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">年制</label>
                            <input
                                type="text"
                                value={formData.study_year || ''}
                                onChange={(e) => handleInputChange('study_year', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">数学类型</label>
                            <input
                                type="text"
                                value={formData.math_type || ''}
                                onChange={(e) => handleInputChange('math_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {/* 监护人信息表单 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">监护人信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                监护人姓名
                                {isFieldRequired('guardian_name') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.guardian_name || ''}
                                onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                                className={getInputClassName('guardian_name')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                监护人身份证号
                                {isFieldRequired('guardian_sfz') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.guardian_sfz || ''}
                                onChange={(e) => handleInputChange('guardian_sfz', e.target.value)}
                                className={getInputClassName('guardian_sfz')}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                关系
                                {isFieldRequired('relationship') && <RequiredMark />}
                            </label>
                            <input
                                type="text"
                                value={formData.relationship || ''}
                                onChange={(e) => handleInputChange('relationship', e.target.value)}
                                className={getInputClassName('relationship')}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {/* 销售信息表单 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">销售信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                            <select
                                value={formData.sales_status || 0}
                                onChange={(e) => handleInputChange('sales_status', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            >
                                {salesInfo.sales_status && Object.entries(salesInfo.sales_status).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">分配员工</label>
                            <select
                                value={formData.assigned_staff || 0}
                                onChange={(e) => handleInputChange('assigned_staff', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            >
                                <option value={0}>未分配</option>
                                {salesInfo.staff_info && Object.entries(salesInfo.staff_info).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">费用（元/期）</label>
                            <input
                                type="number"
                                value={formData.fee || 0}
                                onChange={(e) => handleInputChange('fee', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                年费
                                <RequiredMark />
                            </label>
                            <input
                                type="number"
                                value={formData.year_fee || 0}
                                onChange={(e) => handleInputChange('year_fee', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">注册时间</label>
                            <PasteableDateInput
                                value={formData.registration_time}
                                onChangeTimestamp={(ts) => handleInputChange('registration_time', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                入学日期
                                <RequiredMark />
                            </label>
                            <PasteableDateInput
                                value={formData.enrolment_date}
                                onChangeTimestamp={(ts) => handleInputChange('enrolment_date', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                缴费日期
                                <RequiredMark />
                            </label>
                            <PasteableDateInput
                                value={formData.sales_pay_date}
                                onChangeTimestamp={(ts) => handleInputChange('sales_pay_date', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                毕业日期
                                <RequiredMark />
                            </label>
                            <PasteableDateInput
                                value={formData.graduation_date}
                                onChangeTimestamp={(ts) => handleInputChange('graduation_date', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                校区
                                {isFieldRequired('campus_id') && <RequiredMark />}
                            </label>
                            <select
                                value={formData.campus_id || 0}
                                onChange={(e) => handleInputChange('campus_id', Number(e.target.value))}
                                className={getInputClassName('campus_id')}
                                disabled={!canEdit}
                            >
                                <option value={0}>请选择校区</option>
                                {campusList.map((campus) => (
                                    <option key={campus.id} value={campus.id}>
                                        {campus.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">课程</label>
                            <select
                                value={formData.course || 0}
                                onChange={(e) => handleInputChange('course', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            >
                                {salesInfo.apply_course && Object.entries(salesInfo.apply_course).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">申请课程</label>
                            <select
                                value={formData.apply_course || 0}
                                onChange={(e) => handleInputChange('apply_course', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            >
                                {salesInfo.apply_course && Object.entries(salesInfo.apply_course).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">渠道</label>
                            <select
                                value={formData.channel || 0}
                                onChange={(e) => handleInputChange('channel', Number(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            >
                                <option value={0}>请选择渠道</option>
                                {salesInfo.channel_list && salesInfo.channel_list.map((item) => (
                                    <option key={item.key} value={item.key}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">来源描述</label>
                            <input
                                type="text"
                                value={formData.source || ''}
                                onChange={(e) => handleInputChange('source', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {/* 跟进信息表单 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">跟进信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">跟进</label>
                            <textarea
                                value={formData.follow_up_1 || ''}
                                onChange={(e) => handleInputChange('follow_up_1', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">跟进2</label>
                            <textarea
                                value={formData.follow_up_2 || ''}
                                onChange={(e) => handleInputChange('follow_up_2', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">跟进3</label>
                            <textarea
                                value={formData.follow_up_3 || ''}
                                onChange={(e) => handleInputChange('follow_up_3', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {/* 还款提醒时间 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">还款提醒时间</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">还款时间1 (01-01-2020表示禁用)</label>
                            <PasteableDateInput
                                value={formData.year_fee_reminder_time_1}
                                onChangeTimestamp={(ts) => handleInputChange('year_fee_reminder_time_1', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">还款时间2 (01-01-2020表示禁用)</label>
                            <PasteableDateInput
                                value={formData.year_fee_reminder_time_2}
                                onChangeTimestamp={(ts) => handleInputChange('year_fee_reminder_time_2', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">还款时间3 (01-01-2020表示禁用)</label>
                            <PasteableDateInput
                                value={formData.year_fee_reminder_time_3}
                                onChangeTimestamp={(ts) => handleInputChange('year_fee_reminder_time_3', ts)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {/* 其他信息表单 */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">其他信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">兴趣爱好</label>
                            <textarea
                                value={formData.hobbies || ''}
                                onChange={(e) => handleInputChange('hobbies', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">获奖情况</label>
                            <textarea
                                value={formData.awards || ''}
                                onChange={(e) => handleInputChange('awards', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">评价</label>
                            <textarea
                                value={formData.evaluation || ''}
                                onChange={(e) => handleInputChange('evaluation', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                {/* 底部保存按钮 */}
                {canEdit && (
                    <div className="bg-white rounded-lg shadow p-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                )}

                {/* 发送录取通知确认模态框 */}
                {showAdmissionModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                                            <EnvelopeIcon className="h-6 w-6 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">发送录取通知</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAdmissionModal(false);
                                            setAdmissionError(null);
                                            setAdmissionParams({
                                                school_year: '',
                                                semester: '',
                                                english_score: '',
                                                math_score: '',
                                                campuses: '',
                                                year_num: '',
                                                year_of_study: '',
                                            });
                                            setAdmissionCampusId(0);
                                        }}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">
                                        学生: <strong>{formData.student_name || info.student_name}</strong>
                                    </p>
                                    {(formData.email || info.email) && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            收件邮箱: {formData.email || info.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 错误提示 */}
                            {admissionError && (
                                <div className="px-6">
                                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                        {admissionError}
                                    </div>
                                </div>
                            )}

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            学年 <span className="text-red-500">*</span>
                                        </label>
                                        {yearList.length > 0 ? (
                                            <select
                                                value={admissionParams.school_year || ''}
                                                onChange={(e) => setAdmissionParams({ ...admissionParams, school_year: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                disabled={sendingAdmission}
                                            >
                                                <option value="">请选择学年</option>
                                                {yearList.map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={admissionParams.school_year || ''}
                                                onChange={(e) => setAdmissionParams({ ...admissionParams, school_year: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="例如：2024-2025"
                                                disabled={sendingAdmission}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            学期 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={admissionParams.semester || ''}
                                            onChange={(e) => setAdmissionParams({ ...admissionParams, semester: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            disabled={sendingAdmission}
                                        >
                                            <option value="">请选择学期</option>
                                            <option value="春季">春季</option>
                                            <option value="秋季">秋季</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            英语成绩 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={admissionParams.english_score || ''}
                                            onChange={(e) => setAdmissionParams({ ...admissionParams, english_score: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="请输入英语成绩"
                                            disabled={sendingAdmission}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            数学成绩 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={admissionParams.math_score || ''}
                                            onChange={(e) => setAdmissionParams({ ...admissionParams, math_score: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="请输入数学成绩"
                                            disabled={sendingAdmission}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            校区 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={admissionCampusId || 0}
                                            onChange={(e) => {
                                                const id = Number(e.target.value) || 0;
                                                setAdmissionCampusId(id);
                                                // 同步页面表单的 campus_id，避免后续校验仍提示“未填校区”
                                                if (id) handleInputChange('campus_id', id);
                                                const name = campusList.find((c) => c.id === id)?.name || '';
                                                setAdmissionParams({ ...admissionParams, campuses: name });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            disabled={sendingAdmission}
                                        >
                                            <option value={0}>请选择校区</option>
                                            {campusList.map((campus) => (
                                                <option key={campus.id} value={campus.id}>
                                                    {campus.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Enrollment Year <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={admissionParams.year_num || ''}
                                            onChange={(e) => setAdmissionParams({ ...admissionParams, year_num: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            disabled={sendingAdmission}
                                        >
                                            <option value="">请选择年份</option>
                                            {(() => {
                                                const currentYear = new Date().getFullYear();
                                                return [
                                                    { value: String(currentYear), label: `今年 (${currentYear})` },
                                                    { value: String(currentYear + 1), label: `明年 (${currentYear + 1})` },
                                                    { value: String(currentYear + 2), label: `后年 (${currentYear + 2})` },
                                                ];
                                            })().map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Year of Study <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={admissionParams.year_of_study || ''}
                                            onChange={(e) => setAdmissionParams({ ...admissionParams, year_of_study: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="请输入Year of Study"
                                            disabled={sendingAdmission}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t">
                                <button
                                    onClick={() => {
                                        setShowAdmissionModal(false);
                                        setAdmissionError(null);
                                        setAdmissionParams({
                                            school_year: '',
                                            semester: '',
                                            english_score: '',
                                            math_score: '',
                                            campuses: '',
                                            year_num: '',
                                            year_of_study: '',
                                        });
                                        setAdmissionCampusId(0);
                                    }}
                                    disabled={sendingAdmission}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSendAdmission}
                                    disabled={sendingAdmission}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {sendingAdmission ? '发送中...' : '确认发送'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 发送拒信确认模态框 */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">发送拒信</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectError(null);
                                            setRejectParams({
                                                school_year: '',
                                                english_score: '',
                                                math_score: '',
                                            });
                                        }}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">
                                        学生: <strong>{formData.student_name || info.student_name}</strong>
                                    </p>
                                    {(formData.email || info.email) && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            收件邮箱: {formData.email || info.email}
                                        </p>
                                    )}
                                    <p className="text-sm text-red-600 mt-2">
                                        注意：此操作不可撤销
                                    </p>
                                </div>
                            </div>

                            {/* 错误提示 */}
                            {rejectError && (
                                <div className="px-6">
                                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                        {rejectError}
                                    </div>
                                </div>
                            )}

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            学年 <span className="text-red-500">*</span>
                                        </label>
                                        {yearList.length > 0 ? (
                                            <select
                                                value={rejectParams.school_year || ''}
                                                onChange={(e) => setRejectParams({ ...rejectParams, school_year: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                disabled={sendingReject}
                                            >
                                                <option value="">请选择学年</option>
                                                {yearList.map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={rejectParams.school_year || ''}
                                                onChange={(e) => setRejectParams({ ...rejectParams, school_year: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="例如：2024-2025"
                                                disabled={sendingReject}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            英语成绩 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={rejectParams.english_score || ''}
                                            onChange={(e) => setRejectParams({ ...rejectParams, english_score: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="请输入英语成绩"
                                            disabled={sendingReject}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            数学成绩 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={rejectParams.math_score || ''}
                                            onChange={(e) => setRejectParams({ ...rejectParams, math_score: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="请输入数学成绩"
                                            disabled={sendingReject}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectError(null);
                                        setRejectParams({
                                            school_year: '',
                                            english_score: '',
                                            math_score: '',
                                        });
                                    }}
                                    disabled={sendingReject}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSendReject}
                                    disabled={sendingReject}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {sendingReject ? '发送中...' : '确认发送'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 添加到Students确认模态框 */}
                {showAddToStudentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6 sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <UserPlusIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg font-medium text-gray-900">添加到Students</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            确定要将学生 <strong>{formData.student_name || info.student_name}</strong> 添加到Students系统吗？此操作不可撤销。
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t">
                                <button
                                    onClick={() => setShowAddToStudentModal(false)}
                                    disabled={addingToStudent}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleAddToStudent}
                                    disabled={addingToStudent}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {addingToStudent ? '添加中...' : '确认添加'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students账号信息弹窗 */}
                {showStudentAccountModal && studentAccount && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6 sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg font-medium text-gray-900">已成功添加到Students</h3>
                                    <div className="mt-2 text-sm text-gray-600 space-y-2">
                                        <p>请记录以下账号信息：</p>
                                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-left">
                                            <div className="text-sm text-gray-700">
                                                账号邮箱：<span className="font-mono text-gray-900">{studentAccount.email}</span>
                                            </div>
                                            <div className="text-sm text-gray-700 mt-1">
                                                密码：<span className="font-mono text-gray-900">{studentAccount.password}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 p-6 border-t">
                                <button
                                    onClick={() => {
                                        setShowStudentAccountModal(false);
                                        setStudentAccount(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    确定
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 合同预览模态框 */}
                {showContractPreviewModal && contractPreviewData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">合同预览</h3>
                                    <button
                                        onClick={() => {
                                            setShowContractPreviewModal(false);
                                            setContractPreviewData(null);
                                            setContractError(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            {/* 错误提示 */}
                            {contractError && (
                                <div className="px-6 pt-4">
                                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                                        <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                        <span>{contractError}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* 服务协议预览 */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">服务协议</h4>
                                        <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                                            <iframe
                                                src={contractPreviewData.iframe1}
                                                className="w-full h-full"
                                                title="服务协议预览"
                                            />
                                        </div>
                                    </div>

                                    {/* 咨询协议预览 - 根据配置决定是否显示 */}
                                    {!siteConfig?.sales_simplified_mode && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">咨询协议</h4>
                                            <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                                                <iframe
                                                    src={contractPreviewData.iframe2}
                                                    className="w-full h-full"
                                                    title="咨询协议预览"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t">
                                <button
                                    onClick={() => {
                                        setShowContractPreviewModal(false);
                                        setContractPreviewData(null);
                                        setContractError(null);
                                    }}
                                    disabled={sendingContract}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSendContract}
                                    disabled={sendingContract}
                                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {sendingContract ? '发送中...' : '发送合同'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
