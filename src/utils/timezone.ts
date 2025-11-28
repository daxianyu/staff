/**
 * 时区工具函数 - 强制使用东八区（UTC+8）
 * 确保所有时间显示和计算都使用东八区，不受用户本地时区影响
 */

// 东八区时区标识
export const TIMEZONE_UTC8 = 'Asia/Shanghai';

/**
 * 将时间戳转换为东八区的 Date 对象
 * 注意：Date 对象内部存储的是 UTC 时间，这里返回的 Date 对象
 * 在使用 toLocaleString 等方法时需要指定 timeZone 参数
 * @param timestamp 秒级时间戳
 * @returns Date 对象
 */
export function timestampToDateUTC8(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * 获取东八区时间的各个组成部分
 * @param timestamp 秒级时间戳
 * @returns 包含年月日时分秒的对象
 */
export function getUT8DateParts(timestamp: number) {
  const date = new Date(timestamp * 1000);
  // 使用 Intl.DateTimeFormat 获取东八区时间
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: TIMEZONE_UTC8,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const partsMap: Record<string, string> = {};
  parts.forEach(part => {
    partsMap[part.type] = part.value;
  });
  
  return {
    year: parseInt(partsMap.year || '0'),
    month: parseInt(partsMap.month || '0'),
    day: parseInt(partsMap.day || '0'),
    hour: parseInt(partsMap.hour || '0'),
    minute: parseInt(partsMap.minute || '0'),
    second: parseInt(partsMap.second || '0'),
  };
}

/**
 * 格式化时间戳为东八区日期字符串
 * @param timestamp 秒级时间戳
 * @param format 格式选项
 * @returns 格式化后的日期字符串
 */
export function formatDateUTC8(
  timestamp: number,
  format: {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
  } = {}
): string {
  const date = timestampToDateUTC8(timestamp);
  return date.toLocaleDateString('zh-CN', {
    timeZone: TIMEZONE_UTC8,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...format,
  });
}

/**
 * 格式化时间戳为东八区时间字符串
 * @param timestamp 秒级时间戳
 * @param format 格式选项
 * @returns 格式化后的时间字符串
 */
export function formatTimeUTC8(
  timestamp: number,
  format: {
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    hour12?: boolean;
  } = {}
): string {
  const date = timestampToDateUTC8(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    timeZone: TIMEZONE_UTC8,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...format,
  });
}

/**
 * 格式化时间戳为东八区日期时间字符串
 * @param timestamp 秒级时间戳
 * @param format 格式选项
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTimeUTC8(
  timestamp: number,
  format: {
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    hour12?: boolean;
  } = {}
): string {
  const date = timestampToDateUTC8(timestamp);
  return date.toLocaleString('zh-CN', {
    timeZone: TIMEZONE_UTC8,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...format,
  });
}

/**
 * 获取当前东八区时间戳（秒）
 * @returns 当前时间的秒级时间戳
 */
export function getCurrentTimestampUTC8(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 获取东八区的当前日期对象
 * @returns Date 对象
 */
export function getCurrentDateUTC8(): Date {
  return new Date();
}

/**
 * 将日期字符串（YYYY-MM-DD）转换为东八区时间戳
 * @param dateString 日期字符串，格式：YYYY-MM-DD
 * @param timeString 可选的时间字符串，格式：HH:mm 或 HH:mm:ss
 * @returns 秒级时间戳
 */
export function dateStringToTimestampUTC8(
  dateString: string,
  timeString?: string
): number {
  // 解析日期字符串
  const [year, month, day] = dateString.split('-').map(Number);
  
  // 解析时间字符串（如果提供）
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  if (timeString) {
    const timeParts = timeString.split(':');
    hours = Number(timeParts[0]) || 0;
    minutes = Number(timeParts[1]) || 0;
    seconds = Number(timeParts[2]) || 0;
  }
  
  // 将东八区时间转换为 UTC 时间戳
  // 输入是东八区时间，需要转换为 UTC 时间（减去 8 小时）
  // 使用 Date.UTC 创建 UTC 时间，Date.UTC 的参数就是 UTC 时间
  // 所以我们需要将东八区时间减去 8 小时得到 UTC 时间
  let utcHours = hours - 8;
  let utcDay = day;
  let utcMonth = month - 1;
  let utcYear = year;
  
  // 处理跨日情况
  if (utcHours < 0) {
    utcHours += 24;
    utcDay--;
    if (utcDay < 1) {
      utcMonth--;
      if (utcMonth < 0) {
        utcMonth = 11;
        utcYear--;
      }
      // 获取上个月的天数
      const daysInPrevMonth = new Date(utcYear, utcMonth + 1, 0).getDate();
      utcDay = daysInPrevMonth;
    }
  }
  
  const utcTimestamp = Date.UTC(utcYear, utcMonth, utcDay, utcHours, minutes, seconds);
  
  return Math.floor(utcTimestamp / 1000);
}

/**
 * 格式化时间戳为 YYYY-MM-DD 格式（东八区）
 * @param timestamp 秒级时间戳
 * @returns YYYY-MM-DD 格式的日期字符串
 */
export function formatDateStringUTC8(timestamp: number): string {
  const parts = getUT8DateParts(timestamp);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

/**
 * 格式化时间戳为 HH:mm 格式（东八区）
 * @param timestamp 秒级时间戳
 * @returns HH:mm 格式的时间字符串
 */
export function formatTimeStringUTC8(timestamp: number): string {
  const parts = getUT8DateParts(timestamp);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

/**
 * 格式化时间戳为 YYYY-MM-DD HH:mm 格式（东八区）
 * @param timestamp 秒级时间戳
 * @returns YYYY-MM-DD HH:mm 格式的日期时间字符串
 */
export function formatDateTimeStringUTC8(timestamp: number): string {
  return `${formatDateStringUTC8(timestamp)} ${formatTimeStringUTC8(timestamp)}`;
}

/**
 * 获取东八区日期的开始时间戳（00:00:00）
 * @param timestamp 秒级时间戳
 * @returns 当天 00:00:00 的时间戳（秒）
 */
export function getStartOfDayUTC8(timestamp: number): number {
  const parts = getUT8DateParts(timestamp);
  return dateStringToTimestampUTC8(
    `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    '00:00:00'
  );
}

/**
 * 获取东八区日期的结束时间戳（23:59:59）
 * @param timestamp 秒级时间戳
 * @returns 当天 23:59:59 的时间戳（秒）
 */
export function getEndOfDayUTC8(timestamp: number): number {
  const parts = getUT8DateParts(timestamp);
  return dateStringToTimestampUTC8(
    `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    '23:59:59'
  );
}

