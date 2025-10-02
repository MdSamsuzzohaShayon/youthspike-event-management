/*
  Reverse merge minor matches from main DB (undo merge.js)

  Steps:
  1. Run this script with:
     mongosh reverse-merge.js
*/

// const mainDB = db.getSiblingDB('spikeball-matches'); // Production DB
const mainDB = db.getSiblingDB('spikeball-latest'); // Test DB

/**
 * Remove match._id from document's matches array
 */
const removeMatchFromDoc = (collectionName, id, matchId) => {
  if (!id) return;

  try {
    const existing = mainDB[collectionName].findOne({ _id: id });
    if (existing) {
      mainDB[collectionName].updateOne({ _id: id }, { $pull: { matches: matchId } });
    }
  } catch (err) {
    print(`❌ Error removing match _id ${matchId} from ${collectionName} _id ${id}: ${err}`);
  }
};

/**
 * Remove documents in related collections (e.g., nets, rounds, serverReceiverOnNet) linked to a match
 */
const removeRelatedCollection = (coll, matchId) => {
  try {
    mainDB[coll].deleteMany({ match: matchId });
  } catch (err) {
    print(`❌ Error deleting related docs in ${coll} for match _id ${matchId}: ${err}`);
  }
};

/**
 * Remove team ranking items and references
 */
const removeTeamRanking = (match, teamRankingField) => {
  try {
    if (!match[teamRankingField]) return;

    // Find ranking doc
    const rankingDoc = mainDB[teamRankingField].findOne({ match: match._id });
    if (!rankingDoc) return;

    // Remove ranking items from playerRankingItem collection
    if (rankingDoc.rankings && rankingDoc.rankings.length > 0) {
      rankingDoc.rankings.forEach((item) => {
        mainDB.playerRankingItem.deleteOne({ _id: item._id });
      });
    }

    // Remove ranking reference from team
    if (rankingDoc.team) {
      mainDB.teams.updateOne({ _id: rankingDoc.team }, { $pull: { playerRankings: rankingDoc._id } });
    }

    // Remove ranking doc itself
    mainDB[teamRankingField].deleteOne({ _id: rankingDoc._id });
  } catch (err) {
    print(`❌ Error removing ${teamRankingField} for match _id ${match._id}: ${err}`);
  }
};

// Find all minor matches that were merged
const mergedMatches = mainDB.matches.find({ division: { $regex: 'minor', $options: 'i' } }).toArray();

mergedMatches.forEach((match) => {
  try {
    const matchId = match._id;

    // Remove match from collections
    removeMatchFromDoc('events', match.event, matchId);
    removeMatchFromDoc('teams', match.teamA, matchId);
    removeMatchFromDoc('teams', match.teamB, matchId);
    removeMatchFromDoc('rooms', match.room, matchId);
    removeMatchFromDoc('groups', match.group, matchId);

    // Remove related collections
    removeRelatedCollection('nets', matchId);
    removeRelatedCollection('rounds', matchId);
    removeRelatedCollection('serverReceiverOnNet', matchId);
    removeRelatedCollection('serverReceiverSinglePlay', matchId);
    removeRelatedCollection('playerstats', matchId);

    // Remove team rankings
    removeTeamRanking(match, 'teamARanking');
    removeTeamRanking(match, 'teamBRanking');

    // Finally, remove the match itself
    mainDB.matches.deleteOne({ _id: matchId });

    print(`✅ Removed match _id ${matchId} and all related data`);
  } catch (err) {
    print(`❌ Error removing match _id ${match._id}: ${err}`);
  }
});

print(`✅ Reverse merge completed! Total matches removed: ${mergedMatches.length}`);
