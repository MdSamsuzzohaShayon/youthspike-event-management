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
 
 - [Net veriance explanation](https://www.loom.com/share/bfbb4baabdb2478aac6fa7c8b63f73f5), captain and coach are same, player list(team) means roster, league and event act as same with little bit of diffrence

### Learn
 - Next.js GraphQL - https://www.youtube.com/watch?v=XzE-PzALyDc
 - MERN GraphQL - https://www.youtube.com/watch?v=XzE-PzALyDc
 - Nestjs GraphQL - https://www.youtube.com/watch?v=XS709CO_i9c&list=PLVo1k_VwkKMx8Bo-zwzS_8W28Rbh3sgw8
 - Apache Server tutorial - https://www.youtube.com/watch?v=1CDxpAzvLKY
 - [Similar project - 1](https://github.com/dvikas/nextjs-graphql-adminpanel/tree/main)
 - [Similar project - 2](https://github.com/TomDoesTech/NestJS-GraphQL/tree/main/part-three)
 - Learn GraphQL Apollo client data caching
 - Learn Next.js 13/14 updated

### Style
 - color pallete gray-100, gray-900, yellow-500, green-600

### Running
 - Make player leave of or inavtive in the match day
 - Work with action boxes

### Requirements
 - Make domain __admin.aslsquads.com__ for *admin*
 - Next js testing with react testing library
 - Handling error properly
 - Make only logical comments and make sure clean coding
 - Make the program responsive
 - One league director will have multiple events
 - Handle error just like uploading multiple player file error handling

___
 - **Admin**
 - ✅✅ Get ldos with _id in the directors page (work on the backend)
 - Admin, captain and director can change ranking of players, drag and drop feature
 - Admin can import rosters and click a button for any or one of them to be a captain/
 - ✅✅ User role 1) admin 2) League Director 3) Captain
    - Admins are I, Alex, and Keleb
 - ✅✅ Shows all the events, add new event
 - ✅✅ Create seperate model for event and league(ldo)
 - Director, admin, and captain can change password

 - **Players**
 - ✅✅ Player will be seperate from user
 - ✅✅ A captain can be a player and user so that he can login
 - ✅✅ Import players from excel file
 - [Exports players](https://www.loom.com/share/835208d304cf48ec9f951e42f198d10e) from __manager.leagueapps.com__ and import that into this program
 - ✅✅ *All players will be in the event. Moreover, any team can assign any player. Or director will assign players to a team*
 - Make player leave of or inavtive in the match day
 - Move team, or players to different event
 - ✅✅ League director can create captain

 - **Dashboard**
 - [Explanation video 1](https://www.loom.com/share/de95f56de7274ebca60c4e0605523c82)
 - ✅✅ Change name of league to event from the database / 
 - ✅✅ Make relationship with events and ldo
 - ✅✅ A event is either tournament or league
    - Tournament (1 or 2 days duration)
    - League (8 or 8 weeks) also called league
 - Dashboard menu -> when a director comes to the dashboard first time he will see only account (setting option) -> If the user goes into the event then he will see some specific menu items such as players, teams, matches, settings -> event name will be shown to the top
 - Click on the logo to return to leagues (Event name and logo)
 - ✅✅ Create league director organization(LDO) from admin, Assign a league director to a league so he can organize his own league, A director can have a name, profile picture, and logo
 - ✅✅ Focus on league director and captain for now. 
 - ✅✅ League director can add an event, copy and edit event
 - ✅✅ In order to create an event, select a home team
 - Copy Events properly (Do something for players)
 - If date is pass the status of league will be past, add past events in  the filter, 
 - On click setting button, a setting screen will appear
 - Rosters can be submitted only once
 - On Iphone we need to do passcode verification, to edit match or roster
 - Show sponsers only on the public view (Not in admin project)
 - Add text field for sponsors name and image url
 - Make sure of Test Driven Development (Unit testing, End To End Testing)
 - ✅✅ On Click team, it will redirect to roster
 - ✅✅ Upload sponsors logo and all images to Cloudinary
 - No division section inside roster design, (There are 3 different skills level means 3 sections)
 - Dicisions for best players or worst players (Types of event). It can be men's division, woman division
 - [Explaning Point spread](https://www.loom.com/share/1fa1717af21d4f19a01a3450721cd4f6)

 - **Captain**
 - ✅✅ Coach/Captain can login and change profile picture
 - ✅✅ Captain setting
 - Coach/Captain can change 4 digit passcode
 - When someone login as captain he can only see teams and matches of different events since a player can be in diffrent event
 - Set default password for all captains and they can change their password later on
 - Send welcome email to all of our captains
 - ✅✅ From a single match -> login as captain
 - But coach/captain can change only his team
 
 - **Event**
 - ✅✅ League director can change anything in his event
 - Getting error with updating event
 - Add Name of the sponsors

 - **Match**
 - For a new match there will be whole new setup  (rounds, nets, etc)
 - Database modeling *round, match, and net* make relationship properly
 - Get all the defaults values from the event in order to create a new match
 - Update match
 - Matches page -> pair limit does not work -> 
 - Pair score is combine ranking of two players. [04:00 exlain new varience](https://www.loom.com/share/bfbb4baabdb2478aac6fa7c8b63f73f5), net verience means if a team has pair score of 9 and they submit their lineup, the other team can only assign player that does not exceed a limit as pair score, in this case it is 6 to 12 (pair score).
 - Create pair -> there is a limit in pair score -> If someone is added make sure a list of player with whom the pair score limit does not exceed.
 - Start match should not be there -> Instead when both coach appear there will be a clock to start
 - If a player plays with someone in the round 1 he can not play with with in round 2 or three
 - Make it more SEO friendly

 - **Match**
 - First team will assign players (and click on submit lineup)
 - Captain will not see other team's action box but he can see rosters of other team
 - There is a action flow to explain boxes

___
 - **Single Match (public)**
 - Create a setting option
 - Create swap net no touch event
 - Players need to be assign within 3 minutes or less
 - Work with user authentication - https://www.apollographql.com/docs/react/networking/authentication/#header
 - Submit lineup
 - On click of empty player (player placeholder) a list of players will appear, (name, record). On the second box only appear those players who can pair up with the first.
 - Add an action button in the place of submit lineup. Are all of your players there **check in**. Both caption will have this option [action box sequences T-14:00](https://www.loom.com/share/c577d8301e8442ad9718209c83f18921)
 - Both team captains need to check in whatever team assign first then he will send a pop up box and other team will accept and the clock start
 - Once both captain checked in the clock will start. They will have 3 minutes
 - Auto assign -> **1)** Ancoring Strategy: pair the best player with worst player of the team **2)** Hierarchy strategy: rank 1 player pay with tank 2 player, rank 3 player play with rank 4 player **3)** Random strategy
 - When You select high, rank 1 and 2  player on net 1, rank 3 and 4 player on net 2 and so on... Second option is anchor, for example there are 6 player, rank 1 player pair up with rank 4 player, rank 2 with rank 5, rank 3 with 6. Last option is auto, players will be assigned randomly here
 - When the clock runs out it will automitically randomly assign
 - From the second round a player can not play with someone who had paired up with in the previous round
 - Dedicated pages for nets and rounds of the match


 - **Team**
 - add team then -> add coach -> (step by step)
 - There will be a setting button to make some setting
 - A coach and make a team with all players of a league
 - Players page -> do not make filter -> Insteand just select team to see the team
 - In teams section, There are many leagues, and coaches, if you do not want to use filter how do you want to find teams (any plan for this)?


 - __Calculating__ score
    - Sum of Net 1, Net 2, and Net 3 score Will be score of team B and team B 
    - Match score means how many game a team won in total
    - 

___
 - **New Design**
 - When make the phone landscape more need to show all three nets
 - There are 3 different strategies when assignin players
    1. Ancher: Pair rank 1 player with last rank player, rank 2 player with 2nd last rank player and son on
    2. Hierarchy: Pair rank 1 player with rank 2 player, rank 3 player with rank 4 player and so on
    3. Random: Random pair
 - When the clock runs out it will automitically assign randomly


### Step By Step Guide
 - **Step-1:** Register -> *In Backend*, make request to a mutation `signupCoach` from user.resolver.ts and that will be forwarded to `createOrUpdate` from user.service.ts for business logic
 - Sign up mutation
    ```
    mutation SignupCoach($firstName: String!, $lastName: String!, $email: String!, $password: String!, $role: String) {
        signupCoach(firstName: $firstName, lastName: $lastName, email: $email, password: $password, role: $role) {
            code
            message  
            success
        }
    }
    ```
 - Sign up Mutation variables
    ```
    {
        "firstName": "Jude",
        "lastName": "Bellingham",
        "email": "jude@test.com",
        "password": "Test1234",
        "role": "admin"
    }
    ```
___



### Deployment
 - Setup Github actions
 - [Setup apache server](https://www.digitalocean.com/community/tutorials/how-to-install-the-apache-web-server-on-ubuntu-22-04)
 - [Secure Apache with Let's Encrypt](https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-22-04)
 - Cinfigure firewall
 - Create reverse proxies
 - 
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


### Ask
 1. If anyone put the score they can put whatever they want, this should not be the case. In my opinion, either team director should put the score in or they validate score of both team given by captains are correct.
 2. There is another issue with putting score and  doing any actions on that screen, it is better to add a update button after selecting players for the new captain should click on that update in that way the program will run little bit faster. 
 3. Last question was a bit incorrect. The question is when I login as captain of my team and you login as captain of your team, we both will see our team at the bottom of the screen on 2 different mobile screen. In that case, oponent team will be presented at the top side there for who logged in as captain will not see any buttons or controls of another team that is placed at the top side.