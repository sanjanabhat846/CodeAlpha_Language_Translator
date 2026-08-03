/**
 * CodeAlpha AI Language Translator - Frontend Integration & UI Logic
 * Handles real-time API communication with Flask backend, dynamic language loading,
 * Speech Synthesis (TTS), Speech Recognition (STT), Translation History,
 * Favorite Languages, LocalStorage persistence, accessibility, and UI states.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration - Backend API Base Endpoint
    const API_BASE_URL = 'http://127.0.0.1:5000';

    // DOM Element Selections
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const swapBtn = document.getElementById('swap-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const favoritesBar = document.getElementById('favorites-bar');
    const favoritesList = document.getElementById('favorites-list');
    const translateBtn = document.getElementById('translate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const charCount = document.getElementById('char-count');
    const loadingOverlay = document.getElementById('loading-overlay');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const statusBadge = document.querySelector('.output-status-badge');

    // Speech Action Buttons
    const listenSourceBtn = document.getElementById('listen-source-btn');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const listenTargetBtn = document.getElementById('listen-target-btn');

    // History Panel Elements
    const historySection = document.getElementById('history-section');
    const historyToggleBtn = document.getElementById('history-toggle-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyContent = document.getElementById('history-content');
    const historyList = document.getElementById('history-list');

    // Global Speech Recognition instance
    let recognition = null;
    let isRecording = false;

    /**
     * Helper: Capitalizes the first letter of each word in a string.
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    function capitalizeWords(str) {
        if (!str) return '';
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Gets display name of a language code from dropdown.
     * @param {HTMLSelectElement} selectEl - Language selector element
     * @param {string} code - Language code
     * @returns {string} Language display text
     */
    function getLangName(selectEl, code) {
        const option = Array.from(selectEl.options).find(o => o.value === code);
        if (!option) return code.toUpperCase();
        return option.textContent.split('(')[0].trim();
    }

    /**
     * Dynamically fetches supported languages from backend /languages endpoint
     * and populates the source and target language dropdowns.
     */
    async function loadSupportedLanguages() {
        try {
            const response = await fetch(`${API_BASE_URL}/languages`);
            if (!response.ok) {
                throw new Error(`Failed to fetch languages (HTTP ${response.status})`);
            }

            const data = await response.json();
            if (!data || !data.languages || typeof data.languages !== 'object') {
                throw new Error('Invalid languages format returned from backend');
            }

            const languagesDict = data.languages;
            const languageEntries = Object.entries(languagesDict).map(([name, code]) => ({
                code: String(code).toLowerCase(),
                name: capitalizeWords(String(name))
            })).sort((a, b) => a.name.localeCompare(b.name));

            if (languageEntries.length === 0) return;

            const currentSource = sourceLang.value || 'auto';
            const currentTarget = targetLang.value || 'es';

            sourceLang.innerHTML = '';
            targetLang.innerHTML = '';

            const autoOption = document.createElement('option');
            autoOption.value = 'auto';
            autoOption.textContent = 'Detect Language (Auto)';
            sourceLang.appendChild(autoOption);

            languageEntries.forEach(({ code, name }) => {
                const optSource = document.createElement('option');
                optSource.value = code;
                optSource.textContent = `${name} (${code})`;
                sourceLang.appendChild(optSource);

                const optTarget = document.createElement('option');
                optTarget.value = code;
                optTarget.textContent = `${name} (${code})`;
                targetLang.appendChild(optTarget);
            });

            sourceLang.value = Array.from(sourceLang.options).some(o => o.value === currentSource) ? currentSource : 'auto';
            targetLang.value = Array.from(targetLang.options).some(o => o.value === currentTarget) ? currentTarget : (languageEntries[0]?.code || 'es');

            checkFavoriteStatus();
            renderFavorites();

        } catch (error) {
            console.warn('Backend language endpoint warning (using fallback options):', error.message);
        }
    }

    /**
     * Updates the status badge UI text and visual indicator.
     * @param {string} text - Status text to display ('Ready', 'Translating...', 'Completed', 'Error')
     */
    function updateStatusBadge(text) {
        if (!statusBadge) return;
        const statusDot = statusBadge.querySelector('.status-dot');
        const dotHTML = statusDot ? statusDot.outerHTML : '<span class="status-dot"></span>';
        statusBadge.innerHTML = `${dotHTML} ${text}`;
    }

    /**
     * Displays temporary toast notification with custom message.
     * @param {string} message - Message text to show in toast
     */
    let toastTimeout;
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3500);
    }

    // =========================================================================
    // 1. Text-to-Speech (Browser SpeechSynthesis API)
    // =========================================================================

    /**
     * Speaks given text using browser SpeechSynthesis API.
     * Stops current speech if already speaking.
     * @param {string} text - Text to speak
     * @param {string} langCode - Target language code
     * @param {HTMLElement} buttonEl - Triggering button element for visual state
     */
    function speakText(text, langCode, buttonEl) {
        if (!('speechSynthesis' in window)) {
            showToast('Text-to-Speech is not supported in your browser.');
            return;
        }

        // Stop speech if already speaking
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (buttonEl) buttonEl.classList.remove('speaking');
            showToast('Speech stopped');
            return;
        }

        if (!text || text.trim() === '' || text.startsWith('[Error]')) {
            showToast('No valid text to speak');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Attempt to match voice language code
        if (langCode && langCode !== 'auto') {
            utterance.lang = langCode;
        }

        // Reset visual state on start and end
        utterance.onstart = () => {
            if (buttonEl) buttonEl.classList.add('speaking');
            showToast('Speaking audio...');
        };

        utterance.onend = () => {
            if (buttonEl) buttonEl.classList.remove('speaking');
        };

        utterance.onerror = (e) => {
            console.error('SpeechSynthesis error:', e);
            if (buttonEl) buttonEl.classList.remove('speaking');
            showToast('Failed to play speech audio');
        };

        window.speechSynthesis.speak(utterance);
    }

    if (listenSourceBtn) {
        listenSourceBtn.addEventListener('click', () => {
            speakText(sourceText.value, sourceLang.value, listenSourceBtn);
        });
    }

    if (listenTargetBtn) {
        listenTargetBtn.addEventListener('click', () => {
            speakText(targetText.value, targetLang.value, listenTargetBtn);
        });
    }

    // =========================================================================
    // 2. Speech-to-Text (Web Speech API)
    // =========================================================================

    /**
     * Toggles browser SpeechRecognition for voice input.
     */
    function toggleVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            showToast('Speech recognition is not supported in this browser.');
            return;
        }

        if (isRecording && recognition) {
            recognition.stop();
            return;
        }

        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;

            const selectedLang = sourceLang.value;
            if (selectedLang && selectedLang !== 'auto') {
                recognition.lang = selectedLang;
            }

            recognition.onstart = () => {
                isRecording = true;
                voiceInputBtn.classList.add('recording');
                showToast('Listening... Speak into microphone');
            };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                sourceText.value = transcript;
                charCount.textContent = transcript.length;
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                showToast(`Speech recognition error: ${event.error}`);
                stopVoiceInput();
            };

            recognition.onend = () => {
                stopVoiceInput();
            };

            recognition.start();

        } catch (err) {
            console.error('Voice input error:', err);
            showToast('Unable to start speech recognition');
            stopVoiceInput();
        }
    }

    function stopVoiceInput() {
        isRecording = false;
        if (voiceInputBtn) voiceInputBtn.classList.remove('recording');
    }

    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', toggleVoiceInput);
    }

    // =========================================================================
    // 3. Favorite Languages (LocalStorage Persistence)
    // =========================================================================

    /**
     * Retrieves favorite language pairs from LocalStorage.
     * @returns {Array<{source: string, target: string}>} Array of favorite pairs
     */
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('lingua_favorites')) || [];
        } catch (_) {
            return [];
        }
    }

    /**
     * Saves favorite language pairs to LocalStorage.
     * @param {Array} favorites - Array of favorite language pairs
     */
    function saveFavorites(favorites) {
        localStorage.setItem('lingua_favorites', JSON.stringify(favorites));
    }

    /**
     * Checks if current language pair is pinned as favorite.
     */
    function checkFavoriteStatus() {
        if (!favoriteBtn) return;
        const favorites = getFavorites();
        const src = sourceLang.value;
        const tgt = targetLang.value;

        const isFav = favorites.some(f => f.source === src && f.target === tgt);
        const icon = favoriteBtn.querySelector('i');

        if (isFav) {
            favoriteBtn.classList.add('active');
            if (icon) icon.className = 'fa-solid fa-star';
            favoriteBtn.title = 'Unpin favorite language pair';
        } else {
            favoriteBtn.classList.remove('active');
            if (icon) icon.className = 'fa-regular fa-star';
            favoriteBtn.title = 'Pin current language pair to favorites';
        }
    }

    /**
     * Toggles favorite status for current language pair.
     */
    function toggleFavoriteLanguage() {
        const favorites = getFavorites();
        const src = sourceLang.value;
        const tgt = targetLang.value;

        const index = favorites.findIndex(f => f.source === src && f.target === tgt);

        if (index >= 0) {
            favorites.splice(index, 1);
            showToast('Removed from favorite languages');
        } else {
            favorites.push({ source: src, target: tgt });
            showToast('Pinned to favorite languages!');
        }

        saveFavorites(favorites);
        checkFavoriteStatus();
        renderFavorites();
    }

    /**
     * Renders favorite language chips in favorites bar.
     */
    function renderFavorites() {
        if (!favoritesList || !favoritesBar) return;
        const favorites = getFavorites();

        if (favorites.length === 0) {
            favoritesBar.classList.add('hidden');
            return;
        }

        favoritesBar.classList.remove('hidden');
        favoritesList.innerHTML = '';

        favorites.forEach(fav => {
            const chip = document.createElement('button');
            chip.className = 'fav-chip';
            
            const srcName = getLangName(sourceLang, fav.source);
            const tgtName = getLangName(targetLang, fav.target);
            chip.innerHTML = `${srcName} &rarr; ${tgtName} <i class="fa-solid fa-xmark remove-fav" title="Remove"></i>`;

            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-fav')) {
                    e.stopPropagation();
                    const currentFavs = getFavorites().filter(f => !(f.source === fav.source && f.target === fav.target));
                    saveFavorites(currentFavs);
                    checkFavoriteStatus();
                    renderFavorites();
                    showToast('Favorite removed');
                    return;
                }

                sourceLang.value = fav.source;
                targetLang.value = fav.target;
                checkFavoriteStatus();
                showToast(`Switched to ${srcName} → ${tgtName}`);
            });

            favoritesList.appendChild(chip);
        });
    }

    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', toggleFavoriteLanguage);
    }

    sourceLang.addEventListener('change', checkFavoriteStatus);
    targetLang.addEventListener('change', checkFavoriteStatus);

    // =========================================================================
    // 4. Translation History (Last 10 LocalStorage Persistence)
    // =========================================================================

    /**
     * Retrieves translation history items from LocalStorage.
     * @returns {Array} List of history items
     */
    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem('lingua_history')) || [];
        } catch (_) {
            return [];
        }
    }

    /**
     * Saves a new translation record into LocalStorage history (max 10).
     */
    function saveTranslationToHistory(srcText, tgtText, srcCode, tgtCode) {
        if (!srcText || !tgtText || tgtText.startsWith('[Error]')) return;

        let history = getHistory();
        const srcName = getLangName(sourceLang, srcCode);
        const tgtName = getLangName(targetLang, tgtCode);

        // Remove duplicate entry if present
        history = history.filter(item => item.sourceText !== srcText || item.targetText !== tgtText);

        history.unshift({
            id: Date.now(),
            sourceText: srcText,
            targetText: tgtText,
            sourceCode: srcCode,
            targetCode: tgtCode,
            sourceName: srcName,
            targetName: tgtName,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // Retain only last 10 entries
        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        localStorage.setItem('lingua_history', JSON.stringify(history));
        renderHistory();
    }

    /**
     * Renders history list UI elements in collapsible panel.
     */
    function renderHistory() {
        if (!historyList) return;
        const history = getHistory();

        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty"><i class="fa-solid fa-folder-open"></i> No recent translations saved yet.</div>';
            if (clearHistoryBtn) clearHistoryBtn.classList.add('hidden');
            return;
        }

        if (clearHistoryBtn) clearHistoryBtn.classList.remove('hidden');
        historyList.innerHTML = '';

        history.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'history-item';
            itemEl.setAttribute('role', 'button');
            itemEl.setAttribute('tabindex', '0');

            itemEl.innerHTML = `
                <div class="history-details">
                    <div class="history-meta">
                        <span>${item.sourceName} &rarr; ${item.targetName}</span>
                        <span>• ${item.timestamp}</span>
                    </div>
                    <div class="history-text"><strong>In:</strong> ${escapeHTML(item.sourceText)}</div>
                    <div class="history-subtext"><strong>Out:</strong> ${escapeHTML(item.targetText)}</div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn load-item-btn" title="Load translation into editor" aria-label="Load item"><i class="fa-solid fa-rotate-left"></i></button>
                    <button class="history-action-btn delete-item-btn" title="Delete from history" aria-label="Delete item"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;

            const loadItem = () => {
                sourceText.value = item.sourceText;
                targetText.value = item.targetText;
                sourceLang.value = item.sourceCode;
                targetLang.value = item.targetCode;
                charCount.textContent = item.sourceText.length;
                updateStatusBadge('Completed');
                checkFavoriteStatus();
                showToast('Loaded translation from history');
            };

            itemEl.addEventListener('click', (e) => {
                if (e.target.closest('.delete-item-btn')) {
                    e.stopPropagation();
                    const updated = getHistory().filter(h => h.id !== item.id);
                    localStorage.setItem('lingua_history', JSON.stringify(updated));
                    renderHistory();
                    showToast('History item deleted');
                    return;
                }
                loadItem();
            });

            itemEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadItem();
                }
            });

            historyList.appendChild(itemEl);
        });
    }

    /**
     * Escape HTML characters for safe rendering.
     */
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Toggle Collapsible History Section
    if (historyToggleBtn && historyContent) {
        historyToggleBtn.addEventListener('click', () => {
            const isExpanded = historyToggleBtn.getAttribute('aria-expanded') === 'true';
            historyToggleBtn.setAttribute('aria-expanded', !isExpanded);
            historyContent.classList.toggle('hidden');
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem('lingua_history');
            renderHistory();
            showToast('Translation history cleared');
        });
    }

    // =========================================================================
    // 5. Core Input Handlers & Shortcuts
    // =========================================================================

    // 1. Live Character Counter Update
    sourceText.addEventListener('input', () => {
        const currentLength = sourceText.value.length;
        charCount.textContent = currentLength;
        
        if (currentLength >= 4800) {
            charCount.style.color = '#ef4444';
        } else {
            charCount.style.color = 'var(--text-muted)';
        }

        if (!sourceText.value.trim()) {
            targetText.value = '';
            updateStatusBadge('Ready');
        }
    });

    // 2. Keyboard Shortcut (Ctrl+Enter or Cmd+Enter to Translate)
    sourceText.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            performTranslation();
        }
    });

    // 3. Clear Text Action
    clearBtn.addEventListener('click', () => {
        sourceText.value = '';
        targetText.value = '';
        charCount.textContent = '0';
        charCount.style.color = 'var(--text-muted)';
        updateStatusBadge('Ready');
        sourceText.focus();
        showToast('Text cleared');
    });

    // 4. Swap Languages Action
    swapBtn.addEventListener('click', () => {
        const sourceVal = sourceLang.value;
        const targetVal = targetLang.value;

        if (sourceVal === 'auto') {
            sourceLang.value = targetVal === 'en' ? 'es' : 'en';
        } else {
            sourceLang.value = targetVal;
        }

        targetLang.value = sourceVal === 'auto' ? 'en' : sourceVal;

        if (targetText.value && !targetText.value.startsWith('[Error]')) {
            const tempText = sourceText.value;
            sourceText.value = targetText.value;
            targetText.value = tempText;
            charCount.textContent = sourceText.value.length;
        }

        checkFavoriteStatus();
        showToast('Languages swapped');
    });

    // =========================================================================
    // 6. Backend Translation Execution
    // =========================================================================

    /**
     * Async function to handle backend translation API request.
     * Uses Fetch API with async/await, handles loading UI states, and manages errors.
     */
    async function performTranslation() {
        const textToTranslate = sourceText.value.trim();

        if (!textToTranslate) {
            showToast('Please enter text to translate');
            sourceText.focus();
            return;
        }

        // Update UI to Loading state
        loadingOverlay.classList.remove('hidden');
        translateBtn.disabled = true;
        translateBtn.style.opacity = '0.7';
        updateStatusBadge('Translating...');

        try {
            const response = await fetch(`${API_BASE_URL}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    text: textToTranslate,
                    source: sourceLang.value,
                    target: targetLang.value
                })
            });

            if (!response.ok) {
                let errorMsg = `Server error (${response.status})`;
                try {
                    const errorJson = await response.json();
                    if (errorJson && errorJson.error) {
                        errorMsg = errorJson.error;
                    }
                } catch (_) {}
                throw new Error(errorMsg);
            }

            const data = await response.json();

            if (data && typeof data.translated_text === 'string') {
                targetText.value = data.translated_text;
                updateStatusBadge('Completed');
                showToast('Translation successful!');

                // Save successful translation into LocalStorage History
                saveTranslationToHistory(textToTranslate, data.translated_text, sourceLang.value, targetLang.value);
            } else {
                throw new Error('Received malformed response payload from backend server.');
            }

        } catch (error) {
            console.error('Translation error:', error);
            
            let userFriendlyMsg;
            if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                userFriendlyMsg = 'Unable to connect to the backend server. Please make sure the Flask backend is running on http://127.0.0.1:5000.';
            } else {
                userFriendlyMsg = error.message || 'An unexpected error occurred during translation.';
            }

            targetText.value = `[Error] ${userFriendlyMsg}`;
            updateStatusBadge('Error');
            showToast(userFriendlyMsg);

        } finally {
            loadingOverlay.classList.add('hidden');
            translateBtn.disabled = false;
            translateBtn.style.opacity = '1';
        }
    }

    translateBtn.addEventListener('click', performTranslation);

    // Copy Output Text to Clipboard with Confirmation Toast
    copyBtn.addEventListener('click', async () => {
        const textToCopy = targetText.value || sourceText.value;

        if (!textToCopy || textToCopy.startsWith('[Error]')) {
            showToast('No valid translation to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            
            copyBtn.classList.add('copied');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span class="btn-text">Copied!</span>`;

            showToast('Copied to clipboard!');

            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        } catch (err) {
            showToast('Failed to copy text to clipboard');
        }
    });

    // Initialize application state
    loadSupportedLanguages();
    renderHistory();
});
