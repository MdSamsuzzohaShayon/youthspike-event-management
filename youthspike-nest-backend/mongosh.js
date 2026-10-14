// ============================================================
// Script: Clean up duplicate group points for given teams
// Includes: input validation, logging, referential cleanup
// ============================================================

const teamIds = [
   ObjectId("68c478c91a3dc4cfb83a02ca"),
   ObjectId('68b919d28551f0822955df26'),
   ObjectId('68c31561f2df3df5b924eb57'),
   ObjectId('68ba1e3c4778ee48c4aa5335')
];

try {
   // ---------- Input Validation ----------
   if (!Array.isArray(teamIds) || teamIds.length === 0) {
      throw new Error("teamIds must be a non-empty array of ObjectId");
   }

   print(`[INFO]  Input received: ${teamIds.length} team id(s)`);

   // Deduplicate team IDs (one is duplicated in the input)
   const uniqueTeamIds = [...new Set(teamIds.map(id => id.toString()))]
      .map(id => ObjectId(id));
   print(`[INFO]  Unique team ids after dedup: ${uniqueTeamIds.length}`);

   // ---------- Step 1: Find Teams ----------
   const teams = db.teams.find({ _id: { $in: uniqueTeamIds } }).toArray();

   if (!teams || teams.length === 0) {
      throw new Error(
         `No teams found for the given ids: ${JSON.stringify(uniqueTeamIds.map(String))}`
      );
   }
   print(`[INFO]  Teams found: ${teams.length}`);

   // Warn about any teams that were not located
   if (teams.length < uniqueTeamIds.length) {
      const found = new Set(teams.map(t => t._id.toString()));
      const missing = uniqueTeamIds.filter(id => !found.has(id.toString()));
      print(`[WARN]  ${missing.length} team id(s) not found in db.teams:`);
      missing.forEach(id => print(`        - ${id}`));
   }

   // ---------- Step 2: Find Group Points ----------
   const groupPoints = db.grouppoints
      .find({ team: { $in: uniqueTeamIds } })
      .sort({ _id: 1 })          // deterministic ordering
      .toArray();

   print(`[INFO]  Group points found: ${groupPoints.length}`);

   if (groupPoints.length === 0) {
      print("[INFO]  No group points to process. Exiting.");
      quit(0);
   }

   // ---------- Step 3: Identify Duplicates per Team ----------
   // Group group points by team. Keep the first one (oldest by _id),
   // mark the rest for deletion.
   const byTeam = {};
   groupPoints.forEach(gp => {
      const key = gp.team.toString();
      (byTeam[key] = byTeam[key] || []).push(gp);
   });

   const idsToDelete = [];
   Object.keys(byTeam).forEach(teamKey => {
      const list = byTeam[teamKey];
      if (list.length > 1) {
         print(`[WARN]  Team ${teamKey} has ${list.length} group points (expected 1). ` +
               `Keeping ${list[0]._id}, deleting ${list.length - 1} duplicate(s).`);
         list.slice(1).forEach(gp => idsToDelete.push(gp._id));
      }
   });

   if (idsToDelete.length === 0) {
      print("[INFO]  No duplicate group points detected. Nothing to delete.");
      quit(0);
   }

   print(`[INFO]  Group points marked for deletion: ${idsToDelete.length}`);

   // ---------- Step 4: Delete Related Relationships First ----------
   // IMPORTANT: Remove references in the relationships collection BEFORE
   // deleting the group points to avoid dangling references.
   const relField = "groupPoint"; // adjust if your schema uses a different field name

   const relDelete = db.relationships.deleteMany({
      [relField]: { $in: idsToDelete }
   });

   print(`[INFO]  Relationships deleted: ${relDelete.deletedCount}`);

   // ---------- Step 5: Delete the Duplicate Group Points ----------
   const gpDelete = db.grouppoints.deleteMany({
      _id: { $in: idsToDelete }
   });

   print(`[INFO]  Group points deleted: ${gpDelete.deletedCount}`);

   if (gpDelete.deletedCount !== idsToDelete.length) {
      print(`[WARN]  Mismatch: expected ${idsToDelete.length} deletions, got ${gpDelete.deletedCount}`);
   }

   // ---------- Final Summary ----------
   print("[DONE]  Cleanup completed successfully.");
   print(`        Teams processed           : ${teams.length}`);
   print(`        Group points found        : ${groupPoints.length}`);
   print(`        Group points deleted      : ${gpDelete.deletedCount}`);
   print(`        Relationships deleted     : ${relDelete.deletedCount}`);

} catch (err) {
   print(`[ERROR] ${err.message}`);
   if (err.stack) print(`[ERROR] Stack trace:\n${err.stack}`);
   quit(1);
}