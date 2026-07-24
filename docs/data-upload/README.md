# Data Upload Guides for Genolink

This section provides instructions for uploading sample mappings to the Genolink backend:

1. **Sample (Genotype ID) ↔ Accession Mapping**

   Use `uploadSampleAccessions.js` to insert mappings, including their genotype status and optional Gigwa server URL. Use `updateSampleAccessionsFromCSV.js` to update existing mappings; it supports a dry-run preview.

The scripts can be executed in two ways:

- **Direct Server Execution** (Node.js environment)
- **Docker Container Execution** (if running inside Docker)

---

### Quick links

- [Upload and update Sample (Genotype ID) ↔ Accession mappings](./upload-sample-accessions.md)
