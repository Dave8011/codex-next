#!/bin/bash

# Define folder and file paths
FOLDER="$HOME/Desktop/Check_IMG_Missing"
INPUT_FILE="$FOLDER/image_list.csv"
CSV_FILE="$FOLDER/missing_images.csv"

# Create folder if it does not exist
mkdir -p "$FOLDER"

# Create output CSV with headers
echo "IMG Name,Product ID,Product Name" > "$CSV_FILE"

# Function to check image
check_image() {
    IMG_URL="$1"
    IMG_NAME="$2"
    PRODUCT_ID="$3"
    PRODUCT_NAME="$4"

    HTTP_STATUS=$(curl -o /dev/null --silent --head --write-out "%{http_code}" "$IMG_URL")

    if [ "$HTTP_STATUS" -ne 200 ]; then
        echo "\"$IMG_NAME\",\"$PRODUCT_ID\",\"$PRODUCT_NAME\"" >> "$CSV_FILE"
    fi
}

# Read the input CSV (skip header)
tail -n +2 "$INPUT_FILE" | while IFS=',' read -r IMG_URL IMG_NAME PRODUCT_ID PRODUCT_NAME; do
    check_image "$IMG_URL" "$IMG_NAME" "$PRODUCT_ID" "$PRODUCT_NAME"
done

echo "Check completed! Missing image details saved in: $CSV_FILE"
