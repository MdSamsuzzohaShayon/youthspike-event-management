# Youthspike tournament

___
 - **Design**
 - [Prototype](https://www.figma.com/proto/8rXFB98j1R4fUG6Hug20FH/Alex?type=design&node-id=27-5&t=Ucn2d4Li6ufI8Q7j-1&scaling=scale-down&page-id=0%3A1)
 - [Landscape Prototype](https://www.figma.com/proto/8rXFB98j1R4fUG6Hug20FH/Alex?page-id=179%3A475&type=design&node-id=183-477&viewport=881%2C410%2C0.26&t=xvYj6qYCqbPEDKBX-1&scaling=scale-down)
 - [Backend/admin panel prototype](https://www.figma.com/proto/PoBQKYzuq9IgmCLZMVu9MT/Dashboard-for-spikeball-app-(Client-file)?type=design&node-id=201-1660&t=a8dHq7FKsr2km2dX-1&scaling=min-zoom&page-id=0%3A1)
 
___
 - **Video Explanation**
 - [ACL Match app collaboration docs](https://goalit.wimi.pro/#/asl-match-app/channel)
 - [Project Explanation Video](https://goalit.wimi.pro/#/asl-match-app/tasks/detail/4967510)

 - [Explan previous project video 1](https://www.loom.com/share/de95f56de7274ebca60c4e0605523c82), [Explan previous project video 2(How the match works)](https://www.loom.com/share/142b7cc2efc64e208a3e6f6f0e779ffc), [Explanation video 3](https://www.loom.com/share/6c7397a3939c4896b090ff29275577da)
 - [Match explain](https://loom.com/share/679281f727f541b5a52b49ad755079ae)

 - [Explain action boxes](https://www.loom.com/share/1c0ddb26379b465a947958594a2252a5)

 - [Dashboard part 1](https://www.loom.com/share/e56a6f1caf114970b80c1f3aef218f19), [Dashboard part 2](https://www.loom.com/share/c577d8301e8442ad9718209c83f18921)
 - [Director dashboard menu explain](https://www.loom.com/share/cbdfd52937474c6995391edf609a4b0c)

 - [Explain Prototype](https://www.loom.com/share/89dd7d2e95ee439ab3e89e331fb411c6)
 - [Explaning score](https://www.loom.com/share/2a6cd800d8414f06993896bf185e0dcb)
 - [Previous League App Dashboard](https://www.loom.com/share/c577d8301e8442ad9718209c83f18921)
 
 - [Net variance explanation](https://www.loom.com/share/bfbb4baabdb2478aac6fa7c8b63f73f5), captain and coach are same, player list(team) means roster, league and event act as same with little bit of diffrence

 - **Testing**
 - [Edit event and navigation and moving a squad list](https://www.loom.com/share/5a4ca5cb6afe4351a2c06e4707d1b8f6)
 - [Location on the event settings. Consistency on the name of the event.](https://www.loom.com/share/d023edb6e8e04348a4770dfbd9267919)
 - [Changing captain. And updating rankings and refresh when you make a player inactive.](https://www.loom.com/share/fa723bb6904a4592b1e4833bdc95b124)
 - [Creating matches](https://www.loom.com/share/33de4bdff99740019875d7b4625be2d1)
 - [Player images from players tab to team tab area](https://www.loom.com/share/e89820eb179e4e2f88bd06ccaaa9a533)
 - [LDO profile and main screen](https://www.loom.com/share/05f3416d3c5f4c8ea46267a85ed8775e)
 - [Captains login.](https://www.loom.com/share/3682d0d55358406b9ecb265646107a37)





### Learn
 - Next.js GraphQL - https://www.youtube.com/watch?v=XzE-PzALyDc
 - MERN GraphQL - https://www.youtube.com/watch?v=XzE-PzALyDc
 - Nestjs GraphQL - https://www.youtube.com/watch?v=XS709CO_i9c&list=PLVo1k_VwkKMx8Bo-zwzS_8W28Rbh3sgw8
 - Apache Server tutorial - https://www.youtube.com/watch?v=1CDxpAzvLKY
 - [Similar project - 1](https://github.com/dvikas/nextjs-graphql-adminpanel/tree/main)
 - [Similar project - 2](https://github.com/TomDoesTech/NestJS-GraphQL/tree/main/part-three)
 - [Nest.js Websocket](https://github.com/mokuteki225/nest-websockets-chat-boilerplate/tree/master)
 - Learn GraphQL Apollo client data caching
 - Learn Next.js 13/14 updated



### Style
 - color pallete gray-100, gray-900, yellow-500, green-600

### Running
 - Create team without a captain
 - Work with bulk actions
 - Fix some common issues from running a match - https://www.loom.com/share/2056a1ba4d0f4713991366e3ca2b9112

 - Move team - when moving team to another event current event should not have that team
 - When make player inactive the rank should be update and and this should work properly
 - When Moving player rank them properly

 - Update director informations as admin (Not working properly)
 - Email for a player is optional field, only if we want to add that player to captain we will need email
 - When we edit a player we should not see division and team, when we move the player they should appear
 - When updating points, there should not be a button for updating points instead, when input change it will be updated
 - Till 15:00
 

 - Player sub, a player can be off for a round and can get back in the next round

 - Make sure random assign follow net variance rule, also do not allow a player with previous round partner
 - Update/refetch acter creating an event
 - Changing round one by one (Need to jump to the clicked round)

 - Team name sometime showing up at the top and sometime not
 - When logged in as captain the captain should only see his team and players of the team
 - Division filter always need to be at the top
 - If a round has been submitted he can not re-rank his players
 - Showing cors issue when making requesat with fetch
 - After updating points there next round button should be show up
 - in active players are still showing up when we click on the empty player box
 


### Requirements

 - Work with bulk actions


 - Next js testing with react testing library
 - Handling error properly
 - Handle error just like uploading multiple player file error handling


 - **Team**
 - If there is a team of player, create the team for him as well on the import of players file[14:40](https://www.loom.com/share/fda9c04b47f94d3a8cbae578a886f4fa), If a player unassigned they will be at the event as unassigned players
 - Add search function for player when creating a new team
 - Players page -> do not make filter -> Insteand just select team to see the team
 - Create team without a captain
 - Team name sometime showing up at the top and sometime not

 - **Players**
 - In the player list show all players in an event
 - To Add player need to select division and teams. Submit and and rank (Submit and take to the team, re-rank players)
 - Email for a player is optional field, only if we want to add that player to captain we will need email
 - Import players from excel file should have a confirmation message
 - Assign players to a net will be drop down and move both event
 - Make player leave of or inactive in the match day
 - Move team, or players to different event
 - Move player to diffrent divisions and team

 - **Dashboard**
 - Copy Events properly (Do something for players)
 - If date is pass the status of league will be past, add past events in  the filter, 
 - No division section inside roster design, (There are 3 different skills level means 3 sections)
 - Net range is same as net variance, therefore, delete one of them [assign player with net variance 10:50](https://www.loom.com/share/01cf8693859b474981b4a51660444e4e)


 - **Captain**
 - Send welcome email to all of our captains
 - But coach/captain can change only his team but points can be changed by any captain of any team
 - When logged in as captain the captain should only see his team and players of the team
 - Captain can edit roster photo, and re-rank players
 - If a round has been submitted he can not re-rank his players
 
 - **Event**
 - Updaing round creating some issues (Log in as admin)

 
 - **Division**
 - Division filter always need to be at the top
 - Select a division from an event and that will stick for rest of the event pages

 - **Match**
 - After updating points there next round button should be show up
 - There could be exception, a team can have 5 players because they can get a player injured, In that case they can play will 5 players (Check every net should have atleast 1 player)
 - When updating points, there should not be a button for updating points instead, when input change it will be updated1
 - Player sub, a player can be off for a round and can get back in the next round
 - When clicking on empty player card that net name should be shown on the player list on the left
 - Get a sound notification on an socket event
 - Sponsors will always have a logo of ourself


 - **Single Match (public)**
 - Players need to be assign within 3 minutes or less according to clock
 - When the clock runs out it will automitically randomly assign
 - Dedicated pages for nets and rounds of the match
 - There are 3 different strategies when assignin players
    1. Ancher: Pair rank 1 player with last rank player, rank 2 player with 2nd last rank player and son on
    2. Hierarchy: Pair rank 1 player with rank 2 player, rank 3 player with rank 4 player and so on
    3. Random: Random pair
 - When the clock runs out it will automitically assign randomly

### Bug Fixing
 - Issue with admin directing to event setting page (It is redirecting to /admin page)
 - Edit player from team page
 - When make player inactive the rank should be update and and this should work properly
 - in active players are still showing up when we click on the empty player box
 - Updaing round creating some issues (Log in as admin)
 - Submit lineup is not properly sending data to other client, the other screen being blank - Need to organize rounds in ascending order from `submit-lineup-response`. When a team is updating in round 1 and another team is selecting players for the nets in round 2. When the first team has updated the score ther other team is been kicked out to round 1

 - Add or updating ldo or director logo is not working peroperly
 - Update event logo also not working
 - Showing cors issue when making requesat with fetch



### Deployment
 - Setup Github actions
 - [Setup apache server](https://www.digitalocean.com/community/tutorials/how-to-install-the-apache-web-server-on-ubuntu-22-04)
 - [Secure Apache with Let's Encrypt](https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-22-04)
 - Cinfigure firewall
 - Create reverse proxies (For nest-backend, admin-frontend, frontend, websocket)
 - Nginx GraphQL load balancing
 - Setup docker


### Github action deployment
 - Create secrets in github repos
 - Create ssh key from server
 - Github Profile -> setting -> add ssh public key of ubuntu server
 - Copy ssh private key of server as action secret key in github repo
 - Add public key to authorized key `cat .ssh/id_rsa.pub >> .ssh/authorized_keys` on the server
 - Clone the repository from server `git clone git@github.com:MdSamsuzzohaShayon/youthspike-event-management.git` (*Use ssh not http*)
 - Create **deploy.myl** file and deploy
 - Install git, nodejs, mongodb

### Speed Up
 - Server optimization, 
 - Caching strategies, and 
 - Content delivery networks (CDNs) can also significantly impact the server's ability to handle traffic. 
 - Nature of Requests: If the requests are simple and lightweight, such as serving static content or simple API calls, a $5 droplet may handle 50,000 requests per day without much trouble.
 - Optimization: Efficient coding practices, proper server optimization, and caching mechanisms can significantly improve the performance of your applications and help the server handle more requests.
 - Traffic Distribution: If the requests are evenly distributed throughout the day, the server may handle the load better than if they come in large spikes. Implementing load balancing and CDN services can also help distribute the load.
 - Type of Application: Resource-intensive applications or those that require a lot of processing power may not perform as well on a $5 droplet. In such cases, you might need to consider a higher-tier droplet or other scaling strategies.
 - Scaling Options: DigitalOcean provides options to scale vertically (upgrading the droplet to a higher plan) or horizontally (adding more droplets). If you find that the $5 droplet is reaching its capacity, you can consider scaling up or out.


### Ask
 - If player return, will he return to same event or can return to different event
 - I have updated auto assign logic for random assign, you did not notice the button below the net
 - Currently there are 3 status for a match, if the date passed it will say "PASSED", if the date of the match is about to come it will say "UPCOMING", and if today is the date of the match it will say "CURRENT". Is it okay? Should I add "COMPLETED" in match status?
 - Update multiple division at once is not working properly - after updaging check all team and match division changes

 - I guess you have not check the current update, some errors you have mentioned and I fixed and those were working with me. However, I will double check.
 - And you could not import file for teams because you had some duplicate player's emails that already imported in another event. I will show a message saying that you have duplicates
 - I will let you allow creating a team withour captain
 - When we create a playuer without email address, he won't have any uniqueness in his record, his name can contain someone else and when we find/or select for a team we will be confused. So what is your plan for this? should create a username for all user that will be unique?


 curl -i -N  \
    -H "Connection: Upgrade"  \
    -H "Upgrade: websocket"  \
    -H "Host: echo.websocket.org"  \
    -H "Origin: http://www.websocket.org"  \
    http://echo.websocket.org