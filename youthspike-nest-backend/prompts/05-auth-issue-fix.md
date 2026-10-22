I am having issue with working with some auth protected mutation. 
Like in src/group/group.resolver.ts, I can not use createGroupPoints. 
I am getting this unauthenticated error:

```
{
    "errors": [
        {
            "message": "Unauthorized",
            "locations": [
                {
                    "line": 2,
                    "column": 3
                }
            ],
            "path": [
                "createGroupPoints"
            ],
            "extensions": {
                "code": "UNAUTHENTICATED",
                "stacktrace": [
                    "UnauthorizedException: Unauthorized",
                    "    at JwtAuthGuard.handleRequest (/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/@nestjs/passport/dist/auth.guard.js:60:30)",
                    "    at /home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/@nestjs/passport/dist/auth.guard.js:44:124",
                    "    at /home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/@nestjs/passport/dist/auth.guard.js:83:24",
                    "    at allFailed (/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/passport/lib/middleware/authenticate.js:110:18)",
                    "    at attempt (/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/passport/lib/middleware/authenticate.js:183:28)",
                    "    at strategy.fail (/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/passport/lib/middleware/authenticate.js:314:9)",
                    "    at JwtStrategy.authenticate (/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/passport-jwt/lib/strategy.js:96:21)",
                    "    at attempt (/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/passport/lib/middleware/authenticate.js:378:16)",
                    "    at authenticate (/home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/passport/lib/middleware/authenticate.js:379:7)",
                    "    at /home/shayon/Documents/web/youthspike-event-management/youthspike-nest-backend/node_modules/@nestjs/passport/dist/auth.guard.js:88:3"
                ],
                "originalError": {
                    "message": "Unauthorized",
                    "statusCode": 401
                }
            }
        }
    ],
    "data": null
}

```

When I am removing those 2 lines:
```
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
```
it is working. 

Here is my request detail:

```
Request URL
http://localhost:4000/graphql
Request method
POST
Status code
200 OK
Remote address
[::1]:4000
Referrer policy
strict-origin-when-cross-origin
access-control-allow-credentials
true
access-control-allow-origin
http://localhost:3000
cache-control
no-store
connection
keep-alive
content-length
1835
content-type
application/graphql-response+json; charset=utf-8
date
Wed, 21 Oct 2026 11:37:57 GMT
etag
W/"72b-nY2/HJlhk0y4bzqJFuXjcxtDQlI"
keep-alive
timeout=5
vary
Origin
x-powered-by
Express
accept
application/graphql-response+json,application/json;q=0.9
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.7
connection
keep-alive
content-length
502
content-type
application/json
cookie
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1kc2hheW9uMEBnbWFpbC5jb20iLCJpZCI6MSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzkyNDk0ODU1LCJleHAiOjE4MDAyNzA4NTV9.n6gsWxxla7Qx7Lb2GBfIgiZCPkiXu64IdCHTLP67orU; user={"_id":null,"firstName":"Md","lastName":"Shayon","role":"admin","team":null,"teamLogo":null,"teamId":null,"email":"mdshayon0@gmail.com","passcode":null,"events":[],"captainplayer":null,"cocaptainplayer":null,"player":null,"__typename":"LoginUser"}
host
localhost:4000
origin
http://localhost:3000
referer
http://localhost:3000/
sec-ch-ua
"Chromium";v="154", "Brave";v="154", "Not A(Brand";v="99"
sec-ch-ua-mobile
?1
sec-ch-ua-platform
"iOS"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-site
sec-gpc
1
user-agent
Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1

```


Here is have login fu7nction detail src/user/resolvers/user.mutations.ts

THis is my helper file: src/user/resolvers/user.helpers.ts