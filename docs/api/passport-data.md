# Passport Data Retrieval API

This API endpoint allows users to retrieve passport data from Genesys using either:
- A list of `accessionNumbers`
- A list of `genotypeIds`
- Or both

---

## Endpoint

**URL:**  
`/api/genesys/accession/query`  
(e.g., `https://genolink.plantinformatics.io/api/genesys/accession/query`)

**Method:**  
`POST`

**Content-Type:**  
`application/json`

---

## Request Body

| Field           | Type     | Required | Description                                                              |
|----------------|----------|----------|--------------------------------------------------------------------------|
| accessionNumbers | Array of strings | Optional | A list of accession numbers (e.g., "AGG 240 WHEA")                     |
| genotypeIds      | Array of strings | Optional | A list of genotype IDs (e.g., "AGG240WHEA2-B00003-1-09")              |

---

## Example Requests

### Example 1: Using Only `genotypeIds`

```json
{
  "genotypeIds": ["AGG240WHEA2-B00003-1-09", "AGG5259WHEA1-B00003-1-06"]
}
```
### Example 2: Using Only `accessionNumbers`

```json
{
  "accessionNumbers": ["AGG 1 WHEA", "AGG 480 WHEA"]
}
```
### Example 3: Using Both `genotypeIds` and `accessionNumbers`

```json
{
  "accessionNumbers": ["AGG 1 WHEA", "AGG 480 WHEA"],
  "genotypeIds": ["AGG240WHEA2-B00003-1-09"]
}
```
