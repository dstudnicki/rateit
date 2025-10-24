# RateIt - Social Media Platform

A full-stack social media application built with Next.js 16, TypeScript, MongoDB, and styled-components. Users can share posts and photos, interact through comments, and manage their profiles.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Deployment](#deployment)

## ✨ Features

- **User Authentication**: JWT-based registration and login system
- **Posts**: Create, view, and manage text posts
- **Photos**: Upload and share photos with descriptions
- **Comments**: Comment on posts and photos
- **User Profiles**: View user profiles with their posts and photos
- **Profile Editing**: Edit your own profile information
- **Responsive Design**: Styled-components for consistent UI

## 🛠 Tech Stack

### Frontend
- **Next.js 15.3.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Styled Components 6.1.19** - CSS-in-JS styling
- **Axios** - HTTP client
- **JWT Decode** - Token decoding

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **Mongoose 8.16.3** - ODM for MongoDB
- **JWT (jsonwebtoken)** - Authentication tokens
- **Bcrypt.js** - Password hashing

### Development
- **ESLint** - Code linting
- **Tailwind CSS 4** - Utility-first CSS
- **Turbopack** - Fast bundler for development

## 📁 Project Structure

```
rateit/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/
│   │   │   ├── login/          # POST: User login
│   │   │   └── register/       # POST: User registration
│   │   ├── posts/
│   │   │   ├── route.ts        # GET: All posts, POST: Create post
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts    # GET, PUT, DELETE: Single post
│   │   │   │   └── comments/   # POST: Add comment, DELETE: Remove comment
│   │   │   └── user/[userId]/  # GET: Posts by user
│   │   ├── photos/
│   │   │   ├── route.ts        # GET: All photos, POST: Upload photo
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts    # GET, PUT, DELETE: Single photo
│   │   │   │   └── comments/   # POST: Add comment, DELETE: Remove comment
│   │   │   └── user/[userId]/  # GET: Photos by user
│   │   └── user/
│   │       └── [username]/     # GET: User profile by username
│   ├── [username]/             # User profile page
│   │   ├── page.tsx
│   │   └── edit/               # Edit profile page
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── posts/
│   │   ├── page.tsx            # All posts page
│   │   └── add/                # Create post page
│   ├── photos/
│   │   ├── page.tsx            # All photos page
│   │   └── upload/             # Upload photo page
│   ├── layout.tsx              # Root layout with Navbar
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/
│   └── Navbar/
│       └── Navbar.tsx          # Navigation component
├── hooks/
│   └── useAuth.ts              # Authentication hook
├── lib/
│   ├── mongoose.ts             # MongoDB connection
│   └── registry.tsx            # Styled-components registry
├── models/
│   ├── User.ts                 # User model
│   ├── Post.ts                 # Post model with comments
│   └── Photo.ts                # Photo model with comments
├── public/                     # Static assets
└── styles/
    └── GlobalStyles.ts         # Global styled-components
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/dstudnicki/rateit.git
cd rateit
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. **Run the development server**
```bash
pnpm dev
# or
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | Yes |

## 📡 API Reference

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: { "token": "jwt_token", "message": "Login successful" }
```

### Posts

#### Get All Posts
```http
GET /api/posts
```

#### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string"
}
```

#### Get Single Post
```http
GET /api/posts/[id]
```

#### Update Post
```http
PUT /api/posts/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string"
}
```

#### Delete Post
```http
DELETE /api/posts/[id]
Authorization: Bearer <token>
```

#### Get Posts by User
```http
GET /api/posts/user/[userId]
```

#### Add Comment to Post
```http
POST /api/posts/[id]/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string"
}
```

#### Delete Comment from Post
```http
DELETE /api/posts/[id]/comments/[commentId]
Authorization: Bearer <token>
```

### Photos

#### Get All Photos
```http
GET /api/photos
```

#### Upload Photo
```http
POST /api/photos
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "string",
  "description": "string"
}
```

#### Get Single Photo
```http
GET /api/photos/[id]
```

#### Update Photo
```http
PUT /api/photos/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "string",
  "description": "string"
}
```

#### Delete Photo
```http
DELETE /api/photos/[id]
Authorization: Bearer <token>
```

#### Get Photos by User
```http
GET /api/photos/user/[userId]
```

#### Add Comment to Photo
```http
POST /api/photos/[id]/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string"
}
```

#### Delete Comment from Photo
```http
DELETE /api/photos/[id]/comments/[commentId]
Authorization: Bearer <token>
```

### Users

#### Get User by Username
```http
GET /api/user/[username]
```

## 🗄 Database Models

### User Model
```typescript
{
  username: String (required),
  email: String (required, unique),
  password: String (required, hashed)
}
```

### Post Model
```typescript
{
  title: String (required),
  content: String (required),
  user: ObjectId (ref: User, required),
  comments: [
    {
      content: String (required),
      user: ObjectId (ref: User, required),
      createdAt: Date (default: Date.now)
    }
  ],
  createdAt: Date (default: Date.now)
}
```

### Photo Model
```typescript
{
  filename: String (required),
  description: String,
  user: ObjectId (ref: User, required),
  comments: [
    {
      content: String (required),
      user: ObjectId (ref: User, required),
      createdAt: Date (default: Date.now)
    }
  ],
  createdAt: Date (default: Date.now)
}
```

## 🔒 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: User creates an account with username, email, and password
2. **Password Hashing**: Passwords are hashed using bcrypt before storage
3. **Login**: User provides email and password
4. **Token Generation**: Server generates JWT token (valid for 1 hour)
5. **Token Storage**: Client stores token in localStorage
6. **Protected Routes**: API endpoints verify JWT token in Authorization header
7. **Token Format**: `Bearer <token>`

### Using Authentication in Frontend

```typescript
// Example: Making authenticated request
const token = localStorage.getItem('token');
const response = await axios.post('/api/posts', 
  { title: 'My Post', content: 'Content' },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

### Custom Hook: useAuth

The `useAuth` hook provides authentication utilities:

```typescript
const { 
  user,           // Current user object
  login,          // Login function
  register,       // Register function
  logout,         // Logout function
  isAuthenticated // Boolean authentication status
} = useAuth();
```

## 🚢 Deployment

### Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `MONGODB_URI`
- `JWT_SECRET`

## 📝 Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Dominik Studnicki**
- GitHub: [@dstudnicki](https://github.com/dstudnicki)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [styled-components](https://styled-components.com/)
- Database: [MongoDB](https://www.mongodb.com/)
- Font: [Geist](https://vercel.com/font) by Vercel
