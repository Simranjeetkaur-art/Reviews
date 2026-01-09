# Smart Business Feedback Generator Platform

A white-label feedback generation platform that helps businesses boost their Google reviews by providing customers with AI-generated, personalized feedback templates at the point of service via QR code scanning.

## 🚀 Features

- **AI-Powered Review Generation**: Generate 100+ unique, authentic review templates using OpenAI GPT-4
- **QR Code Integration**: Customers scan, select, and share reviews instantly
- **Smart Load Balancing**: Automatically rotates reviews to ensure variety
- **Analytics Dashboard**: Track scans, conversions, and popular feedback
- **Premium UI/UX**: Modern, responsive design with smooth animations
- **Scalable Architecture**: Built on Next.js 14+ with Vercel deployment in mind

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or use Supabase/PlanetScale)
- OpenAI API key (optional - will use mock data if not provided)

## 🛠️ Installation

1. **Clone and install dependencies**:

```bash
npm install
```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/feedback_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI (Optional - will use mock data if not provided)
OPENAI_API_KEY=""

# Redis (Optional - will use in-memory cache if not provided)
UPSTASH_REDIS_URL=""
UPSTASH_REDIS_TOKEN=""
```

3. **Set up the database**:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

4. **Run the development server**:

```bash
npm run dev
```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
feedback/
├── app/
│   ├── api/                    # API routes
│   │   ├── analytics/          # Analytics tracking
│   │   └── feedbacks/          # Feedback management
│   ├── dashboard/              # Business owner dashboard
│   ├── review/[businessId]/    # Customer-facing review page
│   ├── globals.css             # Global styles
│   └── page.tsx                # Landing page
├── components/
│   └── ui/                     # Reusable UI components
├── lib/
│   ├── ai.ts                   # AI feedback generation
│   ├── cache.ts                # Caching layer
│   ├── prisma.ts               # Prisma client
│   └── utils.ts                # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
└── public/                     # Static assets
```

## 🎯 Usage

### For Business Owners

1. **Navigate to Dashboard**: Go to `/dashboard`
2. **Enter Business Details**: Provide business name, type, Google Maps URL, products, and employees
3. **Generate Reviews**: Click to generate 100+ AI-powered review templates
4. **Get QR Code**: Download and display the QR code at your business location
5. **Monitor Analytics**: Track customer engagement and review conversions

### For Customers

1. **Scan QR Code**: Use phone camera to scan the QR code at the business
2. **Select Review**: Choose a review template that matches their experience
3. **Copy & Share**: Review is automatically copied to clipboard
4. **Redirect to Google**: Automatically redirected to Google Reviews to paste and submit

## 🔧 Configuration

### Database Options

- **Local PostgreSQL**: Use a local PostgreSQL instance
- **Supabase**: Free tier available at [supabase.com](https://supabase.com)
- **PlanetScale**: Serverless MySQL at [planetscale.com](https://planetscale.com)

### AI Configuration

The platform supports multiple AI providers:

- **OpenAI GPT-4**: Set `OPENAI_API_KEY` in `.env`
- **Mock Data**: Automatically used if no API key is provided (for development)

### Caching

- **In-Memory Cache**: Default fallback (included)
- **Redis Cache**: Set `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` for production

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Connect to Vercel**:

- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables
- Deploy!

3. **Set up Database**:

- Use Vercel Postgres, Supabase, or PlanetScale
- Update `DATABASE_URL` in Vercel environment variables
- Run migrations: `npx prisma migrate deploy`

### Environment Variables for Production

Make sure to set these in Vercel:

- `DATABASE_URL`
- `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` (your production URL)
- `OPENAI_API_KEY` (optional)
- `UPSTASH_REDIS_URL` (optional)
- `UPSTASH_REDIS_TOKEN` (optional)

## 🎨 Customization

### Branding

Update the following in `app/page.tsx` and `app/dashboard/page.tsx`:

- Logo and brand name
- Color scheme (in `app/globals.css`)
- Copy and messaging

### Review Generation

Modify the AI prompt in `lib/ai.ts` to:

- Adjust tone and style
- Change review length
- Modify positive/neutral ratio
- Add specific instructions

## 📊 Analytics

The platform tracks:

- **QR Scans**: When customers scan the QR code
- **Feedback Selected**: Which reviews customers choose
- **Google Redirects**: Successful redirects to Google Reviews

Access analytics through the dashboard (to be implemented).

## 🔒 Security

- JWT-based authentication (NextAuth.js)
- SQL injection prevention (Prisma ORM)
- Rate limiting on public endpoints
- IP hashing for privacy
- Input validation with Zod

## 🤝 Contributing

This is a technical specification implementation. Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

MIT License - feel free to use this for your projects!

## 🆘 Support

For issues or questions:

1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub

## 🎉 Credits

Built with:

- Next.js 14+
- TypeScript
- Tailwind CSS
- Prisma
- Framer Motion
- OpenAI API
- shadcn/ui components

---

**Note**: This is a demonstration implementation based on the technical specification. For production use, ensure you:

- Set up proper authentication
- Configure production database
- Add comprehensive error handling
- Implement proper rate limiting
- Set up monitoring and logging
- Add automated testing
