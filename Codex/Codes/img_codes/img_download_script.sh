#!/bin/bash

# Define an array of URLs
urls=(

"https://cdn.iospl.com/saurabh/NATURTINT/3N.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/4N.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/5N.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/4G.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/5GM.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/6G.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/5G.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/3NV.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/4M.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/4NC.PT05FK.jpg"
"https://cdn.iospl.com/saurabh/NATURTINT/1N.PT05FK.jpg"



    # Add all your URLs here
)

# Specify the folder path on the desktop
desktop_folder="$HOME/Desktop/bot"

# Create the destination folder if it doesn't exist
mkdir -p "$desktop_folder"

# Loop through each URL in the array
for url in "${urls[@]}"; do
    # Extract filename from URL
    filename=$(basename "$url")
    # Download the file using wget in the background
    wget "$url" -P "$desktop_folder" -O "$desktop_folder/$filename" &
done

# Wait for all background processes to finish
wait

# Notify user about the completion
echo "All files downloaded and saved to $desktop_folder"
