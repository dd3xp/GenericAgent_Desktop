# Vision API SOP

## ⚠️ 前置规则（必须遵守）

1. **先枚举窗口**：调用 vision 前必须先用 `pygetwindow` 枚举窗口标题，确认目标窗口存在且已激活到前台。窗口不存在就不要截图。
2. **🚫 禁止全屏截图**：必须先利用ljqCtrl截取窗口区域。能截局部（如标题栏）就不截整窗口，能截窗口就绝不全屏。全屏截图在任何场景下都不允许。
3. **能不用 vision 就不用**：如果窗口标题/本地 OCR（`ocr_utils.py`）能获取所需信息，就不要调用 vision API，省 token 且更可靠。Vision 是最后手段。
4. **用户发截图问内容时必须用 vision**：用户发图片问"这是什么"/"写了什么"时，必须调用 `ask_vision()`，不能只用 OCR 也不能猜。
5. **读配置用 file_read**：禁止凭 import 缓存报告 mykey.py 内容，必须 file_read 拿实时版本。

## 快速用法（已配好，直接用）

```python
import sys; sys.path.insert(0, r'C:\Agents\GA\GenericAgent\memory')
from vision_api import ask_vision
result = ask_vision(image, prompt="描述图片内容", timeout=60, max_pixels=1_440_000)
# image: 文件路径(str/Path) 或 PIL Image
# backend: 'claude'(默认) | 'openai' | 'modelscope'
# 返回 str：成功为模型回复，失败为 'Error: ...'
```

## 当前配置

- 后端: openai兼容 (relay: 113.45.39.247:3001)
- 模型: claude-sonnet-4-6 (via native_oai_sonnet_config)
- 自动缩放 >1440000px; JPEG q80; importlib.reload防缓存

## 如果 vision_api.py 丢失，重建步骤

1. 复制 `memory/vision_api.template.py` → `memory/vision_api.py`
2. `file_read mykey.py` 扫描变量名（⚠️ 禁止输出 apikey 值），找 OpenAI 兼容配置填入 `OPENAI_CONFIG_KEY`
3. 设 `DEFAULT_BACKEND = 'openai'`，测试一张已知图片确认正确
4. 保底：去 `https://modelscope.cn/my/myaccesstoken` 申请 token 填入 `MODELSCOPE_API_KEY`

## 避坑（血泪教训）

- **第三方转发站(xty.app等)会静默丢弃图片**：模型仍会"回答"但全是幻觉。验证：检查 prompt_tokens 是否随图片增大（不变=没传）
- **读配置必须 file_read**：`import mykey` 有缓存问题，可能读到旧版本。vision_api.py 内部用 importlib.reload 解决
- **禁止编造图片内容**：若 API 失败或不确定图片是否传入，如实告知用户"看不到"，绝不猜测
- **OCR vs Vision**：OCR 只读文字；用户问"这是什么图片"时必须用 vision
- 用户上传图片路径: `temp/desktop_uploads/sess-*/`
