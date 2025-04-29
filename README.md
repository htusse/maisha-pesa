# Maisha Pesa - Tenderpreneur Transaction Platform

Maisha Pesa is a digital platform that connects Contractors, Brokers, Sourcing Agents, Investors, and Clients, with oversight from an Admin. It streamlines tender management from order creation to funding, sourcing, and delivery using a shared revenue model.

## Features

- **Authentication & Role Management** - Users sign up with specific roles (Contractor, Broker, Sourcing Agent, Investor, Client, Admin) and undergo KYC verification by the admin.
- **Order Lifecycle** - Complete workflow from order creation by brokers, contractor approval, investor bidding, funding, sourcing, and delivery.
- **Chat System** - Built-in communication between contractors and brokers.
- **Revenue Share Model** - Automated distribution of revenue after delivery:
  - Contractor: 20%
  - Broker: 10%
  - Investor: 40%
  - Admin: 30%
- **Real-time Updates** - Live tracking of order status and updates for all users.

## Tech Stack

- **Frontend**:
  - React.js 18.2.0
  - TailwindCSS 3.4.1
  - Headless UI 1.7.17
- **Backend**:
  - Firebase 10.7.2 (Authentication, Firestore, Storage)
- **State Management**:
  - React Context API
- **Routing**:
  - React Router 6.21.3
- **UI/UX**:
  - React Icons 5.0.1
  - React Toastify 10.0.4
- **Utilities**:
  - date-fns 3.3.1
  - Lodash 4.17.21

## Project Structure

```
maisha-pesa/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── admin/     # Admin-specific components
│   │   ├── auth/      # Authentication components 
│   │   ├── kyc/       # KYC verification components
│   │   ├── layout/    # Layout components
│   │   ├── orders/    # Order-related components
│   │   └── chat/      # Chat components
│   ├── context/       # React Context providers
│   ├── firebase/      # Firebase configuration
│   ├── pages/         # Application routes/pages
│   └── App.js         # Main application component
├── public/            # Static assets
├── tailwind.config.js # Tailwind CSS configuration
├── postcss.config.js  # PostCSS configuration
├── firestore.rules    # Firestore security rules
└── storage.rules      # Storage security rules
```

### Key Design Principles

1. **Component-Based Architecture**
   - Modular components organized by feature
   - Clear separation between pages and components
   - Reusable UI components for consistency

2. **State Management**
   - React Context API for global state
   - Separate contexts for auth, orders, and settings
   - Efficient state updates and subscriptions

3. **Security**
   - Role-based access control
   - Firestore security rules
   - Storage access restrictions

4. **Performance**
   - Optimized component rendering
   - Efficient data fetching
   - Lazy loading for routes

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/htusse/maisha-pesa.git
   cd maisha-pesa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable required services:
   - Authentication (Email/Password)
   - Cloud Firestore
   - Storage
3. Set up security rules using the provided `firestore.rules` and `storage.rules`
4. Add your web app to the Firebase project and copy the configuration

## User Roles & Permissions

1. **Contractor** 
   - Approves/rejects orders
   - Communicates with brokers
   - Revenue share: 20%

2. **Broker**
   - Creates and manages orders
   - Communicates with contractors
   - Manages investor bids
   - Revenue share: 10%

3. **Investor**
   - Places bids on orders
   - Provides funding
   - Revenue share: 40%

4. **Sourcing Agent**
   - Manages item sourcing
   - Handles deliveries
   - Updates order status

5. **Client**
   - Views order progress
   - Receives notifications
   - Confirms deliveries

6. **Admin**
   - Manages user verification
   - Oversees operations
   - Revenue share: 30%

## Development

### Available Scripts

- `npm start` - Run development server
- `npm test` - Run test suite
- `npm run build` - Create production build
- `npm run eject` - Eject from Create React App

### Environment Variables

Required environment variables:
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---
Built with ❤️ using React and Firebase
