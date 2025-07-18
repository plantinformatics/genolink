# Upload Sample ↔ Accession Mapping

This guide explains how to upload sample-to-accession mappings into the Genolink database.

---

## 1. CSV Template

The CSV file must include the following *headers*:

| Accession       | Sample                                |
|-----------------|---------------------------------------|
| AGG 4143 WHEA  | AGG4143WHEA1-B00003-1-02             |
| AGG 4681 WHEA  | AGG4681WHEA2-B00003-1-03             |

*Save this file in the `uploads/` folder of the backend.*

---

## 2. Upload via Node.js (Direct Server)

Run this command in the *backend root directory*:

node scripts/uploadSampleAccessions.js uploads/YOUR_FILE.csv

*Example:*
node scripts/uploadSampleAccessions.js uploads/sample_accessions.csv

---

## 3. Upload via Docker

If you are running Genolink via *Docker Compose*, use:

docker exec -it genolink_app_1 node scripts/uploadSampleAccessions.js uploads/YOUR_FILE.csv

*Example:*
docker exec -it genolink_app_1 node scripts/uploadSampleAccessions.js uploads/sample_accessions.csv


*Ensure the uploads/ directory on the host is mounted to the container using docker-compose.yml.*
