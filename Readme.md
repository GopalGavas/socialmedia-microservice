# Social Media Microservices

## Overview

This project is a **microservices-based social media application** that enables users to **authenticate, create posts, manage media, and search for content** efficiently. The system is built using **Node.js, Express, MongoDB, Redis, RabbitMQ, and other cloud services** to ensure scalability and modularity.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Message Broker**: RabbitMQ
- **Cache**: Redis (Upstash)
- **Authentication**: JWT-based authentication
- **Microservices Communication**: HTTP + Message Queue (RabbitMQ)
- **Deployment**: Render (Cloud hosting for microservices)
- **Docker**: Containerization

## Services

### 1. API Gateway

- **Port:** `8000`
- **Responsibilities:**
  - Central entry point for the system
  - Routes requests to appropriate microservices
  - Implements rate limiting and security headers

### 2. Authentication Service (`auth-service`)

- **Port:** Hosted on Render
- **Responsibilities:**
  - User registration, login, and JWT authentication
  - Manages session and authorization

### 3. Post Service (`posts-service`)

- **Port:** Hosted on Render
- **Responsibilities:**
  - Create, update, delete, and fetch posts
  - Manages user-specific content and permissions

### 4. Media Service (`media-service`)

- **Port:** Hosted on Render
- **Responsibilities:**
  - Upload, store, and serve media files
  - Supports image and video uploads

### 5. Search Service (`search-service`)

- **Port:** Hosted on Render
- **Responsibilities:**
  - Search posts and users
  - Implements advanced filtering and search capabilities

## Installation & Setup

### Prerequisites

- Node.js installed (`>= 16.x`)
- MongoDB Atlas (or local MongoDB instance)
- RabbitMQ instance
- Redis instance

### Clone the repository

```sh
git clone https://github.com/your-repo/social-media-microservices.git
cd social-media-microservices
```

### Environment Variables

Create a `.env` file in the root directory and configure it accordingly:

```env
PORT=8000
NODE_ENV=production
IDENTITY_SERVICE=https://auth-service-wolt.onrender.com
POST_SERVICE=https://posts-service-gtcw.onrender.com
MEDIA_SERVICE=https://media-service-h42a.onrender.com
SEARCH_SERVICE=https://search-service-006d.onrender.com
REDIS_URL=rediss://your-redis-url
```

### Install Dependencies

```sh
npm install
```

### Run Services

Run each service separately in different terminals:

```sh
cd api-gateway && npm start
cd auth-service && npm start
cd posts-service && npm start
cd media-service && npm start
cd search-service && npm start
```

## API Endpoints

### Authentication

- `POST /v1/auth/register` → Register user
- `POST /v1/auth/login` → Login user

### Posts

- `POST /v1/posts` → Create a post
- `DELETE /v1/posts/:postId` → Delete a post (Authenticated user only)

### Media

- `POST /v1/media/upload` → Upload media files

### Search

- `GET /v1/search?q=query` → Search posts and users

## Contributing

1. Fork the repository
2. Create a new branch (`feature/new-feature`)
3. Commit changes
4. Push and open a pull request

## License

This project is licensed under the MIT License.

## Author

**Gopal Gavas** 🚀
