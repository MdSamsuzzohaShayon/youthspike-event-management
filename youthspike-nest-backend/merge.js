/*
  Merge minor matches from backup DB into main DB

  Steps:
  1. Restore your backup into a temporary DB:
     scp -r res/spikeball_backup_20250917_150617/dbbackup/spikeball-matches/ shayon@104.248.112.37:/home/shayon/backup-db-17/
     mongorestore --gzip --db spikeball_temp ./spikeball-matches
  2. Run this script with:
     mongosh merge.js
*/

const tempDB = db.getSiblingDB('spikeball_temp'); // Backup DB
// const mainDB = db.getSiblingDB('spikeball-matches'); // Production DB
const mainDB = db.getSiblingDB('spikeball-latest'); // Test DB

/**
 * Generic helper to update a document by _id and add match._id to matches array
 * @param {string} collectionName - Name of the collection in mainDB
 * @param {ObjectId|string} id - _id of the document to update
 * @param {Object} match - Match document
 * @param {boolean} createIfMissing - If true, insert the document from tempDB if not found
 */
const addMatchToDoc = (collectionName, id, match, createIfMissing = false) => {
  if (!id) return;

  try {
    const existing = mainDB[collectionName].findOne({ _id: id });

    if (existing) {
      const result = mainDB[collectionName].updateOne({ _id: id }, { $addToSet: { matches: match._id } });
      if (result.modifiedCount > 0) {
        print(`✅ Updated ${collectionName} _id ${id} with match _id ${match._id}`);
      }
    } else if (createIfMissing) {
      const tempDoc = tempDB[collectionName].findOne({ _id: id });
      if (tempDoc) {
        mainDB[collectionName].insertOne({ ...tempDoc, matches: [match._id] });
        print(`✅ Inserted ${collectionName} _id ${id} with match _id ${match._id}`);
      }
    }
  } catch (err) {
    print(`❌ Error updating ${collectionName} _id ${id}: ${err}`);
  }
};

/**
 * Merge a related array collection (e.g., nets, rounds, serverReceiverOnNet) from tempDB
 */
const mergeRelatedCollection = (coll, match) => {
  if (!match[coll] || match[coll].length === 0) return;

  tempDB[coll].find({ match: match._id }).forEach((doc) => {
    try {
      const exists = mainDB[coll].findOne({ _id: doc._id });
      if (!exists) {
        mainDB[coll].insertOne(doc);
      }
    } catch (err) {
      print(`❌ Error inserting ${coll} _id ${doc._id}: ${err}`);
    }
  });
};

const teamRankingUpdate = (match, teamRankingField) => {
  try {
    if (!match[teamRankingField]) return;

    // Get the ranking document from tempDB
    const rankingDoc = tempDB[teamRankingField].findOne({ match: match._id });
    if (!rankingDoc) return; // No ranking found for this match

    // 1. Insert each ranking item into mainDB.playerRankingItem if not exists
    if (rankingDoc.rankings && rankingDoc.rankings.length > 0) {
        rankingDoc.rankings.forEach((item) => {
          const exists = mainDB.playerRankingItem.findOne({ _id: item._id });
          if (!exists) {
            mainDB.playerRankingItem.insertOne(item);
          }
        });
      }

    // 2. Update the corresponding team's playerRankings array
    const teamId = rankingDoc.team;
    mainDB.teams.updateOne({ _id: teamId }, { $addToSet: { playerRankings: rankingDoc._id } });

    print(`✅ Updated ${teamRankingField} for match _id ${match._id} and team _id ${teamId}`);
  } catch (err) {
    print(`❌ Error updating ${teamRankingField} for match _id ${match._id}: ${err}`);
  }
};

// Array to log merged matches
const mergedDocs = [];

// Find all minor matches in the backup DB
tempDB.matches.find({ division: { $regex: 'minor', $options: 'i' } }).forEach((match) => {
  try {
    mergedDocs.push(match);

    // Skip if the match already exists
    const exists = mainDB.matches.findOne({ _id: match._id });
    if (exists) return;

    // Clone match to avoid mutating original
    const newMatch = { ...match };

    // Merge related collections
    addMatchToDoc('events', newMatch.event, newMatch);
    mergeRelatedCollection('nets', newMatch);
    mergeRelatedCollection('rounds', newMatch);
    mergeRelatedCollection('serverReceiverOnNet', newMatch);
    mergeRelatedCollection('serverReceiverSinglePlay', newMatch);
    mergeRelatedCollection('playerstats', newMatch);
    addMatchToDoc('teams', newMatch.teamA, newMatch);
    addMatchToDoc('teams', newMatch.teamB, newMatch);
    addMatchToDoc('rooms', newMatch.room, newMatch, true); // insert if missing
    addMatchToDoc('groups', newMatch.group, newMatch);
    teamRankingUpdate(newMatch, 'teamARanking');
    teamRankingUpdate(newMatch, 'teamBRanking');

    // Insert match itself
    mainDB.matches.insertOne(newMatch);
  } catch (err) {
    print(`❌ Error processing match _id ${match._id}: ${err}`);
  }
});

print(`✅ Merge completed! Total matches processed: ${mergedDocs.length}`);

// teamARanking, teamBRanking,
