# ScotComply - Developer Quick Reference

## 🚀 Quick Start Commands

```bash
# Start development server
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma Client after schema changes
npx prisma generate

# Create and apply database migration
npx prisma migrate dev --name your_migration_name

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

## 📂 Key Files & Directories

```
src/
├── app/                    # Next.js pages and routes
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # Dashboard header
│   └── sidebar.tsx       # Dashboard sidebar
├── lib/                   # Core utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── trpc.ts           # tRPC server setup
│   ├── trpc-client.tsx   # tRPC client provider
│   └── utils.ts          # Helper functions
├── server/                # Backend logic
│   ├── routers/          # tRPC routers
│   └── index.ts          # Root router
└── types/                 # TypeScript types
    └── next-auth.d.ts    # NextAuth types
```

## 🔐 Authentication Flow

### Sign Up
1. User fills form at `/auth/signup`
2. Form calls `trpc.user.register.useMutation()`
3. Backend validates and creates user in database
4. Auto signs in with NextAuth credentials
5. Redirects to `/dashboard`

### Sign In
1. User enters credentials at `/auth/signin`
2. Calls `signIn('credentials', { email, password })`
3. NextAuth validates against database
4. Creates JWT session
5. Redirects to `/dashboard`

### Protected Routes
- Use `protectedProcedure` in tRPC routers
- Use `useSession()` hook in components
- Middleware redirects unauthenticated users

## 🌐 API Usage (tRPC)

### Client-Side Query
```typescript
'use client'
import { trpc } from '@/lib/trpc-client'

function MyComponent() {
  const { data, isLoading } = trpc.property.list.useQuery({ limit: 10 })
  
  return <div>{/* Use data */}</div>
}
```

### Client-Side Mutation
```typescript
const createProperty = trpc.property.create.useMutation({
  onSuccess: () => {
    // Invalidate and refetch
    trpc.useContext().property.list.invalidate()
  }
})

// Call mutation
createProperty.mutate({ address: '123 Main St', ... })
```

### Adding New Router
1. Create file in `src/server/routers/yourRouter.ts`
2. Define procedures with Zod validation
3. Export router
4. Add to `src/server/index.ts` in `appRouter`

## 🎨 UI Components Usage

### Button
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">Click me</Button>
// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Input & Form
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="your@email.com" />
</div>
```

## 🗄️ Database Queries (Prisma)

### Import Prisma Client
```typescript
import prisma from '@/lib/prisma'
```

### Common Queries
```typescript
// Find unique user
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { landlordProfile: true }
})

// Find many with filters
const properties = await prisma.property.findMany({
  where: { ownerId: userId },
  include: { certificates: true },
  orderBy: { createdAt: 'desc' }
})

// Create record
const property = await prisma.property.create({
  data: {
    address: '123 Main St',
    ownerId: userId,
    councilArea: 'Edinburgh'
  }
})

// Update record
const updated = await prisma.property.update({
  where: { id: propertyId },
  data: { address: 'New Address' }
})

// Delete record
await prisma.property.delete({
  where: { id: propertyId }
})
```

## 🎯 Adding New Features

### Step-by-Step Process

1. **Define Database Model** (if needed)
   - Edit `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name add_feature`

2. **Create tRPC Router**
   - Create `src/server/routers/feature.ts`
   - Define input validation with Zod
   - Add CRUD procedures
   - Export and add to `appRouter`

3. **Create UI Components**
   - Create page in `src/app/dashboard/feature/page.tsx`
   - Use tRPC hooks to fetch/mutate data
   - Style with Tailwind CSS

4. **Add Navigation**
   - Update `src/components/sidebar.tsx`
   - Add route to navigation array

5. **Test**
   - Test in browser
   - Check database in Prisma Studio
   - Verify types are correct

## 🔍 Debugging Tips

### Check tRPC Requests
- Open DevTools Network tab
- Look for `/api/trpc` requests
- Check request/response payloads

### Database Issues
- Run `npx prisma studio` to view data
- Check Prisma logs in terminal
- Verify DATABASE_URL in `.env`

### Auth Issues
- Check session with `useSession()` hook
- Verify NEXTAUTH_SECRET is set
- Test with Postman/Thunder Client

### Type Errors
- Regenerate Prisma Client: `npx prisma generate`
- Restart TypeScript server in VSCode
- Check `tsconfig.json` paths

## 📦 Package Management

### Adding Dependencies
```bash
# Production dependency
npm install package-name

# Dev dependency
npm install -D package-name
```

### Common Packages
- `@prisma/client` - Database ORM
- `@trpc/server` - tRPC server
- `@trpc/client` - tRPC client
- `@trpc/react-query` - React Query integration
- `next-auth` - Authentication
- `zod` - Validation
- `lucide-react` - Icons

## 🎨 Styling Guidelines

### Tailwind Classes
- Use semantic colors: `bg-primary`, `text-muted-foreground`
- Spacing: `space-y-4`, `gap-6`, `p-4`, `m-6`
- Responsive: `md:grid-cols-2`, `lg:flex-row`
- Dark mode ready: All components support dark mode

### Custom Utilities
```typescript
import { cn } from '@/lib/utils'

// Merge class names conditionally
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

## 🔐 Role-Based Access

### User Roles
- `LANDLORD` - Property owners
- `AGENT` - Letting agents
- `ADMIN` - System administrators

### Checking Roles in Components
```typescript
const { data: session } = useSession()
const isAdmin = session?.user?.role === 'ADMIN'

{isAdmin && <AdminPanel />}
```

### Protecting API Routes
```typescript
// In tRPC router
export const adminRouter = createTRPCRouter({
  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can access this
    })
})
```

## 📊 Scottish Council Data

32 councils to seed:
1. Aberdeen City
2. Aberdeenshire
3. Angus
4. Argyll and Bute
5. City of Edinburgh
6. Clackmannanshire
7. Dumfries and Galloway
8. Dundee City
9. East Ayrshire
10. East Dunbartonshire
11. East Lothian
12. East Renfrewshire
13. Falkirk
14. Fife
15. Glasgow City
16. Highland
17. Inverclyde
18. Midlothian
19. Moray
20. Na h-Eileanan Siar
21. North Ayrshire
22. North Lanarkshire
23. Orkney Islands
24. Perth and Kinross
25. Renfrewshire
26. Scottish Borders
27. Shetland Islands
28. South Ayrshire
29. South Lanarkshire
30. Stirling
31. West Dunbartonshire
32. West Lothian

## 🚦 Development Workflow

1. Pull latest changes
2. Start dev server: `npm run dev`
3. Make changes
4. Test in browser
5. Run type check: `npm run type-check`
6. Commit changes
7. Push to repository

## 📈 Performance Tips

- Use `useQuery` with proper cache settings
- Implement pagination for large lists
- Add database indexes for frequently queried fields
- Use Next.js Image component for images
- Lazy load heavy components

## 🆘 Common Issues & Solutions

### Port 3000 already in use
```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)
```

### Prisma Client out of sync
```bash
npx prisma generate
```

### Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Type errors after schema change
1. Run `npx prisma generate`
2. Restart TypeScript server
3. Restart dev server

---

**Happy Coding! 🚀**
