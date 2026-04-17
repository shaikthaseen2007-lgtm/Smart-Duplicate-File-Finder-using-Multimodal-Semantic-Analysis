document.addEventListener('DOMContentLoaded', () => {
    // Nav Logic
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            viewSections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(view).classList.add('active');

            pageTitle.innerText = item.innerText.trim();
        });
    });

    // Upload & Drag Drop Logic
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const btnUpload = document.getElementById('btnUpload');
    const progressArea = document.getElementById('progressArea');
    const progressFill = document.querySelector('.progress-fill');
    
    let selectedFiles = [];

    // Dashboard Elements
    const totFilesEl = document.getElementById('totFiles');
    const totGroupsEl = document.getElementById('totGroups');
    const totSavingsEl = document.getElementById('totSavings');
    const avgConfEl = document.getElementById('avgConf');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const chartPlaceholder = document.querySelector('.chart-placeholder');
    const clusterList = document.getElementById('clusterList');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    });

    function handleFiles(files) {
        selectedFiles = Array.from(files);
        dropZone.querySelector('p').innerText = `${selectedFiles.length} file(s) selected`;
        btnUpload.disabled = selectedFiles.length < 2;
    }

    btnUpload.addEventListener('click', async () => {
        if (selectedFiles.length < 2) return;

        btnUpload.disabled = true;
        progressArea.classList.remove('hidden');
        progressFill.style.width = '0%';

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressFill.style.width = `${progress}%`;
            if (progress >= 90) clearInterval(interval);
        }, 300);

        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));

        try {
            const response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();
            
            clearInterval(interval);
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                progressArea.classList.add('hidden');
                processResults(data.results, selectedFiles);
                updateCharts(selectedFiles);
                navItems[2].click(); // Goto results
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            alert('Analysis Error. Is the backend running?');
            clearInterval(interval);
            progressArea.classList.add('hidden');
            btnUpload.disabled = false;
        }
    });

    function updateCharts(files) {
        const extCount = {};
        files.forEach(f => {
            const ext = f.name.split('.').pop().toUpperCase() || 'UNKNOWN';
            extCount[ext] = (extCount[ext] || 0) + 1;
        });

        chartPlaceholder.innerHTML = '';
        const colors = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];
        let cIdx = 0;

        for (const [ext, count] of Object.entries(extCount)) {
            const percentage = Math.round((count / files.length) * 100);
            const bar = document.createElement('div');
            bar.className = 'sim-bar';
            bar.style.width = `${percentage}%`;
            bar.style.background = colors[cIdx % colors.length];
            bar.innerText = `${ext} (${percentage}%)`;
            chartPlaceholder.appendChild(bar);
            cIdx++;
        }
    }

    function processResults(results, files) {
        btnUpload.disabled = false;
        if (!results || results.length === 0) {
            resultsTableBody.innerHTML = `<tr><td colspan="5" class="text-center subtle-text">Upload at least two files to see comparisons.</td></tr>`;
            return;
        }

        totFilesEl.innerText = files.length;
        
        let groups = 0;
        let confSum = 0;

        resultsTableBody.innerHTML = '';
        const clusters = {};

        results.forEach(res => {
            let badgeClass = 'badge-danger';
            if (res.classification === 'Unique') badgeClass = 'badge-success'; // assuming green for safe
            else if (res.classification === 'Partially Similar') badgeClass = 'badge-warning';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 500;">${res.file1}</div>
                    <div class="subtle-text">vs ${res.file2}</div>
                </td>
                <td>
                    <div style="font-weight: 500; font-size: 0.85rem">🗣️ ${res.topic1 || 'Unknown'}</div>
                    <div class="subtle-text" style="font-size: 0.85rem">🗣️ ${res.topic2 || 'Unknown'}</div>
                </td>
                <td><span class="badge ${badgeClass}">${res["similarity (%)"].toFixed(1)}% (${res.classification})</span></td>
                <td>—</td>
                <td>
                    <button class="action-btn btn-review" data-file="${res.file1}">Review F1</button>
                    <button class="action-btn btn-review" data-file="${res.file2}">Review F2</button>
                    ${res.classification !== 'Unique' ? `<button class="action-btn delete btn-delete" data-file="${res.file2}">Del F2</button>` : ''}
                </td>
            `;
            resultsTableBody.appendChild(tr);

            // only cluster non-unique matches
            if (res.classification !== 'Unique') {
                groups++;
                confSum += res["similarity (%)"];
                
                if (!clusters[res.file1]) clusters[res.file1] = [];
                clusters[res.file1].push({ match: res.file2, score: res["similarity (%)"], topic: res.topic2 });
            }
        });

        // Always show the comparisons since they want to see all pairs.
        totGroupsEl.innerText = groups;
        totSavingsEl.innerText = `N/A`; 
        avgConfEl.innerText = groups > 0 ? `${(confSum / groups).toFixed(0)}%` : `0%`;
        
        if (groups > 0) {
            buildClusterView(clusters);
        } else {
            clusterList.innerHTML = `<div class="empty-state text-center py-2 subtle-text">No duplicate clusters formed. All files unique.</div>`;
        }
        
        attachActionListeners();
    }

    function buildClusterView(clusters) {
        clusterList.innerHTML = '';
        Object.entries(clusters).forEach(([rootFile, matches]) => {
            const div = document.createElement('div');
            div.style.background = 'var(--card-bg)';
            div.style.border = '1px solid var(--border-color)';
            div.style.padding = '1rem';
            div.style.borderRadius = '8px';
            div.style.marginBottom = '1rem';
            
            let html = `<h4>Cluster: ${rootFile}</h4><ul style="margin-left:20px; margin-top:10px;" class="subtle-text">`;
            matches.forEach(m => {
                html += `<li>${m.match} (Similarity: ${m.score.toFixed(1)}%, Topic: ${m.topic})</li>`;
            });
            html += `</ul>`;
            div.innerHTML = html;
            clusterList.appendChild(div);
        });
    }

    function attachActionListeners() {
        document.querySelectorAll('.btn-review').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fname = e.target.getAttribute('data-file');
                window.open(`http://127.0.0.1:5000/file/${fname}`, '_blank');
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(!confirm('Are you sure you want to completely DELETE this file from your system?')) return;
                const fname = e.target.getAttribute('data-file');
                const row = e.target.closest('tr');
                
                try {
                    const res = await fetch('http://127.0.0.1:5000/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: fname })
                    });
                    if(res.ok) {
                        row.remove();
                    } else {
                        alert('Could not delete file.');
                    }
                } catch(error) {
                    console.error('Delete error', error);
                }
            });
        });
    }
});
