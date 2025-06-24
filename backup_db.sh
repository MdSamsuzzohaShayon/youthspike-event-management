#!/bin/bash

# Define variables
DB_NAME="spikeball-matches"   # Change this to your database name
BACKUP_DIR="dbbackup"         # Directory where MongoDB dump is stored
TAR_FILE="spikeball_backup_$(date +"%Y%m%d_%H%M%S").tar.gz"  # Tar file name
FOLDER_ID="1oFkxjoRQ4V1FLJauAM82h_piKCDpayEY"

# To get access token
# Go here -> https://developers.google.com/oauthplayground/
# Put this -> https://www.googleapis.com/auth/drive.file -> Authorize APIs
ACCESS_TOKEN="ya29.a0AXeO80QsDgjTcOOcKkvi00OhlhvnN3utXhmC2j-AQ2SDVqDjaVJ5MrDIoC-rbWXXxnhF8waQLrlRQns-bhmXyRM49hXLlZtJH9giJWDhzZ4FZfczVkJmyVfu5p7fFRHbrrbh0l92QVV4aMY9v98d2cdc5lvGUjzzykkcIs2saCgYKAdESARASFQHGX2MiSZ_q_kS3alFe9HQ9Ub96Lg0175"

# Step 1: Remove previous backups (optional)
echo "Cleaning up old backups..."
rm -rf "$BACKUP_DIR" "$TAR_FILE"

# Step 2: Dump MongoDB database
echo "Dumping MongoDB database: $DB_NAME..."
mongodump --db "$DB_NAME" --out "$BACKUP_DIR"
if [ $? -ne 0 ]; then
    echo "MongoDB dump failed!"
    exit 1
fi

# Step 3: Tar the backup folder
echo "Creating tarball of the backup folder..."
tar -czf "$TAR_FILE" "$BACKUP_DIR"
if [ $? -ne 0 ]; then
    echo "Failed to create tarball of the backup folder!"
    exit 1
fi

# Step 4: Upload to Google Drive using API key
echo "Uploading to Google Drive..."

# Create a metadata JSON for the file upload
# Create JSON metadata
if [[ -n "$FOLDER_ID" ]]; then
    METADATA="{\"name\": \"$(basename $TAR_FILE)\", \"parents\": [\"$FOLDER_ID\"]}"
else
    METADATA="{\"name\": \"$(basename $TAR_FILE)\"}"
fi

# Make the `curl` request to upload the file
UPLOAD_RESPONSE=$(curl -X POST -L \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "metadata=$METADATA;type=application/json" \
  -F "file=@$TAR_FILE;type=application/gzip" \
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")

# Output the response
echo "Upload Response: $UPLOAD_RESPONSE"

# Step 5: Clean up
echo "Cleaning up local backup files..."
rm -rf "$BACKUP_DIR" "$TAR_FILE"

echo "Backup and upload process completed!"
