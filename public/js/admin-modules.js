// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — Admin Module Management UI
// ═══════════════════════════════════════════════════════════════

let adminModules = [];
let currentEditingModule = null;
let currentEditingQuestion = null;

// ─── Initialize Admin Module Management ───
async function initAdminModules() {
  try {
    console.log('[Admin Modules] Initializing...');
    await loadAdminModules();
    renderModuleList();
    console.log('[Admin Modules] Initialized successfully');
  } catch (err) {
    console.error('[Admin Modules] Initialization error:', err);
    // Don't break the page, just log the error
  }
}

// ─── Load Modules from API ───
async function loadAdminModules() {
  try {
    const res = await fetch(`/api/admin/modules?key=${PSTAR.ADMIN_KEY}&includeInactive=true`);
    const data = await res.json();
    if (data.modules) {
      adminModules = data.modules;
    }
  } catch (err) {
    console.error('[Admin] Failed to load modules:', err);
    alert('Failed to load modules. Please try again.');
  }
}

// ─── Render Module List ───
function renderModuleList() {
  console.log('[Admin Modules] Rendering module list with', adminModules.length, 'modules');
  const container = document.getElementById('moduleListContainer');
  if (!container) {
    console.error('[Admin Modules] moduleListContainer not found in DOM!');
    return;
  }

  console.log('[Admin Modules] Container found:', container);

  if (adminModules.length === 0) {
    console.log('[Admin Modules] No modules to display');
    container.innerHTML = `
      <div class="empty-state">
        <p>No modules found. Create your first module to get started.</p>
      </div>
    `;
    return;
  }

  console.log('[Admin Modules] Rendering', adminModules.length, 'modules to table');

  const html = `
    <table class="tracker-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Module ID</th>
          <th>Title</th>
          <th>Questions</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${adminModules.map(m => `
          <tr>
            <td>${m.display_order}</td>
            <td><code>${m.module_id}</code></td>
            <td><strong>${m.title}</strong><br><small style="color:var(--text-light)">${m.description}</small></td>
            <td>0 questions</td>
            <td>
              <span class="status-badge ${m.is_active ? 'active' : 'inactive'}">
                ${m.is_active ? '✓ Active' : '✗ Inactive'}
              </span>
            </td>
            <td>
              <button class="btn-icon" onclick="editModule('${m.module_id}')" title="Edit Module">✏️</button>
              <button class="btn-icon" onclick="manageQuestions('${m.module_id}')" title="Manage Questions">❓</button>
              <button class="btn-icon" onclick="toggleModuleStatus('${m.module_id}', ${m.is_active})" title="Toggle Active">
                ${m.is_active ? '👁️' : '🚫'}
              </button>
              <button class="btn-icon" onclick="deleteModule('${m.module_id}')" title="Delete Module">🗑️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// ─── Show Add Module Form ───
function showAddModuleForm() {
  currentEditingModule = null;
  const form = document.getElementById('moduleFormContainer');
  if (!form) return;

  // Get next module ID and display order
  const nextOrder = adminModules.length > 0
    ? Math.max(...adminModules.map(m => m.display_order)) + 1
    : 1;
  const nextId = `m${nextOrder}`;

  form.innerHTML = `
    <div class="form-card">
      <h3>Add New Module</h3>
      <form id="moduleForm" onsubmit="saveModule(event)">
        <div class="form-group">
          <label for="moduleId">Module ID</label>
          <input type="text" id="moduleId" value="${nextId}" required readonly>
          <small>Auto-generated unique identifier</small>
        </div>

        <div class="form-group">
          <label for="moduleNum">Module Number</label>
          <input type="text" id="moduleNum" placeholder="e.g., Module 9" required>
        </div>

        <div class="form-group">
          <label for="moduleTitle">Title</label>
          <input type="text" id="moduleTitle" placeholder="Module title" required>
        </div>

        <div class="form-group">
          <label for="moduleDesc">Description</label>
          <textarea id="moduleDesc" rows="2" placeholder="Short description" required></textarea>
        </div>

        <div class="form-group">
          <label for="moduleContent">Content (HTML)</label>
          <textarea id="moduleContent" rows="10" placeholder="<div class='content-section'>...</div>" required></textarea>
          <small>Full HTML content for the module</small>
        </div>

        <div class="form-group">
          <label for="moduleOrder">Display Order</label>
          <input type="number" id="moduleOrder" value="${nextOrder}" min="0" required>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="moduleActive" checked>
            Active (visible to learners)
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn">Save Module</button>
          <button type="button" class="btn btn-outline" onclick="hideModuleForm()">Cancel</button>
        </div>
      </form>
    </div>
  `;

  form.style.display = 'block';
  document.getElementById('moduleNum').focus();
}

// ─── Edit Module ───
async function editModule(moduleId) {
  try {
    console.log(moduleId)
    const res = await fetch(`/api/admin/modules/${moduleId}?key=${PSTAR.ADMIN_KEY}`);
    const data = await res.json();

    console.log(data)

    if (!data.module) {
      alert('Module not found');
      return;
    }

    currentEditingModule = data.module;
    const form = document.getElementById('moduleFormContainer');
    if (!form) return;

    form.innerHTML = `
      <div class="form-card">
        <h3>Edit Modul: ${data.module.title}</h3>
        <form id="moduleForm" onsubmit="saveModule(event)">
          <div class="form-group">
            <label for="moduleId">Module ID</label>
            <input type="text" id="moduleId" value="${data.module.module_id}" readonly>
          </div>

          <div class="form-group">
            <label for="moduleNum">Module Number</label>
            <input type="text" id="moduleNum" value="${data.module.num}" required>
          </div>

          <div class="form-group">
            <label for="moduleTitle">Title</label>
            <input type="text" id="moduleTitle" value="${data.module.title}" required>
          </div>

          <div class="form-group">
            <label for="moduleDesc">Description</label>
            <textarea id="moduleDesc" rows="2" required>${data.module.description}</textarea>
          </div>

          <div class="form-group">
            <label for="moduleContent">Content (HTML)</label>
            <textarea id="moduleContent" rows="10" required>${data.module.content_html}</textarea>
          </div>

          <div class="form-group">
            <label for="moduleOrder">Display Order</label>
            <input type="number" id="moduleOrder" value="${data.module.display_order}" min="0" required>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" id="moduleActive" ${data.module.is_active ? 'checked' : ''}>
              Active (visible to learners)
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn">Update Module</button>
            <button type="button" class="btn btn-outline" onclick="hideModuleForm()">Cancel</button>
          </div>
        </form>
      </div>
    `;

    form.style.display = 'block';
    document.getElementById('moduleNum').focus();
  } catch (err) {
    console.error('[Admin] Failed to load module:', err);
    alert('Failed to load module details');
  }
}

// ─── Save Module (Create or Update) ───
async function saveModule(event) {
  event.preventDefault();

  console.log(event)

  const moduleId = document.getElementById('moduleId').value;
  const moduleNum = document.getElementById('moduleNum').value;
  const moduleTitle = document.getElementById('moduleTitle').value;
  const moduleDesc = document.getElementById('moduleDesc').value;
  const moduleContent = document.getElementById('moduleContent').value;
  const moduleOrder = parseInt(document.getElementById('moduleOrder').value);
  const moduleActive = document.getElementById('moduleActive').checked;

  const moduleData = {
    num: moduleNum,
    title: moduleTitle,
    description: moduleDesc,
    content_html: moduleContent,
    display_order: moduleOrder,
    is_active: moduleActive
  };

  console.log(moduleData)

  try {
    let res;
    if (currentEditingModule) {
      // Update existing module
      console.log(currentEditingModule)
      res = await fetch(`/api/admin/modules/${moduleId}?key=${PSTAR.ADMIN_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      });
      console.log(res)
    } else {
      // Create new module
      res = await fetch(`/api/admin/modules?key=${PSTAR.ADMIN_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, ...moduleData })
      });

      console.log(res)
    }

    const data = await res.json();

    console.log(data)

    if (res.ok && data.module) {
      alert(`Module ${currentEditingModule ? 'updated' : 'created'} successfully!`);
      hideModuleForm();
      await loadAdminModules();
      renderModuleList();
    } else {
      alert('Error: ' + (data.error || 'Failed to save module'));
    }
  } catch (err) {
    console.log(err)
    console.error('[Admin] Save module error:', err);
    alert('Failed to save module');
  }
}

// ─── Hide Module Form ───
function hideModuleForm() {
  const form = document.getElementById('moduleFormContainer');
  if (form) {
    form.style.display = 'none';
    form.innerHTML = '';
  }
  currentEditingModule = null;
}

// ─── Toggle Module Active Status ───
async function toggleModuleStatus(moduleId, currentStatus) {
  const action = currentStatus ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this module?`)) return;

  try {
    const res = await fetch(`/api/admin/modules/${moduleId}/toggle?key=${PSTAR.ADMIN_KEY}`, {
      method: 'POST'
    });

    const data = await res.json();

    if (res.ok && data.module) {
      await loadAdminModules();
      renderModuleList();
    } else {
      alert('Error: ' + (data.error || 'Failed to toggle module status'));
    }
  } catch (err) {
    console.error('[Admin] Toggle module error:', err);
    alert('Failed to toggle module status');
  }
}

// ─── Delete Module ───
async function deleteModule(moduleId) {
  const module = adminModules.find(m => m.module_id === moduleId);
  if (!module) return;

  if (!confirm(`Are you sure you want to delete "${module.title}"? This will also delete all associated questions.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/modules/${moduleId}?key=${PSTAR.ADMIN_KEY}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (res.ok) {
      alert('Module deleted successfully');
      await loadAdminModules();
      renderModuleList();
    } else {
      alert('Error: ' + (data.error || 'Failed to delete module'));
    }
  } catch (err) {
    console.error('[Admin] Delete module error:', err);
    alert('Failed to delete module');
  }
}

// ═══════════════════════════════════════════════════════════════
// QUESTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

let currentModuleQuestions = [];
let currentModuleId = null;

// ─── Manage Questions for a Module ───
async function manageQuestions(moduleId) {
  currentModuleId = moduleId;
  const module = adminModules.find(m => m.module_id === moduleId);

  if (!module) {
    alert('Module not found');
    return;
  }

  // Switch to questions tab and load questions
  switchAdminTab('questionsTab');
  document.getElementById('questionsModuleTitle').textContent = module.title;
  await loadModuleQuestions(moduleId);
  renderQuestionList();
}

// ─── Load Questions for Module ───
async function loadModuleQuestions(moduleId) {
  try {
    const res = await fetch(`/api/admin/questions/${moduleId}?key=${PSTAR.ADMIN_KEY}&includeInactive=true`);
    const data = await res.json();
    currentModuleQuestions = data.questions || [];
  } catch (err) {
    console.error('[Admin] Failed to load questions:', err);
    alert('Failed to load questions');
  }
}

// ─── Render Question List ───
function renderQuestionList() {
  const container = document.getElementById('questionListContainer');
  if (!container) return;

  if (!currentModuleId) {
    container.innerHTML = '<p>Select a module to manage questions.</p>';
    return;
  }

  if (currentModuleQuestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No questions found for this module.</p>
        <button class="btn" onclick="showAddQuestionForm()">Add First Question</button>
      </div>
    `;
    return;
  }

  const html = `
    <div class="question-actions" style="margin-bottom:1rem">
      <button class="btn" onclick="showAddQuestionForm()">+ Add Question</button>
      <button class="btn btn-outline" onclick="showBulkUploadForm()">📤 Bulk Upload</button>
      <button class="btn btn-outline" onclick="backToModules()">← Back to Modules</button>
    </div>
    <table class="tracker-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Question</th>
          <th>Options</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${currentModuleQuestions.map((q, idx) => `
          <tr>
            <td>${q.display_order + 1}</td>
            <td>
              <strong>${q.question_text.substring(0, 60)}${q.question_text.length > 60 ? '...' : ''}</strong>
              <br><small style="color:var(--text-light)">${q.options ? q.options.length : 0} options</small>
            </td>
            <td>${q.options ? q.options.filter(o => o.is_correct).length + ' correct' : 'N/A'}</td>
            <td>
              <span class="status-badge ${q.is_active ? 'active' : 'inactive'}">
                ${q.is_active ? '✓ Active' : '✗ Inactive'}
              </span>
            </td>
            <td>
              <button class="btn-icon" onclick="editQuestion(${q.id})" title="Edit">✏️</button>
              <button class="btn-icon" onclick="deleteQuestion(${q.id})" title="Delete">🗑️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// ─── Back to Modules List ───
function backToModules() {
  switchAdminTab('modulesTab');
  currentModuleId = null;
  currentModuleQuestions = [];
}

// ─── Show Add Question Form ───
function showAddQuestionForm() {
  if (!currentModuleId) {
    alert('Please select a module first');
    return;
  }

  currentEditingQuestion = null;
  const form = document.getElementById('questionFormContainer');
  if (!form) return;

  const nextOrder = currentModuleQuestions.length;

  form.innerHTML = `
    <div class="form-card">
      <h3>Add New Question</h3>
      <form id="questionForm" onsubmit="saveQuestion(event)">
        <div class="form-group">
          <label for="questionText">Question Text</label>
          <textarea id="questionText" rows="3" placeholder="Enter question text" required></textarea>
        </div>

        <div class="form-group">
          <label for="questionExplanation">Explanation (shown after answer)</label>
          <textarea id="questionExplanation" rows="2" placeholder="Explain the correct answer" required></textarea>
        </div>

        <div class="form-group">
          <label>Answer Options</label>
          <div id="optionsContainer">
            ${[0, 1, 2, 3].map(i => `
              <div class="option-row" style="display:flex;gap:.5rem;margin-bottom:.5rem;align-items:center">
                <input type="text" class="option-text" placeholder="Option ${i + 1}" required style="flex:1">
                <label style="white-space:nowrap">
                  <input type="radio" name="correctOption" value="${i}" ${i === 0 ? 'checked' : ''} required>
                  Correct
                </label>
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-sm btn-outline" onclick="addOptionRow()" style="margin-top:.5rem">+ Add Option</button>
        </div>

        <div class="form-group">
          <label for="questionOrder">Display Order</label>
          <input type="number" id="questionOrder" value="${nextOrder}" min="0" required>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="questionActive" checked>
            Active
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn">Save Question</button>
          <button type="button" class="btn btn-outline" onclick="hideQuestionForm()">Cancel</button>
        </div>
      </form>
    </div>
  `;

  form.style.display = 'block';
  document.getElementById('questionText').focus();
}

// ─── Add Option Row ───
function addOptionRow() {
  const container = document.getElementById('optionsContainer');
  if (!container) return;

  const currentCount = container.querySelectorAll('.option-row').length;

  const row = document.createElement('div');
  row.className = 'option-row';
  row.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.5rem;align-items:center';
  row.innerHTML = `
    <input type="text" class="option-text" placeholder="Option ${currentCount + 1}" required style="flex:1">
    <label style="white-space:nowrap">
      <input type="radio" name="correctOption" value="${currentCount}" required>
      Correct
    </label>
    <button type="button" class="btn-icon" onclick="this.parentElement.remove()">🗑️</button>
  `;

  container.appendChild(row);
}

// ─── Edit Question ───
async function editQuestion(questionId) {
  try {
    const res = await fetch(`/api/admin/questions/single/${questionId}?key=${PSTAR.ADMIN_KEY}`);
    const data = await res.json();

    if (!data.question) {
      alert('Question not found');
      return;
    }

    currentEditingQuestion = data.question;
    const form = document.getElementById('questionFormContainer');
    if (!form) return;

    const options = data.question.options || [];
    const correctIndex = options.findIndex(o => o.is_correct);

    form.innerHTML = `
      <div class="form-card">
        <h3>Edit Question</h3>
        <form id="questionForm" onsubmit="saveQuestion(event)">
          <input type="hidden" id="questionId" value="${data.question.id}">

          <div class="form-group">
            <label for="questionText">Question Text</label>
            <textarea id="questionText" rows="3" required>${data.question.question_text}</textarea>
          </div>

          <div class="form-group">
            <label for="questionExplanation">Explanation</label>
            <textarea id="questionExplanation" rows="2" required>${data.question.explanation}</textarea>
          </div>

          <div class="form-group">
            <label>Answer Options</label>
            <div id="optionsContainer">
              ${options.map((opt, i) => `
                <div class="option-row" style="display:flex;gap:.5rem;margin-bottom:.5rem;align-items:center">
                  <input type="text" class="option-text" value="${opt.option_text}" required style="flex:1">
                  <label style="white-space:nowrap">
                    <input type="radio" name="correctOption" value="${i}" ${i === correctIndex ? 'checked' : ''} required>
                    Correct
                  </label>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-sm btn-outline" onclick="addOptionRow()" style="margin-top:.5rem">+ Add Option</button>
          </div>

          <div class="form-group">
            <label for="questionOrder">Display Order</label>
            <input type="number" id="questionOrder" value="${data.question.display_order}" min="0" required>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" id="questionActive" ${data.question.is_active ? 'checked' : ''}>
              Active
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn">Update Question</button>
            <button type="button" class="btn btn-outline" onclick="hideQuestionForm()">Cancel</button>
          </div>
        </form>
      </div>
    `;

    form.style.display = 'block';
    document.getElementById('questionText').focus();
  } catch (err) {
    console.error('[Admin] Failed to load question:', err);
    alert('Failed to load question details');
  }
}

// ─── Save Question (Create or Update) ───
async function saveQuestion(event) {
  event.preventDefault();

  const questionText = document.getElementById('questionText').value;
  const explanation = document.getElementById('questionExplanation').value;
  const order = parseInt(document.getElementById('questionOrder').value);
  const isActive = document.getElementById('questionActive').checked;

  // Collect options
  const optionRows = document.querySelectorAll('.option-row');
  const options = [];
  const correctRadio = document.querySelector('input[name="correctOption"]:checked');

  if (!correctRadio) {
    alert('Please select a correct answer');
    return;
  }

  const correctIndex = parseInt(correctRadio.value);

  optionRows.forEach((row, idx) => {
    const text = row.querySelector('.option-text').value.trim();
    if (text) {
      options.push({
        text,
        is_correct: idx === correctIndex
      });
    }
  });

  if (options.length < 2) {
    alert('Please provide at least 2 options');
    return;
  }

  const questionData = {
    question_text: questionText,
    explanation,
    display_order: order,
    is_active: isActive,
    options
  };

  try {
    let res;
    if (currentEditingQuestion) {
      // Update existing question
      const questionId = document.getElementById('questionId').value;
      res = await fetch(`/api/admin/questions/${questionId}?key=${PSTAR.ADMIN_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });
    } else {
      // Create new question
      res = await fetch(`/api/admin/questions?key=${PSTAR.ADMIN_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: currentModuleId,
          ...questionData
        })
      });
    }

    const data = await res.json();

    if (res.ok && data.question) {
      alert(`Question ${currentEditingQuestion ? 'updated' : 'created'} successfully!`);
      hideQuestionForm();
      await loadModuleQuestions(currentModuleId);
      renderQuestionList();
    } else {
      alert('Error: ' + (data.error || 'Failed to save question'));
    }
  } catch (err) {
    console.error('[Admin] Save question error:', err);
    alert('Failed to save question');
  }
}

// ─── Hide Question Form ───
function hideQuestionForm() {
  const form = document.getElementById('questionFormContainer');
  if (form) {
    form.style.display = 'none';
    form.innerHTML = '';
  }
  currentEditingQuestion = null;
}

// ─── Delete Question ───
async function deleteQuestion(questionId) {
  if (!confirm('Are you sure you want to delete this question?')) return;

  try {
    const res = await fetch(`/api/admin/questions/${questionId}?key=${PSTAR.ADMIN_KEY}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (res.ok) {
      alert('Question deleted successfully');
      await loadModuleQuestions(currentModuleId);
      renderQuestionList();
    } else {
      alert('Error: ' + (data.error || 'Failed to delete question'));
    }
  } catch (err) {
    console.error('[Admin] Delete question error:', err);
    alert('Failed to delete question');
  }
}

// ═══════════════════════════════════════════════════════════════
// BULK UPLOAD
// ═══════════════════════════════════════════════════════════════

function showBulkUploadForm() {
  const form = document.getElementById('bulkUploadContainer');
  if (!form) return;

  form.innerHTML = `
    <div class="form-card">
      <h3>Bulk Upload Questions</h3>
      <p>Upload multiple questions at once using JSON format.</p>

      <div class="info-box tip" style="margin:1rem 0">
        <div class="ib-icon">💡</div>
        <div>
          <strong>JSON Format:</strong>
          <pre style="margin-top:.5rem;font-size:.85rem">[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "explanation": "Explanation of correct answer"
  }
]</pre>
        </div>
      </div>

      <form id="bulkUploadForm" onsubmit="processBulkUpload(event)">
        <div class="form-group">
          <label for="bulkQuestions">Questions JSON</label>
          <textarea id="bulkQuestions" rows="12" placeholder='[{"question": "...", "options": [...], "correctIndex": 0, "explanation": "..."}]' required></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn">Upload Questions</button>
          <button type="button" class="btn btn-outline" onclick="hideBulkUploadForm()">Cancel</button>
        </div>
      </form>
    </div>
  `;

  form.style.display = 'block';
  document.getElementById('bulkQuestions').focus();
}

async function processBulkUpload(event) {
  event.preventDefault();

  const jsonText = document.getElementById('bulkQuestions').value;

  let questions;
  try {
    questions = JSON.parse(jsonText);
  } catch (err) {
    alert('Invalid JSON format. Please check your input.');
    return;
  }

  if (!Array.isArray(questions)) {
    alert('JSON must be an array of questions');
    return;
  }

  try {
    const res = await fetch(`/api/admin/questions/bulk?key=${PSTAR.ADMIN_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module_id: currentModuleId,
        questions
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Bulk upload complete!\nCreated: ${data.created}\nErrors: ${data.errors}`);
      if (data.errors > 0) {
        console.error('Bulk upload errors:', data.details.errors);
      }
      hideBulkUploadForm();
      await loadModuleQuestions(currentModuleId);
      renderQuestionList();
    } else {
      alert('Error: ' + (data.error || 'Failed to upload questions'));
    }
  } catch (err) {
    console.error('[Admin] Bulk upload error:', err);
    alert('Failed to upload questions');
  }
}

function hideBulkUploadForm() {
  const form = document.getElementById('bulkUploadContainer');
  if (form) {
    form.style.display = 'none';
    form.innerHTML = '';
  }
}

// ─── Switch Admin Tabs ───
function switchAdminTab(tabId) {
  // Hide all panels
  document.querySelectorAll('.admin-tab-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

  // Show selected panel
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');

  // Activate tab button
  const tabButton = document.querySelector(`[onclick="switchAdminTab('${tabId}')"]`);
  if (tabButton) tabButton.classList.add('active');
}
