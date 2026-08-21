const eventId = ObjectId("6a3c355236b002d89afc4a49");

const team = db.teams.findOne(
  { name: "Idaho Falls Freeze Minor B" },
  { _id: 1 }
);

if (!team) {
  throw new Error("Team not found: Idaho Falls Freeze Minor B");
}

// Add event to the team
db.teams.updateOne(
  { _id: team._id },
  {
    $addToSet: {
      events: eventId
    }
  }
);

// Add team to the event
db.events.updateOne(
  { _id: eventId },
  {
    $addToSet: {
      teams: team._id
    }
  }
);