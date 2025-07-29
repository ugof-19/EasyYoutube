import axios from 'axios';

// 后端 API 的基础 URL
// 将本地 API 地址替换为 Railway 地址
const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'https://easyyoutube-production-1206.up.railway.app') + '/api'
  : 'http://localhost:5000/api';

/**
 * 获取 YouTube 视频原始字幕
 * @param url YouTube 视频 URL
 * @returns 视频字幕数据
 */
export const getYoutubeTranscript = async (url: string): Promise<{
  transcript: string;
  video_id: string;
  url: string;
}> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transcript`, { url });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || '服务器错误');
      } else if (error.request) {
        throw new Error('无法连接到服务器，请确保后端服务正在运行');
      }
    }
    throw new Error('获取字幕时出错');
  }
};

/**
 * 获取格式化的 YouTube 视频字幕
 * @param url YouTube 视频 URL
 * @returns 格式化的视频字幕数据
 */
export const getFormattedTranscript = async (url: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/format-transcript`, { url });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 服务器返回了错误响应
        throw new Error(error.response.data.error || '格式化字幕失败');
      } else if (error.request) {
        // 请求发送了但没有收到响应
        throw new Error('无法连接到服务器，请检查网络连接');
      }
    }
    // 其他错误
    throw new Error('格式化字幕时发生未知错误');
  }
};

/**
 * 翻译格式化字幕为中文
 * @param text 需要翻译的文本
 * @returns 翻译后的中文文本
 */
export const translateToChineseTranscript = async (text: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/translate`, { text });
    return response.data.translated_text;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.error || '翻译失败');
      } else if (error.request) {
        throw new Error('无法连接到服务器，请检查网络连接');
      }
    }
    throw new Error('翻译时发生未知错误');
  }
};

/**
 * 分析 YouTube 视频内容
 * @param url YouTube 视频 URL
 * @returns 视频内容分析结果
 */
export const analyzeYoutubeVideo = async (url: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/analyze`, { url });
    return response.data.analysis;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || '服务器错误');
      } else if (error.request) {
        throw new Error('无法连接到服务器，请确保后端服务正在运行');
      }
    }
    throw new Error('分析视频时出错');
  }
};