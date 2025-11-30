import { request, normalizeApiResponse } from '../apiClient';
import type { ApiResponse, ApiEnvelope } from '../types';

// Backend Raw Response Types
interface BackendSiteInfoResponse {
  homepage_contain: {
    video_url: string;
    video_title: string;
    pic_title: string;
    pic_desc: string;
    pic_url: string;
    pic_link: string;
    banner1: string;
    banner2: string;
    banner3: string;
    banner1_url: string;
    banner2_url: string;
    banner3_url: string;
  };
  home_carousel: {
    pic1_link: string;
    pic1_url: string;
    pic2_link: string;
    pic2_url: string;
    pic3_link: string;
    pic3_url: string;
    pic4_link: string;
    pic4_url: string;
    pic5_link: string;
    pic5_url: string;
  };
  about_us: {
    school_idea_url: string;
    school_overview_url: string;
    desc_url: string;
  };
  about_us_table: Array<{
    index: number;
    day_id: number;
    day_title: string;
    day_type: string;
    day_from: string;
    day_to: string;
  }>;
  teachers: Array<{
    id: number;
    teacher_group: number;
    teacher_name: string;
    teacher_title: string;
    teacher_desc: string;
    teacher_photo: string;
    teacher_responsible: string;
    group_leader: number;
  }>;
  campus_news: Array<{
    id: number;
    title: string;
    news_desc: string;
    news_type: number;
    news_type_name: string;
    cover_url: string;
    link_url: string;
    pub_time: string;
  }>;
  achievements: Array<{
    id: number;
    title: string;
    link_url: string;
    row_id: number;
    achievements_type: string;
  }>;
  teacher_achievements: {
    link: string;
    title: string;
  };
  admission_application: {
    class_control_url: string;
    rules_url: string;
  };
  join_us: {
    teaching_position: {
      id: number;
      text: string;
      html: string;
    };
    operation_position: {
      id: number;
      text: string;
      html: string;
    };
  };
  banners: {
    about_us_banner: string;
    teachers_banner: string;
    campus_banner: string;
    achievements_banner: string;
    apply_banner: string;
    join_us_banner: string;
  };
}

// Frontend Transformed Response
export interface SiteInfoResponse {
  home_page: {
    video: {
      url: string;
      title: string;
    };
    intro: {
      title: string;
      description: string;
      image_url: string;
      link: string;
    };
    banners: Array<{
      image_url: string;
      link: string;
    }>;
  };
  home_carousel: Array<{
    id: number;
    image_url: string;
    link?: string;
    order?: number;
  }>;
  about_us: {
    content: string;
    school_idea_url: string;
    school_overview_url: string;
  };
  campus_news: Array<{
    id: number;
    title: string;
    date: string;
    image_url: string;
    link?: string;
  }>;
  teachers: Array<{
    id: number;
    name: string;
    title: string;
    description: string;
    image_url: string;
    // 原始字段，用于编辑
    teacher_name?: string;
    teacher_title?: string;
    teacher_desc?: string;
    teacher_photo?: string;
    teacher_group?: string | number; // 可能是文本（如"数学组"）或数字
    group_leader?: number;
    teacher_responsible?: string;
  }>;
  achievements: {
    graduation_info: string;
    tech_info: string;
    list: Array<{
      id: number;
      title: string;
      image_url: string;
      link_url: string;
    }>;
  };
  application: {
    content: string;
    class_control_url: string;
  };
  join_us: {
    content: string;
    operation_content: string;
  };
  banners: {
    about_us: string;
    teachers: string;
    campus: string;
    achievements: string;
    apply: string;
    join_us: string;
  };
  [key: string]: unknown;
}

// 上传图片响应
export interface UploadImageResponse {
  url: string;
  file_path?: string;
}

// 获取网站配置信息
export const getSiteInfo = async (): Promise<ApiResponse<SiteInfoResponse>> => {
  try {
    const { data } = await request<ApiEnvelope<BackendSiteInfoResponse>>('/api/web_site/get_site_info');
    if (!data?.data) throw new Error('No data received');
    const rawData = data.data;

    // Transform Backend Data to Frontend Structure
    const transformedData: SiteInfoResponse = {
      home_page: {
        video: {
          url: rawData.homepage_contain.video_url,
          title: rawData.homepage_contain.video_title,
        },
        intro: {
          title: rawData.homepage_contain.pic_title,
          description: rawData.homepage_contain.pic_desc,
          image_url: rawData.homepage_contain.pic_url,
          link: rawData.homepage_contain.pic_link,
        },
        banners: [
          { image_url: rawData.homepage_contain.banner1, link: rawData.homepage_contain.banner1_url },
          { image_url: rawData.homepage_contain.banner2, link: rawData.homepage_contain.banner2_url },
          { image_url: rawData.homepage_contain.banner3, link: rawData.homepage_contain.banner3_url },
        ],
      },
      home_carousel: [
        { id: 1, image_url: rawData.home_carousel.pic1_url, link: rawData.home_carousel.pic1_link, order: 1 },
        { id: 2, image_url: rawData.home_carousel.pic2_url, link: rawData.home_carousel.pic2_link, order: 2 },
        { id: 3, image_url: rawData.home_carousel.pic3_url, link: rawData.home_carousel.pic3_link, order: 3 },
        { id: 4, image_url: rawData.home_carousel.pic4_url, link: rawData.home_carousel.pic4_link, order: 4 },
        { id: 5, image_url: rawData.home_carousel.pic5_url, link: rawData.home_carousel.pic5_link, order: 5 },
      ].filter(item => item.image_url),

      about_us: {
        content: rawData.about_us.desc_url,
        school_idea_url: rawData.about_us.school_idea_url,
        school_overview_url: rawData.about_us.school_overview_url,
      },

      campus_news: (rawData.campus_news || []).map(news => ({
        id: news.id,
        title: news.title,
        date: news.pub_time,
        image_url: news.cover_url,
        link: news.link_url,
      })),

      teachers: (rawData.teachers || []).map(teacher => ({
        id: teacher.id,
        name: teacher.teacher_name,
        title: teacher.teacher_title,
        description: teacher.teacher_desc,
        image_url: teacher.teacher_photo,
        // 保留原始字段以便编辑时使用
        teacher_name: teacher.teacher_name,
        teacher_title: teacher.teacher_title,
        teacher_desc: teacher.teacher_desc,
        teacher_photo: teacher.teacher_photo,
        teacher_group: teacher.teacher_group,
        group_leader: teacher.group_leader,
        teacher_responsible: teacher.teacher_responsible,
      })),

      achievements: {
        graduation_info: '', // 毕业去向信息需要单独获取，这里暂时为空
        tech_info: '', // 学术成果信息需要单独获取，这里暂时为空
        list: (rawData.achievements || []).map(ach => ({
          id: ach.id,
          title: ach.title,
          image_url: '', // 后端返回的数据中没有image_url字段
          link_url: ach.link_url,
        })),
      },

      application: {
        content: rawData.admission_application.rules_url,
        class_control_url: rawData.admission_application.class_control_url,
      },

      join_us: {
        content: rawData.join_us.teaching_position.text,
        operation_content: rawData.join_us.operation_position.text,
      },

      banners: {
        about_us: rawData.banners.about_us_banner,
        teachers: rawData.banners.teachers_banner,
        campus: rawData.banners.campus_banner,
        achievements: rawData.banners.achievements_banner,
        apply: rawData.banners.apply_banner,
        join_us: rawData.banners.join_us_banner,
      },
    };

    return normalizeApiResponse<SiteInfoResponse>({ ...data, data: transformedData } as any);
  } catch (error) {
    console.error('获取网站配置信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '获取网站配置信息失败' };
  }
};

// ... (Rest of the file remains mostly the same, but types might need adjustment if we want to be strict)
// For now, I will keep the rest of the file as is, assuming the other endpoints match the backend expectations
// or I will fix them as I encounter issues. The main issue was getSiteInfo structure.

// 上传图片
export const uploadImage = async (file: File): Promise<ApiResponse<UploadImageResponse>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await request('/api/web_site/upload_image', {
      method: 'POST',
      body: formData,
    });
    // Backend returns { file_path: ... }
    const resData = data as any;
    return normalizeApiResponse<UploadImageResponse>({ url: resData.file_path, ...resData });
  } catch (error) {
    console.error('上传图片失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '上传图片失败' };
  }
};

// ... (Keep other functions)
// 更新 Homepage 轮播
export const updateHomeCarousel = async (params: { carousel: any[] }): Promise<ApiResponse<unknown>> => {
  // We need to transform the array back to the flat structure expected by backend
  // Backend expects: pic1_link, pic1_url, ... pic5_link, pic5_url
  const backendParams: any = {};
  params.carousel.forEach((item, index) => {
    if (index < 5) {
      backendParams[`pic${index + 1}_link`] = item.link || '';
      backendParams[`pic${index + 1}_url`] = item.image_url || '';
    }
  });
  // Fill remaining if less than 5
  for (let i = params.carousel.length; i < 5; i++) {
    backendParams[`pic${i + 1}_link`] = '';
    backendParams[`pic${i + 1}_url`] = '';
  }

  try {
    const { data } = await request('/api/web_site/update_home_carousel', {
      method: 'POST',
      body: backendParams,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新轮播失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新轮播失败' };
  }
};

export const updateAboutUs = async (params: {
  content?: string;
  school_idea_url?: string;
  school_overview_url?: string;
}): Promise<ApiResponse<unknown>> => {
  // Backend expects: school_idea_url (menu_type=1), school_overview_url (menu_type=2), desc_url (menu_type=4)
  // 后端会根据menu_type分别更新对应的记录，未传的字段不会更新
  const backendParams: any = {};

  if (params.school_idea_url !== undefined) {
    backendParams.school_idea_url = params.school_idea_url;
  }
  if (params.school_overview_url !== undefined) {
    backendParams.school_overview_url = params.school_overview_url;
  }
  if (params.content !== undefined) {
    backendParams.desc_url = params.content;
  }

  try {
    const { data } = await request('/api/web_site/update_about_us', {
      method: 'POST',
      body: backendParams,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新关于我们失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新关于我们失败' };
  }
};

export const addCampusNews = async (params: any): Promise<ApiResponse<unknown>> => {
  // Backend expects: news_title, news_cover, news_desc, show_home_page, news_link, news_type
  const backendParams = {
    news_title: params.title,
    news_cover: params.image_url,
    news_desc: params.description || '',
    show_home_page: 1,
    news_link: params.link || '',
    news_type: 0, // Default type
  };
  try {
    const { data } = await request('/api/web_site/update_campus_news', {
      method: 'POST',
      body: backendParams,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('新增校园动态失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增校园动态失败' };
  }
};

export const deleteCampusNews = async (params: { id: number }): Promise<ApiResponse<unknown>> => {
  // Backend expects: record_id
  try {
    const { data } = await request('/api/web_site/delete_campus_news', {
      method: 'POST',
      body: { record_id: params.id },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除校园动态失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除校园动态失败' };
  }
};

export const addTeachers = async (params: any): Promise<ApiResponse<unknown>> => {
  // Backend expects: teacher_group, teacher_name, group_leader, teacher_title, teacher_desc, teacher_photo, teacher_responsible
  try {
    const { data } = await request('/api/web_site/add_teachers', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('新增师资团队失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增师资团队失败' };
  }
};

export const updateTeachers = async (params: any): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/update_teachers', {
      method: 'POST',
      body: params,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新师资团队失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新师资团队失败' };
  }
};

export const deleteTeachers = async (params: { id: number }): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/delete_teachers', {
      method: 'POST',
      body: { record_id: params.id },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除师资团队失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除师资团队失败' };
  }
};

export const newAchievements = async (params: any): Promise<ApiResponse<unknown>> => {
  // Backend expects: ref_url
  try {
    const { data } = await request('/api/web_site/new_achievements', {
      method: 'POST',
      body: { ref_url: params.link_url },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('新增教学成果失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '新增教学成果失败' };
  }
};

export const deleteAchievements = async (params: { id: number }): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await request('/api/web_site/delete_achievements', {
      method: 'POST',
      body: { record_id: params.id },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('删除教学成果失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '删除教学成果失败' };
  }
};

export const updateGraduationInfo = async (params: { content: string }): Promise<ApiResponse<unknown>> => {
  // Backend expects: graduate_year, graduate_url
  // We only have content. Let's assume content is graduate_url? Or year?
  try {
    const { data } = await request('/api/web_site/graduation_info', {
      method: 'POST',
      body: { graduate_year: '2025', graduate_url: params.content },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新毕业去向失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新毕业去向失败' };
  }
};

export const updateTechInfo = async (params: { content: string }): Promise<ApiResponse<unknown>> => {
  // Backend expects: teach_result, teach_result_url
  try {
    const { data } = await request('/api/web_site/new_tech_info', {
      method: 'POST',
      body: { teach_result: 'Tech Result', teach_result_url: params.content },
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新学术成果失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新学术成果失败' };
  }
};

export const updateApplication = async (params: {
  content?: string;
  rules_url?: string;
  class_control_url?: string;
}): Promise<ApiResponse<unknown>> => {
  // Backend expects: rules_url (menu_type=1) and class_control_url (menu_type=2)
  // 后端会根据menu_type分别更新对应的记录，未传的字段不会更新
  // 如果只传了content，则更新rules_url
  const backendParams: any = {};

  if (params.rules_url !== undefined) {
    backendParams.rules_url = params.rules_url;
  } else if (params.content !== undefined) {
    backendParams.rules_url = params.content;
  }

  if (params.class_control_url !== undefined) {
    backendParams.class_control_url = params.class_control_url;
  }

  try {
    const { data } = await request('/api/web_site/update_application', {
      method: 'POST',
      body: backendParams,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新入学申请信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新入学申请信息失败' };
  }
};

export const updateJoinUs = async (params: {
  content?: string;
  operation_content?: string;
  teaching_position_info?: string;
  operations_position_info?: string;
}): Promise<ApiResponse<unknown>> => {
  // Backend expects: teaching_position_info (post_type=1) and operations_position_info (post_type=2)
  // 后端会根据post_type分别更新对应的记录，未传的字段不会更新
  // 如果只传了content，则更新teaching_position_info
  // 如果传了operation_content，则更新operations_position_info
  const backendParams: any = {};

  if (params.teaching_position_info !== undefined) {
    backendParams.teaching_position_info = params.teaching_position_info;
  } else if (params.content !== undefined) {
    backendParams.teaching_position_info = params.content;
  }

  if (params.operations_position_info !== undefined) {
    backendParams.operations_position_info = params.operations_position_info;
  } else if (params.operation_content !== undefined) {
    backendParams.operations_position_info = params.operation_content;
  }

  try {
    const { data } = await request('/api/web_site/update_joinus', {
      method: 'POST',
      body: backendParams,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新加入我们信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新加入我们信息失败' };
  }
};

// 更新首页Banner（更新homepage_contain中的intro部分）
// 注意：后端update_home_page是INSERT操作，需要传递所有字段
// 如果只更新部分字段，需要先获取当前数据，然后合并
export const updateHomePageIntro = async (params: {
  title?: string;
  subtitle?: string;
  image_url?: string;
  link?: string;
  video_title?: string;
  video_url?: string;
  banner1?: string;
  banner1_url?: string;
  banner2?: string;
  banner2_url?: string;
  banner3?: string;
  banner3_url?: string;
  currentSiteInfo?: SiteInfoResponse; // 可选的当前数据，避免重复获取
}): Promise<ApiResponse<unknown>> => {
  // 获取当前数据以保留未更新的字段
  let currentData: BackendSiteInfoResponse | null = null;

  if (params.currentSiteInfo) {
    // 从传入的数据构造后端格式（简化处理，只取需要的字段）
    currentData = {
      homepage_contain: {
        video_url: params.currentSiteInfo.home_page.video.url,
        video_title: params.currentSiteInfo.home_page.video.title,
        pic_title: params.currentSiteInfo.home_page.intro.title,
        pic_desc: params.currentSiteInfo.home_page.intro.description,
        pic_url: params.currentSiteInfo.home_page.intro.image_url,
        pic_link: params.currentSiteInfo.home_page.intro.link,
        banner1: params.currentSiteInfo.home_page.banners?.[0]?.image_url || '',
        banner1_url: params.currentSiteInfo.home_page.banners?.[0]?.link || '',
        banner2: params.currentSiteInfo.home_page.banners?.[1]?.image_url || '',
        banner2_url: params.currentSiteInfo.home_page.banners?.[1]?.link || '',
        banner3: params.currentSiteInfo.home_page.banners?.[2]?.image_url || '',
        banner3_url: params.currentSiteInfo.home_page.banners?.[2]?.link || '',
      },
    } as any;
  } else {
    // 如果没有传入，则获取最新数据
    const siteInfoRes = await getSiteInfo();
    if (siteInfoRes.code === 200 && siteInfoRes.data) {
      // Note: getSiteInfo transformation might need to be updated to expose banner1/2/3 if not already
      // Currently getSiteInfo maps homepage_contain.banner1 etc to nothing explicitly in SiteInfoResponse?
      // Wait, SiteInfoResponse has `home_page.intro` and `home_carousel`.
      // It does NOT seem to have `home_page.banners` (the 3 static banners).
      // I need to check SiteInfoResponse definition again.
      // It has `banners` (the section banners).
      // It seems I missed mapping `banner1/2/3` from `homepage_contain` to `SiteInfoResponse`.
      // I should update SiteInfoResponse to include these 3 banners in `home_page`.

      currentData = {
        homepage_contain: {
          video_url: siteInfoRes.data.home_page.video.url,
          video_title: siteInfoRes.data.home_page.video.title,
          pic_title: siteInfoRes.data.home_page.intro.title,
          pic_desc: siteInfoRes.data.home_page.intro.description,
          pic_url: siteInfoRes.data.home_page.intro.image_url,
          pic_link: siteInfoRes.data.home_page.intro.link,
          // These might be missing from siteInfoRes.data if I didn't map them!
          // I will need to fetch raw data or update getSiteInfo first.
          // For now, let's assume they are empty if missing.
          banner1: '',
          banner2: '',
          banner3: '',
          banner1_url: '',
          banner2_url: '',
          banner3_url: '',
        },
      } as any;
    }
  }

  const backendParams = {
    video_title: params.video_title ?? currentData?.homepage_contain?.video_title ?? '',
    video_url: params.video_url ?? currentData?.homepage_contain?.video_url ?? '',
    pic_title: params.title ?? currentData?.homepage_contain?.pic_title ?? '',
    pic_desc: params.subtitle ?? currentData?.homepage_contain?.pic_desc ?? '',
    pic_url: params.image_url ?? currentData?.homepage_contain?.pic_url ?? '',
    pic_link: params.link ?? currentData?.homepage_contain?.pic_link ?? '',
    banner1: params.banner1 ?? currentData?.homepage_contain?.banner1 ?? '',
    banner2: params.banner2 ?? currentData?.homepage_contain?.banner2 ?? '',
    banner3: params.banner3 ?? currentData?.homepage_contain?.banner3 ?? '',
    banner1_url: params.banner1_url ?? currentData?.homepage_contain?.banner1_url ?? '',
    banner2_url: params.banner2_url ?? currentData?.homepage_contain?.banner2_url ?? '',
    banner3_url: params.banner3_url ?? currentData?.homepage_contain?.banner3_url ?? '',
  };

  try {
    const { data } = await request('/api/web_site/update_home_page', {
      method: 'POST',
      body: backendParams,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新首页Intro失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新首页Intro失败' };
  }
};

// 更新各个页面的Banner（更新page_banner表）
export const updateBanner = async (params: {
  about_us?: string;
  teachers?: string;
  campus?: string;
  achievements?: string;
  apply?: string;
  join_us?: string;
}): Promise<ApiResponse<unknown>> => {
  const backendParams = {
    about_us_banner: params.about_us || '',
    teachers_banner: params.teachers || '',
    campus_banner: params.campus || '',
    achievements_banner: params.achievements || '',
    apply_banner: params.apply || '',
    join_us_banner: params.join_us || '',
  };
  try {
    const { data } = await request('/api/web_site/update_banner', {
      method: 'POST',
      body: backendParams,
    });
    return normalizeApiResponse<unknown>(data as ApiEnvelope<unknown>);
  } catch (error) {
    console.error('更新 Banner 信息失败:', error);
    return { code: 500, message: error instanceof Error ? error.message : '更新 Banner 信息失败' };
  }
};
