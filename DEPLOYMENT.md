# دليل النشر - نسخة ديمو العيادة السنية

## 🚀 النشر على Vercel (الطريقة الموصى بها)

### الطريقة الأولى: عبر GitHub

1. **رفع المشروع إلى GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Demo version"
   git branch -M main
   git remote add origin https://github.com/username/dental-clinic-demo.git
   git push -u origin main
   ```

2. **ربط المستودع مع Vercel:**
   - اذهب إلى [vercel.com](https://vercel.com)
   - سجل دخول أو أنشئ حساب جديد
   - اضغط "New Project"
   - اختر المستودع من GitHub
   - Vercel سيكتشف إعدادات Vite تلقائياً
   - اضغط "Deploy"

### الطريقة الثانية: عبر Vercel CLI

1. **تثبيت Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **تسجيل الدخول:**
   ```bash
   vercel login
   ```

3. **نشر المشروع:**
   ```bash
   vercel
   ```

4. **للنشر في الإنتاج:**
   ```bash
   vercel --prod
   ```

## 🌐 النشر على Netlify

1. **بناء المشروع:**
   ```bash
   npm run build
   ```

2. **رفع مجلد dist إلى Netlify:**
   - اذهب إلى [netlify.com](https://netlify.com)
   - اسحب مجلد `dist` إلى منطقة الرفع
   - أو اربط مع GitHub repository

3. **إعدادات البناء (إذا ربطت مع GitHub):**
   - Build command: `npm run build`
   - Publish directory: `dist`

## 📦 النشر على GitHub Pages

1. **تثبيت gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **إضافة scripts في package.json:**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **تحديث vite.config.ts:**
   ```typescript
   export default defineConfig({
     base: '/dental-clinic-demo/',
     // ... باقي الإعدادات
   })
   ```

4. **النشر:**
   ```bash
   npm run deploy
   ```

## 🔧 إعدادات إضافية

### ملف vercel.json (موجود بالفعل)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### متغيرات البيئة (إذا احتجتها)
```bash
# في Vercel Dashboard > Settings > Environment Variables
VITE_APP_TITLE=نظام إدارة العيادة السنية - ديمو
VITE_APP_VERSION=1.0.0-demo
```

## ✅ التحقق من النشر

بعد النشر، تأكد من:

1. **الصفحة الرئيسية تعمل**
2. **البيانات التجريبية تظهر**
3. **التنقل بين الصفحات يعمل**
4. **الشعار التجريبي يظهر في الأعلى**
5. **جميع الواجهات تعمل بشكل صحيح**

## 🎯 نصائح للعرض

1. **اشرح للعميل أن هذه نسخة تجريبية**
2. **أظهر المميزات الرئيسية**
3. **اذكر أن البيانات وهمية**
4. **وضح إمكانيات النسخة الكاملة**

## 📱 الوصول للنسخة التجريبية

بعد النشر، ستحصل على رابط مثل:
- Vercel: `https://dental-clinic-demo.vercel.app`
- Netlify: `https://dental-clinic-demo.netlify.app`
- GitHub Pages: `https://username.github.io/dental-clinic-demo`

## 🔄 التحديثات

لتحديث النسخة التجريبية:

1. **عدل الكود محلياً**
2. **ادفع التغييرات إلى GitHub**
3. **النشر سيحدث تلقائياً**

أو استخدم:
```bash
vercel --prod
```

---

**ملاحظة:** هذه النسخة مصممة للعرض فقط ولا تحتوي على قاعدة بيانات حقيقية.
