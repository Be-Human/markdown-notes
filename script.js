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
        
        // 处理代码块 (```...```)
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // 处理行内代码 (`...`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 处理标题 (# 到 ######)
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
        
        // 处理粗体 (**...**)
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // 处理斜体 (*...*)
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // 处理链接 ([text](url))
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // 处理分割线 (---, ***, ___)
        html = html.replace(/^\*{3,}$/gm, '<hr>');
        html = html.replace(/^-{3,}$/gm, '<hr>');
        html = html.replace(/^_{3,}$/gm, '<hr>');
        
        // 处理有序列表 (1. 2. 3.)
        // 需要特殊处理，因为列表项可能跨多行
        const orderedListRegex = /^\d+\.\s+[\s\S]*?(?=\n\n|\n$|$)/gm;
        html = html.replace(orderedListRegex, (match) => {
            const items = match.split('\n').filter(item => item.trim() !== '');
            const listItems = items.map(item => {
                return `<li>${item.replace(/^\d+\.\s+/, '')}</li>`;
            }).join('');
            return `<ol>${listItems}</ol>`;
        });
        
        // 处理无序列表 (- *, +)
        const unorderedListRegex = /^[\*\+\-]\s+[\s\S]*?(?=\n\n|\n$|$)/gm;
        html = html.replace(unorderedListRegex, (match) => {
            const items = match.split('\n').filter(item => item.trim() !== '');
            const listItems = items.map(item => {
                return `<li>${item.replace(/^[\*\+\-]\s+/, '')}</li>`;
            }).join('');
            return `<ul>${listItems}</ul>`;
        });
        
        // 处理段落 (剩余的文本)
        // 先处理换行，将单个换行替换为 <br>，然后将多个换行替换为段落分隔
        html = html.split('\n\n').map(paragraph => {
            if (paragraph.startsWith('<') && paragraph.endsWith('>')) {
                return paragraph; // 已经是 HTML 元素
            }
            return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
        }).join('');
        
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
