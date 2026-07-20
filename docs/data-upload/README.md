# Data Upload Guides for Genolink

This section provides instructions for uploading mapping files to the Genolink backend. Two types of mappings are supported:

1. **Sample (Genotype ID) ↔ Accession Mapping**

   Use `uploadSampleAccessions.js` to insert mappings, including their genotype status and optional Gigwa server URL. Use `updateSampleAccessionsFromCSV.js` to update existing mappings; it supports a dry-run preview.

2. **Accession ↔ FIG Mapping**

   Use `uploadAccessionFigs.js` to upload a CSV file mapping accession numbers to FIG names.

The scripts can be executed in two ways:

- **Direct Server Execution** (Node.js environment)
- **Docker Container Execution** (if running inside Docker)

---

### Quick links

- [Upload and update Sample (Genotype ID) ↔ Accession mappings](./upload-sample-accessions.md)
- [Upload Accession ↔ FIG Mapping](./upload-accession-figs.md)
