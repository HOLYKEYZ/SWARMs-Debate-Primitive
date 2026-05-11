# Simple Railway Deployment (Backend Only)

## Strategy

Deploy backend and frontend as **separate Railway services**:
- **Service 1**: Backend (FastAPI) - This repo
- **Service 2**: Frontend (Next.js) - Deploy from `frontend/` folder

## Backend Deployment (This Repo)

### 1. Push Changes

```bash
git add .
git commit -m "Simplify Railway deployment - backend only"
git push origin master
```

### 2. Railway Will Deploy Backend

Railway will:
- Auto-detect Python
- Install requirements.txt
- Run: `python -m uvicorn server.api:app --host 0.0.0.0 --port $PORT`

### 3. Get Backend URL

After deployment, Railway gives you a URL like:
```
https://swarms-debate-primitive-production.up.railway.app
```

Copy this URL!

## Frontend Deployment (Separate Service)

### 1. Create New Railway Service

1. Go to Railway dashboard
2. Click "New" → "Empty Service"
3. Connect to same GitHub repo
4. **Important**: Set root directory to `frontend/`

### 2. Set Frontend Environment Variable

In the frontend service, add:
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

(Use the backend URL from step 3 above)

### 3. Railway Will Deploy Frontend

Railway will:
- Auto-detect Next.js
- Run `npm install`
- Run `npm run build`
- Run `npm start`

## Environment Variables

### Backend Service
```
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL=moonshotai/kimi-k2.6
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
LLM_PROVIDER=nvidia
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_JSON_BASE64=<base64 wallet>
```

### Frontend Service
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

## Testing

1. **Test Backend**: `curl https://your-backend.railway.app/api/health`
2. **Test Frontend**: Visit `https://your-frontend.railway.app/arena`

## Why This Works

- **Simpler**: No bash scripts, no complex monorepo setup
- **Reliable**: Railway handles each service independently
- **Scalable**: Can scale backend and frontend separately
- **Debuggable**: Clear logs for each service

## Cost

- 2 services on Railway
- Free tier: $5/month credit
- Should be enough for hackathon demo

---

**This is the simplest, most reliable way to deploy on Railway!**
