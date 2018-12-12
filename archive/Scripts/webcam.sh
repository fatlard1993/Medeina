#!/bin/bash

DATE=$(date +"%Y-%m-%d_%H%M")

fswebcam -r 1280x720 -S 2 --no-banner /home/pi/node/public/images/$DATE.jpg

exit 210
