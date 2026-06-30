# تایپ سریع در کنسول (Fast Type in Console)

**نسخه ۸.۰** - رفع کامل مشکل شیفت و کاراکترهای خاص

اسکریپت قدرتمند Tampermonkey برای تایپ خودکار متن در کنسول‌های VNC/noVNC (مانند Proxmox، TrueNAS، و ...) بدون خطا.

## ویژگی‌های اصلی

- **تایپ بدون خطا**: نگاشت کامل کلیدها شامل تمام کاراکترهای شیفت‌دار (`* ! @ # $ % ...`)
- **Paste مستقیم**: ارسال متن از طریق ClipboardEvent + شبیه‌سازی Ctrl+Shift+V
- **پنل دستورات آماده**: صدها دستور لینوکس/شل مرتب‌شده در دسته‌بندی‌ها (فایل، شبکه، سیستم و ...)
- **رابط کاربری زیبا**: draggable، شفاف، responsive با فونت وزیرمتن
- **پیشرفت realtime** با نوار پیشرفت
- **کپی سریع** + ارسال Enter
- **حفظ موقعیت** دکمه و مودال در localStorage

## نحوه استفاده

1. اسکریپت را در **Tampermonkey** نصب کنید.
2. روی دکمه سبز «⌨️ تایپ سریع» کلیک کنید (قابل جابجایی).
3. متن را paste کنید یا دستورات آماده را انتخاب کنید.
4. **تایپ خودکار** یا **Paste مستقیم** را بزنید.
5. **میانبر**: `Ctrl + Shift + Q`

## نصب

[نصب مستقیم از GitHub](https://raw.githubusercontent.com/mohammad021/tampermonkey-fast-type-console/main/fast-type-in-console.user.js)

## سازگاری

- Proxmox VE
- TrueNAS Scale
- هر صفحه‌ای که شامل `canvas` (noVNC) باشد
- تمام مرورگرهای مدرن

## English

# Fast Type in Console (Tampermonkey Script)

**Version 8.0** - Complete Shift Key Fix

Powerful auto-typing script for VNC/noVNC consoles (Proxmox, TrueNAS, etc.) with perfect character support.

### Features
- Full keyboard mapping including all shifted characters
- Direct Paste via Clipboard API + Ctrl+Shift+V simulation
- Built-in Linux command library with categories
- Beautiful draggable UI with Persian font
- Real-time progress bar
- Works on any canvas-based remote console

**Hotkey**: `Ctrl + Shift + Q`

---

**Developed for Iranian users** - Optimized for right-to-left and Persian keyboards.

⭐ اگر مفید بود ستاره بده!