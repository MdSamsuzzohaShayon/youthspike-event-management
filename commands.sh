#!/bin/bash


    1  ls
    2  sudo mkdir /home/shayon
    3  ls
    4  pwd
    5  sudo chown shayon:shayon /home/shayon
    6  sudo chown -R shayon:shayon /home/shayon
    7  exit
    8  chmod 700 ~/.ssh
    9  mkdir ~/.ssh
   10  chmod 700 ~/.ssh
   11  touch ~/.ssh/authorized_keys
   12  chmod 600 ~/.ssh/authorized_keys
   13  nano ~/.ssh/authorized_keys
   14  sudo systemctl restart ssh
   15  exit
   16  history
   17  ls
   18  mkdir
   19  ls -la
   20  cd .ssh/
   21  ls
   22  cd ..
   23  ssh-keygen -t rsa -b 4096 -C "mdsamsuzzoha5222@gmail.com"
   24  cat .ssh/id_rsa.pub 
   25  cat .ssh/id_rsa
   26  cat .ssh/id_rsa.pub >> .ssh/authorized_keys 
   27  cat .ssh/authorized_keys 
   28  git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git
   29  ls
   30  sudo apt-get update
   31  sudo apt-get install -y ca-certificates curl gnupg
   32  sudo mkdir -p /etc/apt/keyrings
   33  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
   34  NODE_MAJOR=20
   35  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
   36  sudo apt-get update
   37  sudo apt-get install nodejs -y
   38  npm --version
   39  pwd
   40  ls
   41  cd youthspike-event-management/
   42  pwd
   43  git add .
   44  git commit -m "Path change"
   45  cd ..
   46  rm -rf youthspike-event-management/
   47  git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git
   48  exit
   49  ls
   50  cd youthspike-event-management/
   51  ls
   52  rm -rf node_modules package.json package-lock.json 
   53  ls
   54  ls -la
   55  cd youthspike-nest-backend/
   56  ls
   57  npm install
   58  ls
   59  nano .env
   60  npm run dev
   61  ls
   62  rm -rf .env
   63  cd ..
   64  git status
   65  git pull
   66  git pull origin master
   67  ls
   68  cd youthspike-nest-backend/
   69  npm run dev
   70  cat/etc/lsv-release
   71  cat /etc/lsv-release
   72  cat /etc/lbv-release
   73  cat /etc/lbb-release
   74  cat /etc/lsb-release
   75  dh -h
   76  df -h
   77  sudo apt-get install gnupg curl
   78  curl -fsSL https://pgp.mongodb.com/server-7.0.asc |    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg    --dearmor
   79  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   80  sudo apt-get install -y mongodb-org
   81  sudo apt-get update
   82  sudo apt-get install -y mongodb-org
   83  sudo systemctl status mongod
   84  sudo systemctl start mongod
   85  sudo systemctl status mongod
   86  sudo npm install pm2 -g
   87  git status
   88  npm run dev
   89  cd ../..
   90  rm -rf youthspike-event-management
   91  git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git
   92  git add .
   93  pwd
   94  cd youthspike-event-management/
   95  pwd
   96  ls
   97  cd youthspike-nest-backend/
   98  ls
   99  npm run dev
  100  npm run start:prod
  101  npm run build
  102  npm install
  103  npm run start:prod
  104  npm run build
  105  npm run start:prod
  106  mongod startup
  107  sudo systemctl enable mongod
  108  pm2 --version
  109  pm2 restart npm --name "nest_backend" -- start:prod
  110  sudo npm install -g pm2
  111  pm2 restart npm --name "nest_backend" -- start:prod
  112  which npm
  113  pm2 restart /usr/bin/npm --name "nest_backend" -- start:prod
  114  pm2 start npm --name "nest_backend" -- start:prod
  115  pm2 stop nest_backend
  116  pm2 delete nest_backend
  117  pm2 save
  118  pm2 save --force
  119  git add .
  120  git commit -m "updated pm2 setting"
  121  cd 
  122  rm -rf youthspike-event-management
  123  pm2 list
  124  ls
  125  rm -rf package-lock.json 
  126  git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git
  127  cd youthspike-event-management/
  128  git merge master
  129  git status
  130  pm2 list
  131  pm2 startOrRestart ecosystem.config.js --env production
  132  cd youthspike-nest-backend/
  133  pm2 startOrRestart ecosystem.config.js --env production
  134  ls
  135  git branch
  136  git switch development 
  137  ls
  138  cd ..
  139  pm2 start ecosystem.config.js --env production
  140  cd youthspike-nest-backend/
  141  pm2 start ecosystem.config.js --env production
  142  git pull origin master
  143  git pull --rebase origin master
  144  pm2 startOrRestart ecosystem.config.js --env production
  145  pm2 stop nest_backend
  146  pm2 delete nest_backend
  147  git add .
  148  pm2 status
  149  pm2 stop nest_backend
  150  pm2 start nest_backend
  151  pm2 save
  152  pm2 startup
  153  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shayon --hp /home/shayon
  154  pm2 stop nest_backend
  155  pm2 delete nest_backend
  156  pm2 save --force
  157  exit
  158  ls
  159  cd youthspike-event-management/
  160  ls
  161  cat README.md 
  162  clear
  163  ls
  164  cat README.md 
  165  ls
  166  cat youthspike-nest-backend/example.txt 
  167  cd youthspike-event-management/
  168  ls
  169  cat youthspike-nest-backend/
  170  cat youthspike-nest-backend/example.txt 
  171  cat README.md 
  172  ls
  173  pm2 list
  174  exit
  175  sudo apt update && sudo apt upgrade -y
  176  sudo systemctl start apache2
  177  sudo systemctl status apache2
  178  sudo apt install apache2
  179  sudo systemctl start apache2
  180  sudo systemctl enable apache2
  181  sudo ufw allow 80
  182  sudo ufw allow 443
  183  sudo ufw enable
  184  sudo ufw status
  185  sudo ufw allow ssh
  186  sudo ufw status
  187  sudo ufw allow http
  188  sudo ufw allow https
  189  sudo ufw status
  190  sudo nano /var/www/html/index.html
  191  sudo systemctl restart apache2
  192  history






  250  sudo nano /etc/apache2/sites-available/000-default.conf
  251  sudo systemctl restart apache2
  252  sudo apt-get install certbot python3-certbot-apache
  253  sudo certbot --apache
  254  sudo ufw status
  255  sudo ufw 80
  256  sudo ufw allow 80
  257  sudo apt-get remove certbot python3-certbot-apache --purge
  258  ls
  259  exit
  260  sudo systemctl restart apache2
  261  history
  262  sudo nano /etc/apache2/sites-available/default-ssl.conf
  263  sudo apt remove apache2 --purge
  264  sudo apt install apache2
  265  sudo nano /etc/apache2/sites-available/default-ssl.conf
  266  cat /etc/apache2/sites-available/default-ssl.conf
  267  sudo rm -rf  /etc/apache2/sites-available/default-ssl.conf
  268  sudo nano  /etc/apache2/sites-available/default-ssl.conf
  269  sudo systemctl restart apache2
  270  exit
  271  ls
  272  cd youthspike-event-management/
  273  pm2 list
  274  history
