# Deploy to Railway NOW! 🚀

## ✅ What I Did For You

1. ✅ Created `railway.toml` - Railway configuration
2. ✅ Created `nixpacks.toml` - Build configuration  
3. ✅ Created `start.sh` - Startup script (made executable)
4. ✅ Updated `config.py` - Base64 wallet support
5. ✅ Updated `frontend/next.config.ts` - API proxy
6. ✅ Updated `frontend/src/lib/api.ts` - Production URLs
7. ✅ Committed all changes to Git
8. ✅ Made `start.sh` executable (mode 100755)

## 🎯 What YOU Need to Do

### Step 1: Push to GitHub

```bash
git push origin master
```

That's it! Railway will auto-deploy.

### Step 2: Watch Railway Logs

In Railway dashboard, click on your service and watch the logs. You should see:

```
✅ Starting SWARMs Debate Primitive...
✅ Starting backend on port 8000...
✅ Waiting for backend to start...
✅ Backend is ready!
✅ Starting frontend on port 3000...
```

### Step 3: Test Your Deployment

Visit: `https://your-app.railway.app/arena`

Click "AGI Open Source Debate" and submit!

## 🔍 If Something Goes Wrong

### Check Health Endpoint

```bash
curl https://your-app.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "service": "swarms-debate-primitive",
  "database": "connected",
  "api_keys_configured": 4
}
```

### Check Railway Logs

Look for these in Railway dashboard logs:

**✅ Good Signs:**
- "Starting backend on port 8000..."
- "Backend is ready!"
- "Starting frontend..."
- "✅ Wallet decoded from WALLET_JSON_BASE64"

**❌ Bad Signs:**
- "ModuleNotFoundError"
- "API key" errors
- "Backend is not ready after 30 attempts"
- "npm start" fails

### Common Fixes

**If backend fails to start:**
1. Check all environment variables are set in Railway
2. Verify API keys are correct
3. Check Python version (needs 3.11+)

**If frontend fails to build:**
1. Check Node.js version (needs 18+)
2. Verify `package.json` exists in `frontend/`
3. Check for TypeScript errors

**If API calls fail:**
1. Verify backend is running (check logs)
2. Test health endpoint
3. Check Next.js rewrites are working

## 📋 Environment Variables Checklist

Make sure these are set in Railway:

- [x] NVIDIA_API_KEY
- [x] NVIDIA_MODEL
- [x] NVIDIA_BASE_URL
- [x] GEMINI_API_KEY
- [x] GEMINI_MODEL
- [x] LLM_PROVIDER
- [x] SOLANA_RPC_URL
- [x] WALLET_JSON_BASE64

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Health endpoint returns `"status": "ok"`
2. ✅ Frontend loads at `/arena`
3. ✅ Can submit a question
4. ✅ Agents respond (not "API Error")
5. ✅ Pipeline shows all 5 steps
6. ✅ Chain transaction completes

## 🆘 Need Help?

If deployment fails after pushing:

1. **Check Railway logs** - Most errors show up here
2. **Test health endpoint** - `curl https://your-app.railway.app/api/health`
3. **Verify env vars** - Make sure all are set correctly
4. **Check GitHub Actions** - If you have CI/CD, check it's not blocking

---

## 🚀 Ready to Deploy!

Just run:
```bash
git push origin master
```

Then watch Railway dashboard for deployment progress!

**Good luck with your hackathon submission!** 🎉
