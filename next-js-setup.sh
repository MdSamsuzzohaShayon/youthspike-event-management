#!/bin/bash
 
    9  sudo adduser shayon
   10  su shayon
   12  sudo usermod -aG sudo shayon
   13  history
su - shayon
    8  sudo apt update && sudo apt upgrade -y
    9  sudo nano ~/.ssh/authorized_keys
   10  sudo mkdir -p /home/shayon/.ssh
   11  pwd


   12  sudo touch /home/shayon/.ssh/authorized_keys
   13  sudo chmod 600 /home/shayon/.ssh/authorized_keys
   14  sudo chown shayon:shayon /home/shayon/.ssh/authorized_keys
   15  sudo nano /home/shayon/.ssh/authorized_keys
   16  sudo systemctl restart ssh


   46  sudo apt-get install -y curl
   47  curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
   48  sudo -E bash nodesource_setup.sh
   49  node --version
   50  sudo apt-get install -y nodejs
   51  node --version
   52  npm --version


   55  ls ~/.ssh
   56  sudo apt update
   57  sudo apt install apache2
   58  ssh-keygen -t rsa -b 4096 -C "mdsamsuzzoha5222@gmail.com"
   59  sudo ssh-keygen -t rsa -b 4096 -C "mdsamsuzzoha5222@gmail.com"
   60  cd ~/.ssh/
   61  ls
   62  ssh-keygen -t rsa -b 4096 -C "mdsamsuzzoha5222@gmail.com" -f /home/shayon/.ssh/id_rsa
   63  sudo ssh-keygen -t rsa -b 4096 -C "mdsamsuzzoha5222@gmail.com" -f /home/shayon/.ssh/id_rsa
   64  ls -la
   65  cat id_rsa.pub 



sudo npm install pm2 -g



  110  sudo ufw status
  111  sudo ufw enable
  112  sudo ufw allow ssh
  113  sudo ufw status
  114  sudo ufw allow 80
  115  sudo ufw allow 443
  116  sudo ufw allow http
  117  sudo ufw allow https
    119  sudo ufw allow 'Apache Full'
  120  sudo systemctl restart apache2
  121  sudo systemctl status apache2
  122  cp -r /var/www/html/index.html /var/www/html/old-index.html
  123  sudo cp -r /var/www/html/index.html /var/www/html/old-index.html
  124  sudo nanno /var/www/html/index.html
  125  sudo nano /var/www/html/index.html
  126  history
  127  sudo nano /var/www/html/index.html





   79  cat /home/shayon/.ssh/id_rsa.pub
   80  sudo cat /home/shayon/.ssh/id_rsa.pub
   81  touch /home/shayon/.ssh/known_hosts
   82  sudo chown -R shayon:shayon /home/shayon/.ssh
   83  chmod 700 /home/shayon/.ssh
   84  chmod 644 /home/shayon/.ssh/known_hosts
   85  chmod 700 /home/shayon/.ssh
   86  git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git


   89  cd youthspike-event-management/
   90  rm -rf youthspike-nest-backend
   91  cd ..
   92  du -s youthspike-event-management
   93  du -sh youthspike-event-management 
   94  cd youthspike-event-management/
   95  ls -la
   96  rm -rf .git .github .dockerignore Message.txt README.md apache auto_deploy.sh  dbbackup docker-compose.common.yml docker-compose.dev.yml docker-compose.prod.yml index.html nginx run.sh setup.sh youthspike-nest-backend.code-workspace youthspike.code-workspace
   97  ls -la
   98  rm -rf .git .github .dockerignore Message.txt README.md apache auto_deploy.sh  dbbackup docker-compose.common.yml docker-compose.dev.yml docker-compose.prod.yml index.html nginx run.sh setup.sh youthspike-nest-backend.code-workspace youthspike.code-workspace .gitignore 
   99  cd youthspike-admin-frontend
  100  npm install
  101  ls
  102  npm run build
  103  nano src/utils/keys.ts 
  104  npm run build
  105  cd
  106  history










