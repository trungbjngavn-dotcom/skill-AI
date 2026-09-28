// AI Media Skills Hub - Executive Report & Technical Specifications Logic
let allSkills = [];
let selectedSkill = null;
let currentCodeFormat = 'python';

// Categories Configuration (Pure English category names)
const CATEGORY_GROUPS = [
  { key: 'video', label: 'Video Generation' },
  { key: 'image', label: 'Image Generation' },
  { key: 'edit', label: 'Editing & VFX' },
  { key: 'avatar', label: 'Avatar & Faces' },
  { key: 'music', label: 'Music & Audio' },
  { key: 'tools', label: 'CLI & System' }
];

// DOM Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const accordionContainer = document.getElementById('accordion-container');
const catalogCountLabel = document.getElementById('catalog-count-label');
const btnExpandAll = document.getElementById('btn-expand-all');
const btnCollapseAll = document.getElementById('btn-collapse-all');

const emptyDetail = document.getElementById('empty-detail');
const detailContent = document.getElementById('detail-content');
const detailCategoryBadge = document.getElementById('detail-category-badge');
const detailTitle = document.getElementById('detail-title');
const detailDesc = document.getElementById('detail-description');
const detailEndpoint = document.getElementById('detail-endpoint');
const btnCopyEndpoint = document.getElementById('btn-copy-endpoint');

const specsTableBody = document.getElementById('specs-table-body');
const samplePromptsContainer = document.getElementById('sample-prompts-container');
const codeSnippetTitle = document.getElementById('code-snippet-title');
const codeSnippetContent = document.getElementById('code-snippet-content');
const btnCopyCode = document.getElementById('btn-copy-code');
const tipsContainer = document.getElementById('tips-container');

const agentPromptCode = document.getElementById('agent-prompt-code');
const btnCopyAgentPrompt = document.getElementById('btn-copy-agent-prompt');
const toastEl = document.getElementById('toast');

// Toast Notification
function showToast(message) {
  toastEl.innerHTML = `<span>✓</span> <span>${message}</span>`;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2800);
}

// Clipboard Helper
function copyText(text, successMsg = 'Đã sao chép vào bộ nhớ tạm!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showToast(successMsg);
}

// Fetch all skills on load (Tương thích 100% Cloudflare Pages & Local Server)
async function initApp() {
  try {
    let res;
    try {
      res = await fetch('./data/skills.json');
      if (!res.ok) throw new Error('Static not found');
    } catch (_) {
      res = await fetch('/api/skills');
    }
    const data = await res.json();
    allSkills = data.skills || [];

    renderAccordionCatalog(allSkills);

    // Default select Seedance 2.5
    const defaultSkill = allSkills.find(s => s.id === 'seedance-2-5-image-to-video') || allSkills[0];
    if (defaultSkill) {
      selectSkill(defaultSkill);
    }
  } catch (err) {
    accordionContainer.innerHTML = `
      <div class="loading-container">
        <p style="color: #dc2626; font-weight: 700;">⚠️ Lỗi tải dữ liệu: ${err.message}</p>
      </div>
    `;
  }
}

// Render Collapsible Accordion Groups (Tất cả mặc định đóng gọn gàng)
function renderAccordionCatalog(skillsToRender, autoExpandAll = false) {
  accordionContainer.innerHTML = '';
  const query = searchInput.value.trim().toLowerCase();

  let totalVisible = 0;

  CATEGORY_GROUPS.forEach((catGroup) => {
    // Filter skills matching this category and query
    const groupSkills = skillsToRender.filter(s => {
      const matchCat = s.category.key === catGroup.key;
      const matchQuery = !query || 
        s.displayName.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.endpoint.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (groupSkills.length === 0 && query) {
      return;
    }

    totalVisible += groupSkills.length;

    // Create Accordion Group - Do NOT expand by default
    const groupEl = document.createElement('div');
    const shouldExpand = autoExpandAll || Boolean(query);
    groupEl.className = `accordion-group ${shouldExpand ? 'expanded' : ''}`;
    groupEl.dataset.catKey = catGroup.key;

    // Header without icon, clean and executive
    const headerEl = document.createElement('div');
    headerEl.className = 'accordion-header';
    headerEl.innerHTML = `
      <div class="accordion-title-wrap">
        <span class="accordion-label">${catGroup.label}</span>
        <span class="accordion-count-badge">${groupSkills.length}</span>
      </div>
      <span class="accordion-chevron">▼</span>
    `;

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'accordion-body';

    if (groupSkills.length === 0) {
      bodyEl.innerHTML = `<div style="font-size: 13px; color: var(--text-dim); padding: 8px 12px;">Chưa có giải pháp nào trong nhóm này.</div>`;
    } else {
      groupSkills.forEach(skill => {
        const itemEl = document.createElement('div');
        const isSelected = selectedSkill && selectedSkill.id === skill.id;
        itemEl.className = `skill-item-card ${isSelected ? 'selected' : ''}`;
        itemEl.dataset.skillId = skill.id;

        itemEl.innerHTML = `
          <div class="item-left">
            <span class="item-title">${skill.displayName}</span>
            <span class="item-desc">${skill.endpoint}</span>
          </div>
          <span class="item-action-icon">➔</span>
        `;

        itemEl.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.skill-item-card').forEach(el => el.classList.remove('selected'));
          itemEl.classList.add('selected');
          selectSkill(skill);
        });

        bodyEl.appendChild(itemEl);
      });
    }

    // Toggle expand/collapse
    headerEl.addEventListener('click', () => {
      groupEl.classList.toggle('expanded');
    });

    groupEl.appendChild(headerEl);
    groupEl.appendChild(bodyEl);
    accordionContainer.appendChild(groupEl);
  });

  catalogCountLabel.textContent = query 
    ? `Tìm thấy ${totalVisible} giải pháp` 
    : `6 Categories (${allSkills.length} Solutions)`;
}

// Select and show Skill technical details
function selectSkill(skill) {
  selectedSkill = skill;
  emptyDetail.style.display = 'none';
  detailContent.style.display = 'block';

  // Header Details
  detailCategoryBadge.className = `badge ${skill.category.badgeClass}`;
  detailCategoryBadge.textContent = skill.category.label;
  detailTitle.textContent = skill.displayName;
  detailDesc.textContent = skill.description || 'Không có mô tả chi tiết.';
  detailEndpoint.textContent = skill.endpoint;

  // 1. Render Technical Specifications Table
  renderSpecsTable(skill);

  // 2. Render Sample Prompts (Mục Mới)
  renderSamplePrompts(skill);

  // 3. Render Code Snippets
  updateCodeSnippet();

  // 4. Render Prompt Standards
  renderTips(skill);

  // 5. Render Agent System Prompt Spec
  agentPromptCode.textContent = generateAgentSystemPrompt(skill);
}

// Render Real Technical Specifications Table
function renderSpecsTable(skill) {
  specsTableBody.innerHTML = '';

  let fields = skill.fields && skill.fields.length > 0 ? skill.fields : [
    { name: 'prompt', type: 'string', required: true, default: '—', notes: 'Mô tả chi tiết phân cảnh, chủ thể và chuyển động camera.' },
    { name: 'image', type: 'string (URL)', required: skill.id.includes('to-video') || skill.id.includes('edit'), default: '—', notes: 'Đường dẫn URL ảnh gốc mỏ neo làm cơ sở xử lý.' },
    { name: 'duration', type: 'integer', required: false, default: '5', notes: 'Thời lượng video (tính bằng giây, 4–30s tùy mô hình).' }
  ];

  fields.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="spec-field-name">${f.name}</span></td>
      <td><span class="spec-type-tag">${f.type}</span></td>
      <td>${f.required ? '<span class="spec-req-yes">Bắt buộc</span>' : '<span class="spec-req-no">Tùy chọn</span>'}</td>
      <td><code>${f.default || '—'}</code></td>
      <td style="line-height: 1.5;">${f.notes || 'Không có ghi chú thêm.'}</td>
    `;
    specsTableBody.appendChild(tr);
  });
}

// Generate Realistic Sample Prompts (Mẫu Prompt Thực Tế kèm giải nghĩa)
function getSamplePromptsForSkill(skill) {
  const id = skill.id;

  if (id.includes('seedance-2-5-image-to-video') || id.includes('seedance-v2')) {
    return [
      {
        useCase: 'Tình huống 1: Video Quảng Cáo Sản Phẩm (Packshot)',
        prompt: 'The model turns slowly toward camera and lifts the bottle into the key light; slow push-in, shallow depth of field, warm cinematic backlight, 4k quality, no text, no watermark.',
        explanation: 'Người mẫu quay chậm về phía ống kính, nâng chai sản phẩm vào vùng ánh sáng chính; máy quay tiến lại gần từ từ (push-in), độ sâu trường ảnh mỏng (làm mờ hậu cảnh để làm nổi bật sản phẩm).'
      },
      {
        useCase: 'Tình huống 2: Nhân Vật Đối Thoại Kèm Âm Thanh Tự Nhiên',
        prompt: 'The barista looks up from the counter and says, in a warm conversational tone, that today\'s roast just landed. Medium close-up, gentle handheld drift, soft cafe ambience and low chatter behind her.',
        explanation: 'Người pha chế ngước nhìn từ quầy bar và nói với tông giọng trò chuyện ấm áp. Cảnh quay cận vừa (medium close-up), máy quay trôi nhẹ tự nhiên, âm thanh quán cafe nhẹ nhàng ở phía sau.'
      },
      {
        useCase: 'Tình huống 3: Hành Động Điện Ảnh (Cinematic Action)',
        prompt: 'Close-up of a runner\'s face focusing intensely, beads of sweat glistening under stadium lights; camera tracks alongside at steady speed, dramatic slow motion, shallow focus.',
        explanation: 'Cận cảnh gương mặt vận động viên tập trung cao độ, mồ hôi lấp lánh dưới ánh đèn sân vận động; máy quay di chuyển song song theo tốc độ ổn định, hiệu ứng quay chậm kịch tính.'
      }
    ];
  }

  if (id.includes('wan') || id.includes('kling')) {
    return [
      {
        useCase: 'Tình huống 1: Cảnh Quay Giới Thiệu Doanh Nghiệp / Công Nghệ',
        prompt: 'A modern tech executive stands in a glass-walled conference room overlooking a sunlit metropolitan skyline; slow camera pan from left to right, natural golden hour lighting, 8k crisp details.',
        explanation: 'Nhà lãnh đạo công nghệ đứng trong phòng họp vách kính nhìn ra toàn cảnh thành phố lúc bình minh; góc máy quét chậm từ trái sang phải, ánh sáng vàng tự nhiên, độ chi tiết 8K.'
      },
      {
        useCase: 'Tình huống 2: Quảng Cáo Xe Hơi & Chuyển Động Tốc Độ Cao',
        prompt: 'Sleek electric luxury sedan driving along a coastal highway at dusk, headlights illuminating the smooth asphalt, smooth drone chase shot from high angle, cinematic color grading.',
        explanation: 'Xe sedan điện hạng sang chạy dọc đường bờ biển lúc hoàng hôn, đèn pha chiếu sáng mặt đường; góc máy flycam đuổi theo từ trên cao mượt mà, màu sắc chuẩn phim điện ảnh.'
      }
    ];
  }

  if (id.includes('flux') || id.includes('gpt-image') || id.includes('nano-banana')) {
    return [
      {
        useCase: 'Tình huống 1: Chân Dung Doanh Nghiệp Chuyên Nghiệp (Corporate Headshot)',
        prompt: 'Ultra-photorealistic portrait of a confident Asian female tech CEO in a navy blazer, soft studio lighting, neutral grey backdrop, 85mm f/1.4 lens, natural skin texture, masterpiece quality.',
        explanation: 'Chân dung siêu thực của nữ giám đốc công nghệ mặc áo vest xanh navy, ánh sáng studio mềm mại, phông nền xám trung tính, ống kính 85mm f/1.4 sắc nét, kết cấu da tự nhiên không bị bệt màu.'
      },
      {
        useCase: 'Tình huống 2: Thiết Kế Không Gian & Kiến Trúc Hiện Đại',
        prompt: 'Minimalist Scandinavian living room with floor-to-ceiling glass windows, warm oak furniture, lush indoor plants, soft morning daylight streaming across hardwood floors, architectural digest style.',
        explanation: 'Phòng khách phong cách Bắc Âu tối giản với cửa kính lớn chạm trần, nội thất gỗ sồi ấm cúng, cây xanh trong nhà, ánh sáng ban mai tự nhiên tràn vào sàn gỗ.'
      }
    ];
  }

  if (id.includes('lipsync') || id.includes('avatar') || id.includes('face-swap')) {
    return [
      {
        useCase: 'Tình huống 1: Phát Thanh Viên / Bản Tin Tài Chính',
        prompt: 'Professional corporate spokesperson delivering an articulate financial report, natural lip synchronization matching vocal audio track, realistic subtle head tilts and eye blinks, clean studio key.',
        explanation: 'Người phát ngôn doanh nghiệp trình bày báo cáo tài chính, khẩu hình cử động đồng bộ chuẩn xác theo âm thanh giọng nói, chuyển động đầu và chớp mắt tự nhiên.'
      },
      {
        useCase: 'Tình huống 2: Chuyển Đổi Khuôn Mặt / Đổi Nhân Vật (Face Swap)',
        prompt: 'Seamless face swap preserving original head orientation, ambient lighting reflections, and authentic facial expressions without edge artifacts or skin tone mismatch.',
        explanation: 'Thay đổi khuôn mặt nhân vật nhưng giữ nguyên góc nghiêng đầu, bóng sáng môi trường xung quanh và biểu cảm chân thực, không để lại vết ghép rìa tóc.'
      }
    ];
  }

  if (id.includes('edit') || id.includes('inpainting') || id.includes('outpainting') || id.includes('relight')) {
    return [
      {
        useCase: 'Tình huống 1: Mở Rộng Khung Hình Video (Outpainting Từ Dọc Sang Ngang)',
        prompt: 'Expand canvas horizontally from 9:16 to 16:9 widescreen, continuing the interior office architecture and natural lighting seamlessly into both side margins without seams.',
        explanation: 'Mở rộng khung hình từ video dọc (TikTok/Shorts) sang định dạng ngang 16:9 (YouTube/TVC), tự động vẽ nối dài không gian văn phòng và ánh sáng sang hai bên rìa liền mạch.'
      },
      {
        useCase: 'Tình huống 2: Xóa & Thay Thế Vật Thể Trong Video (Video Inpainting)',
        prompt: 'Remove the microphone wire and background bystander, replacing with smooth matching gradient wall texture consistent across all frames.',
        explanation: 'Xóa dây micro và người đi bộ phía sau, tự động lấp đầy bằng kết cấu bề mặt tường đồng nhất xuyên suốt tất cả các khung hình trong clip.'
      }
    ];
  }

  if (id.includes('music') || id.includes('audio')) {
    return [
      {
        useCase: 'Tình huống 1: Nhạc Nền Video Doanh Nghiệp (Corporate Background Music)',
        prompt: 'Inspiring modern corporate tech background soundtrack, gentle acoustic guitar intro building into uplifting ambient piano and soft synth pads, tempo 110 bpm, seamless loop.',
        explanation: 'Bản nhạc nền truyền cảm hứng cho video giới thiệu công nghệ, mở đầu bằng guitar mộc nhẹ nhàng phát triển dần sang tiếng đàn piano ấm áp và synth bay bổng, nhịp điệu 110 bpm.'
      },
      {
        useCase: 'Tình huống 2: Nhạc Nền Video Review Sản Phẩm / Vlog',
        prompt: 'Upbeat chill lo-fi hip hop groove with warm rhodes electric piano, relaxing vinyl crackle, subtle bassline, modern urban commercial style.',
        explanation: 'Giai điệu lo-fi hip hop thư giãn với tiếng piano điện ấm áp, tiếng nổ đĩa than nhẹ nhàng hoài niệm, rất phù hợp cho video review hoặc trải nghiệm đời sống.'
      }
    ];
  }

  // Fallback generic sample prompts
  return [
    {
      useCase: 'Mẫu Prompt Tiêu Chuẩn Cho Mô Hình Này',
      prompt: 'A cinematic high-definition sequence, photorealistic rendering, accurate motion dynamics, professional studio color grading, no artifacts.',
      explanation: 'Câu lệnh mẫu tiêu chuẩn yêu cầu mô hình tối ưu độ sắc nét, kiểm soát chuyển động mượt mà và áp dụng bảng màu tiêu chuẩn điện ảnh chuyên nghiệp.'
    }
  ];
}

// Render Sample Prompts into Tab 2
function renderSamplePrompts(skill) {
  samplePromptsContainer.innerHTML = '';
  const prompts = getSamplePromptsForSkill(skill);

  prompts.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'sample-prompt-card';

    card.innerHTML = `
      <div class="prompt-card-top">
        <span class="prompt-use-case">${p.useCase}</span>
        <button class="btn-copy-prompt" data-prompt="${encodeURIComponent(p.prompt)}">📋 Sao Chép Prompt</button>
      </div>
      <div class="prompt-box">"${p.prompt}"</div>
      <div class="prompt-explanation-box">
        <strong>💡 Ý nghĩa & Phân tích kịch bản:</strong> ${p.explanation}
      </div>
    `;

    const copyBtn = card.querySelector('.btn-copy-prompt');
    copyBtn.addEventListener('click', () => {
      copyText(decodeURIComponent(copyBtn.dataset.prompt), 'Đã sao chép prompt mẫu!');
    });

    samplePromptsContainer.appendChild(card);
  });
}

// Generate Realistic Payload Object based on skill schema
function generateSamplePayload(skill) {
  const payload = {};
  if (skill.fields && skill.fields.length > 0) {
    skill.fields.forEach(f => {
      if (f.name.toLowerCase().includes('prompt')) {
        payload[f.name] = 'A cinematic professional sequence, photorealistic 8k, seamless camera drift, no watermark.';
      } else if (f.type.includes('bool')) {
        payload[f.name] = f.default !== 'false';
      } else if (f.name.toLowerCase() === 'duration') {
        payload[f.name] = Number(f.default) || 5;
      } else if (f.name.toLowerCase().includes('aspect_ratio')) {
        payload[f.name] = '16:9';
      } else if (f.name.includes('image') || f.name.includes('video') || f.name.includes('url')) {
        payload[f.name] = 'https://example.com/assets/sample-anchor.jpg';
      } else if (f.type.includes('int') || f.type.includes('num')) {
        payload[f.name] = Number(f.default) || 1;
      } else {
        payload[f.name] = f.default || 'default_value';
      }
    });
  } else {
    payload['prompt'] = 'A cinematic professional sequence, photorealistic 8k, seamless camera drift.';
  }
  return payload;
}

// Update Real Working Code Snippets (Python, Node, CLI, cURL)
function updateCodeSnippet() {
  if (!selectedSkill) return;
  const endpoint = selectedSkill.endpoint;
  const payloadObj = generateSamplePayload(selectedSkill);
  const payloadJson = JSON.stringify(payloadObj, null, 4);

  let snippet = '';

  if (currentCodeFormat === 'python') {
    codeSnippetTitle.textContent = 'Python 3 (Mã nguồn thực tế chạy trên Windows / Linux)';
    snippet = `# =====================================================================
# KẾT NỐI API RUNCOMFY CHO DỰ ÁN TỰ ĐỘNG HÓA DOANH NGHIỆP
# =====================================================================
import requests
import json

# Thay YOUR_RUNCOMFY_TOKEN bằng khóa API chính thức của tài khoản RunComfy
API_TOKEN = "YOUR_RUNCOMFY_TOKEN"
ENDPOINT = "${endpoint}"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

payload = ${payloadJson}

# Gửi yêu cầu khởi tạo tiến trình sinh media
response = requests.post(
    f"https://api.runcomfy.com/v1/models/{ENDPOINT}",
    headers=headers,
    json=payload
)

result = response.json()
print("Trạng thái phản hồi:", response.status_code)
print("Kết quả trả về:", json.dumps(result, indent=2))`;

  } else if (currentCodeFormat === 'node') {
    codeSnippetTitle.textContent = 'Node.js (Fetch API)';
    snippet = `// Tích hợp quy trình sinh video vào Backend Node.js
const API_TOKEN = process.env.RUNCOMFY_TOKEN || 'YOUR_RUNCOMFY_TOKEN';
const ENDPOINT = '${endpoint}';

const payload = ${payloadJson};

async function createMediaTask() {
  const response = await fetch(\`https://api.runcomfy.com/v1/models/\${ENDPOINT}\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  console.log('Kết quả:', result);
}

createMediaTask();`;

  } else if (currentCodeFormat === 'cli') {
    codeSnippetTitle.textContent = 'RunComfy CLI (macOS / Linux)';
    snippet = `# Lệnh thực thi qua công cụ dòng lệnh RunComfy CLI
runcomfy run ${endpoint} \\
  --input '${JSON.stringify(payloadObj)}' \\
  --output-dir ./output`;

  } else if (currentCodeFormat === 'curl') {
    codeSnippetTitle.textContent = 'cURL (REST API HTTP Request)';
    snippet = `curl -X POST "https://api.runcomfy.com/v1/models/${endpoint}" \\
  -H "Authorization: Bearer YOUR_RUNCOMFY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payloadObj)}'`;
  }

  codeSnippetContent.textContent = snippet;
}

// Generate Agent Prompt Specification
function generateAgentSystemPrompt(skill) {
  return `### AI Standard: ${skill.displayName}
Model Endpoint: ${skill.endpoint}
Category: ${skill.category.label}
Summary: ${skill.description}

When generating requests for ${skill.displayName}, strictly conform to this schema:
${JSON.stringify(skill.fields || [], null, 2)}
`;
}

// Render Prompting Tips
function renderTips(skill) {
  if (skill.tips) {
    const formatted = skill.tips
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .split('\n\n')
      .map(p => p.startsWith('<li>') ? `<ul>${p}</ul>` : `<p>${p}</p>`)
      .join('');
    tipsContainer.innerHTML = formatted;
  } else {
    tipsContainer.innerHTML = `
      <p>💡 <strong>Tiêu chuẩn kỹ thuật khi tối ưu hóa prompt cho ${skill.displayName}:</strong></p>
      <ul>
        <li>Tách biệt rõ ràng <strong>hành động của chủ thể</strong> và <strong>chuyển động của camera</strong> (Ví dụ: <em>"The subject smiles; slow push-in, shallow depth of field"</em>).</li>
        <li>Để ảnh gốc mang các thuộc tính cố định (khuôn mặt, trang phục); prompt chỉ mô tả các yếu tố biến đổi.</li>
        <li>Sử dụng câu phủ định tiêu chuẩn thương mại để triệt tiêu lỗi: <em>"No text, no watermark, no on-screen captions"</em>.</li>
      </ul>
    `;
  }
}

// Event Listeners for Tabs
document.querySelectorAll('.tab-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add('active');
  });
});

// Event Listeners for Code Format Switcher
document.querySelectorAll('.format-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCodeFormat = btn.dataset.fmt;
    updateCodeSnippet();
  });
});

// Expand All / Collapse All Buttons
btnExpandAll.addEventListener('click', () => {
  document.querySelectorAll('.accordion-group').forEach(g => g.classList.add('expanded'));
});

btnCollapseAll.addEventListener('click', () => {
  document.querySelectorAll('.accordion-group').forEach(g => g.classList.remove('expanded'));
});

// Search input
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  clearSearchBtn.style.display = query ? 'block' : 'none';
  renderAccordionCatalog(allSkills, Boolean(query));
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  renderAccordionCatalog(allSkills, false);
});

// Copy buttons
btnCopyCode.addEventListener('click', () => copyText(codeSnippetContent.textContent));
btnCopyEndpoint.addEventListener('click', () => copyText(detailEndpoint.textContent, 'Đã sao chép Endpoint!'));
btnCopyAgentPrompt.addEventListener('click', () => copyText(agentPromptCode.textContent));

// Start application
initApp();
