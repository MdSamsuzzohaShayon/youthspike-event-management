#!/bin/bash

# ================================================================
#  MongoDB Backup Script with Optional Google Drive Upload
# ================================================================

# -------------------------------
#  Define colors for output
# -------------------------------
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
CYAN='\033[1;36m'
NC='\033[0m' # No color

# -------------------------------
#  Define variables
# -------------------------------
DB_NAME="spikeball-matches"    # Change this to your MongoDB database name
BACKUP_DIR="db-backup"         # Local directory to store MongoDB dump
TAR_FILE="spikeball_backup_$(date +"%Y%m%d_%H%M%S").tar.gz"  # Tarball filename
FOLDER_ID="1oFkxjoRQ4V1FLJauAM82h_piKCDpayEY"                # Google Drive folder ID
FOLDER_NAME="$BACKUP_DIR"      # Reuse BACKUP_DIR for clarity

# ================================================================
#  Step 1: Cleanup old backups (optional)
# ================================================================
echo -e "${CYAN}Cleaning up old backups...${NC}"
rm -rf "$BACKUP_DIR" "$TAR_FILE"

# ================================================================
#  Step 2: Backup MongoDB Database
# ================================================================
echo -e "${CYAN}Backing up MongoDB database '$DB_NAME'...${NC}"
mkdir -p "$FOLDER_NAME"
mongodump --db "$DB_NAME" --out "./$FOLDER_NAME"
ls -la "./${FOLDER_NAME}/${DB_NAME}" || echo -e "${YELLOW}Warning: Backup folder might be empty!${NC}"
echo -e "${GREEN}Database backup completed.${NC}"

# ================================================================
#  Step 3: Ask if user wants to upload to Google Drive
# ================================================================
read -p "Do you want to upload the backup to Google Drive? (Y/N): " SAVE_TO_GDRIVE
SAVE_TO_GDRIVE=${SAVE_TO_GDRIVE^^}  # Convert to uppercase

if [[ "$SAVE_TO_GDRIVE" == "Y" ]]; then
  echo -e "\n${CYAN}================ Google Drive Upload Instructions ================${NC}"
  echo -e "# 1. Go to: ${YELLOW}https://developers.google.com/oauthplayground/${NC}"
  echo -e "# 2. Under 'Select & authorize APIs', choose: ${YELLOW}https://www.googleapis.com/auth/drive.file${NC}"
  echo -e "# 3. Click 'Authorize APIs' → 'Exchange authorization code for tokens'."
  echo -e "# 4. Copy the 'Access Token' value (starts with ya29...)."
  echo -e "${CYAN}=================================================================${NC}\n"

  read -p "Paste your Google Drive Access Token here: " ACCESS_TOKEN

  if [[ -z "$ACCESS_TOKEN" ]]; then
    echo -e "${RED}Error: No access token provided. Skipping upload.${NC}"
    exit 1
  fi

  echo -e "${CYAN}Creating tarball of the backup folder...${NC}"
  tar -czf "$TAR_FILE" "$BACKUP_DIR"
  if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to create tarball of the backup folder!${NC}"
      exit 1
  fi

  echo -e "${CYAN}Uploading to Google Drive...${NC}"

  # Prepare metadata JSON
  if [[ -n "$FOLDER_ID" ]]; then
      METADATA="{\"name\": \"$(basename $TAR_FILE)\", \"parents\": [\"$FOLDER_ID\"]}"
  else
      METADATA="{\"name\": \"$(basename $TAR_FILE)\"}"
  fi

  # Upload file using curl
  UPLOAD_RESPONSE=$(curl -s -X POST -L \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "metadata=$METADATA;type=application/json" \
    -F "file=@$TAR_FILE;type=application/gzip" \
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")

  if echo "$UPLOAD_RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Database backup successfully uploaded to Google Drive.${NC}"
  else
    echo -e "${RED}❌ Upload failed. Response:${NC}"
    echo "$UPLOAD_RESPONSE"
  fi

  # Step 4: Cleanup local files
  echo -e "${CYAN}Cleaning up local backup files...${NC}"
  rm -rf "$BACKUP_DIR" "$TAR_FILE"

else
  echo -e "${YELLOW}Skipping Google Drive upload.${NC}"
fi

# ================================================================
#  End of script
# ================================================================
echo -e "${GREEN}🎉 Backup process completed!${NC}"
