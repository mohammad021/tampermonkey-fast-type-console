// ==UserScript==
// @name         تایپ سریع در کنسول (نسخه ۸.۰ - رفع کامل شیفت)
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  تایپ خودکار بدون خطا - رفع مشکل * و کاراکترهای شیفت‌دار - Paste مستقیم
// @match        *://172.218.128.210*
// @match        *://*:8006/*
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/mohammad021/tampermonkey-fast-type-console/main/fast-type-in-console.user.js
// @downloadURL  https://raw.githubusercontent.com/mohammad021/tampermonkey-fast-type-console/main/fast-type-in-console.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let isTyping = false;
    let cancelTyping = false;

    // ═══════════ نگاشت کامل شیفت‌کاراکترها ═══════════
    // کلید: کاراکتری که کاربر تایپ می‌کند
    // مقدار: { key: کاراکتر واقعی, code: کد فیزیکی کلید, shiftKey: آیا شیفت لازم است }
    const KEY_MAP = {
        // حروف بزرگ
        ...(()=>{
            const m = {};
            for (let i = 65; i <= 90; i++) {
                const upper = String.fromCharCode(i);
                const lower = String.fromCharCode(i + 32);
                m[upper] = { key: upper, code: `Key${upper}`, keyCode: i, shiftKey: true };
                m[lower] = { key: lower, code: `Key${upper}`, keyCode: i, shiftKey: false };
            }
            return m;
        })(),

        // اعداد (بدون شیفت)
        '0': { key: '0', code: 'Digit0', keyCode: 48, shiftKey: false },
        '1': { key: '1', code: 'Digit1', keyCode: 49, shiftKey: false },
        '2': { key: '2', code: 'Digit2', keyCode: 50, shiftKey: false },
        '3': { key: '3', code: 'Digit3', keyCode: 51, shiftKey: false },
        '4': { key: '4', code: 'Digit4', keyCode: 52, shiftKey: false },
        '5': { key: '5', code: 'Digit5', keyCode: 53, shiftKey: false },
        '6': { key: '6', code: 'Digit6', keyCode: 54, shiftKey: false },
        '7': { key: '7', code: 'Digit7', keyCode: 55, shiftKey: false },
        '8': { key: '8', code: 'Digit8', keyCode: 56, shiftKey: false },
        '9': { key: '9', code: 'Digit9', keyCode: 57, shiftKey: false },

        // شیفت + عدد = کاراکتر خاص
        '!': { key: '!', code: 'Digit1', keyCode: 49, shiftKey: true },
        '@': { key: '@', code: 'Digit2', keyCode: 50, shiftKey: true },
        '#': { key: '#', code: 'Digit3', keyCode: 51, shiftKey: true },
        '$': { key: '$', code: 'Digit4', keyCode: 52, shiftKey: true },
        '%': { key: '%', code: 'Digit5', keyCode: 53, shiftKey: true },
        '^': { key: '^', code: 'Digit6', keyCode: 54, shiftKey: true },
        '&': { key: '&', code: 'Digit7', keyCode: 55, shiftKey: true },
        '*': { key: '*', code: 'Digit8', keyCode: 56, shiftKey: true },
        '(': { key: '(', code: 'Digit9', keyCode: 57, shiftKey: true },
        ')': { key: ')', code: 'Digit0', keyCode: 48, shiftKey: true },

        // نشانه‌گذاری‌ها (بدون شیفت)
        '-': { key: '-', code: 'Minus', keyCode: 189, shiftKey: false },
        '=': { key: '=', code: 'Equal', keyCode: 187, shiftKey: false },
        '[': { key: '[', code: 'BracketLeft', keyCode: 219, shiftKey: false },
        ']': { key: ']', code: 'BracketRight', keyCode: 221, shiftKey: false },
        '\\': { key: '\\', code: 'Backslash', keyCode: 220, shiftKey: false },
        ';': { key: ';', code: 'Semicolon', keyCode: 186, shiftKey: false },
        "'": { key: "'", code: 'Quote', keyCode: 222, shiftKey: false },
        '`': { key: '`', code: 'Backquote', keyCode: 192, shiftKey: false },
        ',': { key: ',', code: 'Comma', keyCode: 188, shiftKey: false },
        '.': { key: '.', code: 'Period', keyCode: 190, shiftKey: false },
        '/': { key: '/', code: 'Slash', keyCode: 191, shiftKey: false },

        // شیفت + نشانه‌گذاری
        '_': { key: '_', code: 'Minus', keyCode: 189, shiftKey: true },
        '+': { key: '+', code: 'Equal', keyCode: 187, shiftKey: true },
        '{': { key: '{', code: 'BracketLeft', keyCode: 219, shiftKey: true },
        '}': { key: '}', code: 'BracketRight', keyCode: 221, shiftKey: true },
        '|': { key: '|', code: 'Backslash', keyCode: 220, shiftKey: true },
        ':': { key: ':', code: 'Semicolon', keyCode: 186, shiftKey: true },
        '"': { key: '"', code: 'Quote', keyCode: 222, shiftKey: true },
        '~': { key: '~', code: 'Backquote', keyCode: 192, shiftKey: true },
        '<': { key: '<', code: 'Comma', keyCode: 188, shiftKey: true },
        '>': { key: '>', code: 'Period', keyCode: 190, shiftKey: true },
        '?': { key: '?', code: 'Slash', keyCode: 191, shiftKey: true },

        // کلیدهای خاص
        ' ': { key: ' ', code: 'Space', keyCode: 32, shiftKey: false },
        '\n': { key: 'Enter', code: 'Enter', keyCode: 13, shiftKey: false },
        '\r': { key: 'Enter', code: 'Enter', keyCode: 13, shiftKey: false },
        '\t': { key: 'Tab', code: 'Tab', keyCode: 9, shiftKey: false },
    };

    // ═══════════ استایل‌ها ═══════════
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');

        .qt-btn-main {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 0 12px;
            font-size: 12px;
            cursor: move;
            box-shadow: 0 3px 12px rgba(16,185,129,0.4);
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            font-weight: 600;
            transition: all 0.2s;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            white-space: nowrap;
            width: fit-content;
            height: 30px;
            display: flex;
            align-items: center;
            gap: 5px;
            user-select: none;
            direction: rtl;
        }
        .qt-btn-main:hover { box-shadow: 0 5px 18px rgba(16,185,129,0.55); }

        /* ═══ مودال ═══ */
        .qt-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            z-index: 1000000;
            display: none;
            width: 780px;
            max-width: 94vw;
            max-height: 92vh;
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            direction: rtl;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.08);
            cursor: default;
        }
        .qt-modal.qt-opaque {
            background: #1a1f2e;
        }
        .qt-modal.qt-transparent {
            background: rgba(26, 31, 46, 0.85);
            backdrop-filter: blur(12px);
        }

        .qt-header {
            padding: 10px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            user-select: none;
            background: rgba(0,0,0,0.2);
        }
        .qt-header-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .qt-header h3 {
            margin: 0;
            color: #d1d5db;
            font-weight: 600;
            font-size: 0.85rem;
        }
        .qt-header-left {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .qt-hbtn {
            width: 26px; height: 26px;
            border-radius: 4px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            color: #94a3b8;
            cursor: pointer;
            font-size: 12px;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s;
        }
        .qt-hbtn:hover { background: rgba(255,255,255,0.12); color: #e2e8f0; }
        .qt-hbtn.qt-close:hover { background: rgba(239,68,68,0.2); color: #ef4444; }

        .qt-body {
            padding: 14px;
            display: flex;
            gap: 14px;
            flex-wrap: nowrap;
            overflow: hidden;
        }

        .qt-input-sec {
            flex: 2;
            min-width: 280px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        /* ═══ تنظیمات ═══ */
        .qt-settings {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 5px;
            padding: 6px 10px;
            flex-wrap: wrap;
        }
        .qt-settings label {
            color: #94a3b8;
            font-size: 0.68rem;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            white-space: nowrap;
        }
        .qt-settings input[type="checkbox"] {
            accent-color: #10b981;
            width: 14px; height: 14px;
            cursor: pointer;
        }

        /* ═══ textarea ═══ */
        #qtInput {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 5px;
            background: #0d1117;
            color: #e6edf3;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
            box-sizing: border-box;
            direction: ltr;
            text-align: left;
            white-space: pre-wrap;
            min-height: 130px;
            transition: border-color 0.2s;
        }
        #qtInput:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 2px rgba(16,185,129,0.15);
        }
        #qtInput::placeholder {
            color: #4b5563;
            font-family: 'Vazirmatn', Tahoma;
            direction: rtl;
        }

        .qt-charcount {
            display: flex;
            justify-content: space-between;
            font-size: 0.6rem;
            color: #4b5563;
            padding: 0 2px;
        }

        .qt-progress {
            width: 100%; height: 3px;
            background: #1e293b;
            border-radius: 2px;
            overflow: hidden;
            display: none;
        }
        .qt-progress-bar {
            height: 100%; width: 0%;
            background: linear-gradient(90deg, #10b981, #34d399);
            border-radius: 2px;
            transition: width 0.1s;
        }

        /* ═══ دکمه‌ها ═══ */
        .qt-btns {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        .qt-b {
            height: 28px;
            border-radius: 4px;
            padding: 0 10px;
            border: none;
            font-family: 'Vazirmatn', Tahoma;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            font-size: 0.7rem;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            line-height: 1;
            white-space: nowrap;
        }
        .qt-b:disabled { opacity: 0.45; cursor: not-allowed; }
        .qt-b-green { background: #10b981; color: white; }
        .qt-b-green:hover:not(:disabled) { background: #059669; }
        .qt-b-blue { background: #3b82f6; color: white; }
        .qt-b-blue:hover:not(:disabled) { background: #2563eb; }
        .qt-b-purple { background: #8b5cf6; color: white; }
        .qt-b-purple:hover:not(:disabled) { background: #7c3aed; }
        .qt-b-red { background: #ef4444; color: white; }
        .qt-b-red:hover:not(:disabled) { background: #dc2626; }
        .qt-b-gray {
            background: rgba(255,255,255,0.06);
            color: #94a3b8;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .qt-b-gray:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #e2e8f0; }
        .qt-b-orange { background: #f59e0b; color: white; }
        .qt-b-orange:hover:not(:disabled) { background: #d97706; }

        .qt-status {
            font-size: 0.68rem;
            text-align: center;
            color: #10b981;
            min-height: 16px;
        }

        /* ═══ پنل دستورات ═══ */
        .qt-cmds {
            flex: 1;
            min-width: 190px;
            max-width: 230px;
            background: rgba(13,17,23,0.8);
            border-radius: 8px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .qt-cmds-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .qt-cmds-head h4 {
            color: #94a3b8; margin: 0;
            font-size: 0.72rem; font-weight: 600;
        }
        .qt-cmd-search {
            width: 100%;
            padding: 5px 8px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 4px;
            background: #1a1f2e;
            color: #e2e8f0;
            font-size: 0.68rem;
            font-family: 'Vazirmatn', Tahoma;
            margin-bottom: 6px;
            box-sizing: border-box;
            direction: rtl;
        }
        .qt-cmd-search:focus { outline: none; border-color: #10b981; }
        .qt-cmd-search::placeholder { color: #4b5563; }

        .qt-cmd-tabs {
            display: flex; gap: 3px; margin-bottom: 6px; flex-wrap: wrap;
        }
        .qt-cmd-tab {
            padding: 2px 6px; border-radius: 4px;
            font-size: 0.58rem; cursor: pointer;
            background: rgba(255,255,255,0.04);
            color: #64748b; border: 1px solid transparent;
            transition: all 0.15s; font-family: 'Vazirmatn', Tahoma;
            white-space: nowrap;
        }
        .qt-cmd-tab:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
        .qt-cmd-tab.active {
            background: rgba(16,185,129,0.15);
            color: #10b981;
            border-color: rgba(16,185,129,0.3);
        }

        .qt-cmd-list {
            flex: 1; overflow-y: auto; padding-left: 3px;
        }
        .qt-cmd-item {
            background: rgba(26,31,46,0.8);
            margin-bottom: 5px; border-radius: 5px;
            padding: 6px 8px; cursor: pointer;
            transition: all 0.12s;
            border-right: 3px solid #10b981;
        }
        .qt-cmd-item:hover { background: rgba(55,65,81,0.7); transform: translateX(-2px); }
        .qt-cmd-name {
            font-family: 'Courier New', monospace;
            font-weight: bold; color: #34d399;
            font-size: 0.7rem; direction: ltr; text-align: left;
        }
        .qt-cmd-desc {
            font-size: 0.58rem; color: #64748b;
            margin-top: 2px; line-height: 1.3;
        }

        .qt-notif {
            position: fixed; top: 18px; right: 18px;
            color: white; padding: 8px 16px;
            border-radius: 5px; z-index: 1000002;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            direction: rtl;
            animation: qtSlideIn 0.25s ease, qtFadeOut 0.3s ease 2s forwards;
        }
        @keyframes qtSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes qtFadeOut {
            from { opacity: 1; }
            to { opacity: 0; transform: translateY(-8px); }
        }

        @media (max-width: 700px) {
            .qt-body { flex-direction: column; }
            .qt-cmds { max-width: 100%; max-height: 180px; }
        }

        .qt-cmd-list::-webkit-scrollbar { width: 3px; }
        .qt-cmd-list::-webkit-scrollbar-track { background: transparent; }
        .qt-cmd-list::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    `;
    document.head.appendChild(style);

    // ═══════════ دکمه اصلی (قابل جابجایی) ═══════════
    const mainBtn = document.createElement('button');
    mainBtn.className = 'qt-btn-main';
    mainBtn.innerHTML = '⌨️ تایپ سریع';
    document.body.appendChild(mainBtn);

    setupDraggable(mainBtn, 'qtMainBtnPos', () => openModal());

    // ═══════════ مودال ═══════════
    const modal = document.createElement('div');
    modal.className = 'qt-modal qt-opaque';
    modal.innerHTML = `
        <div class="qt-header" id="qtModalHeader">
            <div class="qt-header-right">
                <h3>📝 تایپ سریع</h3>
            </div>
            <div class="qt-header-left">
                <label style="color:#64748b;font-size:0.62rem;display:flex;align-items:center;gap:3px;cursor:pointer;">
                    <input type="checkbox" id="qtTransparent" style="accent-color:#10b981;width:13px;height:13px;cursor:pointer;">
                    شفاف
                </label>
                <button class="qt-hbtn" id="qtPasteClip" title="خواندن از کلیپ‌بورد">📋</button>
                <button class="qt-hbtn" id="qtClearAll" title="پاک کردن متن">🗑</button>
                <button class="qt-hbtn qt-close" id="qtClose" title="بستن (Esc)">✕</button>
            </div>
        </div>
        <div class="qt-body">
            <div class="qt-input-sec">
                <textarea id="qtInput" rows="7"
                    placeholder="متن را وارد کنید یا Ctrl+V بزنید...&#10;💡 اگر متنی کپی کرده‌اید خودکار بارگذاری می‌شود"></textarea>

                <div class="qt-charcount">
                    <span id="qtChars">۰ کاراکتر</span>
                    <span id="qtLines">۰ خط</span>
                </div>

                <div class="qt-progress" id="qtProgress">
                    <div class="qt-progress-bar" id="qtProgressBar"></div>
                </div>

                <div class="qt-btns">
                    <button id="qtStartType" class="qt-b qt-b-green">▶ تایپ خودکار</button>
                    <button id="qtPasteDirect" class="qt-b qt-b-purple">📌 Paste مستقیم</button>
                    <button id="qtCopy" class="qt-b qt-b-blue">📋 کپی</button>
                    <button id="qtSendEnter" class="qt-b qt-b-gray">↵ Enter</button>
                    <button id="qtClearBtn" class="qt-b qt-b-orange">🗑 پاک</button>
                    <button id="qtCancel" class="qt-b qt-b-red" style="display:none">⏹ توقف</button>
                </div>

                <div id="qtStatus" class="qt-status"></div>
            </div>

            <div class="qt-cmds">
                <div class="qt-cmds-head">
                    <h4>📚 دستورات</h4>
                </div>
                <input type="text" class="qt-cmd-search" id="qtCmdSearch" placeholder="🔍 جستجو...">
                <div class="qt-cmd-tabs" id="qtCmdTabs"></div>
                <div class="qt-cmd-list" id="qtCmdList"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // ═══════════ رفرنس‌ها ═══════════
    const txtInput = modal.querySelector('#qtInput');
    const btnStart = modal.querySelector('#qtStartType');
    const btnPaste = modal.querySelector('#qtPasteDirect');
    const btnCopy = modal.querySelector('#qtCopy');
    const btnEnter = modal.querySelector('#qtSendEnter');
    const btnClear = modal.querySelector('#qtClearBtn');
    const btnCancel = modal.querySelector('#qtCancel');
    const btnClose = modal.querySelector('#qtClose');
    const btnPasteClip = modal.querySelector('#qtPasteClip');
    const btnClearAll = modal.querySelector('#qtClearAll');
    const chkTransparent = modal.querySelector('#qtTransparent');
    const elStatus = modal.querySelector('#qtStatus');
    const elChars = modal.querySelector('#qtChars');
    const elLines = modal.querySelector('#qtLines');
    const elProgress = modal.querySelector('#qtProgress');
    const elProgressBar = modal.querySelector('#qtProgressBar');
    const elCmdList = modal.querySelector('#qtCmdList');
    const elCmdSearch = modal.querySelector('#qtCmdSearch');
    const elCmdTabs = modal.querySelector('#qtCmdTabs');
    const modalHeader = modal.querySelector('#qtModalHeader');

    // ═══════════ جابجایی مودال ═══════════
    setupDraggableModal(modal, modalHeader, 'qtModalPos');

    // ═══════════ شفافیت ═══════════
    const savedTransparent = localStorage.getItem('qtTransparent') === 'true';
    chkTransparent.checked = savedTransparent;
    modal.className = `qt-modal ${savedTransparent ? 'qt-transparent' : 'qt-opaque'}`;

    chkTransparent.addEventListener('change', () => {
        const isT = chkTransparent.checked;
        modal.className = `qt-modal ${isT ? 'qt-transparent' : 'qt-opaque'}`;
        localStorage.setItem('qtTransparent', isT);
    });

    // ═══════════ دیتابیس دستورات ═══════════
    const CATS = { 'همه': null, 'فایل': 'file', 'شبکه': 'net', 'سیستم': 'sys', 'سرویس': 'svc', 'متن': 'txt', 'بسته': 'pkg' };

    const CMDS = [
        { c: "ls -la", d: "نمایش کامل محتویات", t: "file" },
        { c: "ls -lah", d: "نمایش با حجم خوانا", t: "file" },
        { c: "cd /path", d: "رفتن به مسیر", t: "file" },
        { c: "cd ..", d: "یک سطح بالاتر", t: "file" },
        { c: "pwd", d: "مسیر فعلی", t: "file" },
        { c: "cp -r src dest", d: "کپی بازگشتی", t: "file" },
        { c: "mv old new", d: "انتقال/تغییر نام", t: "file" },
        { c: "rm -rf path", d: "حذف اجباری", t: "file" },
        { c: "mkdir -p dir/sub", d: "ساخت پوشه تو در تو", t: "file" },
        { c: "touch file.txt", d: "ساخت فایل خالی", t: "file" },
        { c: "chmod +x script.sh", d: "اجرایی کردن", t: "file" },
        { c: "chmod 755 file", d: "تنظیم مجوز", t: "file" },
        { c: "chown user:group file", d: "تغییر مالکیت", t: "file" },
        { c: "du -sh *", d: "حجم فایل‌ها", t: "file" },
        { c: "find . -name '*.log'", d: "جستجوی فایل", t: "file" },
        { c: "tar -czf a.tar.gz dir/", d: "فشرده‌سازی", t: "file" },
        { c: "tar -xzf a.tar.gz", d: "خارج کردن tar.gz", t: "file" },
        { c: "unzip file.zip", d: "خارج کردن zip", t: "file" },
        { c: "cat file", d: "نمایش فایل", t: "txt" },
        { c: "head -20 file", d: "۲۰ خط اول", t: "txt" },
        { c: "tail -f /var/log/syslog", d: "لاگ زنده", t: "txt" },
        { c: "nano file", d: "ویرایشگر ساده", t: "txt" },
        { c: "grep -rn 'pattern' .", d: "جستجو بازگشتی", t: "txt" },
        { c: "sed -i 's/old/new/g' file", d: "جایگزینی متن", t: "txt" },
        { c: "wc -l file", d: "شمارش خطوط", t: "txt" },
        { c: "echo 'text' >> file", d: "افزودن به فایل", t: "txt" },
        { c: "diff file1 file2", d: "مقایسه دو فایل", t: "txt" },
        { c: "sudo su", d: "ورود به روت", t: "sys" },
        { c: "whoami", d: "کاربر فعلی", t: "sys" },
        { c: "uname -a", d: "اطلاعات هسته", t: "sys" },
        { c: "uptime", d: "مدت روشن بودن", t: "sys" },
        { c: "df -h", d: "فضای دیسک", t: "sys" },
        { c: "free -h", d: "وضعیت رم", t: "sys" },
        { c: "htop", d: "مدیریت فرآیندها", t: "sys" },
        { c: "ps aux | grep proc", d: "جستجوی فرآیند", t: "sys" },
        { c: "kill -9 PID", d: "پایان اجباری", t: "sys" },
        { c: "history | grep cmd", d: "جستجو تاریخچه", t: "sys" },
        { c: "reboot", d: "ریست سیستم", t: "sys" },
        { c: "shutdown -h now", d: "خاموش فوری", t: "sys" },
        { c: "lsblk", d: "دیسک‌ها و پارتیشن‌ها", t: "sys" },
        { c: "crontab -e", d: "ویرایش کرون‌جاب", t: "sys" },
        { c: "ping -c 4 google.com", d: "پینگ ۴ بار", t: "net" },
        { c: "ip a", d: "آدرس‌های IP", t: "net" },
        { c: "ss -tulpn", d: "پورت‌های باز", t: "net" },
        { c: "curl -I url", d: "هدرهای HTTP", t: "net" },
        { c: "wget url", d: "دانلود فایل", t: "net" },
        { c: "scp file user@host:/path", d: "کپی امن", t: "net" },
        { c: "ssh user@host", d: "اتصال SSH", t: "net" },
        { c: "nslookup domain", d: "جستجوی DNS", t: "net" },
        { c: "traceroute host", d: "مسیر شبکه", t: "net" },
        { c: "ufw status", d: "وضعیت فایروال", t: "net" },
        { c: "ufw allow 22", d: "باز کردن SSH", t: "net" },
        { c: "iptables -L -n", d: "قوانین فایروال", t: "net" },
        { c: "systemctl status svc", d: "وضعیت سرویس", t: "svc" },
        { c: "systemctl start svc", d: "شروع سرویس", t: "svc" },
        { c: "systemctl stop svc", d: "توقف سرویس", t: "svc" },
        { c: "systemctl restart svc", d: "ریستارت سرویس", t: "svc" },
        { c: "systemctl enable svc", d: "فعال در بوت", t: "svc" },
        { c: "journalctl -u svc -f", d: "لاگ زنده سرویس", t: "svc" },
        { c: "apt update && apt upgrade -y", d: "آپدیت کامل (دبیان)", t: "pkg" },
        { c: "apt install pkg", d: "نصب بسته", t: "pkg" },
        { c: "apt remove pkg", d: "حذف بسته", t: "pkg" },
        { c: "apt autoremove", d: "حذف وابستگی‌ها", t: "pkg" },
        { c: "yum update -y", d: "آپدیت (RedHat)", t: "pkg" },
        { c: "dnf install pkg", d: "نصب (Fedora)", t: "pkg" },
        { c: "pip install pkg", d: "نصب پایتون", t: "pkg" },
        { c: "npm install pkg", d: "نصب Node.js", t: "pkg" },
    ];

    // ═══════════ تب‌ها ═══════════
    let activeCat = null;
    Object.entries(CATS).forEach(([label, key]) => {
        const tab = document.createElement('span');
        tab.className = 'qt-cmd-tab' + (key === null ? ' active' : '');
        tab.textContent = label;
        tab.onclick = () => {
            activeCat = key;
            elCmdTabs.querySelectorAll('.qt-cmd-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCmds();
        };
        elCmdTabs.appendChild(tab);
    });

    function renderCmds(search = '') {
        elCmdList.innerHTML = '';
        const s = search.toLowerCase();
        let count = 0;
        CMDS.forEach(item => {
            if (activeCat && item.t !== activeCat) return;
            if (s && !item.c.toLowerCase().includes(s) && !item.d.includes(s)) return;
            count++;
            const div = document.createElement('div');
            div.className = 'qt-cmd-item';
            div.innerHTML = `<div class="qt-cmd-name">$ ${item.c}</div><div class="qt-cmd-desc">${item.d}</div>`;
            div.onclick = () => {
                const cur = txtInput.value;
                txtInput.value = cur ? cur + '\n' + item.c : item.c;
                txtInput.focus();
                updateCount();
                setStatus(`✅ «${item.c}» اضافه شد`, '#10b981');
            };
            elCmdList.appendChild(div);
        });
        if (!count) elCmdList.innerHTML = '<div style="color:#4b5563;text-align:center;padding:15px;font-size:0.65rem;">نتیجه‌ای نیست</div>';
    }
    renderCmds();
    elCmdSearch.addEventListener('input', () => renderCmds(elCmdSearch.value));

    // ═══════════ شمارنده ═══════════
    function updateCount() {
        const t = txtInput.value;
        elChars.textContent = `${t.length} کاراکتر`;
        elLines.textContent = `${t ? t.split('\n').length : 0} خط`;
    }
    txtInput.addEventListener('input', updateCount);

    // ═══════════ خواندن کلیپ‌بورد ═══════════
    async function readClip() {
        try {
            const t = await navigator.clipboard.readText();
            return (t && t.trim()) ? t : null;
        } catch { return null; }
    }

    // ═══════════ باز/بسته مودال ═══════════
    async function openModal() {
        modal.style.display = 'block';
        if (!txtInput.value.trim()) {
            const clip = await readClip();
            if (clip) {
                txtInput.value = clip;
                updateCount();
                setStatus('📋 متن کلیپ‌بورد بارگذاری شد', '#3b82f6');
            }
        }
        txtInput.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // ═══════════ ارسال یک کاراکتر (حل شیفت!) ═══════════
    async function sendChar(char, target) {
        if (cancelTyping) return;

        const mapping = KEY_MAP[char];

        if (mapping) {
            const opts = {
                key: mapping.key,
                code: mapping.code,
                keyCode: mapping.keyCode,
                which: mapping.keyCode,
                charCode: 0,
                shiftKey: mapping.shiftKey,
                ctrlKey: false,
                altKey: false,
                metaKey: false,
                bubbles: true,
                cancelable: true
            };

            if (mapping.shiftKey) {
                target.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Shift', code: 'ShiftLeft', keyCode: 16, which: 16,
                    shiftKey: true, bubbles: true, cancelable: true
                }));
            }

            target.dispatchEvent(new KeyboardEvent('keydown', opts));

            if (char !== '\n' && char !== '\r' && char !== '\t') {
                target.dispatchEvent(new KeyboardEvent('keypress', {
                    ...opts,
                    charCode: char.charCodeAt(0),
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0),
                }));
            }

            target.dispatchEvent(new KeyboardEvent('keyup', opts));

            if (mapping.shiftKey) {
                target.dispatchEvent(new KeyboardEvent('keyup', {
                    key: 'Shift', code: 'ShiftLeft', keyCode: 16, which: 16,
                    shiftKey: false, bubbles: true, cancelable: true
                }));
            }
        } else {
            const kc = char.charCodeAt(0);
            const opts = {
                key: char, code: '', keyCode: kc, which: kc,
                charCode: 0, shiftKey: false,
                bubbles: true, cancelable: true
            };
            target.dispatchEvent(new KeyboardEvent('keydown', opts));
            target.dispatchEvent(new KeyboardEvent('keypress', {
                ...opts, charCode: kc, keyCode: kc, which: kc
            }));
            target.dispatchEvent(new KeyboardEvent('keyup', opts));
        }

        await sleep(8);
    }

    // ═══════════ تایپ کامل ═══════════
    async function typeText(text, target) {
        const chars = text.split('');
        const total = chars.length;
        elProgress.style.display = 'block';
        elProgressBar.style.width = '0%';

        for (let i = 0; i < total; i++) {
            if (cancelTyping) break;
            await sendChar(chars[i], target);
            if (i % 20 === 0 || i === total - 1) {
                elProgressBar.style.width = Math.round(((i + 1) / total) * 100) + '%';
            }
        }
        elProgress.style.display = 'none';
        elProgressBar.style.width = '0%';
    }

    // ═══════════ پیدا کردن canvas ═══════════
    function findCanvas() {
        let c = document.querySelector('canvas.noVNC_canvas') ||
                document.querySelector('canvas');

        if (!c) {
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                try {
                    c = iframe.contentDocument.querySelector('canvas');
                    if (c) break;
                } catch {}
            }
        }
        return c;
    }

    // ═══════════ Paste مستقیم ═══════════
    async function pasteDirectly() {
        let text = txtInput.value;

        if (!text.trim()) {
            const clip = await readClip();
            if (clip) {
                text = clip;
                txtInput.value = clip;
                updateCount();
                setStatus('📋 متن کلیپ‌بورد بارگذاری شد', '#3b82f6');
                await sleep(400);
            } else {
                setStatus('⚠️ متنی وجود ندارد', '#f59e0b');
                return;
            }
        }

        const canvas = findCanvas();
        if (!canvas) {
            setStatus('❌ کنسول پیدا نشد!', '#ef4444');
            return;
        }

        closeModal();
        canvas.focus();
        canvas.click();
        await sleep(300);

        const clipData = new DataTransfer();
        clipData.setData('text/plain', text);

        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: clipData
        });

        canvas.dispatchEvent(pasteEvent);

        try {
            await navigator.clipboard.writeText(text);
        } catch {}

        await sleep(100);
        canvas.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'v', code: 'KeyV', keyCode: 86, which: 86,
            ctrlKey: true, shiftKey: true,
            bubbles: true, cancelable: true
        }));
        canvas.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'v', code: 'KeyV', keyCode: 86, which: 86,
            ctrlKey: true, shiftKey: true,
            bubbles: true, cancelable: true
        }));

        showNotif('📌 Paste ارسال شد - اگر کار نکرد دستی Ctrl+Shift+V بزنید', '#8b5cf6');
        txtInput.value = '';
        updateCount();
    }

    // ═══════════ شروع تایپ ═══════════
    btnStart.onclick = async () => {
        let text = txtInput.value;

        if (!text.trim()) {
            const clip = await readClip();
            if (clip) {
                text = clip;
                txtInput.value = clip;
                updateCount();
                setStatus('📋 از کلیپ‌بورد بارگذاری شد', '#3b82f6');
                await sleep(500);
            } else {
                setStatus('⚠️ متنی وارد نشده و کلیپ‌بورد خالی است', '#f59e0b');
                return;
            }
        }

        const canvas = findCanvas();
        if (!canvas) {
            setStatus('❌ canvas یافت نشد! از «Paste مستقیم» یا «کپی» استفاده کنید', '#ef4444');
            return;
        }

        isTyping = true;
        cancelTyping = false;
        btnStart.style.display = 'none';
        btnCancel.style.display = 'inline-flex';
        btnPaste.disabled = true;
        btnCopy.disabled = true;
        btnClear.disabled = true;

        closeModal();
        canvas.focus();
        canvas.click();
        await sleep(350);

        await typeText(text, canvas);

        isTyping = false;
        btnStart.style.display = 'inline-flex';
        btnCancel.style.display = 'none';
        btnPaste.disabled = false;
        btnCopy.disabled = false;
        btnClear.disabled = false;

        if (!cancelTyping) {
            showNotif('✅ تایپ کامل شد!', '#10b981');
            txtInput.value = '';
            updateCount();
        } else {
            showNotif('⏹ تایپ متوقف شد', '#f59e0b');
        }
        cancelTyping = false;
    };

    btnCancel.onclick = () => { cancelTyping = true; };

    btnPaste.onclick = pasteDirectly;

    btnCopy.onclick = async () => {
        let text = txtInput.value;
        if (!text.trim()) {
            const clip = await readClip();
            if (clip) {
                txtInput.value = clip;
                updateCount();
                setStatus('📋 متن کلیپ‌بورد وارد شد', '#3b82f6');
                return;
            }
            setStatus('⚠️ متنی نیست', '#f59e0b');
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            setStatus('✅ کپی شد! Ctrl+Shift+V در کنسول', '#10b981');
            showNotif('📋 کپی شد → Ctrl+Shift+V', '#3b82f6');
            setTimeout(closeModal, 1200);
        } catch {
            setStatus('❌ خطا در کپی', '#ef4444');
        }
    };

    btnClear.onclick = () => {
        txtInput.value = '';
        updateCount();
        setStatus('🗑 پاک شد', '#64748b');
        txtInput.focus();
    };

    btnClearAll.onclick = () => {
        txtInput.value = '';
        updateCount();
        setStatus('🗑 پاک شد', '#64748b');
    };

    btnPasteClip.onclick = async () => {
        const clip = await readClip();
        if (clip) {
            txtInput.value = clip;
            updateCount();
            setStatus('📋 بارگذاری شد', '#3b82f6');
        } else {
            setStatus('⚠️ کلیپ‌بورد خالی/بدون دسترسی', '#f59e0b');
        }
    };

    btnEnter.onclick = async () => {
        const canvas = findCanvas();
        if (!canvas) { showNotif('❌ کنسول نیست', '#ef4444'); return; }
        closeModal();
        canvas.focus();
        canvas.click();
        await sleep(200);
        await sendChar('\n', canvas);
        showNotif('↵ Enter ارسال شد', '#10b981');
    };

    btnClose.onclick = closeModal;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q')) {
            e.preventDefault();
            modal.style.display === 'block' ? closeModal() : openModal();
        }
        if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
    });

    txtInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); btnStart.click(); }
    });

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function setStatus(msg, color) {
        elStatus.textContent = msg;
        elStatus.style.color = color;
        setTimeout(() => { if (elStatus.textContent === msg) elStatus.textContent = ''; }, 3500);
    }

    function showNotif(msg, bg) {
        document.querySelectorAll('.qt-notif').forEach(n => n.remove());
        const n = document.createElement('div');
        n.className = 'qt-notif';
        n.textContent = msg;
        n.style.background = bg;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 2500);
    }

    function setupDraggable(el, storageKey, clickCallback) {
        let dragging = false, offX, offY, sX, sY;

        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) {
            el.style.left = saved.left;
            el.style.top = saved.top;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        }

        el.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            dragging = true;
            const r = el.getBoundingClientRect();
            offX = e.clientX - r.left;
            offY = e.clientY - r.top;
            sX = e.clientX; sY = e.clientY;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e.clientX - offX));
            const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - offY));
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        });

        window.addEventListener('mouseup', (e) => {
            if (!dragging) return;
            dragging = false;
            const moved = Math.abs(e.clientX - sX) > 4 || Math.abs(e.clientY - sY) > 4;
            if (!moved && clickCallback) {
                clickCallback();
            } else {
                localStorage.setItem(storageKey, JSON.stringify({ left: el.style.left, top: el.style.top }));
            }
        });
    }

    function setupDraggableModal(modalEl, handleEl, storageKey) {
        let dragging = false, offX, offY;

        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) {
            modalEl.style.left = saved.left;
            modalEl.style.top = saved.top;
            modalEl.style.transform = 'none';
        }

        handleEl.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('.qt-hbtn') || e.target.closest('label')) return;
            dragging = true;
            const r = modalEl.getBoundingClientRect();
            offX = e.clientX - r.left;
            offY = e.clientY - r.top;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const x = Math.max(0, Math.min(window.innerWidth - modalEl.offsetWidth, e.clientX - offX));
            const y = Math.max(0, Math.min(window.innerHeight - modalEl.offsetHeight, e.clientY - offY));
            modalEl.style.left = x + 'px';
            modalEl.style.top = y + 'px';
            modalEl.style.transform = 'none';
        });

        window.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            localStorage.setItem(storageKey, JSON.stringify({
                left: modalEl.style.left,
                top: modalEl.style.top
            }));
        });
    }

    console.log(
        '%c ⌨️ تایپ سریع v8.0 %c Ctrl+Shift+Q ',
        'background:#10b981;color:white;padding:3px 8px;border-radius:4px 0 0 4px;font-weight:bold;',
        'background:#1e293b;color:#10b981;padding:3px 8px;border-radius:0 4px 4px 0;'
    );
})();
