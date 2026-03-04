let eduLevel = 'High School';
let knowledgeBase = [];
const VISION_DB_NAME = "VisionEternalMemory";

// --- 1. INITIALIZE INDEXED DB (Infinite Memory) ---
const dbRequest = indexedDB.open(VISION_DB_NAME, 1);
dbRequest.onupgradeneeded = (e) => {
  const db = e.target.result;
  if (!db.objectStoreNames.contains("chats")) {
    db.createObjectStore("chats", { keyPath: "id", autoIncrement: true });
  }
};

dbRequest.onsuccess = () => {
  updateHistoryUI(); 
};

async function saveToEternalMemory(type, content) {
  const db = await new Promise(resolve => dbRequest.onsuccess = (e) => resolve(e.target.result) || dbRequest.result);
  const transaction = db.transaction("chats", "readwrite");
  const store = transaction.objectStore("chats");
  store.add({
    timestamp: new Date().toISOString(),
    type: type, 
    content: content,
    eduLevel: eduLevel
  });
  
  transaction.oncomplete = () => { updateHistoryUI(); };
}

// --- 2. SMART TYPEWRITER ---
window.onload = () => {
  const output = document.getElementById('tutor-output');
  if(!output) return;
  const fullContent = output.innerHTML;
  output.innerHTML = "";
  let i = 0;
  const typewriter = setInterval(() => {
    if (fullContent[i] === '<') i = fullContent.indexOf('>', i) + 1;
    else i++;
    
    output.innerHTML = fullContent.substring(0, i);
    if (i >= fullContent.length) clearInterval(typewriter);
  }, 15);
};

// --- 3. UI CONTROLS ---
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
function openCamera() { document.getElementById('image-upload').click(); }
function setMode(mode) {
  eduLevel = mode;
  document.querySelectorAll('.age-pill').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
}
function createNewChat() {
  document.getElementById('hero-text').classList.remove('hidden');
  document.getElementById('preview-box').classList.add('hidden');
  document.getElementById('tutor-output').innerHTML = "Ready for a new logic layer. What subject are we exploring?";
  document.getElementById('user-query').value = "";
}

// --- 4. TESSERACT OCR ENGINE ---
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    document.getElementById('image-preview').src = e.target.result;
    document.getElementById('preview-box').classList.remove('hidden');
    document.getElementById('hero-text').classList.add('hidden');
    
    const status = document.getElementById('ocr-status');
    status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Vision OCR engine scanning layers...';
    
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text.trim();
      
      status.innerText = "OCR Analysis Complete.";
      if(text) {
        document.getElementById('tutor-output').innerHTML = `<strong>Vision Read:</strong><br>${text.substring(0, 300)}...<br><br><span class="gradient-text" style="font-size:1rem; margin-top:10px; display:block;">This scan is now saved to my permanent memory.</span>`;
        saveToEternalMemory('ocr_data', text);
        document.getElementById('user-query').value = text.substring(0, 50) + "..."; 
      } else {
        document.getElementById('tutor-output').innerHTML = "I couldn't detect any readable text in that image.";
      }
    } catch (err) {
      status.innerText = "OCR Error. Make sure you have internet access for Tesseract.";
    }
  };
  reader.readAsDataURL(file);
}

// --- 5. BRAIN SYNC & SEARCH ---
function loadDatabase(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      knowledgeBase = JSON.parse(e.target.result);
      const map = document.getElementById('subject-map');
      map.innerHTML = knowledgeBase.map(n => `
        <div style="padding:10px; cursor:pointer; color:#4285f4; border-bottom: 1px solid #333; transition:0.2s;" onmouseover="this.style.background='#2a2b2f'" onmouseout="this.style.background='transparent'" onclick="quickSearch('${n.content.subject}')">
          <i class="fa-solid fa-layer-group" style="margin-right: 8px;"></i> ${n.content.subject}
        </div>
      `).join('');
    } catch(err) {
      alert("Invalid JSON file uploaded.");
    }
  };
  reader.readAsText(file);
}

function quickSearch(sub) {
  document.getElementById('user-query').value = sub;
  runSearch();
}

function runSearch() {
  const queryInput = document.getElementById('user-query');
  const query = queryInput.value.toLowerCase();
  const output = document.getElementById('tutor-output');
  
  if(!query) return;

  document.getElementById('hero-text').classList.add('hidden');
  document.getElementById('preview-box').classList.add('hidden');
  
  let response = "Logic layer not found in current Brain sync, but I've noted this query in my long-term memory.";
  
  const match = knowledgeBase.find(node => node.content?.subject?.toLowerCase().includes(query));
  if(match) {
     response = match.content.hs || match.content.text || "Data found.";
  }

  output.innerHTML = response;
  saveToEternalMemory('chat_exchange', { query: queryInput.value, response: response });
  queryInput.value = ""; 
}

// --- 6. DEEP MEMORY SEARCH & TIMELINE ---
function updateHistoryUI(filteredData = null) {
  const historyBox = document.getElementById('chat-history');
  if(!historyBox) return;

  const db = dbRequest.result;
  if(!db) return; 
  
  const transaction = db.transaction("chats", "readonly");
  const store = transaction.objectStore("chats");
  const request = store.getAll();

  request.onsuccess = () => {
    const allHistory = request.result.reverse(); 
    const displayData = filteredData !== null ? filteredData : allHistory;

    if (displayData.length === 0) {
      historyBox.innerHTML = `<p class="empty-text" style="color: #666; font-size: 0.8rem; padding: 10px 0;">No memories found.</p>`;
      return;
    }

    historyBox.innerHTML = displayData.slice(0, 15).map(h => `
      <div class="history-item" style="padding:12px; border-radius: 8px; background: #131314; border: 1px solid #333; margin-bottom: 8px; font-size:0.8rem; cursor: pointer; transition: 0.2s;" onmouseover="this.style.borderColor='#4285f4'" onmouseout="this.style.borderColor='#333'" onclick="quickSearch('${h.type === 'ocr_data' ? 'Scanned Note' : h.content.query}')">
        <i class="fa-solid fa-clock-rotate-left" style="color: #9aa0a6;"></i> 
        <span style="color: #9aa0a6; margin-left: 5px;">${new Date(h.timestamp).toLocaleDateString()}</span>
        <div style="color:white; margin-top:6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${h.type === 'ocr_data' ? '<i class="fa-solid fa-camera"></i> Scan: ' + h.content : '<i class="fa-solid fa-comment"></i> ' + h.content.query}
        </div>
      </div>
    `).join('');
  };
}

function searchMemory() {
  const searchTerm = document.getElementById('memory-search').value.toLowerCase();
  const db = dbRequest.result;
  const transaction = db.transaction("chats", "readonly");
  const store = transaction.objectStore("chats");
  const request = store.getAll();

  request.onsuccess = () => {
    const allHistory = request.result.reverse(); 
    
    if (!searchTerm) {
      updateHistoryUI(allHistory); 
      return;
    }

    const filteredHistory = allHistory.filter(h => {
      const textToSearch = h.type === 'ocr_data' ? h.content : (h.content.query + " " + h.content.response);
      return textToSearch && textToSearch.toLowerCase().includes(searchTerm);
    });

    updateHistoryUI(filteredHistory);
  };
}
