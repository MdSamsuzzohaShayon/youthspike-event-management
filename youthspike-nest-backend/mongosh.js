// ============================================================
// CONFIG
// ============================================================

const GROUP_NAME = "East-Richmond";


// ============================================================
// 1. FIND DUPLICATED GROUPS
// ============================================================

const duplicatedGroups = db.groups
  .find({
    name: {
      $regex: `^${GROUP_NAME}$`,
      $options: "i",
    },
    event: ObjectId('6a3c355236b002d89afc4a49')
  })
  .sort({ _id: 1 })
  .toArray();

if (duplicatedGroups.length === 0) {
  print(`No groups found with name: ${GROUP_NAME}`);
  quit();
}

if (duplicatedGroups.length === 1) {
  print(`Only one group found with name: ${GROUP_NAME}`);
  print("Nothing to merge.");
  quit();
}

print(`Found ${duplicatedGroups.length} groups with name: ${GROUP_NAME}`);


// ============================================================
// 2. KEEP THE FIRST GROUP AS THE SOURCE
// ============================================================

const keepFirstGroup = duplicatedGroups[0];

print("");
print("Source group:");
printjson({
  _id: keepFirstGroup._id,
  name: keepFirstGroup.name,
});


// ============================================================
// 3. COLLECT ALL IDS
// ============================================================
//
// Map is used for deduplication while preserving the original
// ObjectId values.
//
// ============================================================

const groupIdMap = new Map();
const teamIdMap = new Map();
const eventIdMap = new Map();
const matchIdMap = new Map();

for (const group of duplicatedGroups) {

  // ----------------------------------------------------------
  // Group ID
  // ----------------------------------------------------------

  groupIdMap.set(
    String(group._id),
    group._id
  );


  // ----------------------------------------------------------
  // Event ID
  // ----------------------------------------------------------

  if (group.event) {
    eventIdMap.set(
      String(group.event),
      group.event
    );
  }


  // ----------------------------------------------------------
  // Team IDs
  // ----------------------------------------------------------

  if (Array.isArray(group.teams)) {
    for (const teamId of group.teams) {
      if (teamId) {
        teamIdMap.set(
          String(teamId),
          teamId
        );
      }
    }
  }


  // ----------------------------------------------------------
  // Match IDs
  // ----------------------------------------------------------

  if (Array.isArray(group.matches)) {
    for (const matchId of group.matches) {
      if (matchId) {
        matchIdMap.set(
          String(matchId),
          matchId
        );
      }
    }
  }
}


// ============================================================
// 4. CONVERT MAPS TO ARRAYS
// ============================================================

const groupIds = [...groupIdMap.values()];
const teamIds = [...teamIdMap.values()];
const eventIds = [...eventIdMap.values()];
const matchIds = [...matchIdMap.values()];

print("");
print("Collected IDs:");
print("Groups:", groupIds.length);
print("Teams:", teamIds.length);
print("Events:", eventIds.length);
print("Matches:", matchIds.length);


// ============================================================
// 5. SAFETY CHECK — ALL GROUPS SHOULD BELONG TO ONE EVENT
// ============================================================
//
// Your new Group has only one `event` field.
//
// If duplicate groups belong to different events, we should
// NOT automatically merge them into one group.
//
// ============================================================

if (eventIds.length > 1) {
  print("");
  print("============================================================");
  print("ABORTED");
  print("============================================================");
  print(
    `Found ${eventIds.length} different events for these groups.`
  );
  print(
    "The script expects all duplicate groups to belong to the same event."
  );
  print("No new group or updates were made.");
  quit();
}


// ============================================================
// 6. CREATE NEW GROUP
// ============================================================

const newGroupDocument = {
  name: keepFirstGroup.name,
  active: keepFirstGroup.active,
  division: keepFirstGroup.division,
  rule: keepFirstGroup.rule,

  teams: [],
  matches: [],

  event: keepFirstGroup.event,
};

const insertResult = db.groups.insertOne(newGroupDocument);

if (!insertResult.acknowledged) {
  throw new Error("Failed to create new group.");
}

const newGroupId = insertResult.insertedId;

print("");
print("New group created:");
printjson({
  _id: newGroupId,
  name: newGroupDocument.name,
});


// ============================================================
// 7. UPDATE EVENTS
// ============================================================
//
// IMPORTANT:
//
// MongoDB does NOT allow:
//
// $pull + $addToSet
//
// on the same `groups` field in a single update.
//
// Therefore we do them as two separate operations.
//
// ============================================================

if (eventIds.length > 0) {

  // ----------------------------------------------------------
  // Remove old group IDs
  // ----------------------------------------------------------

  const eventPullResult = db.events.updateMany(
    {
      _id: { $in: eventIds },
    },
    {
      $pull: {
        groups: {
          $in: groupIds,
        },
      },
    }
  );

  print("");
  print(
    "Events - old groups removed:",
    eventPullResult.modifiedCount
  );


  // ----------------------------------------------------------
  // Add new group ID
  // ----------------------------------------------------------

  const eventAddResult = db.events.updateMany(
    {
      _id: { $in: eventIds },
    },
    {
      $addToSet: {
        groups: newGroupId,
      },
    }
  );

  print(
    "Events - new group added:",
    eventAddResult.modifiedCount
  );
}


// ============================================================
// 8. UPDATE TEAMS
// ============================================================

if (teamIds.length > 0) {

  // ----------------------------------------------------------
  // Remove old group IDs
  // ----------------------------------------------------------

  const teamPullResult = db.teams.updateMany(
    {
      _id: { $in: teamIds },
    },
    {
      $pull: {
        groups: {
          $in: groupIds,
        },
      },
    }
  );

  print("");
  print(
    "Teams - old groups removed:",
    teamPullResult.modifiedCount
  );


  // ----------------------------------------------------------
  // Add new group ID
  // ----------------------------------------------------------

  const teamAddResult = db.teams.updateMany(
    {
      _id: { $in: teamIds },
    },
    {
      $addToSet: {
        groups: newGroupId,
      },
    }
  );

  print(
    "Teams - new group added:",
    teamAddResult.modifiedCount
  );
}


// ============================================================
// 9. UPDATE MATCHES
// ============================================================

if (matchIds.length > 0) {

  const matchUpdateResult = db.matches.updateMany(
    {
      _id: { $in: matchIds },
    },
    {
      $set: {
        group: newGroupId,
      },
    }
  );

  print("");
  print(
    "Matches updated:",
    matchUpdateResult.modifiedCount
  );
}


// ============================================================
// 10. UPDATE NEW GROUP
// ============================================================

const groupUpdateResult = db.groups.updateOne(
  {
    _id: newGroupId,
  },
  {
    $set: {
      teams: teamIds,
      matches: matchIds,
    },
  }
);

print("");
print(
  "New group updated:",
  groupUpdateResult.modifiedCount
);



// ============================================================
// 11. VERIFICATION
// ============================================================

const createdGroup = db.groups.findOne({
  _id: newGroupId,
});

print("");
print("============================================================");
print("VERIFICATION");
print("============================================================");

print("New group:");
printjson(createdGroup);


// ============================================================
// 12. SUMMARY
// ============================================================

print("");
print("============================================================");
print("MERGE COMPLETED");
print("============================================================");

print("Old groups:", groupIds.length);
print("Teams:", teamIds.length);
print("Events:", eventIds.length);
print("Matches:", matchIds.length);
print("New group ID:", newGroupId);

print("");
print("IMPORTANT:");
print("Old groups were NOT deleted.");
print("Verify the migration before deleting them.");



// ============================================================
// 13. DELETE OLD / UNNECESSARY GROUPS
// ============================================================
//
// IMPORTANT:
// groupIds contains only the original duplicate groups.
// newGroupId is NOT included in groupIds.
//
// Therefore this deletes the old groups while keeping the
// newly created group.
//
// ============================================================

const deleteResult = db.groups.deleteMany({
  _id: {
    $in: groupIds,
  },
});

print("");
print("============================================================");
print("OLD GROUPS DELETED");
print("============================================================");

print("Deleted groups:", deleteResult.deletedCount);