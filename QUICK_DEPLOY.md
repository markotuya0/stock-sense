# ⚡ Quick Deploy to Vercel

## 🚀 5-Minute Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. Add Environment Variables
In Vercel dashboard, add:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Deploy
Click "Deploy" and wait 2-3 minutes.

## ✅ Verify It Works

Test these URLs:
- `/` - Landing page
- `/auth` - Login page
- `/dashboard` - Dashboard (after login)

Refresh each page - should NOT get 404!

## 🐛 If Something Breaks

### 404 on Refresh?
- Check `vercel.json` exists in root
- Redeploy

### Blank Page?
- Check browser console for errors
- Verify environment variables in Vercel
- Check Supabase URL is correct

### Build Fails?
- Run `npm run build` locally
- Fix any TypeScript errors
- Push and redeploy

## 📝 Files You Need

✅ `vercel.json` - Routing configuration (already created)
✅ `vite.config.ts` - Build configuration (already updated)
✅ `public/favicon.svg` - New favicon (already created)
✅ `index.html` - Updated meta tags (already updated)

## 🎉 Done!

Your app is live at: `https://your-project.vercel.app`

---

**Full Guide**: See `DEPLOYMENT.md` for detailed instructions.