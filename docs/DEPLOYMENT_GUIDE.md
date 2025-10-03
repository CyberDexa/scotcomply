# 🚀 Production Deployment Guide

**Platform**: ScotComply - Scottish Landlord Compliance  
**Version**: 1.0.0  
**Date**: October 3, 2025

---

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] PostgreSQL database provisioned
- [ ] Environment variables configured
- [ ] Domain name configured
- [ ] SSL certificate ready (automatic on Vercel)
- [ ] Email service configured (optional)
- [ ] File storage configured (Cloudflare R2 or AWS S3)

### ✅ Code Preparation
- [x] Production build successful
- [x] All TypeScript errors resolved
- [x] PWA manifest configured
- [x] Service worker registered
- [ ] Environment variables documented

---

## 🔐 Required Environment Variables

Create a `.env.production` file with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Cloudflare R2 (Document Storage)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="scotcomply-documents"
R2_PUBLIC_URL="https://your-r2-domain.com"

# Email (Optional - for notifications)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@scotcomply.com"

# Application
NODE_ENV="production"
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 📦 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

#### Step 1: Prepare Repository
```bash
# Initialize git if not already
git init
git add .
git commit -m "Production ready"

# Push to GitHub
git remote add origin https://github.com/yourusername/scotcomply.git
git push -u origin main
```

#### Step 2: Deploy to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Step 3: Add Environment Variables
In Vercel dashboard → Settings → Environment Variables:
- Add all variables from `.env.production`
- Use different values for Production/Preview/Development

#### Step 4: Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Your app is live at `https://your-project.vercel.app`

#### Step 5: Custom Domain (Optional)
- Settings → Domains
- Add your custom domain
- Update DNS records as instructed
- SSL certificate auto-configured

---

### Option 2: Railway

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### Step 2: Initialize Project
```bash
railway init
railway link
```

#### Step 3: Add PostgreSQL
```bash
railway add postgresql
```

#### Step 4: Set Environment Variables
```bash
railway variables set NEXTAUTH_SECRET=<your-secret>
railway variables set R2_ACCOUNT_ID=<your-id>
# ... add all other variables
```

#### Step 5: Deploy
```bash
railway up
```

---

### Option 3: Docker (Self-Hosted)

#### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

#### Step 2: Build Image
```bash
docker build -t scotcomply .
```

#### Step 3: Run Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  scotcomply
```

#### Step 4: Use Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: scotcomply
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

---

## 🗄️ Database Setup

### Step 1: Provision PostgreSQL

**Recommended Providers**:
- **Neon** (Serverless, free tier): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **AWS RDS**: https://aws.amazon.com/rds

### Step 2: Run Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed demo data (optional)
npm run seed
```

### Step 3: Verify Connection
```bash
npx prisma db push
npx prisma studio
```

---

## 📁 File Storage Setup (Cloudflare R2)

### Step 1: Create R2 Bucket
1. Log in to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Click "Create bucket"
4. Name: `scotcomply-documents`
5. Location: Auto

### Step 2: Generate API Token
1. Go to R2 → Manage R2 API Tokens
2. Create API Token
3. Permissions: Object Read & Write
4. Copy Access Key ID and Secret Access Key

### Step 3: Configure Public Access (Optional)
1. Bucket Settings → Public Access
2. Enable public access for downloads
3. Note the public URL

### Step 4: Update Environment Variables
```bash
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="scotcomply-documents"
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

---

## 🔒 Security Configuration

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use different secrets for prod/dev
- ✅ Rotate secrets regularly
- ✅ Use platform secret management

### 2. Database Security
- ✅ Enable SSL connections
- ✅ Use connection pooling
- ✅ Set up read replicas (optional)
- ✅ Regular backups enabled

### 3. Application Security
- ✅ HTTPS only (enforced by Vercel)
- ✅ CORS configured properly
- ✅ Rate limiting (add middleware)
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Prisma ORM)

### 4. Authentication
- ✅ Secure session cookies
- ✅ Password hashing (bcrypt)
- ✅ CSRF protection
- ✅ Session expiration

---

## 📊 Monitoring & Analytics

### 1. Vercel Analytics (Built-in)
- Real-time performance metrics
- Core Web Vitals tracking
- Visitor analytics
- Error tracking

### 2. Sentry (Error Tracking - Optional)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 3. Logging
- Use Vercel logs for debugging
- Set up structured logging
- Monitor API response times

### 4. Uptime Monitoring
- **Uptime Robot**: https://uptimerobot.com
- **Pingdom**: https://pingdom.com
- Set up alerts for downtime

---

## 🚀 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Verify all pages load correctly
- [ ] Test user signup/login
- [ ] Test property creation
- [ ] Test certificate upload
- [ ] Verify email notifications
- [ ] Check PWA installation works
- [ ] Test mobile responsiveness

### Week 1
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix any critical bugs
- [ ] Optimize slow queries

### Week 2-4
- [ ] Add missing features based on feedback
- [ ] Improve documentation
- [ ] Create video tutorials
- [ ] Optimize bundle size
- [ ] Add analytics tracking

---

## 🐛 Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
```bash
# Test connection
npx prisma db push
npx prisma studio

# Check connection string format
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

### Environment Variable Issues
```bash
# Verify variables are set
printenv | grep DATABASE_URL
printenv | grep NEXTAUTH

# Restart Vercel deployment after changing env vars
```

### PWA Not Installing
- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify service worker is registered
- Check browser console for errors

---

## 📈 Performance Optimization

### 1. Database Indexes
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_properties_owner ON "Property"("ownerId");
CREATE INDEX idx_certificates_property ON "Certificate"("propertyId");
CREATE INDEX idx_certificates_expiry ON "Certificate"("expiryDate");
```

### 2. Caching Strategy
- Use React Query for client-side caching
- Configure tRPC stale time appropriately
- Cache static assets with service worker

### 3. Image Optimization
- Use Next.js Image component
- Compress images before upload
- Use modern formats (WebP, AVIF)

### 4. Code Splitting
- Already optimized with Next.js automatic code splitting
- Lazy load heavy components
- Use dynamic imports for large libraries

---

## 📚 Additional Resources

### Documentation Links
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Docs: https://vercel.com/docs
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment
- Cloudflare R2: https://developers.cloudflare.com/r2

### Support
- Create issues on GitHub
- Check documentation
- Community Discord/Slack

---

## ✅ Production Readiness Checklist

### Code Quality
- [x] All TypeScript errors resolved
- [x] Production build successful
- [x] No console errors in browser
- [x] All routes accessible
- [x] Forms validate correctly

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Bundle size optimized

### Security
- [ ] Environment variables secured
- [ ] Database connection encrypted
- [ ] API routes protected
- [ ] Input sanitization enabled
- [ ] HTTPS enforced

### Features
- [x] Authentication working
- [x] CRUD operations functional
- [x] File uploads working
- [x] Notifications sending
- [x] PWA installable

### Deployment
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Database migrated
- [ ] Environment variables set
- [ ] Monitoring enabled

---

## 🎯 Launch Day Checklist

**T-1 Day**:
- [ ] Final testing on staging
- [ ] Backup database
- [ ] Prepare rollback plan
- [ ] Update documentation
- [ ] Notify stakeholders

**Launch Day**:
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Be ready for support

**T+1 Day**:
- [ ] Review analytics
- [ ] Address any issues
- [ ] Gather user feedback
- [ ] Plan next iteration

---

**Status**: Ready for deployment! 🚀

Choose your deployment platform:
1. **Vercel** (Recommended) - Easiest, auto-scaling
2. **Railway** - Database included, simple pricing
3. **Docker** - Full control, self-hosted

**Next Steps**: Run through the deployment steps for your chosen platform!
