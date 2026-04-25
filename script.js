// 应用状态管理
class MarkdownNotesApp {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.searchKeyword = '';
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.notesList = document.getElementById('notes-list');
        this.newNoteBtn = document.getElementById('new-note-btn');
        this.searchInput = document.getElementById('search-input');
        this.noResults = document.getElementById('no-results');
        
        // 排序相关
        this.sortBy = 'updatedAt';
        this.sortOrder = 'desc';
        this.sortSelect = document.getElementById('sort-select');
        this.sortOrderBtn = document.getElementById('sort-order-btn');
        
        // 专注模式相关
        this.isFocusMode = false;
        this.focusModeBtn = document.getElementById('focus-mode-btn');
        this.exitFocusModeBtn = document.getElementById('exit-focus-mode-btn');
        this.appContainer = document.querySelector('.app-container');
        this.sidebar = document.querySelector('.sidebar');
        
        // 标签相关
        this.currentTagFilter = null;
        this.tagInput = document.getElementById('tag-input');
        this.currentTagsElement = document.getElementById('current-tags');
        this.tagsFilterList = document.getElementById('tags-filter-list');
        this.clearTagsFilterBtn = document.getElementById('clear-tags-filter-btn');
        
        // 格式工具栏按钮
        this.formatButtons = document.querySelectorAll('.format-btn');
        
        // 快捷键参考相关元素
        this.keyboardShortcutsBtn = document.getElementById('keyboard-shortcuts-btn');
        this.shortcutsDialogOverlay = document.getElementById('shortcuts-dialog-overlay');
        this.shortcutsDialogClose = document.getElementById('shortcuts-dialog-close');
        
        // 确认对话框相关元素
        this.confirmDialogOverlay = document.getElementById('confirm-dialog-overlay');
        this.confirmDialogTitle = document.getElementById('confirm-dialog-title');
        this.confirmDialogMessage = document.getElementById('confirm-dialog-message');
        this.confirmDialogCancel = document.getElementById('confirm-dialog-cancel');
        this.confirmDialogConfirm = document.getElementById('confirm-dialog-confirm');
        
        // 提示对话框相关元素
        this.alertDialogOverlay = document.getElementById('alert-dialog-overlay');
        this.alertDialogTitle = document.getElementById('alert-dialog-title');
        this.alertDialogMessage = document.getElementById('alert-dialog-message');
        this.alertDialogOk = document.getElementById('alert-dialog-ok');
        
        this.confirmCallback = null;
        
        // 主题相关
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.isLightTheme = false;
        
        // 统计相关
        this.charCountElement = document.getElementById('char-count');
        this.wordCountElement = document.getElementById('word-count');
        
        // 导出按钮
        this.exportBtn = document.getElementById('export-btn');
        
        // 系统检测 - 用于快捷键显示
        this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        
        // 按键名称映射 - 根据系统显示不同的按键名称
        this.keyNames = {
            ctrl: this.isMac ? '⌘' : 'Ctrl',
            shift: this.isMac ? '⇧' : 'Shift',
            alt: this.isMac ? '⌥' : 'Alt',
            meta: this.isMac ? '⌘' : 'Win',
            control: this.isMac ? '⌘' : 'Ctrl',
            cmd: this.isMac ? '⌘' : 'Ctrl',
            n: 'N',
            d: 'D',
            b: 'B',
            i: 'I',
            '?': '?',
            '/': '/',
            arrowUp: this.isMac ? '↑' : '↑',
            arrowDown: this.isMac ? '↓' : '↓',
            esc: 'Esc'
        };
        
        this.init();
    }

    // 初始化应用
    init() {
        this.loadTheme();
        this.loadSortSettings();
        this.loadFocusModeSettings();
        this.loadNotes();
        this.bindEvents();
        this.renderNotesList();
        this.renderTagsFilter();
        this.updateStats();
        
        // 更新快捷键显示（根据系统显示不同的按键名称）
        this.updateShortcutsDisplay();
        
        // 如果没有笔记，创建一个新笔记
        if (this.notes.length === 0) {
            this.createNewNote();
        } else {
            // 否则加载第一个笔记
            this.loadNote(this.notes[0].id);
        }
    }

    // 获取按键显示名称
    getKeyDisplay(key) {
        return this.keyNames[key.toLowerCase()] || key;
    }

    // 生成快捷键显示文本
    getShortcutDisplay(keys) {
        const displayKeys = keys.map(key => this.getKeyDisplay(key));
        return displayKeys.join(this.isMac ? '' : ' + ');
    }

    // 更新快捷键显示
    updateShortcutsDisplay() {
        // 更新新建笔记按钮的 title
        if (this.newNoteBtn) {
            const shortcut = this.getShortcutDisplay(['Ctrl', 'Shift', 'N']);
            this.newNoteBtn.title = `新建笔记 (${shortcut})`;
        }
        
        // 更新快捷键参考按钮的 title
        if (this.keyboardShortcutsBtn) {
            const shortcut = this.getShortcutDisplay(['Ctrl', '?']);
            this.keyboardShortcutsBtn.title = `键盘快捷键 (${shortcut})`;
        }
        
        // 动态更新快捷键参考对话框中的内容
        this.updateShortcutsDialog();
    }

    // 更新快捷键参考对话框
    updateShortcutsDialog() {
        const shortcuts = [
            { keys: ['Ctrl', 'Shift', 'N'], desc: '新建笔记' },
            { keys: ['Ctrl', 'Shift', 'D'], desc: '删除当前笔记' },
            { keys: ['Ctrl', 'Shift', 'ArrowUp'], desc: '上一条笔记' },
            { keys: ['Ctrl', 'Shift', 'ArrowDown'], desc: '下一条笔记' },
            { keys: ['Ctrl', '?'], desc: '显示/隐藏快捷键参考' },
            { keys: ['Esc'], desc: '关闭对话框' },
            { keys: ['Ctrl', 'B'], desc: '加粗' },
            { keys: ['Ctrl', 'I'], desc: '斜体' }
        ];
        
        // 获取所有快捷键项
        const shortcutItems = document.querySelectorAll('.shortcut-item');
        if (shortcutItems.length === 0) return;
        
        // 更新每个快捷键项
        shortcuts.forEach((shortcut, index) => {
            if (index < shortcutItems.length) {
                const keyElement = shortcutItems[index].querySelector('.shortcut-key');
                if (keyElement) {
                    let displayText;
                    if (shortcut.keys.includes('ArrowUp')) {
                        displayText = this.getShortcutDisplay(['Ctrl', 'Shift']) + (this.isMac ? '↑' : ' + ↑');
                    } else if (shortcut.keys.includes('ArrowDown')) {
                        displayText = this.getShortcutDisplay(['Ctrl', 'Shift']) + (this.isMac ? '↓' : ' + ↓');
                    } else {
                        displayText = this.getShortcutDisplay(shortcut.keys);
                    }
                    keyElement.textContent = displayText;
                }
            }
        });
    }

    // 绑定事件
    bindEvents() {
        // 编辑器内容变化事件
        this.editor.addEventListener('input', () => {
            this.updateCurrentNote();
            this.renderPreview();
            this.updateStats();
        });
        
        // 导出按钮事件
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => {
                this.exportNote();
            });
        }
        
        // 主题切换按钮事件
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // 新建笔记按钮
        this.newNoteBtn.addEventListener('click', () => {
            this.createNewNote();
        });

        // 搜索框事件
        this.searchInput.addEventListener('input', () => {
            this.searchKeyword = this.searchInput.value.trim().toLowerCase();
            this.renderNotesList();
        });

        // 排序相关事件
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => {
                this.sortBy = this.sortSelect.value;
                this.saveSortSettings();
                this.renderNotesList();
            });
        }
        
        if (this.sortOrderBtn) {
            this.sortOrderBtn.addEventListener('click', () => {
                this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
                this.updateSortOrderButton();
                this.saveSortSettings();
                this.renderNotesList();
            });
        }

        // 专注模式相关事件
        if (this.focusModeBtn) {
            this.focusModeBtn.addEventListener('click', () => {
                this.toggleFocusMode();
            });
        }
        
        if (this.exitFocusModeBtn) {
            this.exitFocusModeBtn.addEventListener('click', () => {
                this.toggleFocusMode();
            });
        }

        // 标签相关事件
        if (this.tagInput) {
            this.tagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTag();
                }
            });
        }

        // 清除标签筛选按钮事件
        if (this.clearTagsFilterBtn) {
            this.clearTagsFilterBtn.addEventListener('click', () => {
                this.currentTagFilter = null;
                this.renderNotesList();
                this.renderTagsFilter();
            });
        }

        // 格式工具栏按钮事件
        this.formatButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.handleFormatAction(action);
            });
        });

        // 快捷键参考按钮事件
        if (this.keyboardShortcutsBtn) {
            this.keyboardShortcutsBtn.addEventListener('click', () => {
                this.showShortcutsDialog();
            });
        }

        // 快捷键参考对话框关闭按钮
        if (this.shortcutsDialogClose) {
            this.shortcutsDialogClose.addEventListener('click', () => {
                this.hideShortcutsDialog();
            });
        }

        // 点击遮罩层关闭快捷键参考对话框
        if (this.shortcutsDialogOverlay) {
            this.shortcutsDialogOverlay.addEventListener('click', (e) => {
                if (e.target === this.shortcutsDialogOverlay) {
                    this.hideShortcutsDialog();
                }
            });
        }

        // ESC 键关闭快捷键参考对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.shortcutsDialogOverlay && this.shortcutsDialogOverlay.classList.contains('active')) {
                this.hideShortcutsDialog();
            }
        });

        // 键盘快捷键 - 跨平台兼容设计
        // Windows/Linux: Ctrl = 主修饰键
        // macOS: Cmd (Meta) = 主修饰键
        // 使用 (e.ctrlKey || e.metaKey) 同时支持两种系统
        document.addEventListener('keydown', (e) => {
            // 格式快捷键（Ctrl+B, Ctrl+I）
            if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    this.handleFormatAction('bold');
                } else if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    this.handleFormatAction('italic');
                }
            }
            
            // 新建笔记（Ctrl+Shift+N）- 跨平台兼容
            // Windows/Linux: Ctrl+Shift+N
            // macOS: Cmd+Shift+N
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
                if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    this.createNewNote();
                }
            }
            
            // 删除当前笔记（Ctrl+Shift+D）- 跨平台兼容
            // Windows/Linux: Ctrl+Shift+D
            // macOS: Cmd+Shift+D
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
                if (e.key === 'd' || e.key === 'D') {
                    e.preventDefault();
                    this.deleteNote(this.currentNoteId);
                }
            }
            
            // 快捷键参考（Ctrl+? 或 Ctrl+/）- 跨平台兼容
            // Windows/Linux: Ctrl+? 或 Ctrl+/
            // macOS: Cmd+? 或 Cmd+/
            if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '?')) {
                e.preventDefault();
                this.toggleShortcutsDialog();
            }
            
            // 笔记切换快捷键（Ctrl+Shift+↑/↓）- 跨平台兼容
            // Windows/Linux: Ctrl+Shift+↑/↓
            // macOS: Cmd+Shift+↑/↓
            // 使用 Ctrl+Shift 组合避免在编辑器中误触光标移动
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateToPreviousNote();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateToNextNote();
                }
            }
            
            // 专注模式切换（F11）
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFocusMode();
            }
        });

        // 确认对话框按钮事件
        this.confirmDialogCancel.addEventListener('click', () => {
            this.hideConfirmDialog();
        });

        this.confirmDialogConfirm.addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            this.hideConfirmDialog();
        });

        // 点击遮罩层关闭对话框
        this.confirmDialogOverlay.addEventListener('click', (e) => {
            if (e.target === this.confirmDialogOverlay) {
                this.hideConfirmDialog();
            }
        });

        // ESC 键关闭确认对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.confirmDialogOverlay.classList.contains('active')) {
                this.hideConfirmDialog();
            }
        });

        // 提示对话框按钮事件
        this.alertDialogOk.addEventListener('click', () => {
            this.hideAlertDialog();
        });

        // 点击遮罩层关闭提示对话框
        this.alertDialogOverlay.addEventListener('click', (e) => {
            if (e.target === this.alertDialogOverlay) {
                this.hideAlertDialog();
            }
        });

        // ESC 键关闭提示对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.alertDialogOverlay.classList.contains('active')) {
                this.hideAlertDialog();
            }
        });
    }

    // 处理格式操作
    handleFormatAction(action) {
        const editor = this.editor;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const text = editor.value;
        const selectedText = text.substring(start, end);
        
        let newText = '';
        let newCursorPos = start;
        
        switch (action) {
            case 'bold':
                if (selectedText) {
                    newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
                    newCursorPos = end + 4;
                } else {
                    newText = text.substring(0, start) + '****' + text.substring(end);
                    newCursorPos = start + 2;
                }
                break;
                
            case 'italic':
                if (selectedText) {
                    newText = text.substring(0, start) + '*' + selectedText + '*' + text.substring(end);
                    newCursorPos = end + 2;
                } else {
                    newText = text.substring(0, start) + '**' + text.substring(end);
                    newCursorPos = start + 1;
                }
                break;
                
            case 'inline-code':
                if (selectedText) {
                    newText = text.substring(0, start) + '`' + selectedText + '`' + text.substring(end);
                    newCursorPos = end + 2;
                } else {
                    newText = text.substring(0, start) + '``' + text.substring(end);
                    newCursorPos = start + 1;
                }
                break;
                
            case 'h1':
                newText = this.insertLinePrefix(text, start, end, '# ');
                newCursorPos = start + 2;
                break;
                
            case 'h2':
                newText = this.insertLinePrefix(text, start, end, '## ');
                newCursorPos = start + 3;
                break;
                
            case 'h3':
                newText = this.insertLinePrefix(text, start, end, '### ');
                newCursorPos = start + 4;
                break;
                
            case 'ul':
                newText = this.insertLinePrefix(text, start, end, '- ');
                newCursorPos = start + 2;
                break;
                
            case 'ol':
                newText = this.insertLinePrefix(text, start, end, '1. ');
                newCursorPos = start + 3;
                break;
                
            case 'quote':
                newText = this.insertLinePrefix(text, start, end, '> ');
                newCursorPos = start + 2;
                break;
        }
        
        if (newText) {
            editor.value = newText;
            editor.selectionStart = newCursorPos;
            editor.selectionEnd = newCursorPos;
            editor.focus();
            this.updateCurrentNote();
            this.renderPreview();
            this.updateStats();
        }
    }

    // 在选中的行开头插入前缀
    insertLinePrefix(text, start, end, prefix) {
        const lines = text.split('\n');
        let startLine = 0;
        let endLine = 0;
        let charCount = 0;
        
        // 找到起始行
        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1;
            if (charCount + lineLength > start) {
                startLine = i;
                break;
            }
            charCount += lineLength;
        }
        
        // 找到结束行
        charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1;
            if (charCount + lineLength > end) {
                endLine = i;
                break;
            }
            charCount += lineLength;
        }
        
        // 如果光标在文本末尾，结束行就是最后一行
        if (end === text.length) {
            endLine = lines.length - 1;
        }
        
        // 检查所有选中行是否都已经有前缀
        let allHavePrefix = true;
        for (let i = startLine; i <= endLine; i++) {
            if (lines[i] && !lines[i].startsWith(prefix)) {
                allHavePrefix = false;
                break;
            }
        }
        
        // 对选中的每一行进行处理
        for (let i = startLine; i <= endLine; i++) {
            if (allHavePrefix) {
                // 移除前缀
                if (lines[i] && lines[i].startsWith(prefix)) {
                    lines[i] = lines[i].substring(prefix.length);
                }
            } else {
                // 添加前缀
                lines[i] = prefix + lines[i];
            }
        }
        
        return lines.join('\n');
    }

    // 显示确认对话框
    showConfirmDialog(title, message, callback) {
        this.confirmDialogTitle.textContent = title;
        this.confirmDialogMessage.textContent = message;
        this.confirmCallback = callback;
        this.confirmDialogOverlay.classList.add('active');
    }

    // 隐藏确认对话框
    hideConfirmDialog() {
        this.confirmDialogOverlay.classList.remove('active');
        this.confirmCallback = null;
    }

    // 显示提示对话框
    showAlertDialog(title, message) {
        this.alertDialogTitle.textContent = title;
        this.alertDialogMessage.textContent = message;
        this.alertDialogOverlay.classList.add('active');
    }

    // 隐藏提示对话框
    hideAlertDialog() {
        this.alertDialogOverlay.classList.remove('active');
    }

    // Markdown 解析函数
    parseMarkdown(text) {
        if (!text) return '';
        
        let html = text;
        
        // 先处理代码块，避免其中的内容被其他规则解析
        // 使用特殊标记替换代码块，最后再替换回来
        const codeBlocks = [];
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            codeBlocks.push(`<pre><code>${this.escapeHtml(code.trim())}</code></pre>`);
            return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
        });
        
        // 分割为段落（以空行分隔）
        const blocks = html.split(/\n\n+/);
        const result = [];
        
        for (let block of blocks) {
            block = block.trim();
            if (!block) continue;
            
            // 检查是否是引用块（以 > 开头）
            if (block.startsWith('>')) {
                const quoteContent = block.split('\n').map(line => {
                    return line.replace(/^>\s?/, '');
                }).join('\n');
                // 递归解析引用块内的内容
                result.push(`<blockquote>${this.parseInlineMarkdown(quoteContent)}</blockquote>`);
                continue;
            }
            
            // 检查是否是有序列表
            if (/^\d+\.\s/.test(block)) {
                const items = block.split('\n').filter(line => /^\d+\.\s/.test(line));
                const listItems = items.map(item => {
                    return `<li>${this.parseInlineMarkdown(item.replace(/^\d+\.\s+/, ''))}</li>`;
                }).join('');
                result.push(`<ol>${listItems}</ol>`);
                continue;
            }
            
            // 检查是否是无序列表
            if (/^[\*\+\-]\s/.test(block)) {
                const items = block.split('\n').filter(line => /^[\*\+\-]\s/.test(line));
                const listItems = items.map(item => {
                    return `<li>${this.parseInlineMarkdown(item.replace(/^[\*\+\-]\s+/, ''))}</li>`;
                }).join('');
                result.push(`<ul>${listItems}</ul>`);
                continue;
            }
            
            // 检查是否是标题
            if (/^#{1,6}\s/.test(block)) {
                const level = block.match(/^(#+)/)[1].length;
                const content = block.replace(/^#{1,6}\s/, '');
                result.push(`<h${level}>${this.parseInlineMarkdown(content)}</h${level}>`);
                continue;
            }
            
            // 检查是否是分割线
            if (/^(\*{3,}|-{3,}|_{3,})$/.test(block)) {
                result.push('<hr>');
                continue;
            }
            
            // 普通段落
            result.push(`<p>${this.parseInlineMarkdown(block)}</p>`);
        }
        
        // 替换回代码块
        let finalHtml = result.join('');
        for (let i = 0; i < codeBlocks.length; i++) {
            finalHtml = finalHtml.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
        }
        
        return finalHtml;
    }
    
    // 解析行内 Markdown 语法
    parseInlineMarkdown(text) {
        if (!text) return '';
        
        let html = text;
        
        // 处理行内代码 (`...`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 处理粗体 (**...**)
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // 处理斜体 (*...*)
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // 处理链接 ([text](url))
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // 处理换行（单个换行）
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    // HTML 转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 渲染预览
    renderPreview() {
        const markdownText = this.editor.value;
        this.preview.innerHTML = this.parseMarkdown(markdownText);
    }

    // 从 localStorage 加载笔记
    loadNotes() {
        const savedNotes = localStorage.getItem('markdownNotes');
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
            
            // 兼容旧数据：为没有 tags 字段的笔记添加空数组
            this.notes.forEach(note => {
                if (!note.tags) {
                    note.tags = [];
                }
            });
        }
    }

    // 保存笔记到 localStorage
    saveNotes() {
        localStorage.setItem('markdownNotes', JSON.stringify(this.notes));
    }

    // 格式化时间
    formatTime(isoString) {
        if (!isoString) return '';
        
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins} 分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours} 小时前`;
        } else if (diffDays < 7) {
            return `${diffDays} 天前`;
        } else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const mins = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${mins}`;
        }
    }

    // 渲染笔记列表
    renderNotesList() {
        this.notesList.innerHTML = '';
        
        if (this.notes.length === 0) {
            this.showNoResults(false);
            return;
        }

        const filteredNotes = this.getFilteredNotes();
        
        if (filteredNotes.length === 0) {
            this.showNoResults(true);
            return;
        }

        this.showNoResults(false);
        
        filteredNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item${note.id === this.currentNoteId ? ' active' : ''}`;
            noteItem.dataset.id = note.id;
            
            const noteInfo = document.createElement('div');
            noteInfo.className = 'note-info';
            
            const noteTitle = document.createElement('div');
            noteTitle.className = 'note-title';
            noteTitle.textContent = this.getNoteTitle(note.content);
            
            const noteTime = document.createElement('div');
            noteTime.className = 'note-time';
            noteTime.textContent = this.formatTime(note.updatedAt);
            
            const noteSummary = document.createElement('div');
            noteSummary.className = 'note-summary';
            noteSummary.textContent = this.getNoteSummary(note.content);
            
            noteInfo.appendChild(noteTitle);
            noteInfo.appendChild(noteTime);
            if (noteSummary.textContent) {
                noteInfo.appendChild(noteSummary);
            }
            
            // 添加标签显示
            if (note.tags && note.tags.length > 0) {
                const noteTags = document.createElement('div');
                noteTags.className = 'note-tags';
                
                note.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'note-tag';
                    tagElement.textContent = tag;
                    tagElement.title = `点击筛选标签: ${tag}`;
                    tagElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.filterByTag(tag);
                    });
                    noteTags.appendChild(tagElement);
                });
                
                noteInfo.appendChild(noteTags);
            }
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'note-delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = '删除笔记 (Ctrl+Shift+D)';
            
            noteItem.addEventListener('click', (e) => {
                if (e.target !== deleteBtn) {
                    this.loadNote(note.id);
                }
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNote(note.id);
            });
            
            noteItem.appendChild(noteInfo);
            noteItem.appendChild(deleteBtn);
            this.notesList.appendChild(noteItem);
        });
    }

    // 获取过滤和排序后的笔记列表
    getFilteredNotes() {
        let filteredNotes = [...this.notes];
        
        // 标签筛选
        if (this.currentTagFilter) {
            filteredNotes = filteredNotes.filter(note => 
                note.tags && note.tags.includes(this.currentTagFilter)
            );
        }
        
        // 搜索关键词筛选
        if (this.searchKeyword) {
            filteredNotes = filteredNotes.filter(note => {
                const title = this.getNoteTitle(note.content).toLowerCase();
                const content = note.content.toLowerCase();
                return title.includes(this.searchKeyword) || content.includes(this.searchKeyword);
            });
        }
        
        // 排序
        filteredNotes.sort((a, b) => {
            let comparison = 0;
            
            switch (this.sortBy) {
                case 'title':
                    const titleA = this.getNoteTitle(a.content).toLowerCase();
                    const titleB = this.getNoteTitle(b.content).toLowerCase();
                    comparison = titleA.localeCompare(titleB, 'zh-CN');
                    break;
                    
                case 'createdAt':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                    
                case 'updatedAt':
                default:
                    comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
                    break;
            }
            
            // 如果是降序，取反
            return this.sortOrder === 'desc' ? -comparison : comparison;
        });
        
        return filteredNotes;
    }

    // 显示/隐藏无结果提示
    showNoResults(show) {
        if (this.noResults && this.notesList) {
            this.noResults.style.display = show ? 'block' : 'none';
            this.notesList.style.display = show ? 'none' : 'block';
        }
    }

    // 获取笔记标题（从内容第一行）
    getNoteTitle(content) {
        if (!content || content.trim() === '') {
            return '新建笔记';
        }
        
        const lines = content.trim().split('\n');
        const firstLine = lines[0].trim();
        
        // 移除 Markdown 标题标记
        return firstLine.replace(/^#+\s*/, '');
    }

    // 获取笔记内容摘要
    getNoteSummary(content) {
        if (!content || content.trim() === '') {
            return '';
        }
        
        // 移除 Markdown 标题标记
        let summary = content.replace(/^#+\s*/gm, '');
        
        // 移除代码块
        summary = summary.replace(/```[\s\S]*?```/g, '');
        
        // 移除行内代码
        summary = summary.replace(/`[^`]+`/g, '');
        
        // 移除 Markdown 语法标记
        summary = summary.replace(/\*\*([^*]+)\*\*/g, '$1'); // 粗体
        summary = summary.replace(/\*([^*]+)\*/g, '$1'); // 斜体
        summary = summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // 链接
        summary = summary.replace(/^>\s?/gm, ''); // 引用
        summary = summary.replace(/^[\*\+\-]\s/gm, ''); // 无序列表
        summary = summary.replace(/^\d+\.\s/gm, ''); // 有序列表
        
        // 移除空行
        summary = summary.replace(/\n\n+/g, '\n');
        
        // 移除单个换行
        summary = summary.replace(/\n/g, ' ');
        
        // 移除多余空格
        summary = summary.replace(/\s+/g, ' ').trim();
        
        // 截取前 50 个字符
        if (summary.length > 50) {
            summary = summary.substring(0, 50) + '...';
        }
        
        return summary;
    }

    // 创建新笔记
    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: []
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.loadNote(newNote.id);
        this.renderNotesList();
        this.renderTagsFilter();
    }

    // 加载笔记
    loadNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.currentNoteId = noteId;
            this.editor.value = note.content;
            this.renderPreview();
            this.updateStats();
            this.renderCurrentTags();
            this.renderNotesList();
        }
    }

    // 更新字符数和字数统计
    updateStats() {
        const content = this.editor.value || '';
        const charCount = content.length;
        
        // 计算字数：对于中文，每个汉字算一个字；对于英文，按空格分隔计算单词
        const chineseChars = content.match(/[\u4e00-\u9fa5]/g) || [];
        const englishWords = content.split(/\s+/).filter(word => word.length > 0 && !/[\u4e00-\u9fa5]/.test(word));
        const wordCount = chineseChars.length + englishWords.length;
        
        if (this.charCountElement) {
            this.charCountElement.textContent = `字符数: ${charCount}`;
        }
        if (this.wordCountElement) {
            this.wordCountElement.textContent = `字数: ${wordCount}`;
        }
    }

    // 导出当前笔记为 .md 文件
    exportNote() {
        if (!this.currentNoteId) {
            this.showAlertDialog('提示', '没有可导出的笔记！');
            return;
        }
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        
        // 获取笔记标题作为文件名
        let fileName = this.getNoteTitle(note.content);
        // 移除文件名中不允许的字符
        fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
        // 如果文件名为空或过长，使用默认名称
        if (!fileName || fileName.trim() === '' || fileName.length > 50) {
            fileName = '笔记';
        }
        fileName += '.md';
        
        // 创建 Blob 对象
        const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 切换主题
    toggleTheme() {
        this.isLightTheme = !this.isLightTheme;
        this.applyTheme();
        this.saveTheme();
    }

    // 应用主题
    applyTheme() {
        if (this.isLightTheme) {
            document.body.classList.add('light-theme');
            if (this.themeToggleBtn) {
                this.themeToggleBtn.querySelector('.icon').textContent = '☀️';
                this.themeToggleBtn.title = '切换到深色主题';
            }
        } else {
            document.body.classList.remove('light-theme');
            if (this.themeToggleBtn) {
                this.themeToggleBtn.querySelector('.icon').textContent = '🌙';
                this.themeToggleBtn.title = '切换到浅色主题';
            }
        }
    }

    // 保存主题设置到 localStorage
    saveTheme() {
        localStorage.setItem('markdownNotesTheme', this.isLightTheme ? 'light' : 'dark');
    }

    // 从 localStorage 加载主题设置
    loadTheme() {
        const savedTheme = localStorage.getItem('markdownNotesTheme');
        this.isLightTheme = savedTheme === 'light';
        this.applyTheme();
    }

    // 更新当前笔记
    updateCurrentNote() {
        if (!this.currentNoteId) return;
        
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex !== -1) {
            this.notes[noteIndex].content = this.editor.value;
            this.notes[noteIndex].updatedAt = new Date().toISOString();
            this.saveNotes();
            
            // 更新笔记列表中的标题
            this.renderNotesList();
        }
    }

    // 删除笔记
    deleteNote(noteId) {
        if (this.notes.length <= 1) {
            // 至少保留一个笔记
            this.showAlertDialog('提示', '至少需要保留一个笔记！');
            return;
        }
        
        this.showConfirmDialog('删除笔记', '确定要删除这个笔记吗？', () => {
            const noteIndex = this.notes.findIndex(n => n.id === noteId);
            if (noteIndex !== -1) {
                const deletedNote = this.notes[noteIndex];
                this.notes.splice(noteIndex, 1);
                this.saveNotes();
                
                // 如果当前筛选的标签只在被删除的笔记中存在，清除筛选
                if (this.currentTagFilter && deletedNote.tags && deletedNote.tags.includes(this.currentTagFilter)) {
                    const otherNotesHaveTag = this.notes.some(note => 
                        note.tags && note.tags.includes(this.currentTagFilter)
                    );
                    if (!otherNotesHaveTag) {
                        this.currentTagFilter = null;
                    }
                }
                
                // 重新渲染标签筛选器
                this.renderTagsFilter();
                
                // 如果删除的是当前笔记，加载第一个笔记
                if (noteId === this.currentNoteId) {
                    this.loadNote(this.notes[0].id);
                } else {
                    this.renderNotesList();
                }
            }
        });
    }

    // 导航到上一条笔记
    navigateToPreviousNote() {
        const filteredNotes = this.getFilteredNotes();
        if (filteredNotes.length <= 1) return;
        
        const currentIndex = filteredNotes.findIndex(n => n.id === this.currentNoteId);
        if (currentIndex > 0) {
            this.loadNote(filteredNotes[currentIndex - 1].id);
        }
    }

    // 导航到下一条笔记
    navigateToNextNote() {
        const filteredNotes = this.getFilteredNotes();
        if (filteredNotes.length <= 1) return;
        
        const currentIndex = filteredNotes.findIndex(n => n.id === this.currentNoteId);
        if (currentIndex < filteredNotes.length - 1) {
            this.loadNote(filteredNotes[currentIndex + 1].id);
        }
    }

    // 显示快捷键参考对话框
    showShortcutsDialog() {
        this.shortcutsDialogOverlay.classList.add('active');
    }

    // 隐藏快捷键参考对话框
    hideShortcutsDialog() {
        this.shortcutsDialogOverlay.classList.remove('active');
    }

    // 切换快捷键参考对话框显示状态
    toggleShortcutsDialog() {
        if (this.shortcutsDialogOverlay.classList.contains('active')) {
            this.hideShortcutsDialog();
        } else {
            this.showShortcutsDialog();
        }
    }

    // ========== 排序相关方法 ==========

    // 更新排序方向按钮显示
    updateSortOrderButton() {
        if (this.sortOrderBtn) {
            const icon = this.sortOrderBtn.querySelector('.icon');
            if (icon) {
                icon.textContent = this.sortOrder === 'desc' ? '↓' : '↑';
            }
        }
    }

    // 保存排序设置
    saveSortSettings() {
        const settings = {
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };
        localStorage.setItem('markdownNotesSortSettings', JSON.stringify(settings));
    }

    // 加载排序设置
    loadSortSettings() {
        const savedSettings = localStorage.getItem('markdownNotesSortSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.sortBy = settings.sortBy || 'updatedAt';
            this.sortOrder = settings.sortOrder || 'desc';
            
            // 更新下拉框选中值
            if (this.sortSelect) {
                this.sortSelect.value = this.sortBy;
            }
            
            // 更新排序按钮显示
            this.updateSortOrderButton();
        }
    }

    // ========== 专注模式相关方法 ==========

    // 切换专注模式
    toggleFocusMode() {
        this.isFocusMode = !this.isFocusMode;
        this.applyFocusMode();
        this.saveFocusModeSettings();
    }

    // 应用专注模式
    applyFocusMode() {
        if (this.appContainer) {
            if (this.isFocusMode) {
                this.appContainer.classList.add('focus-mode');
            } else {
                this.appContainer.classList.remove('focus-mode');
            }
        }

        if (this.sidebar) {
            this.sidebar.style.display = this.isFocusMode ? 'none' : 'flex';
        }

        if (this.exitFocusModeBtn) {
            this.exitFocusModeBtn.style.display = this.isFocusMode ? 'block' : 'none';
        }

        if (this.focusModeBtn) {
            const icon = this.focusModeBtn.querySelector('.icon');
            if (icon) {
                icon.textContent = this.isFocusMode ? '⤢' : '✍️';
            }
            this.focusModeBtn.title = this.isFocusMode ? '退出专注模式 (F11)' : '专注模式 (F11)';
        }
    }

    // 保存专注模式设置
    saveFocusModeSettings() {
        localStorage.setItem('markdownNotesFocusMode', this.isFocusMode ? 'true' : 'false');
    }

    // 加载专注模式设置
    loadFocusModeSettings() {
        const saved = localStorage.getItem('markdownNotesFocusMode');
        if (saved === 'true') {
            this.isFocusMode = true;
            this.applyFocusMode();
        }
    }

    // ========== 标签相关方法 ==========

    // 添加标签到当前笔记
    addTag() {
        if (!this.tagInput || !this.currentNoteId) return;

        const tagText = this.tagInput.value.trim();
        if (!tagText) return;

        // 检查标签是否只包含空格
        if (tagText === '') return;

        // 检查标签是否已存在
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex === -1) return;

        const note = this.notes[noteIndex];
        
        // 确保 tags 数组存在
        if (!note.tags) {
            note.tags = [];
        }

        // 检查标签是否已存在（不区分大小写）
        if (note.tags.some(t => t.toLowerCase() === tagText.toLowerCase())) {
            this.tagInput.value = '';
            return;
        }

        // 添加标签
        note.tags.push(tagText);
        this.notes[noteIndex].updatedAt = new Date().toISOString();
        this.saveNotes();
        
        // 清空输入框
        this.tagInput.value = '';
        
        // 重新渲染
        this.renderCurrentTags();
        this.renderNotesList();
        this.renderTagsFilter();
    }

    // 从当前笔记删除标签
    removeTag(tagText) {
        if (!this.currentNoteId) return;

        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex === -1) return;

        const note = this.notes[noteIndex];
        if (!note.tags) return;

        // 删除标签
        note.tags = note.tags.filter(t => t !== tagText);
        this.notes[noteIndex].updatedAt = new Date().toISOString();
        this.saveNotes();

        // 重新渲染
        this.renderCurrentTags();
        this.renderNotesList();
        this.renderTagsFilter();
    }

    // 按标签筛选
    filterByTag(tagText) {
        this.currentTagFilter = tagText;
        this.renderNotesList();
        this.renderTagsFilter();
    }

    // 渲染当前笔记的标签
    renderCurrentTags() {
        if (!this.currentTagsElement || !this.currentNoteId) return;

        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note || !note.tags || note.tags.length === 0) {
            this.currentTagsElement.innerHTML = '';
            return;
        }

        this.currentTagsElement.innerHTML = '';
        note.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-item';
            tagElement.innerHTML = `
                <span class="tag-text">${this.escapeHtml(tag)}</span>
                <button class="tag-remove-btn" title="删除标签">×</button>
            `;
            
            const removeBtn = tagElement.querySelector('.tag-remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTag(tag);
            });
            
            this.currentTagsElement.appendChild(tagElement);
        });
    }

    // 获取所有唯一标签
    getAllTags() {
        const allTags = new Set();
        this.notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    // 渲染标签筛选器
    renderTagsFilter() {
        if (!this.tagsFilterList) return;

        const allTags = this.getAllTags();
        
        if (allTags.length === 0) {
            this.tagsFilterList.innerHTML = '';
            if (this.clearTagsFilterBtn) {
                this.clearTagsFilterBtn.style.display = 'none';
            }
            return;
        }

        this.tagsFilterList.innerHTML = '';
        
        allTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = `filter-tag${this.currentTagFilter === tag ? ' active' : ''}`;
            tagElement.textContent = tag;
            tagElement.title = `点击筛选标签: ${tag}`;
            
            tagElement.addEventListener('click', () => {
                if (this.currentTagFilter === tag) {
                    // 如果已经选中，则取消筛选
                    this.currentTagFilter = null;
                } else {
                    this.currentTagFilter = tag;
                }
                this.renderNotesList();
                this.renderTagsFilter();
            });
            
            this.tagsFilterList.appendChild(tagElement);
        });

        // 显示/隐藏清除筛选按钮
        if (this.clearTagsFilterBtn) {
            this.clearTagsFilterBtn.style.display = this.currentTagFilter ? 'block' : 'none';
        }
    }
}

// 当 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownNotesApp();
});
