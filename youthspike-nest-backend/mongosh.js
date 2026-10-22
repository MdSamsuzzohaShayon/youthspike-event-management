// Get all matches of this event 6a3c355236b002d89afc4a49
// find all teams of each match (there are teamA and teamB fields in all matches)
// Then check that both team of a match are in same group (there are groups array of string in each team)
// If multiple group match, then which group is inside this event, otherwise if one group match that pick that
// If they match then set match group to that event
// Then print those match with _id and group, previous and current, so I can make sure what has changed


// ============================================================
// Assign match groups based on team groups and event groups
// Compatible with mongosh
// ============================================================

// Configuration
let EVENT_ID = ObjectId("6a3c355236b002d89afc4a49");
let DRY_RUN = true; // Change to false after reviewing the logs

let matchesCollection = db.getCollection("matches");
let teamsCollection = db.getCollection("teams");
let eventsCollection = db.getCollection("events");

// Statistics
let totalMatches = 0;
let updatedMatches = 0;
let unchangedMatches = 0;
let skippedMatches = 0;
let failedMatches = 0;
let proposedUpdates = 0;

function logInfo(message, data) {
    print("[INFO] " + message);
    if (data) {
        printjson(data);
    }
}

function logWarning(message, data) {
    print("[WARN] " + message);
    if (data) {
        printjson(data);
    }
}

function logError(message, data) {
    print("[ERROR] " + message);
    if (data) {
        printjson(data);
    }
}

try {
    print("\n========== START ==========");
    print("Event ID: " + EVENT_ID);
    print("Dry run: " + DRY_RUN);

    // 1. Find the event
    let event = eventsCollection.findOne(
        { _id: EVENT_ID },
        { groups: 1 }
    );

    if (!event) {
        throw new Error("Event not found: " + EVENT_ID);
    }

    if (!Array.isArray(event.groups)) {
        throw new Error("Event groups must be an array.");
    }

    // Keep only valid, non-empty group strings.
    let eventGroups = [];

    event.groups.forEach(function (group) {
        if (
            typeof group === "string" &&
            group.length > 0 &&
            eventGroups.indexOf(group) === -1
        ) {
            eventGroups.push(group);
        }
    });

    logInfo("Event loaded", {
        eventId: event._id,
        groups: eventGroups
    });

    // 2. Find matches belonging to the event.
    // Change "event" if your schema uses another field name.
    let matches = matchesCollection.find({
        event: EVENT_ID
    }).toArray();

    totalMatches = matches.length;

    logInfo("Matches found", {
        totalMatches: totalMatches
    });

    // 3. Process each match
    matches.forEach(function (match) {
        try {
            if (!match.teamA || !match.teamB) {
                skippedMatches++;

                logWarning("Match is missing a team reference", {
                    matchId: match._id,
                    teamA: match.teamA || null,
                    teamB: match.teamB || null
                });

                return;
            }

            // 4. Find both teams
            let teamA = teamsCollection.findOne({
                _id: match.teamA
            });

            let teamB = teamsCollection.findOne({
                _id: match.teamB
            });

            if (!teamA || !teamB) {
                skippedMatches++;

                logWarning("Team not found", {
                    matchId: match._id,
                    teamAFound: !!teamA,
                    teamBFound: !!teamB
                });

                return;
            }

            if (
                !Array.isArray(teamA.groups) ||
                !Array.isArray(teamB.groups)
            ) {
                skippedMatches++;

                logWarning("Invalid team groups", {
                    matchId: match._id,
                    teamAId: teamA._id,
                    teamBId: teamB._id
                });

                return;
            }

            // 5. Find groups shared by both teams AND the event.
            let matchingGroups = [];

            teamA.groups.forEach(function (group) {
                if (
                    typeof group === "string" &&
                    teamB.groups.indexOf(group) !== -1 &&
                    eventGroups.indexOf(group) !== -1 &&
                    matchingGroups.indexOf(group) === -1
                ) {
                    matchingGroups.push(group);
                }
            });

            if (matchingGroups.length === 0) {
                skippedMatches++;

                logWarning("No matching event group", {
                    matchId: match._id,
                    teamAId: teamA._id,
                    teamBId: teamB._id,
                    teamAGroups: teamA.groups,
                    teamBGroups: teamB.groups
                });

                return;
            }

            // 6. Resolve the group.
            // If multiple groups match, use the first matching group
            // in the event's groups array.
            let selectedGroup = null;

            eventGroups.forEach(function (eventGroup) {
                if (
                    selectedGroup === null &&
                    matchingGroups.indexOf(eventGroup) !== -1
                ) {
                    selectedGroup = eventGroup;
                }
            });

            let previousGroup =
                typeof match.group === "undefined" ? null : match.group;

            if (previousGroup === selectedGroup) {
                unchangedMatches++;

                logInfo("Group already correct", {
                    matchId: match._id,
                    group: selectedGroup
                });

                return;
            }

            // 7. Log the change
            proposedUpdates++;

            logInfo(DRY_RUN ? "DRY RUN - Proposed change" : "Updating match", {
                matchId: match._id,
                previousGroup: previousGroup,
                currentGroup: selectedGroup,
                allMatchingGroups: matchingGroups
            });

            // 8. Update the match only when dry run is disabled
            if (!DRY_RUN) {
                let updateResult = matchesCollection.updateOne(
                    {
                        _id: match._id,
                        group: match.group
                    },
                    {
                        $set: {
                            group: selectedGroup
                        }
                    }
                );

                if (updateResult.modifiedCount === 1) {
                    updatedMatches++;

                    logInfo("Match updated successfully", {
                        matchId: match._id,
                        previousGroup: previousGroup,
                        currentGroup: selectedGroup
                    });
                } else {
                    failedMatches++;

                    logError("Match was not updated", {
                        matchId: match._id,
                        matchedCount: updateResult.matchedCount,
                        modifiedCount: updateResult.modifiedCount
                    });
                }
            }
        } catch (matchError) {
            failedMatches++;

            logError("Error processing match", {
                matchId: match._id,
                message: matchError.message
            });
        }
    });

    // 9. Final summary
    print("\n========== SUMMARY ==========");
    printjson({
        eventId: EVENT_ID,
        dryRun: DRY_RUN,
        totalMatches: totalMatches,
        proposedUpdates: proposedUpdates,
        updatedMatches: updatedMatches,
        unchangedMatches: unchangedMatches,
        skippedMatches: skippedMatches,
        failedMatches: failedMatches
    });

    print("=========== END =============");

} catch (error) {
    logError("Script aborted", {
        message: error.message
    });
}