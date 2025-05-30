# Youthspike Tournament Management System

![Project Status](https://img.shields.io/badge/status-active-development-green)
![Tech Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Nest.js%20%7C%20GraphQL-blue)

A comprehensive tournament management system for spikeball events with admin panel, captain interface, and public viewing capabilities.

## Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [Design Resources](#design-resources)
- [Testing](#testing)
- [Learning Resources](#learning-resources)
- [Database Operations](#database-operations)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

### Core Functionality
- Tournament creation and management
- Team and player management
- Match scheduling and scoring
- Real-time updates via WebSocket
- Ranking system with custom logic
- Overtime and tiebreaker handling

### User Roles
- **Admin**: Full system access
- **Director**: Event management
- **Captain**: Team management
- **Spectator**: Public view access

## System Architecture

### Applications
1. **Admin Panel** (Next.js on port 3000)
   - Management interface for admins, directors, and captains
2. **Public Site** (Next.js on port 3001)
   - Tournament viewing for spectators
3. **Backend API** (Nest.js on port 4000)
   - GraphQL API for all operations
   - MongoDB for data persistence
   - Redis for caching and real-time updates

### Technology Stack
- Frontend: Next.js 13/14
- Backend: Nest.js with GraphQL
- Database: MongoDB
- Cache: Redis
- WebSocket: Real-time communication
- Deployment: Docker, Nginx, Apache

## Installation

### Prerequisites
- Node.js 16+
- MongoDB
- Redis
- Yarn or npm

### Steps
1. Clone the repository:
   ```bash
   git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git
   ```
2. Install dependencies for each application:
   ```bash
   cd youthspike-nest-backend && npm install
   cd ../youthspike-admin-frontend && npm install
   cd ../youthspike-frontend && npm install
   ```
3. Configure environment variables (see `.env.example` files in each directory)

## Development Setup

### Running Locally
1. Start Redis and MongoDB services
2. In separate terminals:
   ```bash
   # Backend
   cd ../youthspike-nest-backend && npm run dev
   
   # Admin Panel
   cd ../youthspike-admin-frontend && npm run dev
   
   # Public Site
   cd ../youthspike-frontend && npm run dev
   ```

## Design Resources

### Prototypes
- [Main Prototype](https://www.figma.com/proto/8rXFB98j1R4fUG6Hug20FH/Alex?type=design&node-id=27-5&t=Ucn2d4Li6ufI8Q7j-1&scaling=scale-down&page-id=0%3A1)
- [Landscape View](https://www.figma.com/proto/8rXFB98j1R4fUG6Hug20FH/Alex?page-id=179%3A475&type=design&node-id=183-477&viewport=881%2C410%2C0.26&t=xvYj6qYCqbPEDKBX-1&scaling=scale-down)
- [Admin Panel](https://www.figma.com/proto/PoBQKYzuq9IgmCLZMVu9MT/Dashboard-for-spikeball-app-(Client-file)?type=design&node-id=201-1660&t=a8dHq7FKsr2km2dX-1&scaling=min-zoom&page-id=0%3A1)

### Todo List
[Project Todo](https://docs.google.com/spreadsheets/d/1mEpOy7_pZP7rRUBMhi5c6kd33tDWt6QBoZ-fMm1P4JQ/edit#gid=1386834576)


## Troubleshooting

### Common Issues
- **Player ranking issues**: Ensure ranking is locked after round submission
- **WebSocket disconnections**: Verify Redis Pub/Sub configuration
- **Slow public views**: Implement pagination and optimize GraphQL queries
- **Team logo display**: Check image processing and caching

**Note**: This project is under active development. Refer to the [Todo list](https://docs.google.com/spreadsheets/d/1mEpOy7_pZP7rRUBMhi5c6kd33tDWt6QBoZ-fMm1P4JQ/edit#gid=1386834576) for current priorities.
