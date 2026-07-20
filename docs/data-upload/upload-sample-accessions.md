# Upload Sample (Genotype ID) ↔ Accession Mappings

This guide explains how to insert and update sample-to-accession mappings in the Genolink database.

## CSV format

The header names are case-sensitive and must use the following spelling:

| Header | Required | Description |
| --- | --- | --- |
| `accession` | Yes | Accession number. Rows without an accession are skipped. |
| `sample` | No | Sample/genotype ID. A blank value is stored as `NULL`. |
| `status` | Yes | One of `Completed`, `Pending`, `Excluded`, or `TBC`. The upload script requires the exact capitalization shown. |
| `serverUrl` | No | URL of the Gigwa server containing the sample. A blank value is stored as `NULL`. |

Example:

```csv
accession,sample,status,serverUrl
AGG 4143 WHEA,AGG4143WHEA1-B00003-1-02,Completed,https://gigwa.example.org
AGG 4681 WHEA,AGG4681WHEA2-B00003-1-03,Pending,https://gigwa.example.org
AGG 5000 WHEA,,TBC,
```

Only mappings whose status is `Completed` are returned when Genolink maps accessions to genotype IDs. `ServerUrl` is used to associate accessions with the Gigwa server on which their genotype data is stored.

Save the CSV file in `back/uploads/`, or provide another path that is readable by the process running the script.

## Insert mappings

From the `back` directory, run:

```bash
node scripts/uploadSampleAccessions.js uploads/YOUR_FILE.csv
```

For example:

```bash
node scripts/uploadSampleAccessions.js uploads/sample_accessions.csv
```

Rows with a missing accession or an invalid status are skipped. Existing `(accession, sample)` pairs are not inserted again.

## Update existing mappings

Use the update script to change the sample, status, or server URL of existing accessions:

```bash
node scripts/updateSampleAccessionsFromCSV.js uploads/YOUR_FILE.csv --dry
node scripts/updateSampleAccessionsFromCSV.js uploads/YOUR_FILE.csv
```

Run with `--dry` first to preview changes without writing to the database. The update script:

- updates existing accessions only; it does not insert accessions that are not already in the database;
- treats status values case-insensitively but accepts only the four statuses listed above;
- uses the last CSV row when an accession appears more than once; and
- changes `ServerUrl` only when the CSV contains a `serverUrl` column. If that column exists but its value is blank, the stored URL is cleared.

## Run with Docker

If Genolink is running with Docker Compose, run the scripts inside the application container:

```bash
docker exec -it genolink_app_1 node scripts/uploadSampleAccessions.js uploads/YOUR_FILE.csv
docker exec -it genolink_app_1 node scripts/updateSampleAccessionsFromCSV.js uploads/YOUR_FILE.csv --dry
docker exec -it genolink_app_1 node scripts/updateSampleAccessionsFromCSV.js uploads/YOUR_FILE.csv
```

Replace `genolink_app_1` if your application container has a different name.
