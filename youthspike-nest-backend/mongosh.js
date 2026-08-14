const sourceGroupId = ObjectId('6a6141c22196a012dc1b43ca');
const targetGroupId = ObjectId('6a7ef92d32c63c3af5a7ce1e');

// Find match IDs before changing anything
const matches = db.matches
  .find({ group: sourceGroupId }, { _id: 1 })
  .toArray();

const matchIds = matches.map(match => match._id);

print(`Found ${matchIds.length} matches to move.`);

if (matchIds.length > 0) {
  // 1. Update matches
  const matchUpdateResult = db.matches.updateMany(
    { _id: { $in: matchIds } },
    { $set: { group: targetGroupId } }
  );

  // 2. Add matches to target group
  const targetGroupUpdateResult = db.groups.updateOne(
    { _id: targetGroupId },
    {
      $addToSet: {
        matches: { $each: matchIds }
      }
    }
  );

  // 3. Remove matches from source group
  const sourceGroupUpdateResult = db.groups.updateOne(
    { _id: sourceGroupId },
    {
      $pull: {
        matches: { $in: matchIds }
      }
    }
  );

  print(`Matches updated: ${matchUpdateResult.modifiedCount}`);
  print(`Target group updated: ${targetGroupUpdateResult.modifiedCount}`);
  print(`Source group updated: ${sourceGroupUpdateResult.modifiedCount}`);
} else {
  print('No matches found. Nothing to update.');
}