# Upload Accession ↔ FIG Mapping

This guide explains how to upload **accession-to-fig** mappings into the Genolink database.

---

## 1. CSV Template

The CSV file must include the following *headers*:

| accession       | fig              |
|-----------------|------------------|
| AGG 40824 CHIC    | Ascochyta Blight |
| AGG 40824 CHIC    | Virus           |

Save this file in the `/back/uploads/` folder.

---

## 2. Upload via Node.js (Direct Server)

Run this command in the */back* directory:

```bash
node scripts/uploadAccessionFigs.js uploads/YOUR_FILE.csv
```
Example:
```bash
node scripts/uploadAccessionFigs.js uploads/accession_figs.csv
```

---

## 3. Upload via Docker
If you are running Genolink via Docker Compose, use:

```bash
docker exec -it genolink_app_1 node scripts/uploadAccessionFigs.js uploads/YOUR_FILE.csv
```
Example:

```bash
docker exec -it genolink_app_1 node scripts/uploadAccessionFigs.js uploads/accession_figs.csv
```
