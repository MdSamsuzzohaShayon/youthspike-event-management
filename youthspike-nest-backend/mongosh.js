// P1-west

const groupId = ObjectId("6a3d808d0aa1fcc941fdc795");
const matchId = ObjectId("6a3f69a119d66ed17919f1ba");

const groupResult = db.groups.updateOne(
  { _id: groupId },
  { $addToSet: { matches: matchId } }
);

const matchResult = db.matches.updateOne(
  { _id: matchId },
  { $set: { group: groupId } }
);

print("Group updated:", groupResult.modifiedCount);
print("Match updated:", matchResult.modifiedCount);