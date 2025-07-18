# Data Upload Guides for Genolink

This section provides step-by-step instructions for uploading mapping files to the Genolink backend. Two types of mappings are supported:

1. **Sample(GenotypeID) ↔ Accession Mapping**  
   Use `uploadSampleAccessions.js` to upload a CSV file mapping sample IDs to accession numbers.

2. **Accession ↔ FIG Mapping**  
   Use `uploadAccessionFigs.js` to upload a CSV file mapping accession numbers to FIG names.

Both scripts can be executed in two ways:
- **Direct Server Execution** (Node.js environment)
- **Docker Container Execution** (if running inside Docker)

---

### Quick Links:
- [Upload Sample ↔ Accession Mapping](./upload-sample-accessions.md)
- [Upload Accession ↔ FIG Mapping](./upload-accession-figs.md)
