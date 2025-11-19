# GRHOG


A modern Next.js frontend application for the GRHOG waste management system with comprehensive authentication and role-based access control.

## Features

- **Authentication System**: JWT-based authentication with role-based access control
- **Role-Based Permissions**: Three user roles (SUPER_ADMIN, ADMIN, VIEWER) with different permissions
- **Protected Routes**: Automatic route protection based on user roles and permissions
- **Modern UI**: Built with Next.js 15, TypeScript, Tailwind CSS, and Radix UI
- **Real-time Data**: Integration with backend API for real-time waste management data
- **Responsive Design**: Mobile-first responsive design
- **Dark Mode**: Built-in dark mode support

## Authentication & Authorization

### User Roles

The system implements three user roles with different levels of access:

#### 1. SUPER_ADMIN
- **Full system access**
- Can view all data and manage all aspects of the system
- Can create, edit, and delete bins, clients, and system users
- Can assign roles to users
- Can access all analytics and reports

#### 2. ADMIN
- **Data management access**
- Can view all data
- Can create, edit, and delete bins and clients
- Cannot manage system users
- Can access analytics and reports

#### 3. VIEWER
- **Read-only access**
- Can view all data
- Cannot create, edit, or delete anything
- Can access analytics and reports

### Authentication Flow

1. **Login**: Users authenticate with username/password
2. **JWT Token**: Backend returns JWT token with user role and permissions
3. **Local Storage**: Token and user config stored in localStorage
4. **Route Protection**: Protected routes check authentication and permissions
5. **Auto-redirect**: Unauthenticated users redirected to login page

### Permission System

The system uses a granular permission system:

```typescript
interface UserPermissions {
  canViewAllData: boolean;
  canManageBins: boolean;
  canManageClients: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canViewDashboard: boolean;
  canViewTransactions: boolean;
  canViewReports: boolean;
}

interface UserConfig {
  showUserManagement: boolean;
  showBinManagement: boolean;
  showClientManagement: boolean;
  showAnalytics: boolean;
  showDashboard: boolean;
  showTransactions: boolean;
  showReports: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateBins: boolean;
  canEditBins: boolean;
  canDeleteBins: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
}
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Backend API running on `http://device.grhog.mn`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GRHOG
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example.txt .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # For development with local backend
   NEXT_PUBLIC_API_BASE_URL=http://device.grhog.mn
   
   # For production with HTTP backend (uses proxy to avoid mixed content)
   NEXT_PUBLIC_API_BASE_URL=/api/proxy
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
GRHOG/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── api/              # API routes
│   ├── components/            # Reusable components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── types/                # TypeScript types
│   └── constants/            # Constants and data
├── public/                   # Static assets
└── docs/                     # Documentation
```

## Mixed Content Solution

This project includes a solution for HTTPS frontend making requests to HTTP backend (mixed content):

- **Proxy API Routes**: `/api/proxy/*` routes forward requests to your HTTP backend
- **Automatic Fallback**: If proxy fails, falls back to direct backend calls
- **Environment Configurable**: Set `NEXT_PUBLIC_API_BASE_URL=/api/proxy` to use proxy

### How It Works

1. Frontend makes requests to `/api/proxy/endpoint`
2. Next.js API route forwards request to `http://device.grhog.mn/endpoint`
3. Response is returned to frontend
4. No mixed content issues since all frontend requests are to same domain

## Key Components

### Authentication Components

- **`ProtectedRoute`**: Wrapper component for route protection
- **`UserAuthForm`**: Login form component
- **`SignInViewPage`**: Sign-in page component

### Hooks

- **`useAuth`**: Authentication state management
- **`useRolePermissions`**: Role and permission management

### Utilities

- **`authUtils`**: Authentication utilities
- **`api.ts`**: API client with authentication headers

## Usage Examples

### Protected Routes

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <div>Admin only content</div>
    </ProtectedRoute>
  );
}
```

### Permission Checks

```tsx
import { useRolePermissions } from '@/hooks/use-role-permissions';

export default function BinManagement() {
  const { hasPermission, canPerformAction } = useRolePermissions();

  return (
    <div>
      {hasPermission('canManageBins') && (
        <button>Create New Bin</button>
      )}
      
      {canPerformAction('canCreateBins') && (
        <button>Add Bin</button>
      )}
    </div>
  );
}
```

### Authentication State

```tsx
import { useAuth } from '@/hooks/use-auth';

export default function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## API Integration

The frontend integrates with the backend API through:

- **Authentication endpoints**: `/auth/signin`, `/auth/signout`, `/auth/me`
- **Data endpoints**: `/bins`, `/clients`, `/bin-usages`, etc.
- **Analytics endpoints**: `/analytics/*`, `/dashboard/*`

All API requests automatically include JWT authentication headers.

## Development

### Adding New Protected Routes

1. **Create the page component**
   ```tsx
   // src/app/dashboard/admin/page.tsx
   import { ProtectedRoute } from '@/components/auth/protected-route';

   export default function AdminPage() {
     return (
       <ProtectedRoute requiredRole="SUPER_ADMIN">
         <div>Admin content</div>
       </ProtectedRoute>
     );
   }
   ```

2. **Add navigation item**
   ```tsx
   // src/constants/data.ts
   {
     title: 'Admin',
     url: '/dashboard/admin',
     icon: 'admin',
     requiresRole: 'SUPER_ADMIN'
   }
   ```

### Adding New Permissions

1. **Update types**
   ```tsx
   // src/types/index.ts
   interface UserPermissions {
     // ... existing permissions
     canManageNewFeature: boolean;
   }
   ```

2. **Update backend** (if needed)
3. **Use in components**
   ```tsx
   const { hasPermission } = useRolePermissions();
   
   if (hasPermission('canManageNewFeature')) {
     // Show feature
   }
   ```

## Testing

### Authentication Testing

```bash
# Test login with default admin credentials
curl -X POST http://device.grhog.mn/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "pass#1s"}'
```

### Frontend Testing

```bash
# Run tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables

Set the following environment variables for production:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check if backend is running on correct port
   - Verify JWT token is being sent in headers
   - Check browser console for errors

2. **Permissions not working**
   - Verify user role in localStorage
   - Check if permissions are properly set in backend
   - Ensure ProtectedRoute is wrapping components

3. **API calls failing**
   - Check CORS configuration on backend
   - Verify API endpoints are correct
   - Check network tab for request/response details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
