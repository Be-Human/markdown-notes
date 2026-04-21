// 应用状态管理
class MarkdownNotesApp {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.notesList = document.getElementById('notes-list');
        this.newNoteBtn = document.getElementById('new-note-btn');
        
        this.init();
    }

    // 初始化应用
    init() {
        this.loadNotes();
        this.bindEvents();
        this.renderNotesList();
        
        // 如果没有笔记，创建一个新笔记
        if (this.notes.length === 0) {
            this.createNewNote();
        } else {
            // 否则加载第一个笔记
            this.loadNote(this.notes[0].id);
        }
    }

    // 绑定事件
    bindEvents() {
        // 编辑器内容变化事件
        this.editor.addEventListener('input', () => {
            this.updateCurrentNote();
            this.renderPreview();
        });

        // 新建笔记按钮
        this.newNoteBtn.addEventListener('click', () => {
            this.createNewNote();
        });
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
        }
    }

    // 保存笔记到 localStorage
    saveNotes() {
        localStorage.setItem('markdownNotes', JSON.stringify(this.notes));
    }

    // 渲染笔记列表
    renderNotesList() {
        this.notesList.innerHTML = '';
        
        if (this.notes.length === 0) {
            return;
        }
        
        this.notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item${note.id === this.currentNoteId ? ' active' : ''}`;
            noteItem.dataset.id = note.id;
            
            const noteTitle = document.createElement('span');
            noteTitle.className = 'note-title';
            noteTitle.textContent = this.getNoteTitle(note.content);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'note-delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = '删除笔记';
            
            // 点击笔记项加载笔记
            noteItem.addEventListener('click', (e) => {
                if (e.target !== deleteBtn) {
                    this.loadNote(note.id);
                }
            });
            
            // 点击删除按钮删除笔记
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNote(note.id);
            });
            
            noteItem.appendChild(noteTitle);
            noteItem.appendChild(deleteBtn);
            this.notesList.appendChild(noteItem);
        });
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

    // 创建新笔记
    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.loadNote(newNote.id);
        this.renderNotesList();
    }

    // 加载笔记
    loadNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.currentNoteId = noteId;
            this.editor.value = note.content;
            this.renderPreview();
            this.renderNotesList();
        }
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
            alert('至少需要保留一个笔记！');
            return;
        }
        
        if (confirm('确定要删除这个笔记吗？')) {
            const noteIndex = this.notes.findIndex(n => n.id === noteId);
            if (noteIndex !== -1) {
                this.notes.splice(noteIndex, 1);
                this.saveNotes();
                
                // 如果删除的是当前笔记，加载第一个笔记
                if (noteId === this.currentNoteId) {
                    this.loadNote(this.notes[0].id);
                } else {
                    this.renderNotesList();
                }
            }
        }
    }
}

// 当 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownNotesApp();
});
