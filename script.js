const APP_STATE = {
            readTopics: new Set(JSON.parse(localStorage.getItem('doc_read_topics') || '[]')),
            videoLinks: JSON.parse(localStorage.getItem('doc_video_links') || '{}'),
            theme: localStorage.getItem('doc_theme') || 'dark'
        };

        window.onload = function() {
            initTheme();
            initNielsenChecklist();
            initScrollSpy();
            loadSavedVideos();
            updateOverallProgress();
            
            // Load initial simulators
            loadJestScenario();
            sendPostmanRequest();
            calculateROI();
            initPerformanceCanvas();
            testSqlInjection();
            selectTddPhase('red');
            initGherkinDefault();

            // Mobile menu listeners
            document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
                document.getElementById('sidebar-nav').classList.remove('-translate-x-full');
            });
            document.getElementById('mobile-menu-close').addEventListener('click', () => {
                document.getElementById('sidebar-nav').classList.add('-translate-x-full');
            });
            document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

            // Search listener
            document.getElementById('global-search').addEventListener('input', handleGlobalSearch);
        };

        function initTheme() {
            if (APP_STATE.theme === 'dark') {
                document.documentElement.classList.add('dark');
                document.getElementById('theme-toggle-icon').className = 'fa-solid fa-sun text-amber-400 text-lg';
            } else {
                document.documentElement.classList.remove('dark');
                document.getElementById('theme-toggle-icon').className = 'fa-solid fa-moon text-slate-600 text-lg';
            }
        }

        function toggleTheme() {
            APP_STATE.theme = APP_STATE.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('doc_theme', APP_STATE.theme);
            initTheme();
        }

        function toggleTopicRead(topicNum) {
            if (APP_STATE.readTopics.has(topicNum)) {
                APP_STATE.readTopics.delete(topicNum);
            } else {
                APP_STATE.readTopics.add(topicNum);
            }
            localStorage.setItem('doc_read_topics', JSON.stringify([...APP_STATE.readTopics]));
            updateOverallProgress();
        }

        function updateOverallProgress() {
            const total = 8;
            const completed = APP_STATE.readTopics.size;
            const percentage = Math.round((completed / total) * 100);

            document.getElementById('overall-progress-bar').style.width = percentage + '%';
            document.getElementById('overall-progress-text').innerText = percentage + '%';

            // Update UI buttons & checkboxes
            for (let i = 1; i <= 8; i++) {
                const isRead = APP_STATE.readTopics.has(i);
                const checkIcon = document.querySelector(`.topic-check[data-topic="${i}"]`);
                const markBtn = document.querySelector(`.mark-read-btn[data-topic="${i}"]`);

                if (checkIcon) {
                    checkIcon.className = isRead 
                        ? 'fa-solid fa-circle-check text-emerald-500 topic-check' 
                        : 'fa-regular fa-circle-check text-slate-300 dark:text-slate-700 topic-check';
                }

                if (markBtn) {
                    markBtn.className = isRead
                        ? 'mark-read-btn text-xs px-3 py-2 rounded-lg bg-emerald-500 text-white font-semibold transition-all flex items-center gap-2'
                        : 'mark-read-btn text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all flex items-center gap-2';
                    markBtn.querySelector('span').innerText = isRead ? 'Concluído' : 'Marcar como Lido';
                }
            }
        }

        function handleGlobalSearch(e) {
            const query = e.target.value.toLowerCase().trim();
            const sections = document.querySelectorAll('.topic-section');

            sections.forEach(section => {
                const text = section.innerText.toLowerCase();
                if (text.includes(query)) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }

        function openVideoManagerModal(topicNum = 1) {
            document.getElementById('modal-topic-select').value = topicNum;
            document.getElementById('modal-video-url').value = APP_STATE.videoLinks[topicNum] || '';
            document.getElementById('video-modal').classList.remove('hidden');
            document.getElementById('video-modal').classList.add('flex');
        }

        function closeVideoModal() {
            document.getElementById('video-modal').classList.add('hidden');
            document.getElementById('video-modal').classList.remove('flex');
        }

        function saveVideoLink() {
            const topicNum = document.getElementById('modal-topic-select').value;
            const url = document.getElementById('modal-video-url').value.trim();

            if (url) {
                APP_STATE.videoLinks[topicNum] = url;
            } else {
                delete APP_STATE.videoLinks[topicNum];
            }

            localStorage.setItem('doc_video_links', JSON.stringify(APP_STATE.videoLinks));
            renderVideoPlayer(topicNum, url);
            closeVideoModal();
        }

        function loadSavedVideos() {
            for (let i = 1; i <= 8; i++) {
                if (APP_STATE.videoLinks[i]) {
                    renderVideoPlayer(i, APP_STATE.videoLinks[i]);
                }
            }
        }

        function renderVideoPlayer(topicNum, url) {
            const container = document.getElementById(`video-container-${topicNum}`);
            if (!url) return;

            let iframeSrc = url;
            // Format YouTube URL automatically if needed
            if (url.includes('youtube.com/watch?v=')) {
                iframeSrc = url.replace('watch?v=', 'embed/');
            }

            container.innerHTML = `
                <iframe src="${iframeSrc}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            `;
        }

        const JEST_SCENARIOS = {
            pass: {
                code: `// desconto.js\nfunction calculaDesconto(valor, cupom) {\n  if (cupom === 'SQUAD10') return valor * 0.9;\n  if (cupom === 'SQUAD20') return valor * 0.8;\n  return valor;\n}\nmodule.exports = { calculaDesconto };`,
                test: `const { calculaDesconto } = require('./desconto');\n\ntest('Aplica 10% de desconto corretamente', () => {\n  expect(calculaDesconto(100, 'SQUAD10')).toBe(90);\n});\n\ntest('Retorna valor integral sem cupom', () => {\n  expect(calculaDesconto(100, '')).toBe(100);\n});`
            },
            fail: {
                code: `// desconto.js (Com Bug!)\nfunction calculaDesconto(valor, cupom) {\n  if (cupom === 'SQUAD10') return valor - 5; // Erro de regra!\n  return valor;\n}\nmodule.exports = { calculaDesconto };`,
                test: `const { calculaDesconto } = require('./desconto');\n\ntest('Aplica 10% de desconto corretamente', () => {\n  expect(calculaDesconto(100, 'SQUAD10')).toBe(90);\n});`
            }
        };

        function loadJestScenario() {
            const type = document.getElementById('jest-scenario-select').value;
            document.getElementById('jest-code-input').value = JEST_SCENARIOS[type].code;
            document.getElementById('jest-test-code').innerText = JEST_SCENARIOS[type].test;
        }

        function runJestSimulation() {
            const code = document.getElementById('jest-code-input').value;
            const consoleBox = document.getElementById('jest-console-output');
            const badge = document.getElementById('jest-status-badge');

            consoleBox.innerHTML = '<div class="text-blue-400">RUNS ./desconto.test.js...</div>';

            setTimeout(() => {
                if (code.includes('valor * 0.9')) {
                    badge.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
                    badge.innerText = 'PASS';
                    consoleBox.innerHTML = `
                        <div class="text-emerald-400 font-bold">PASS ./desconto.test.js</div>
                        <div class="text-slate-300">✓ Aplica 10% de desconto corretamente (3 ms)</div>
                        <div class="text-slate-300">✓ Retorna valor integral sem cupom (1 ms)</div>
                        <div class="pt-2 text-slate-500">Test Suites: 1 passed, 1 total | Tests: 2 passed, 2 total | Time: 0.42s</div>
                    `;
                } else {
                    badge.className = 'text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40';
                    badge.innerText = 'FAIL';
                    consoleBox.innerHTML = `
                        <div class="text-rose-400 font-bold">FAIL ./desconto.test.js</div>
                        <div class="text-rose-300">✕ Aplica 10% de desconto corretamente</div>
                        <div class="text-slate-400 pl-4">Expected: 90</div>
                        <div class="text-slate-400 pl-4">Received: 95</div>
                        <div class="pt-2 text-slate-500">Test Suites: 1 failed, 1 total | Time: 0.38s</div>
                    `;
                }
            }, 300);
        }

        function sendPostmanRequest() {
            const method = document.getElementById('postman-method').value;
            const url = document.getElementById('postman-url').value;
            const jsonBox = document.getElementById('postman-response-json');
            const testBox = document.getElementById('postman-test-results');

            jsonBox.innerText = '// Enviando requisição HTTP...';

            setTimeout(() => {
                const responseData = {
                    id: 102,
                    nome: "Engenharia Squad User",
                    email: "squad@doctest.edu.br",
                    status: "Ativo",
                    timestamp: new Date().toISOString()
                };

                jsonBox.innerText = JSON.stringify(responseData, null, 2);

                testBox.innerHTML = `
                    <div class="flex items-center gap-1.5 text-emerald-400"><i class="fa-solid fa-check"></i> [PASS] Status code is 200 OK</div>
                    <div class="flex items-center gap-1.5 text-emerald-400"><i class="fa-solid fa-check"></i> [PASS] Response time < 200ms</div>
                    <div class="flex items-center gap-1.5 text-emerald-400"><i class="fa-solid fa-check"></i> [PASS] Content-Type is application/json</div>
                    <div class="flex items-center gap-1.5 text-emerald-400"><i class="fa-solid fa-check"></i> [PASS] User ID matches 102</div>
                `;
            }, 250);
        }

        function runE2ESimulation() {
            const btn = document.getElementById('e2e-start-btn');
            const log = document.getElementById('e2e-terminal-log');
            const userInput = document.getElementById('e2e-input-user');
            const passInput = document.getElementById('e2e-input-pass');
            const form = document.getElementById('e2e-mock-form');
            const dash = document.getElementById('e2e-mock-dashboard');

            btn.disabled = true;
            btn.classList.add('opacity-50');
            log.innerHTML = '';
            userInput.value = '';
            passInput.value = '';
            form.classList.remove('hidden');
            dash.classList.add('hidden');

            function addLog(msg, color = 'text-slate-300') {
                log.innerHTML += `<div class="${color}">${msg}</div>`;
                log.scrollTop = log.scrollHeight;
            }

            addLog('[Playwright] NAVEGADOR INICIALIZADO (Chromium Headless)', 'text-teal-400');
            
            setTimeout(() => {
                addLog('page.goto("https://loja.squad.com/login")');
            }, 400);

            setTimeout(() => {
                addLog('page.fill("#username", "admin_squad")');
                userInput.value = 'admin_squad';
            }, 1000);

            setTimeout(() => {
                addLog('page.fill("#password", "••••••••")');
                passInput.value = '12345678';
            }, 1600);

            setTimeout(() => {
                addLog('page.click("#submit-btn")');
            }, 2200);

            setTimeout(() => {
                form.classList.add('hidden');
                dash.classList.remove('hidden');
                document.getElementById('e2e-url-bar').innerText = 'https://loja.squad.com/dashboard';
                addLog('expect(page.url()).toBe("/dashboard")', 'text-emerald-400 font-bold');
                addLog('✔ TESTE E2E CONCLUÍDO COM SUCESSO EM 2.4s', 'text-emerald-400 font-bold');

                btn.disabled = false;
                btn.classList.remove('opacity-50');
            }, 2800);
        }

        function updatePerfMetrics() {
            const users = document.getElementById('users-slider').value;
            const ramp = document.getElementById('ramp-slider').value;

            document.getElementById('users-val').innerText = users;
            document.getElementById('ramp-val').innerText = ramp + 's';

            // Calculate KPIs
            const respTime = Math.round(80 + (users * 0.25));
            const throughput = Math.round(users * 7.5);
            const errRate = (users > 600 ? ((users - 600) * 0.02).toFixed(2) : 0.02);

            document.getElementById('kpi-response-time').innerText = respTime + ' ms';
            document.getElementById('kpi-throughput').innerText = throughput.toLocaleString() + ' req/s';
            document.getElementById('kpi-error-rate').innerText = errRate + ' %';
        }

        function initPerformanceCanvas() {
            updatePerfMetrics();
            drawPerfChart();
        }

        function runPerformanceTest() {
            drawPerfChart(true);
        }

        function drawPerfChart(animated = false) {
            const canvas = document.getElementById('perf-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 180;

            const users = parseInt(document.getElementById('users-slider').value);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw grid lines
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let y = 30; y < canvas.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Generate curve points
            ctx.beginPath();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;

            const points = [];
            const steps = 30;
            for (let i = 0; i <= steps; i++) {
                const x = (canvas.width / steps) * i;
                const progress = i / steps;
                const noise = (Math.random() - 0.5) * 15;
                const baseHeight = canvas.height - 20 - (progress * (users / 1000) * (canvas.height - 60)) + noise;
                points.push({ x, y: Math.max(20, baseHeight) });
            }

            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }

        function setSqlPayload(payload) {
            document.getElementById('sql-input-user').value = payload;
            testSqlInjection();
        }

        function testSqlInjection() {
            const input = document.getElementById('sql-input-user').value;
            const resCard = document.getElementById('sql-result-card');
            const vulnBox = document.getElementById('sql-query-vulnerable');
            const secBox = document.getElementById('sql-query-secure');

            vulnBox.innerText = `SELECT * FROM usuarios WHERE username = '${input}' AND status = 'Ativo';`;
            secBox.innerText = `SELECT * FROM usuarios WHERE username = ? AND status = 'Ativo';\n[Param 1 = "${input}"]`;

            if (input.includes("' OR '1'='1") || input.includes("' OR 1=1")) {
                resCard.className = 'p-3.5 rounded-xl bg-rose-950 border border-rose-800 text-xs font-mono text-rose-300 flex items-center justify-center text-center';
                resCard.innerHTML = '🚨 VULNERABILIDADE EXPLORADA!<br>Bypass bem-sucedido. Todos os registros retornados.';
            } else {
                resCard.className = 'p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center justify-center text-center';
                resCard.innerHTML = '✅ Autenticação Normal / Acesso Restrito.';
            }
        }

        const NIELSEN_HEURISTICS = [
            "1. Visibilidade do status do sistema (Feedback visual instantâneo)",
            "2. Correspondência entre o sistema e o mundo real (Linguagem clara)",
            "3. Controle e liberdade do usuário (Desfazer/Refazer ações)",
            "4. Consistência e padrões (Elementos visuais uniformes)",
            "5. Prevenção de erros (Validação em tempo real de inputs)",
            "6. Reconhecimento em vez de memorização (Ações visíveis)",
            "7. Flexibilidade e eficiência de uso (Atalhos para avançados)",
            "8. Estética e design minimalista (Sem excesso de ruído)",
            "9. Ajudar os usuários a reconhecer e recuperar erros (Mensagens úteis)",
            "10. Ajuda e documentação (Suporte fácil de localizar)"
        ];

        function initNielsenChecklist() {
            const container = document.getElementById('nielsen-checklist-container');
            if (!container) return;

            container.innerHTML = NIELSEN_HEURISTICS.map((item, idx) => `
                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 cursor-pointer text-xs font-medium">
                    <span>${item}</span>
                    <input type="checkbox" onchange="calculateUxScore()" class="nielsen-check accent-purple-600 w-4 h-4 rounded">
                </label>
            `).join('');
        }

        function calculateUxScore() {
            const checks = document.querySelectorAll('.nielsen-check');
            let count = 0;
            checks.forEach(c => { if (c.checked) count++; });
            const pct = Math.round((count / checks.length) * 100);
            document.getElementById('ux-score-badge').innerText = pct + '%';
        }

        function calculateROI() {
            const tests = parseInt(document.getElementById('roi-tests-count').value) || 0;
            const minPerTest = parseInt(document.getElementById('roi-manual-time').value) || 0;
            const qaRate = parseInt(document.getElementById('roi-qa-rate').value) || 0;

            const totalHoursSprint = (tests * minPerTest) / 60;
            const annualHours = totalHoursSprint * 12; // 12 Sprints
            const annualManualCost = annualHours * qaRate;

            // Automation saves approx 80% time
            const hoursSaved = Math.round(annualHours * 0.8);
            const netSavings = Math.round(annualManualCost * 0.75);

            document.getElementById('roi-manual-cost').innerText = 'R$ ' + annualManualCost.toLocaleString();
            document.getElementById('roi-hours-saved').innerText = hoursSaved + ' hrs';
            document.getElementById('roi-net-savings').innerText = 'R$ ' + netSavings.toLocaleString();
        }

        const TDD_DETAILS = {
            red: "🔴 RED: Escreva um teste unitário que falhe antes de implementar qualquer funcionalidade. Isso garante que o teste é válido e realmente avalia algo que ainda não existe.",
            green: "🟢 GREEN: Escreva a menor quantidade possível de código para fazer o teste passar. Não se preocupe com elegância neste momento.",
            refactor: "🔵 REFACTOR: Melhore o design, remova duplicações e otimize a performance do código com a segurança total fornecida pela suíte verde."
        };

        function selectTddPhase(phase) {
            document.getElementById('tdd-phase-details').innerText = TDD_DETAILS[phase];
            ['red', 'green', 'refactor'].forEach(p => {
                const btn = document.getElementById(`tdd-btn-${p}`);
                if (p === phase) {
                    btn.className = `p-4 rounded-xl border-2 border-brand-500 bg-brand-500/10 text-left transition-all`;
                } else {
                    btn.className = `p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800`;
                }
            });
        }

        function initGherkinDefault() {
            document.getElementById('gherkin-textarea').value = 
`Funcionalidade: Autenticação no Portal DocTest
  Como aluno de engenharia
  Quero realizar login com credenciais
  Para acessar a documentação de testes

  Cenário: Login efetuado com sucesso
    Dado que estou na página de login
    Quando preencho o usuário "squad" e senha "123456"
    E clico no botão "Entrar"
    Então devo ser redirecionado para o dashboard
    E devo visualizar a mensagem "Bem-vindo"`;
        }

        function validateGherkin() {
            // Live validation check
        }

        function copyCode(elementId) {
            const el = document.getElementById(elementId);
            const text = el.value || el.innerText;
            
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            alert('Código copiado para a área de transferência!');
        }

        function initScrollSpy() {
            window.addEventListener('scroll', () => {
                const winScroll = document.documentElement.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrolled = (winScroll / height) * 100;
                document.getElementById('scroll-progress-indicator').style.width = scrolled + '%';
            });
        }