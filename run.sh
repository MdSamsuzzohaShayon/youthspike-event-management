#!/bin/bash

echo "============================================================"
echo "=======================START MONGODB========================"
echo "============================================================"
sudo systemctl start mongod

echo "============================================================"
echo "=======================UPDATE SYSTEM========================"
echo "============================================================"
sudo dnf update -y

echo "============================================================"
echo "=======================RUN BACKEND=========================="
echo "============================================================"
if [ ! -d "youthspike-nest-backend/node_modules" ]; then
    echo "Installing packages"
    npm install express --prefix youthspike-nest-backend
fi
gnome-terminal --tab --working-directory="/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/" --title="Backend" -- bash -c "code . && npm run dev"

echo "============================================================"
echo "=======================RUN FRONTEND ADMIN==================="
echo "============================================================"
if [ ! -d "youthspike-admin-frontend/node_modules" ]; then
    echo "Installing packages"
    npm install express --prefix youthspike-admin-frontend
fi
gnome-terminal --tab --working-directory="/home/shayon/Documents/web/youthspike-event-management/youthspike-admin-frontend/" --title="Admin Frontend" -- bash -c "code . && npm run dev"

echo "============================================================"
echo "=======================RUN FRONTEND ========================"
echo "============================================================"
if [ ! -d "youthspike-frontend/node_modules" ]; then
    echo "Installing packages"
    npm install express --prefix youthspike-frontend
fi
gnome-terminal --tab --working-directory="/home/shayon/Documents/web/youthspike-event-management/youthspike-frontend/" --title="Frontend" -- bash -c "code . && npm run dev"


# code /home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend
# code /home/shayon/Documents/web/youthspike-event-management/youthspike-admin-frontend
# code /home/shayon/Documents/web/youthspike-event-management/youthspike-frontend