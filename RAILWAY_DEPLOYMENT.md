# Railway Deployment Guide

## Monorepo Setup (Backend + Frontend in One Service)

This project is configured to run both the FastAPI backend and Next.js frontend in a single Railway service.

## Architecture

```
Railway Service ($PORT)
├── Backend (FastAPI) → Port 8000
└── Frontend (Next.js) → Port $PORT (proxies /api/* to backend)
```

## Configuration Files

- `railway.toml` - Railway service configuration
- `nixpacks.toml` - Build configuration
- `start.sh` - Startup script (runs both services)
- `frontend/next.config.ts` - API proxy configuration

## Environment Variables (Railway)

Set these in your Railway service settings:

### Required
```
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_MODEL=moonshotai/kimi-k2.6
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_PROVIDER=nvidia
```

### Optional (for mixed provider)
```
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-2.5-flash
```

### Solana (Required)
```
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Important
- **DO NOT** set `NEXT_PUBLIC_BACKEND_URL` in Railway
- The frontend will use relative URLs and proxy through Next.js rewrites

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Configure Railway deployment"
git push origin main
```

### 2. Create Railway Service

1. Go to https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the configuration

### 3. Set Environment Variables

In Railway dashboard:
1. Go to your service
2. Click "Variables" tab
3. Add all required environment variables (see above)
4. Click "Deploy"

### 4. Upload Wallet

Railway needs your Solana wallet for chain logging:

**Option A: Use Railway CLI**
```bash
railway login
railway link
railway run python -c "from solders.keypair import Keypair; import json; kp = Keypair(); json.dump(list(bytes(kp)), open('wallet.json','w')); print('Public key:', kp.pubkey())"
```

**Option B: Add as Base64 Environment Variable**
```bash
# On your local machine
cat wallet.json | base64 > wallet.b64

# In Railway, add variable:
WALLET_JSON_BASE64=<paste base64 content>
```

Then update `config.py` to decode it:
```python
import base64
wallet_b64 = os.getenv("WALLET_JSON_BASE64")
if wallet_b64:
    with open("wallet.json", "wb") as f:
        f.write(base64.b64decode(wallet_b64))
```

### 5. Fund Wallet (Devnet)

After deployment:
1. Check Railway logs for the wallet public key
2. Go to https://faucet.solana.com/
3. Paste the public key and request 1 SOL

## Troubleshooting

### "Failed" Status in UI

**Check Railway Logs:**
```
railway logs
```

**Common Issues:**

1. **Backend not starting**
   - Check environment variables are set
   - Verify API keys are valid
   - Check for Python errors in logs

2. **Frontend can't reach backend**
   - Verify `start.sh` is executable: `chmod +x start.sh`
   - Check backend health: `curl https://your-app.railway.app/api/health`
   - Verify Next.js rewrites are working

3. **API Key errors**
   - Ensure `NVIDIA_API_KEY` starts with `nvapi-`
   - Ensure `GEMINI_API_KEY` starts with `AIza`
   - Check keys are not expired

4. **Port conflicts**
   - Backend must use port 8000 (hardcoded)
   - Frontend must use `$PORT` (Railway assigns this)

### Check Backend Health

```bash
curl https://your-app.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "service": "swarms-debate-primitive",
  "version": "1.0.0",
  "database": "connected",
  "api_keys_configured": 4
}
```

### Check Frontend

Visit: `https://your-app.railway.app/arena`

### View Logs

```bash
railway logs --follow
```

## Local Testing (Production Mode)

Test the production setup locally:

```bash
# Build frontend
cd frontend
npm run build

# Start both services
cd ..
bash start.sh
```

Visit `http://localhost:3000/arena`

## Updating Deployment

```bash
git add .
git commit -m "Update deployment"
git push origin main
```

Railway will automatically redeploy.

## Performance Tips

1. **Use Railway Pro** for better performance
2. **Enable caching** in Railway settings
3. **Monitor logs** for rate limit warnings
4. **Scale vertically** if needed (increase RAM/CPU)

## Cost Optimization

- Railway Free Tier: $5 credit/month
- This app uses ~512MB RAM
- Estimated cost: $3-5/month on Hobby plan

## Security Notes

1. **Never commit `.env`** - It's in `.gitignore`
2. **Use Railway secrets** for sensitive data
3. **Rotate API keys** regularly
4. **Monitor usage** to avoid unexpected costs

## Support

If deployment fails:
1. Check Railway logs
2. Verify all environment variables
3. Test locally in production mode
4. Check Railway status page: https://status.railway.app/

---

**Deployment Status:** Ready for Railway ✅
