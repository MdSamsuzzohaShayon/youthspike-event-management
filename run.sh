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
gnome-terminal --tab --working-directory="/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/" --title="Backend" -- bash -c "code . && npm run dev"

echo "============================================================"
echo "=======================RUN FRONTEND ADMIN==================="
echo "============================================================"
gnome-terminal --tab --working-directory="/home/shayon/Documents/web/youthspike-event-management/youthspike-admin-frontend/" --title="Admin Frontend" -- bash -c "code . && npm run dev"

echo "============================================================"
echo "=======================RUN FRONTEND ========================"
echo "============================================================"
gnome-terminal --tab --working-directory="/home/shayon/Documents/web/youthspike-event-management/youthspike-frontend/" --title="Frontend" -- bash -c "code . && npm run dev"


# gnome-terminal --tab is used to open a new tab in the terminal for each application.
# --working-directory specifies the directory in which the terminal should start.
# --title sets a title for each terminal tab (optional but helpful for organization).
# -- is used to separate the gnome-terminal options from the command (npm run dev in this case).