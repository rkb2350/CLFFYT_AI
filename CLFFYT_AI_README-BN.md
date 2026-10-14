# CLFFYT AI — সেটআপ গাইড (বাংলা)

এটি Google Gemini API-চালিত একটি ছোট full-stack AI chat web app। `public/index.html` হলো UI, আর `server.js` API Key গোপন রেখে Gemini API-তে অনুরোধ পাঠায়।

## কী কী আছে
- মোবাইল-ফ্রেন্ডলি dark/violet UI
- বাংলা/ইংরেজি চ্যাট
- আগের কথোপকথনের সীমিত context
- Copy answer, New chat, quick prompts
- সার্ভারের status এবং বাংলা error message
- প্রতি IP-তে সাধারণ rate limit
- API Key browser code-এ রাখা হয় না

## ১. Gemini API Key তৈরি
1. Google AI Studio খুলে Gemini API Key তৈরি করো: https://aistudio.google.com/apikey
2. Key-টি কারও সঙ্গে শেয়ার করো না এবং HTML/JavaScript ফাইলে লিখবে না।
3. Key কেবল hosting provider-এর Environment Variables-এ বসাবে।

## ২. GitHub-এ ফাইল আপলোড
1. GitHub-এ সাইন ইন করে `New repository` তৈরি করো।
2. এই ZIP-এর ভেতরের ফাইলগুলো repository-র মূল অংশে আপলোড করো। `public` ফোল্ডারসহ আপলোড করতে হবে।
3. `node_modules` বা API Key আপলোড করবে না। `.gitignore` ফাইলটি এগুলো আটকাতে সাহায্য করে।

## ৩. Render-এ প্রকাশ
1. https://render.com/ এ সাইন আপ করে GitHub সংযুক্ত করো।
2. Dashboard → **New** → **Web Service** নির্বাচন করো।
3. তোমার GitHub repository নির্বাচন করে Connect করো।
4. সেটিংস:
   - **Runtime/Language:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Environment** অংশে এই variable যোগ করো:
   - Key: `GEMINI_API_KEY`
   - Value: তোমার আসল Gemini API Key
6. চাইলে আরেকটি variable:
   - Key: `GEMINI_MODEL`
   - Value: `gemini-3.6-flash`
7. Save/Deploy করো। Deploy সফল হলে Render একটি `https://...onrender.com` লিংক দেবে।

Render-এর ফ্রি web service কিছু সময় ব্যবহার না হলে sleep করতে পারে; প্রথম অনুরোধে জাগতে সময় লাগতে পারে।

## ৪. কীভাবে পরীক্ষা করবে
1. প্রকাশিত URL খুলে উপরের status দেখো।
2. “সার্ভার সংযুক্ত” দেখালে একটি প্রশ্ন পাঠাও।
3. “API Key সেট করা নেই” দেখালে Render → তোমার service → Environment-এ `GEMINI_API_KEY` ঠিকভাবে যোগ হয়েছে কি না দেখো।
4. API Key বদলালে Render-এ Save/Deploy করো।

## নিরাপত্তা নোট
- API Key কখনো `public/index.html`, GitHub commit, স্ক্রিনশট বা public message-এ দেবে না।
- `.env` ফাইল থাকলে GitHub-এ আপলোড করবে না। এই প্রজেক্টের `.gitignore` সেটি বাদ রাখে।
- এটি একটি starter project। Rate limit আছে, কিন্তু এটি সম্পূর্ণ অপব্যবহার-প্রতিরোধ ব্যবস্থা নয়। অ্যাপটি সবার জন্য খুলে দিলে অন্যরা তোমার API quota ব্যবহার করতে পারে। বাস্তব ব্যবহারকারীর জন্য login/authentication, আরও শক্ত rate limit, monitoring এবং budget/quota alerts যোগ করো।
- API usage-এর সীমা ও খরচ Google-এর অ্যাকাউন্ট/প্রজেক্ট ও বর্তমান শর্তের ওপর নির্ভর করে।
- API Key কখনো প্রকাশ হয়ে গেলে সেটি revoke/replace করো।

## লোকাল কম্পিউটারে চালানো (ঐচ্ছিক)
Node.js 20+ ইনস্টল করে প্রজেক্ট ফোল্ডারে:
```bash
npm install
```
তারপর environment variable `GEMINI_API_KEY` সেট করে:
```bash
npm start
```
ব্রাউজারে `http://localhost:10000` খোলো।

## সমস্যা হলে
- **502 / API permission:** API Key এবং Gemini API access পরীক্ষা করো।
- **429:** API quota/rate limit পূর্ণ হতে পারে; অপেক্ষা করো।
- **সার্ভারে সংযোগ নেই:** Render deploy log দেখো।
- **মডেল পাওয়া যায় না:** Render-এর `GEMINI_MODEL`-এ তোমার অ্যাকাউন্টে উপলভ্য Gemini model-এর নাম বসাও।
