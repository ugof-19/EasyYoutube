from flask import Flask, request, jsonify
from flask_cors import CORS
from ytcc.download import Download, DownloadException
import re
import os
from dotenv import load_dotenv
from openai import OpenAI

# 加载环境变量
load_dotenv()

# 创建 Flask 应用
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:5174", 
    "https://easy-youtube-chi.vercel.app",
    "*"  # 临时允许所有域名，部署后可以限制为具体域名
])

# 初始化 OpenAI 客户端
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("警告: 未找到 OPENAI_API_KEY 环境变量")
    client = None
else:
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

# 从 YouTube URL 中提取视频 ID
def extract_video_id(url):
    # 处理各种 YouTube URL 格式
    youtube_regex = r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})'
    match = re.search(youtube_regex, url)
    return match.group(1) if match else None

# 获取视频字幕
def get_transcript(video_id):
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            print(f"尝试获取字幕，第 {retry_count + 1} 次尝试")
            
            # 使用ytcc库获取字幕
            downloader = Download()
            
            # 优先尝试获取英文字幕
            try:
                transcript_text = downloader.get_captions(video_id, 'en')
                print("成功获取英文字幕")
            except DownloadException:
                # 如果没有英文字幕，尝试获取其他常见语言字幕
                print("未找到英文字幕，尝试获取其他语言字幕")
                languages_to_try = ['zh', 'zh-cn', 'zh-tw', 'es', 'fr', 'de', 'ja', 'ko']
                transcript_text = None
                
                for lang in languages_to_try:
                    try:
                        transcript_text = downloader.get_captions(video_id, lang)
                        print(f"成功获取 {lang} 语言字幕")
                        break
                    except DownloadException:
                        continue
                
                if transcript_text is None:
                    # 尝试获取任何可用的字幕（不指定语言）
                    try:
                        transcript_text = downloader.get_captions(video_id)
                        print("成功获取默认语言字幕")
                    except DownloadException:
                        raise Exception("无法获取任何语言的字幕")
            
            if transcript_text and transcript_text.strip():
                print(f"成功获取字幕，长度: {len(transcript_text)}")
                return transcript_text.strip()
            else:
                raise Exception("获取到的字幕内容为空")
        
        except DownloadException as e:
            # 处理ytcc库的下载异常
            print(f"无法获取视频字幕: {str(e)}")
            raise Exception(f"无法获取视频字幕: {str(e)}")
        except ConnectionError as e:
            # 处理连接错误，尝试重试
            retry_count += 1
            print(f"连接错误，正在重试 ({retry_count}/{max_retries}): {str(e)}")
            import time
            time.sleep(2)  # 等待2秒后重试
            if retry_count >= max_retries:
                raise Exception(f"获取字幕失败，连接错误: {str(e)}")
        except Exception as e:
            # 处理其他异常
            print(f"获取字幕时出错: {str(e)}")
            import traceback
            traceback.print_exc()
            retry_count += 1
            if retry_count >= max_retries:
                # 如果重试次数达到上限，则返回一个模拟的分析结果
                print("达到重试上限，返回模拟分析结果")
                return "无法获取视频字幕，请尝试其他视频或稍后再试。"
            import time
            time.sleep(2)  # 等待2秒后重试

# 使用 OpenAI API 分析视频内容
def analyze_content(transcript):
    try:
        # 检查OpenAI客户端是否可用
        if client is None:
            return "服务暂时不可用：缺少必要的API配置。请联系管理员。"
        
        # 检查字幕是否为错误消息
        if transcript.startswith("无法获取视频字幕"):
            return "很抱歉，无法获取此视频的字幕内容。可能的原因：\n\n1. 视频没有提供字幕\n2. 字幕访问受到限制\n3. 网络连接问题\n\n请尝试其他视频，或稍后再试。"
        
        # print(transcript)
        print("开始使用 OpenAI API 分析内容")
        # 使用 OpenAI API 分析内容
        # response = client.chat.completions.create(
        #     model="gpt-3.5-turbo",
        #     messages=[
        #         {"role": "system", "content": "你是一个专业的内容分析助手，擅长总结和分析文本内容。请用中文回答。"},
        #         {"role": "user", "content": f"以下是一个YouTube视频的字幕内容，请分析并总结其主要内容、关键点和核心信息。请以清晰的结构呈现，使用简洁的中文。字幕内容：\n\n{transcript}"}
        #     ],
        #     max_tokens=1000
        # )
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个专业的内容分析助手，擅长总结和分析文本内容。请用中文回答。"},
                {"role": "user", "content": f"以下是一个YouTube视频的字幕内容，请分析并总结其主要内容、关键点和核心信息。请以清晰的结构呈现，使用简洁的中文。字幕内容：\n\n{transcript}"}
            ],
            max_tokens=5000
        )
        print("OpenAI API 分析完成")
        return response.choices[0].message.content
    except Exception as e:
        print(f"分析内容时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"分析内容时出错: {str(e)}")

# 使用 AI 格式化字幕
def format_transcript(transcript):
    try:
        # 检查OpenAI客户端是否可用
        if client is None:
            return "服务暂时不可用：缺少必要的API配置。请联系管理员。"
        
        print("开始使用 AI 格式化字幕")
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个专业的文本格式化助手。请将输入的字幕文本进行合理的分句、分行和分段处理，使其更易于阅读和理解。保持原文内容不变，只调整格式和结构。直接输出格式化后的文本，不要添加任何说明或前缀。"},
                {"role": "user", "content": f"请将以下字幕文本进行格式化处理，合理分句分行分段，使其更清晰易读。请保持原文内容完整，只优化格式，直接输出结果：\n\n{transcript}"}
            ],
            max_tokens=8000
        )
        
        formatted_text = response.choices[0].message.content.strip()
        print(f"字幕格式化完成，长度: {len(formatted_text)}")
        return formatted_text
        
    except Exception as e:
        print(f"格式化字幕时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return f"格式化失败: {str(e)}"

@app.route('/api/format-transcript', methods=['POST'])
def format_video_transcript():
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': '缺少URL参数'}), 400
        
        print(f"收到格式化字幕请求: {url}")
        
        # 提取视频ID
        video_id = extract_video_id(url)
        if not video_id:
            return jsonify({'error': '无效的YouTube URL'}), 400
        
        print(f"提取到视频ID: {video_id}")
        
        # 获取字幕
        transcript = get_transcript(video_id)
        if not transcript or transcript.startswith("无法获取视频字幕"):
            return jsonify({'error': '无法获取视频字幕'}), 400
        
        print(f"获取到字幕，长度: {len(transcript)}")
        
        # 格式化字幕
        formatted_transcript = format_transcript(transcript)
        
        return jsonify({
            'formatted_transcript': formatted_transcript,
            'original_transcript': transcript,
            'video_id': video_id,
            'url': url
        })
        
    except Exception as e:
        print(f"处理格式化字幕请求时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# API 路由：获取原始字幕
@app.route('/api/transcript', methods=['POST'])
def get_video_transcript():
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': True, 'message': '请提供YouTube视频URL'}), 400
        
        # 提取视频ID
        video_id = extract_video_id(url)
        if not video_id:
            return jsonify({'error': True, 'message': '无效的YouTube视频URL'}), 400
        
        print(f"正在获取视频字幕，视频ID: {video_id}")
        
        try:
            # 获取字幕
            transcript = get_transcript(video_id)
            print(f"成功获取字幕，长度: {len(transcript)}")
            
            return jsonify({
                'error': False, 
                'transcript': transcript,
                'video_id': video_id,
                'url': url
            })
        except Exception as inner_e:
            print(f"获取字幕时出错: {str(inner_e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': True, 'message': str(inner_e)}), 500
    
    except Exception as e:
        print(f"API请求处理出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': True, 'message': str(e)}), 500

# API 路由：分析 YouTube 视频
@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': True, 'message': '请提供YouTube视频URL'}), 400
        
        # 提取视频ID
        video_id = extract_video_id(url)
        if not video_id:
            return jsonify({'error': True, 'message': '无效的YouTube视频URL'}), 400
        
        print(f"正在处理视频ID: {video_id}")
        
        try:
            # 获取字幕
            transcript = get_transcript(video_id)
            print(f"成功获取字幕，长度: {len(transcript)}")
            
            # 分析内容
            analysis = analyze_content(transcript)
            print("成功分析内容")
            
            return jsonify({'error': False, 'analysis': analysis})
        except Exception as inner_e:
            print(f"处理视频时出错: {str(inner_e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': True, 'message': str(inner_e)}), 500
    
    except Exception as e:
        print(f"API请求处理出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': True, 'message': str(e)}), 500

# 翻译字幕为中文
@app.route('/api/translate', methods=['POST'])
def translate_text():
    try:
        # 检查OpenAI客户端是否可用
        if client is None:
            return jsonify({'error': True, 'message': '服务暂时不可用：缺少必要的API配置'}), 500
        
        data = request.get_json()
        text = data.get('text')
        
        if not text:
            return jsonify({'error': '缺少文本参数'}), 400
        
        # 使用 DeepSeek API 进行翻译
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的翻译助手。请将用户提供的文本翻译成中文。保持原文的格式和结构，只进行语言翻译，不要添加任何解释或说明。如果原文已经是中文，请直接返回原文。"
                },
                {
                    "role": "user",
                    "content": f"请将以下文本翻译成中文：\n\n{text}"
                }
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        translated_text = response.choices[0].message.content.strip()
        
        return jsonify({
            'translated_text': translated_text,
            'original_text': text
        })
        
    except Exception as e:
        print(f"翻译错误: {str(e)}")
        return jsonify({'error': f'翻译失败: {str(e)}'}), 500

# 健康检查路由
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'EasyYoutube API Server',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'transcript': '/api/transcript',
            'analyze': '/api/analyze',
            'format': '/api/format-transcript',
            'translate': '/api/translate'
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

# 启动应用
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)