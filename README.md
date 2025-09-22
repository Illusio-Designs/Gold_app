# Amrut Jewels - B2B Jewelry Platform

<div align="center">
  <img src="Frontend/Dashboard/src/assests/loginlogo.png" alt="Amrut Jewels Logo" width="200"/>
  
  <h3>🏆 Premium B2B Jewelry Management Platform</h3>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.80.2-blue.svg)](https://reactnative.dev/)
  [![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://mysql.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-12.0.0-yellow.svg)](https://firebase.google.com/)
  [![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
</div>

---

A comprehensive B2B jewelry platform consisting of a React Native mobile app, React web dashboard, and Node.js backend API. This platform enables jewelry businesses to manage products, orders, and customer relationships efficiently with real-time updates and advanced features.

## 🎯 Platform Overview

**Amrut Jewels** is a sophisticated B2B jewelry management system designed for wholesale jewelry businesses. The platform provides a complete ecosystem for managing inventory, processing orders, and maintaining customer relationships through modern web and mobile technologies.

### 🌟 Key Capabilities
- **Real-time Inventory Management** - Live updates across all platforms
- **Advanced Order Processing** - Complete order lifecycle management
- **Customer Relationship Management** - Comprehensive customer data and interaction tracking
- **Multi-platform Access** - Native mobile app and web dashboard
- **Push Notifications** - Real-time alerts and updates
- **Image Processing** - Advanced product image management and optimization
- **Analytics & Reporting** - Business intelligence and performance metrics

## 🏗️ Project Architecture

```
Gold_app/
├── Backend/                 # Node.js API Server
├── Frontend/
│   ├── Amrut/              # React Native Mobile App
│   └── Dashboard/          # React Web Dashboard (Admin Panel)
```

## 🚀 Features

### Mobile App (React Native)
- **User Authentication** - OTP-based login system
- **Product Catalog** - Browse and search jewelry products
- **Shopping Cart** - Add/remove items with real-time updates
- **Order Management** - Place and track orders
- **Push Notifications** - Real-time notifications via Firebase
- **Real-time Updates** - Socket.io integration for live data
- **Image Processing** - Advanced image handling and optimization
- **Offline Support** - AsyncStorage for offline functionality

### Web Dashboard (React)
- **Admin Panel** - Complete management interface
- **Product Management** - Add, edit, and manage jewelry products
- **Order Processing** - Handle and track customer orders
- **User Management** - Manage customer accounts
- **Analytics Dashboard** - Sales and performance metrics
- **Media Gallery** - Upload and manage product images
- **Real-time Notifications** - Admin notification system

### Backend API (Node.js)
- **RESTful API** - Complete CRUD operations
- **Authentication** - JWT-based authentication system
- **Database Management** - MySQL with automated migrations
- **File Upload** - Cloudinary integration for image storage
- **Real-time Communication** - Socket.io for live updates
- **Push Notifications** - Firebase Cloud Messaging
- **PDF Generation** - Automated invoice and report generation
- **Image Processing** - Sharp library for image optimization

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Socket.io** - Real-time communication
- **Firebase Admin** - Push notifications
- **Cloudinary** - Image storage and processing
- **JWT** - Authentication
- **Sharp** - Image processing
- **PDFKit** - PDF generation

### Mobile App
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **AsyncStorage** - Local storage
- **Firebase** - Push notifications
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client

### Web Dashboard
- **React** - Frontend framework
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **Lucide React** - Icons

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)
- **React Native CLI** (for mobile development)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Gold_app
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

Create a `.env` file in the Backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=amrut_jewels
DB_PORT=3306

# Server Configuration
PORT=3001
HOST=0.0.0.0

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Production URL
PRODUCTION_URL=https://api.amrutkumargovinddasllp.com
```

Initialize the database:
```bash
npm run setup
```

Start the backend server:
```bash
# Development
npm run dev

# Production
npm start
```

### 3. Mobile App Setup
```bash
cd Frontend/Amrut
npm install
```

For iOS (macOS only):
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

Start the Metro bundler:
```bash
npm start
```

Run the app:
```bash
# Android
npm run android

# iOS
npm run ios
```

### 4. Web Dashboard Setup
```bash
cd Frontend/Dashboard
npm install
```

Start the development server:
```bash
npm run dev
```

## 📱 Mobile App Configuration

### Android Setup
1. Ensure Android Studio is installed
2. Set up Android SDK and emulator
3. Enable USB debugging on your device
4. Run `npm run android`

### iOS Setup (macOS only)
1. Install Xcode from App Store
2. Install CocoaPods: `sudo gem install cocoapods`
3. Run `cd ios && pod install`
4. Run `npm run ios`

## 🔧 Environment Configuration

### Backend Environment Variables
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing secret
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name

### Mobile App Configuration
Update API endpoints in `src/services/Api.jsx`:
```javascript
const BASE_URL = 'http://your-backend-url:3001';
```

### Dashboard Configuration
Update API endpoints in `src/services/` files to match your backend URL.

## 📊 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/verify-otp` - OTP verification

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Cart
- `GET /api/cart/:userId` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `DELETE /api/cart/remove` - Remove item from cart

## 🔐 Security Features

- JWT-based authentication
- CORS protection
- Input validation and sanitization
- Secure file upload handling
- Environment variable protection
- SQL injection prevention

## 📱 Push Notifications

The app supports push notifications through Firebase Cloud Messaging:
- Order updates
- Product notifications
- System announcements
- Real-time alerts

## 🚀 Deployment

### Backend Deployment
1. Set up production environment variables
2. Configure MySQL database
3. Set up Cloudinary account
4. Deploy to your preferred hosting service

### Mobile App Deployment
1. Generate signed APK for Android
2. Build for iOS App Store
3. Configure Firebase for production

### Dashboard Deployment
1. Build the production bundle: `npm run build`
2. Deploy to your web hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Author**: Rishi Soni
- **Contact**: info@illusiodesigns.agency

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: info@illusiodesigns.agency

## 📈 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Inventory management
- [ ] Customer support chat
- [ ] Payment gateway integration

---

**Note**: This is a B2B jewelry platform designed for wholesale jewelry businesses. Ensure proper configuration of all environment variables and third-party services before deployment.
