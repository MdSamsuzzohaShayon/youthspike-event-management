// I have 2 mongodb collections teams and players
// In players, I have teams (arra y of team id) fields 
// in teams, I have array of players and moved both of t hem array of id
// Now, I want to check all teams that there are no duplicated in players and moved array of a team
// Then, in a team if a player id is in thea players array field, delete that if from moved array if that player id is is also present in moved



// MongoDB Shell Script (mongosh)
// Purpose: Remove player IDs from the 'moved' array if they are also present in the 'players' array.

// 1. Define the database and collection names
const dbName = "spikeball-latest"; // Replace with your actual database name
const collectionName = "teams";     // Replace with your actual collection name

// 2. Get the database and collection references
const db = db.getSiblingDB(dbName);
const teamsCollection = db.getCollection(collectionName);

print("Starting cleanup process: Removing duplicate player IDs from 'moved' arrays...\n");

// 3. Execute the update using an aggregation pipeline
const updateResult = teamsCollection.updateMany(
   // Filter: Only target documents where both 'players' and 'moved' arrays exist and are not empty
   {
      players: { $exists: true, $ne: [] },
      moved: { $exists: true, $ne: [] }
   },
   // Update: Use an aggregation pipeline to modify the document
   [
      {
         $set: {
            // Rebuild the 'moved' array by keeping only items NOT present in 'players'
            moved: {
               $filter: {
                  input: "$moved",
                  as: "playerId",
                  cond: { $not: [ { $in: ["$$playerId", "$players"] } ] }
               }
            }
         }
      }
   ]
);

// 4. Print the results properly
print("Cleanup Process Completed.");
print("--------------------------------------------------");
print(`Documents matched:  ${updateResult.matchedCount}`);
print(`Documents modified: ${updateResult.modifiedCount}`);
print("--------------------------------------------------\n");

// 5. (Optional) Display a sample of the updated documents to verify
print("Sample of updated team documents:");
const updatedDocs = teamsCollection.find(
   { moved: { $exists: true } }, 
   { _id: 1, teamName: 1, players: 1, moved: 1 } // Projection (add/remove fields as needed)
).limit(5).toArray();

if (updatedDocs.length === 0) {
   print("No documents with a 'moved' array were found to display.");
} else {
   updatedDocs.forEach(doc => {
      printjson(doc);
   });
}