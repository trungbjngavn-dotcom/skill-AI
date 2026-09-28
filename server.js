const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3300;
const SKILLS_DIR = fs.existsSync(path.join(__dirname, 'skills')) 
  ? path.join(__dirname, 'skills') 
  : path.resolve(__dirname, '../skills');
const PUBLIC_DIR = path.resolve(__dirname, 'public');

// Category mapping helper
function getCategory(id) {
  const videoIds = [
    'ai-video-generation', 'seedance-v2', 'seedance-2-5-image-to-video', 
    'seedance-2-5-reference-to-video', 'wan-2-7', 'wan-3-0-prime-reference-to-video',
    'kling-3-0', 'image-to-video', 'happyhorse-1-0'
  ];
  const imageIds = [
    'ai-image-generation', 'flux-2-klein', 'flux-kontext', 
    'gpt-image-2', 'nano-banana-2'
  ];
  const editIds = [
    'image-edit', 'gpt-image-edit', 'nano-banana-edit', 'image-inpainting',
    'image-outpainting', 'relight', 'controlnet-pose', 'video-edit',
    'video-extend', 'video-inpainting', 'video-outpainting'
  ];
  const avatarIds = ['ai-avatar-video', 'face-swap', 'lipsync'];
  const musicIds = ['ai-music', 'elevenlabs-music-generation', 'ace-step'];

  if (videoIds.includes(id)) return { key: 'video', label: 'Video Generation', icon: '🎬', badgeClass: 'badge-video' };
  if (imageIds.includes(id)) return { key: 'image', label: 'Image Generation', icon: '🎨', badgeClass: 'badge-image' };
  if (editIds.includes(id)) return { key: 'edit', label: 'Editing & VFX', icon: '✂️', badgeClass: 'badge-edit' };
  if (avatarIds.includes(id)) return { key: 'avatar', label: 'Avatar & Faces', icon: '👤', badgeClass: 'badge-avatar' };
  if (musicIds.includes(id)) return { key: 'music', label: 'Music & Audio', icon: '🎵', badgeClass: 'badge-music' };
  return { key: 'tools', label: 'CLI & Utilities', icon: '⚡', badgeClass: 'badge-tools' };
}

// Parse Markdown tables into structured fields
function parseSchemaTable(markdown) {
  const schemaSectionMatch = markdown.match(/## (?:Endpoint \+ )?(?:input )?schema[\s\S]*?(?=\n## |\n#[^#]|$)/i);
  if (!schemaSectionMatch) return [];

  const sectionText = schemaSectionMatch[0];
  const tableMatch = sectionText.match(/\|([^\n]+)\|\r?\n\|[-|\s]+\|\r?\n((?:\|[^\n]+\|\r?\n?)+)/);
  if (!tableMatch) return [];

  const headers = tableMatch[1].split('|').map(h => h.trim().toLowerCase()).filter(Boolean);
  const rows = tableMatch[2].trim().split('\n');

  const fields = [];
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).slice(1, -1);
    if (cells.length === 0) continue;

    const fieldObj = {};
    headers.forEach((h, idx) => {
      let key = h.replace(/[^a-z]/g, '');
      if (key === 'field' || key === 'name' || key === 'parameter') key = 'name';
      fieldObj[key] = (cells[idx] || '').replace(/`/g, '');
    });

    if (fieldObj.name) {
      // determine default value cleanly
      const isRequired = (fieldObj.required || '').toLowerCase().includes('yes') || (fieldObj.required || '').toLowerCase().includes('true');
      fields.push({
        name: fieldObj.name,
        type: fieldObj.type || 'string',
        required: isRequired,
        default: fieldObj.default && fieldObj.default !== '—' && fieldObj.default !== '-' ? fieldObj.default : '',
        notes: fieldObj.notes || fieldObj.description || ''
      });
    }
  }

  return fields;
}

// Extract endpoint name
function extractEndpoint(markdown, id) {
  const epMatch = markdown.match(/### `([^`]+)`/) || markdown.match(/runcomfy run ([a-z0-9\-_./]+)/i);
  if (epMatch) return epMatch[1];
  return `runcomfy/${id}`;
}

// Extract Pricing info
function extractPricing(markdown) {
  const priceMatch = markdown.match(/## Pricing[\s\S]*?(?=\n## |\n#[^#]|$)/i);
  if (!priceMatch) {
    const inlineMatch = markdown.match(/\$[\d.]+\s*(?:\/\s*[a-z]+|per [a-z]+)/i);
    return inlineMatch ? inlineMatch[0] : 'See model catalog';
  }
  const summaryLine = priceMatch[0].split('\n').find(l => l.includes('$')) || 'Billed on compute usage';
  return summaryLine.replace(/[#*]/g, '').trim();
}

// Extract Tips / Best Practices
function extractTips(markdown) {
  const tipsMatch = markdown.match(/## Prompting[^\n]*\n([\s\S]*?)(?=\n## |\n#[^#]|$)/i);
  if (!tipsMatch) return null;
  return tipsMatch[1].trim();
}

// Parse SKILL.md file
function parseSkillFile(skillId) {
  const skillPath = path.join(SKILLS_DIR, skillId, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;

  const content = fs.readFileSync(skillPath, 'utf8');
  let meta = {
    id: skillId,
    displayName: skillId,
    description: '',
    homepage: 'https://www.runcomfy.com',
    license: 'MIT'
  };

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  let markdownBody = content;

  if (fmMatch) {
    markdownBody = content.slice(fmMatch[0].length);
    const fmLines = fmMatch[1].split('\n');
    let currentKey = null;

    for (const rawLine of fmLines) {
      const line = rawLine.trim();
      if (!line) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
        currentKey = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        if (val.startsWith('>') || val.startsWith('|')) {
          val = '';
        }
        meta[currentKey] = val.replace(/^["']|["']$/g, '');
      } else if (currentKey && meta[currentKey] !== undefined) {
        meta[currentKey] = (meta[currentKey] + ' ' + line.replace(/^["']|["']$/g, '')).trim();
      }
    }
  }

  const category = getCategory(skillId);
  const endpoint = extractEndpoint(markdownBody, skillId);
  const fields = parseSchemaTable(markdownBody);
  const pricing = extractPricing(markdownBody);
  const tips = extractTips(markdownBody);

  return {
    id: skillId,
    name: meta.name || skillId,
    displayName: meta.displayName || skillId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: meta.description || '',
    category,
    endpoint,
    fields,
    pricing,
    tips,
    markdown: markdownBody,
    installCommand: `npx skills add agentspace-so/runcomfy-agent-skills --skill ${skillId} -g`
  };
}

// Get all skills list
function getAllSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const parsed = parseSkillFile(entry.name);
      if (parsed) {
        skills.push(parsed);
      }
    }
  }

  // Sort by category order then name
  const catOrder = ['video', 'image', 'edit', 'avatar', 'music', 'tools'];
  return skills.sort((a, b) => {
    const catDiff = catOrder.indexOf(a.category.key) - catOrder.indexOf(b.category.key);
    if (catDiff !== 0) return catDiff;
    return a.displayName.localeCompare(b.displayName);
  });
}

// HTTP Server
const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/skills') {
    const skills = getAllSkills();
    const categories = [
      { key: 'all', label: 'Tất cả (34 Skills)', icon: '✨' },
      { key: 'video', label: 'Video Generation', icon: '🎬' },
      { key: 'image', label: 'Image Generation', icon: '🎨' },
      { key: 'edit', label: 'Editing & VFX', icon: '✂️' },
      { key: 'avatar', label: 'Avatar & Faces', icon: '👤' },
      { key: 'music', label: 'Music & Audio', icon: '🎵' },
      { key: 'tools', label: 'CLI & Tools', icon: '⚡' }
    ];

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ total: skills.length, categories, skills }));
    return;
  }

  if (pathname.startsWith('/api/skills/')) {
    const id = pathname.replace('/api/skills/', '');
    const skill = parseSkillFile(id);
    if (!skill) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Skill not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(skill));
    return;
  }

  // Test Run Endpoint (Simulator / Live RunComfy proxy)
  if (pathname === '/api/test-run' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { skillId, endpoint, input, apiKey, mode } = payload;

        // If simulated mode
        if (mode === 'simulate' || !apiKey) {
          const fakeRequestId = 'req_' + Math.random().toString(36).substring(2, 10);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            status: 'success',
            mode: 'simulation',
            requestId: fakeRequestId,
            endpoint: endpoint || skillId,
            message: 'Mô phỏng thành công! Dưới đây là kết quả mẫu theo cấu trúc RunComfy.',
            sampleOutput: {
              status: 'completed',
              duration: input.duration || 5,
              mediaUrl: skillId.includes('music') || skillId.includes('audio') 
                ? 'https://cdn.example.com/audio/sample-audio.mp3'
                : (skillId.includes('image') && !skillId.includes('to-video')
                    ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080'
                    : 'https://cdn.example.com/video/sample-render.mp4'),
              model: endpoint,
              input
            }
          }));
          return;
        }

        // Live API execution via fetch to RunComfy
        // (If user provided API key)
        const runComfyUrl = `https://api.runcomfy.com/v1/models/${endpoint}`;
        fetch(runComfyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(input)
        })
          .then(async r => {
            const data = await r.json();
            res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(data));
          })
          .catch(err => {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err.message }));
          });

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 RunComfy Skills Studio running at http://localhost:${PORT}`);
  console.log(`📚 Indexed skills from: ${SKILLS_DIR}`);
});
