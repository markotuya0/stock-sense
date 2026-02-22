# 🚀 SignalDeck Deployment Guide

Complete guide for deploying SignalDeck to Vercel with proper routing and production configuration.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase project set up
- Environment variables ready

## 🔧 Step 1: Prepare for Deployment

### 1.1 Verify Build Works Locally
```bash
# Test production build
npm run build

# Preview production build
npm run preview
```

### 1.2 Check Environment Variables
Ensure your `.env` file has all required variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🌐 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add each variable from your `.env` file:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - Any other `VITE_*` variables you're using

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? signaldeck (or your choice)
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## 🔍 Step 3: Verify Deployment

### 3.1 Check Routing
Test these URLs (replace with your domain):
- ✅ `https://your-app.vercel.app/` - Landing page
- ✅ `https://your-app.vercel.app/auth` - Auth page
- ✅ `https://your-app.vercel.app/dashboard` - Dashboard (requires login)
- ✅ `https://your-app.vercel.app/settings` - Settings (requires login)

### 3.2 Test Navigation
1. Click through all navigation links
2. Refresh page on each route (should not 404)
3. Use browser back/forward buttons
4. Test direct URL access

### 3.3 Check Console
Open browser DevTools and check for:
- ❌ No 404 errors
- ❌ No CORS errors
- ❌ No missing environment variables
- ✅ Successful API calls to Supabase

## 🐛 Troubleshooting

### Issue: 404 on Page Refresh

**Problem**: Navigating works, but refreshing gives 404

**Solution**: Ensure `vercel.json` exists with proper rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Issue: Environment Variables Not Working

**Problem**: App can't connect to Supabase

**Solution**:
1. Check variables in Vercel dashboard
2. Ensure they start with `VITE_`
3. Redeploy after adding variables:
   ```bash
   vercel --prod
   ```

### Issue: Build Fails

**Problem**: Deployment fails during build

**Solution**:
1. Check build logs in Vercel dashboard
2. Test build locally: `npm run build`
3. Fix any TypeScript errors
4. Ensure all dependencies are in `package.json`

### Issue: Blank Page After Deploy

**Problem**: App loads but shows blank page

**Solution**:
1. Check browser console for errors
2. Verify environment variables are set
3. Check Supabase URL is correct
4. Ensure base path is correct in `vite.config.ts`

### Issue: Routing Breaks on Vercel

**Problem**: Direct URL access gives 404

**Solution**:
1. Verify `vercel.json` exists
2. Check rewrite rules are correct
3. Ensure you're using React Router's `BrowserRouter`
4. Redeploy after adding `vercel.json`

## 🔒 Step 4: Configure Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `signaldeck.com`)

2. **Update DNS Records**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers

3. **Update Supabase**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your custom domain to allowed redirect URLs

## 📊 Step 5: Monitor Deployment

### Vercel Analytics (Free)
- Go to Project → Analytics
- View page views, performance, and errors

### Check Logs
```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

## 🔄 Step 6: Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Notifies you via email
```

## 🎯 Production Checklist

Before going live, verify:

- [ ] All routes work correctly
- [ ] Page refresh doesn't cause 404
- [ ] Environment variables are set
- [ ] Supabase connection works
- [ ] Authentication flow works
- [ ] API calls succeed
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Favicon loads correctly
- [ ] Meta tags are correct
- [ ] Performance is good (Lighthouse score)

## 🚀 Performance Optimization

### Enable Compression
Vercel automatically enables:
- Gzip compression
- Brotli compression
- HTTP/2

### Optimize Images
```bash
# Install sharp for image optimization
npm install sharp

# Vercel automatically optimizes images
```

### Enable Caching
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 📱 PWA Setup (Optional)

To make SignalDeck installable:

1. Add `manifest.json` to `public/`
2. Add service worker
3. Update `index.html` with manifest link
4. Deploy and test on mobile

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Deployment Logs**: https://vercel.com/[your-username]/[project]/deployments
- **Domain Settings**: https://vercel.com/[your-username]/[project]/settings/domains

## 🎉 Success!

Your SignalDeck app is now live! Share your deployment URL and start tracking stocks with AI-powered insights.

**Next Steps:**
- Set up custom domain
- Enable analytics
- Monitor performance
- Add more features
- Share with users

---

**Need Help?** Check Vercel's documentation or open an issue on GitHub.