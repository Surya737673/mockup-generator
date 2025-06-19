# Deployment Guide

## Frontend Deployment

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Deploy: `vercel`
4. Follow the prompts to connect your GitHub account and deploy

### Option 2: Netlify
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Or connect your GitHub repository for automatic deployments

### Option 3: GitHub Pages
1. Add to package.json:
```json
{
  "homepage": "https://yourusername.github.io/your-repo-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```
2. Install gh-pages: `npm install --save-dev gh-pages`
3. Deploy: `npm run deploy`

## Backend Deployment

### Option 1: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables:
   - `MONGO_URL`: Your MongoDB connection string
   - `DB_NAME`: Your database name
4. Deploy automatically

### Option 2: Render
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Add environment variables

### Option 3: Heroku
1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Add MongoDB addon: `heroku addons:create mongolab`
4. Deploy: `git push heroku main`

### Option 4: DigitalOcean App Platform
1. Go to DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure as Python app
4. Add environment variables

## Environment Variables Required

### Backend (.env file)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=status_check_db
```

### Frontend (if connecting to deployed backend)
Update the API base URL in your frontend code to point to your deployed backend URL.

## Database Setup

### MongoDB Atlas (Cloud Database)
1. Go to [mongodb.com](https://mongodb.com)
2. Create a free cluster
3. Get your connection string
4. Update `MONGO_URL` in your environment variables

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017` as your `MONGO_URL`

## Quick Deployment Commands

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway)
```bash
cd backend
railway login
railway init
railway up
```

## Production Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Update CORS settings for production domains
3. **Security**: Add authentication if needed
4. **Monitoring**: Set up logging and monitoring
5. **SSL**: Ensure HTTPS is enabled
6. **Database**: Use production-grade database
7. **Backup**: Set up regular backups

## Troubleshooting

### Common Issues:
1. **CORS errors**: Update CORS settings in backend
2. **Database connection**: Check MongoDB connection string
3. **Build errors**: Check Node.js and Python versions
4. **Environment variables**: Ensure all required vars are set

### Support:
- Check platform-specific documentation
- Review error logs in deployment platform
- Test locally before deploying 