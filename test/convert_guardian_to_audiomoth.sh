#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

DIRECTORY_FILEPATH=$1;
DEPLOY_ID=$2

FILE_COUNT=0;
FILE_CONVERT_COUNT=0;

VOLT="4.2"
TEMP="19.6"
DEVICE_ID="2495F303562DE118"

for FILEPATH_ORIG in $DIRECTORY_FILEPATH/*; do

	FILENAME_ORIG=$(basename -- "$FILEPATH_ORIG")
	EXTENSION_ORIG=$(echo $FILENAME_ORIG | rev | cut -d'.' -f 1 | rev | tr '[:upper:]' '[:lower:]')
	
	if [ -f $FILEPATH_ORIG ] ; then FILE_COUNT=$((FILE_COUNT+1)); fi;

	if [ "$EXTENSION_ORIG" = "opus" ]; then 

		YR="${FILENAME_ORIG:13:4}"
		MO="${FILENAME_ORIG:18:2}"
		DY="${FILENAME_ORIG:21:2}"
		HR="${FILENAME_ORIG:24:2}"
		MN="${FILENAME_ORIG:27:2}"
		SC="${FILENAME_ORIG:30:2}"

		FILENAME_MOTH="${YR}${MO}${DY}_${HR}${MN}${SC}.WAV";
		FILEPATH_MOTH="${DIRECTORY_FILEPATH}/${YR}${MO}${DY}_${HR}${MN}${SC}.WAV";

		META_DATETIME="${HR}:${MN}:${SC} ${DY}/${MO}/${YR} (UTC)";
		META_ARTIST="AudioMoth ${DEVICE_ID}";
		META_COMMENT="Recorded at ${META_DATETIME} during deployment ${DEPLOY_ID} at medium gain setting while battery state was ${VOLT}V and temperature was ${TEMP}C.";

		EXEC_CONVERT_TO_WAV=$(ffmpeg -i "$FILEPATH_ORIG" -loglevel panic -ar 48000 -ac 1 -c:a pcm_s16le -flags +bitexact -map_metadata 0 -id3v2_version 3 -write_id3v1 1 -metadata artist="${META_ARTIST}" -metadata comment="${META_COMMENT}" "$FILEPATH_MOTH")

		if [ -f $FILEPATH_MOTH ] ; then FILE_CONVERT_COUNT=$((FILE_CONVERT_COUNT+1)); rm $FILEPATH_ORIG; fi;
		echo "${FILE_CONVERT_COUNT}) ${FILENAME_ORIG} - ${FILEPATH_MOTH}"
	fi

done

echo "-----";
echo "COUNT: $FILE_CONVERT_COUNT out of $FILE_COUNT total";

