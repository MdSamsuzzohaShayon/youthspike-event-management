# Youthspike tournament

___
 - **Design**
 - [Prototype](https://www.figma.com/proto/8rXFB98j1R4fUG6Hug20FH/Alex?type=design&node-id=27-5&t=Ucn2d4Li6ufI8Q7j-1&scaling=scale-down&page-id=0%3A1)
 - [Landscape Prototype](https://www.figma.com/proto/8rXFB98j1R4fUG6Hug20FH/Alex?page-id=179%3A475&type=design&node-id=183-477&viewport=881%2C410%2C0.26&t=xvYj6qYCqbPEDKBX-1&scaling=scale-down)
 - [Backend/admin panel prototype](https://www.figma.com/proto/PoBQKYzuq9IgmCLZMVu9MT/Dashboard-for-spikeball-app-(Client-file)?type=design&node-id=201-1660&t=a8dHq7FKsr2km2dX-1&scaling=min-zoom&page-id=0%3A1)
 - [Action box design](https://www.canva.com/design/DAF-9-GdNuM/8rUTuBtKb2hCfzOlmx2jCQ/edit)
 - [Todo](https://docs.google.com/spreadsheets/d/1mEpOy7_pZP7rRUBMhi5c6kd33tDWt6QBoZ-fMm1P4JQ/edit#gid=1386834576)
 - [Redesign](https://www.figma.com/proto/8rXFB98j1R4fUG6Hug20FH/Alex?page-id=514%3A336&type=design&node-id=514-337&viewport=720%2C444%2C0.16&t=eolk3WEtglEtDIz0-1&scaling=min-zoom&no_third_party_tracking=true)
 
___

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
 - Color pallete gray-100, gray-900, yellow-500, green-600

### Running
 - Style according to Figma - Make color scheme same
 - https://www.loom.com/share/4d8d6caf06144ce1a734f23c8758a127
 - https://www.loom.com/share/34fb16bf594d405f81d8334b1bf399e8
 - Moreover, the team name will be hyperlink
 - Move team need to work properly - one division to another division

### Important
 - Removed someone from captain it erased  him off of his ldo account
 - Run the match 20 times and fix all the issues we got
      

### Requirements 
 - So I think as far as list goes- 
  1.) loading speed on public view standings, 
  2.) in phone mostly having to hit a button up to 10 times, 
  3.) logo presentation on public view standings (group and all). 
  4.) And then standings ranking by losses first.
 - Sorting matches -> group selected
 - Resize logos
 - Make it faster
 - DIvision and group select input (taking multiple times to click)
 - Team name change (bg color in the match)
 - Nginx load balancing
 - Node.js module (Clusters)
 - Increase capacity of RAM and CPUs


 - Make group filter for admin
 - Optimize assign strategies
 - Matches should be filtered by group in matches and players
 - Standings for players -> individual games / individual team / game points diff
 - SHow rank in frontend
 - WHen clicking on extend overtime, it is taking to the next round
 - PlayerList is not showing properly (Only works when I reload something) 
   - Captain can not re-rank a player
 - Overtime:
    - there will be 2 options A) Overtime B) 2 points net
    - There will be 1 in the final round there will be only one net (To break the tie)
    - If someone has 1 point advantage then the match is over, there will be no two points net
    - Only top 3 players are able to assigned to that one net
    - Both team need to submit their team in order to show the net (with assigned players)
 - Leaving a goast image behind
 - Settings -> number of rounds

 - Change style for adding and updating form
 - Trying everything again and again on mobile backdated browser (Safari)
 - In public view show search filter (Search by team, date, match description)
 - Admin should be able to put score in
 - Work with a captain can play only one match
 - Improve design -> Change design and animations for all input fields
 - Handle error properly -> Use react toast
 - Welcome to the match VS (other team team name), 
 - Description of the match

 - Create a team and player should be able to add to the team (In player or team edit option)

 - (web socket) Update match properly and show win and losses properly
 - Group card change - keep group name, and number of  groups, and list all the teams inside a group

 - Testing now! Initial thoughts:
    - ⁠All admins will need to be able to see the standings page. The one that you can see from the spectator view
    - A team view from the admin to public
 - **__https://www.loom.com/share/f221cae55313451cb1a0752dc7768ac4__**
 - Move team, and assign group should have a bulk action
 - **__https://www.loom.com/share/52d87d3bec864e64b83ab7affe7af326__** Till 3 minutes
 - Move change nets like change rosters
 - In 2 points nets, had to refresh. Able to put score in before banning a net
 - Sort by name and record in teams (public view)
 - **__https://www.loom.com/share/da66732176474ed291c37312afe8b17f__**
 - (In play match page ) - Need to rotate net beautifully

 - Ranking player with a ranking icon
 - Captain of a team must not be able to change the ranking of another team
 - Test with public in the match 
 - Live events are not working properly captain to admin
 - Handling error properly
 - Handle error just like uploading multiple player file error handling
 - Use www sub domain for both


 - **Team**
 - Add search function for player when creating a new team
 - When we are in team, in the player list in the place of assigned it will say the name of the team that is assigned to
 - Moreover, the team name will be hyperlink
 - If there are no logo, do not put any text there

 - **Players**
 - Move player need to work properly
 - Import players from excel file should have a confirmation message (error message if there is any error)
 - Assign players to a net will be drop down and move both event
 - Make player leave of or inactive in the match day
 - Move team, or players to different event
 - When make player inactive the rank should be update and and this should work properly
 - When Moving player rank them properl y
 - Need to create a seperate database document for this that will hold player id and player rank, so a player will have seperate rank in seperate team
 - Update player need to go to save and team page (if there is a team id) / player page
 - Add new player need to work properly when click on create new player link
 - Make player image bigger in player card
 - Phone number is not updating or saving properly
 - When creating team along with logo, players are still there after they are being added to the team
 - Add yellow box to the players once again
 - [05:50](https://www.loom.com/share/701aadddcb8341bba1631ca8d89e028a) - someone was ranked and his match is over, when he is inactive and make him active again his pair score and ranking was gone
 - Once a round is submitted that ranking should not be ever changed
 - [07:00](https://www.loom.com/share/701aadddcb8341bba1631ca8d89e028a) If something on the roster changes later on the round on the match and director decide to remove injured because he got injured, his ranking should be remain same (No isseue because ranking is locked because round has started), when he will be back his ranking should be same

 - **Dashboard**
 - Copy Events properly (Do something for players)
 - If date is pass the status of league will be past, add past events in  the filter, 


 - **Captain**
 - Send welcome email to all of our captains
 - When login as captain show name of the team of which I am captain of
 - When login as captain there won't be any option for division
 
 - **Event**
 - Updaing round creating some issues (Log in as admin)


 - **Match**
 - Run a match smoothly 
 - There could be exception, a team can have 5 players because they can get a player injured, In that case they can play will 5 players (Check every net should have atleast 1 player)
 - Get a sound notification on an socket event
 - Sponsors will always have a logo of ourself by default
 - Close button must not show up after submitting lineup
 - When click on input field to update score it should highlight the whole number
 - When I will match and submit my lineup, net 1 should be selected automitically
 - Update score button should not be shown - it is irrelevent now
 - On matches page, we do not need upcomming, only current ande passed
 - No current or any text on yellow box of match card, instead just keep the date
 - Design match list same as this - https://www.figma.com/proto/PoBQKYzuq9IgmCLZMVu9MT/Dashboard-for-spikeball-app-(Client-file)?type=design&node-id=145-1394&t=a8dHq7FKsr2km2dX-1&scaling=min-zoom&page-id=0%3A1

 - **Final Round**
 - 2 points net logic [04:20](https://www.loom.com/share/a39b08628d344b6588bd94d23e47ad8e) appear in the final round

 - **Design**
 - Black text on yellow box
 - Yellow need to be little more brighter than current yellow
 - Put those headers in every page of a event

 - **Public View**
 - There will be list of events instead of list of LDOs
 - List need to filter by date, upcomming, past
 - When some3one click on the event it will taker them to matches or teams
 - No need to show phone, email, or anything, Need to show name of the player and team they are on
 - Team logo is not showing

 - **Sponsors**
 - Some issue with sponsor, they  just somehow disappeared

 - **Single Match (public)**
 - Players need to be assign within 3 minutes or less according to clock
 - When the clock runs out it will automitically randomly assign
 - Dedicated pages for nets and rounds of the match
 - There are 3 different strategies when assignin players
    1. Anchor: Pair rank 1 player with last rank player, rank 2 player with 2nd last rank player and son on
    2. Hierarchy: Pair rank 1 player with rank 2 player, rank 3 player with rank 4 player and so on
    3. Random: Random pair
 - Make sure random assign, anchor assign, heirarchy assign more smooth
 - When the clock runs out it will automitically assign randomly
 - Change redial nevy blue color to black gradient

 - **LDO**
 - Email address are not showing up for account setting
 - When LDO is the same as the captain of the squad [00:55](https://www.loom.com/share/701aadddcb8341bba1631ca8d89e028a), instead of email address, we should be able to add username

### Design
 - Style according to Figma
 - Make color scheme same
 - https://www.loom.com/share/1290be7bff784ec190a58111f1411e3c

### Bug Fixing
 - A team has submitted their lineup, and the other team could not submit their lineup, it skipped the process (No lineup setting for the other team) [00:00](https://www.loom.com/share/67dab820e93e4a90b53995155a53d8bb)
 - [01:55](https://www.loom.com/share/ab1d7eebaf8246ea87f818428cf5e0d4) It is allowing a player to play with the player he played with in previous round
 - Submit lineup is not properly sending data to other client, the other screen being blank - Need to organize rounds in ascending order from `submit-lineup-response`. When a team is updating in round 1 and another team is selecting players for the nets in round 2. When the first team has updated the score ther other team is been kicked out to round 1
 


### Deployment
 - Setup Github actions
 - [Setup apache server](https://www.digitalocean.com/community/tutorials/how-to-install-the-apache-web-server-on-ubuntu-22-04)
 - [Secure Apache with Let's Encrypt](https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-22-04)
 - Cinfigure firewall
 - Create reverse proxies (For nest-backend, admin-frontend, frontend, websocket)
 - Nginx GraphQL load balancing
 - Setup docker

### Database Action
 - Set default passcode for all user
 ```
 db.users.updateMany({ role: { $in: ["admin", "director"] } },{ $set: { passcode: "Pass1234" } });
 ```
 -  Change `location` to `description` in all document of match and event
 - Allow duplicate email for a player `db.players.getIndexes()` and delete `db.players.dropIndex("email_1");`
  ```
  db.events.updateMany( { location: { $exists: true } }, { $rename: { "location": "description" } } );
  db.matches.updateMany( { location: { $exists: true } }, { $rename: { "location": "description" } } );
  ```
 -  Set `completed` to `false` in all document of match
 -  Set `sendCredentials` to `false` in all document of event and team
  ```
  db.events.updateMany({}, { $set: { sendCredentials: false } });
  db.teams.updateMany({}, { $set: { sendCredentials: false } });
  ```
 - Set num in teams
  ```
  const cursor = db.teams.find()
  let num = 1
  while (cursor.hasNext()) {
    let doc = cursor.next()
    db.teams.updateOne(
      { _id: doc._id }, // Match the document by its _id
      { $set: { num: num } } // Set the 'num' field to the current counter value
    )
    num++ // Increment the counter for the next document
    }
  ```

  - **Update Ranking** 
  - Delete `rank` field from Player
  - Set number for all documents `cursor.forEach((doc)=> {db.ldos.updateOne({_id: doc._id}, {$set:{num: counter}}); counter +=1;});`


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
 - Run both next.js server with one node_modules file (So I do not need to install those multiple times)
 - Server optimization, 
 - Caching strategies, and 
 - Content delivery networks (CDNs) can also significantly impact the server's ability to handle traffic. 
 - Nature of Requests: If the requests are simple and lightweight, such as serving static content or simple API calls, a $5 droplet may handle 50,000 requests per day without much trouble.
 - Optimization: Efficient coding practices, proper server optimization, and caching mechanisms can significantly improve the performance of your applications and help the server handle more requests.
 - Traffic Distribution: If the requests are evenly distributed throughout the day, the server may handle the load better than if they come in large spikes. Implementing load balancing and CDN services can also help distribute the load.
 - Type of Application: Resource-intensive applications or those that require a lot of processing power may not perform as well on a $5 droplet. In such cases, you might need to consider a higher-tier droplet or other scaling strategies.
 - Scaling Options: DigitalOcean provides options to scale vertically (upgrading the droplet to a higher plan) or horizontally (adding more droplets). If you find that the $5 droplet is reaching its capacity, you can consider scaling up or out.


### Ask
 - Plaase reply all those comments I have made in the to-do list
 - This is hours for last two days, jan 22 is not over yet, it is night, from the morning I will work more than 7 or 8 hours.
