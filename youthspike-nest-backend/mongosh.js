const badges = db.badges.find().toArray();

print(`Found ${badges.length} badges.\n`);

let teamBadgeCount = 0;
let playerBadgeCount = 0;
let updatedCount = 0;

badges.forEach((badge, index) => {
  const teamCount = Array.isArray(badge.teams) ? badge.teams.length : 0;

  const badgeFor = teamCount > 1 ? "TEAM" : "PLAYER";

  print(
    `[${index + 1}/${badges.length}] ` +
    `Badge: "${badge.name || "Unnamed"}" | ` +
    `Teams: ${teamCount} | ` +
    `badgeFor: ${badgeFor}`
  );

  const result = db.badges.updateOne(
    { _id: badge._id },
    {
      $set: {
        badgeFor: badgeFor,
      },
    }
  );

  if (result.modifiedCount === 1) {
    updatedCount++;

    print(`  ✓ Updated successfully`);
  } else {
    print(`  - No change needed`);
  }

  if (badgeFor === "TEAM") {
    teamBadgeCount++;
  } else {
    playerBadgeCount++;
  }
});

print("\n========================================");
print("Badge Migration Completed");
print("========================================");
print(`Total badges:        ${badges.length}`);
print(`TEAM badges:         ${teamBadgeCount}`);
print(`PLAYER badges:       ${playerBadgeCount}`);
print(`Documents updated:   ${updatedCount}`);
print("========================================");