# URL Shortener
as neat little `IP address` grabber for Redteaming. 

You only need to setup a mongoDB and can start sharing links, then log the IP.

# Disclaimer
Please use only for legal OSINT, Pentesting and Redteaming. Usage outside this scope is unwanted by the Author. Please build your own tools for your purposes. 

## Demo
It's got `responsive` CSS for desktop and mobile.

### Desktop
![](urls.JPG)

### Mobile
![](urls_mob.JPG)


# About
This is a Url Shortener based on `nodejs`, `express`, `mongoDB` and `nginx`. It's codebase is small and should provide you with both, a ready-to-use RedTeam tool as well as a starting point to work out your custom tool. 

# Why
- `Social Engineering` `MITM` attack
- For fun

## Usage
TL;DR: `git clone`, setup MongoDB (use `.env`), configure Domain, IP, certs, ... and start logging!

For more detailed `Tutorial` scroll down. 

## Lift Off!
Have fun. 

```bash
$ npm start
```

## Results
All access will be logged like this.

`mongosh` shell database content. 
```bash
privurl> db.urls.find({"shortUrl":"iyp7zk"})
[
  {
    _id: ObjectId("64f90c7f87386b9cd9259569"),
    originalUrl: 'https://example.org/test123',
    shortUrl: 'iyp7zk',
    creatorIp: '87.249.***.***',
    createdAt: ISODate("2023-09-06T23:34:23.317Z"),
    visitorIps: [
      {
        ip: '87.249.***.***',
        date: ISODate("2023-09-06T23:37:19.915Z"),
        _id: ObjectId("64f90d2f87386b9cd925956c")
      }
    ],
    __v: 1
  }
]
```

# Install components
Assuming a 64bit Ubuntu Server 22.04, user is `root` throughout all steps. This is a security risk and would need adaptation in a `production` environment, web file owner should rather be `www-data`.

### Install nginx, nodejs and basic components
Note that we will update to latest node and components further down the line. But I like to setup things for starters, get the setup going step by step, to make sure we start out with a working system without major pitfalls. 

```bash
$ su root
$ apt update && apt install nginx nodejs npm gnupg curl
$ systemctl enable nginx
$ systemctl start nginx
```

### First check & edit of nginx configs
```bash
$ nano /etc/nginx/nginx.conf
$ nano /etc/nginx/sites-enabled/default
$ nginx -t
$ systemctl restart nginx
$ systemctl status nginx
$ cat /var/log/nginx/error.log
```

### Install snap & certbot for LetsEncrypt
```bash
$ cd /
$ snap install core; snap refresh core
$ snap install certbot --classic
$ ln -s /snap/bin/certbot /usr/bin/certbot
$ certbot --nginx -d your_domain.name
```

### nginx config
After certbot ran, you should have a somewhat similar `sites-enables/default` nginx config, but you'll need to add the `proxy` config as shown below. 

```bash
server {
    listen 443 ssl;
    server_name your_domain.name;

    ssl_certificate /etc/letsencrypt/live/your_domain.name/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.name/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_set_header  Host $host;
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  X-Forwarded-Proto https;
        proxy_set_header  X-Forwarded-For $remote_addr;
        proxy_set_header  X-Forwarded-Host $remote_addr;

        # assuming your Node.js app is running on port 3000
        proxy_pass http://localhost:3000; 
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Install app components
Make absolutely sure, you have the latest `nodejs` and `node package manager` (npm) installed via `nvm` (Node Version Manager), otherwise things will fail from hereon onwards. 

```bash
$ cd /var/www/html/
$ rm -rf *
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
$ export NVM_DIR="$HOME/.nvm"
$ [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
$ nvm install --lts
$ npm install express mongoose dotenv
```

### Setup directory structure
To your own liking...

```bash
$ mkdir -p src/template src/models
$ mkdir -p pub/css pub/img pub/js
$ echo "MONGODB_URI=mongodb://dbuser:dbpass@127.0.0.1:27017/dbname" > .env
```

### Setup mongoDB
I skipped the step of setting up the actual `DB` intentionally.

```bash
$ curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
$ echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
$ apt update
$ apt install -y mongodb-org 
$ systemctl enable mongod
$ systemctl start mongod
$ npm update mongoose
$ systemctl restart mongod.service
$ mongosh
```
If you struggle at this point, here's a nudge: `Restart mongoDB` service each time you change a thing. 



