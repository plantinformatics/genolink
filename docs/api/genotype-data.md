
# How to Get Genotype Data for Samples 

**Note:** The following are example requests demonstrating how to use the Genolink API endpoints to retrieve genotype data.

There are two main scenarios for retrieving genotype data for samples. The process involves sending a series of requests to specific API endpoints. Here’s an overview of how to proceed with each scenario. 

## Scenario 1: Users Know the Sample Names:
If the user knows the specific sample names for which they need to retrieve genotype data, the following steps must be followed: 

### 1.1 Get Sample Information: 
The user needs to send a `POST` request to the `/samplesDatasetInfo` endpoint, providing the sample names as an array in the request body. This request will return the `callSetDbIds` and `variantSetDbIds` (datasets that the sample belongs to). 
#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/samplesDatasetInfo 
``` 
#### Request Body: 
```json 
{
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "Samples": [
        "AGG422086BARL2-B00005-8-88",
        "AGG422088BARL2-B00005-9-09"
    ]
}
``` 
#### Response: 
```json 
[
    {
        "sampleName": "AGG422086BARL2-B00005-8-88-1-240806-Raw-MorexV3",
        "callSetDbId": "AGG_BARLEY§13006",
        "variantSetDbId": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422088BARL2-B00005-9-09-1-240806-Raw-MorexV3",
        "callSetDbId": "AGG_BARLEY§13007",
        "variantSetDbId": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422086BARL2-B00005-8-88-2-240806-FilledIn-MorexV3",
        "callSetDbId": "AGG_BARLEY§26995",
        "variantSetDbId": [
            "AGG_BARLEY§2§240806-FilledIn-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422088BARL2-B00005-9-09-2-240806-FilledIn-MorexV3",
        "callSetDbId": "AGG_BARLEY§26996",
        "variantSetDbId": [
            "AGG_BARLEY§2§240806-FilledIn-MorexV3"
        ]
    }
]
 ``` 

### 1.2 Get Genotype Data:
Once the `callSetDbIds` and `variantSetDbIds` are obtained, send a `POST` request to the `/allelematrix` endpoint to retrieve the genotype data. 
#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/brapi/v2/search/allelematrix 
``` 
#### Request Body: 
```json 
{
    "callSetDbIds": [
        "AGG_BARLEY§26995",
        "AGG_BARLEY§26996"
    ],
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "variantSetDbIds": [
        "AGG_BARLEY§2§240806-FilledIn-MorexV3"
    ]
}
``` 
#### Response: 
```json 
{
    "metadata": {
        "status": [
            {}
        ]
    },
    "result": {
        "callSetDbIds": [
            "AGG_BARLEY§26995",
            "AGG_BARLEY§26996"
        ],
        "dataMatrices": [
            {
                "dataMatrix": [
                    [
                        "0",
                        "1"
                    ],
                    [
                        "0",
                        "0"
                    ],
                    [
                        "0",
                        "0|1"
                    ],
                    [
                        "1",
                        "1"
                    ]
                ]
            }
        ]
    }
}
```

## Scenario 2: Users may not know the sample names, only the accession numbers
If the user knows the specific accession numbers for which they need to retrieve genotype data, the following steps must be followed: 

### 2.1 Get Sample Information: 
The user needs to send a `POST` request to the `/samplesDatasetInfo` endpoint, providing the accession numbers as an array in the request body. This request will return the `callSetDbIds` and `variantSetDbIds` (datasets that the samples belongs to). 
#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/samplesDatasetInfo 
``` 
#### Request Body: 
```json 
{
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "Accessions": [
        "AGG 422086 BARL",
        "AGG 422088 BARL"
    ]
}
```
OR
```json 
{
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "Accessions": [
        {
            "Accession": "AGG 422086 BARL",
        },
        {
            "Accession": "AGG 422088 BARL",
        }
    ]
}
```
#### Response: 
```json 
[
    {
        "sampleName": "AGG422086BARL2-B00005-8-88-1-240806-Raw-MorexV3",
        "callSetDbId": "AGG_BARLEY§13006",
        "variantSetDbId": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422088BARL2-B00005-9-09-1-240806-Raw-MorexV3",
        "callSetDbId": "AGG_BARLEY§13007",
        "variantSetDbId": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422086BARL2-B00005-8-88-2-240806-FilledIn-MorexV3",
        "callSetDbId": "AGG_BARLEY§26995",
        "variantSetDbId": [
            "AGG_BARLEY§2§240806-FilledIn-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422088BARL2-B00005-9-09-2-240806-FilledIn-MorexV3",
        "callSetDbId": "AGG_BARLEY§26996",
        "variantSetDbId": [
            "AGG_BARLEY§2§240806-FilledIn-MorexV3"
        ]
    }
]
```

### 2.2 Get Genotype Data:
Once the `callSetDbIds` and `variantSetDbIds` are obtained, send a `POST` request to the `/allelematrix` endpoint to retrieve the genotype data. 
#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/brapi/v2/search/allelematrix 
``` 
#### Request Body: 
```json 
{
    "callSetDbIds": [
        "AGG_BARLEY§13006",
        "AGG_BARLEY§13007"
    ],
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "variantSetDbIds": [
        "AGG_BARLEY§1§240806-Raw-MorexV3"
    ]
}
``` 
#### Response: 
```json 
{
    "metadata": {
        "status": [
            {}
        ]
    },
    "result": {
        "callSetDbIds": [
            "AGG_BARLEY§13006",
            "AGG_BARLEY§13007"
        ],
        "dataMatrices": [
            {
                "dataMatrix": [
                    [
                        "0",
                        "1"
                    ],
                    [
                        "0",
                        "0"
                    ],
                    [
                        "0",
                        "."
                    ],
                    [
                        "1",
                        "1"
                    ]
                ]
            }
        ]
    }
}
```

## Scenario 3: Users Don’t Know the Sample Names and Accession Numbers
If the user does not know the sample names and needs to search for them using filters, follow these steps: 

### 3.1 Search for Samples: 
The user must first use the `/passportQuery` endpoint to search for samples using filters like accession, institute, date range, crop, and country of origin. 
#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/genesys/passportQuery 
``` 
#### Request Body: 
```json 
{
    "_text": "",
    "institute": [
        "AUS165"
    ],
    "startCreatedDate": "1987-01-01T00:00:00Z",
    "endCreatedDate": "2020-01-01T00:00:00Z",
    "crop": [
        "barley"
    ],
    "taxonomy": [
        "Hordeum"
    ],
    "countryOfOrigin": [
        "USA",
        "AUS"
    ],
    "sampStat": [
        "100",
        "110",
        "120",
        "130"
    ]
}
``` 
#### Response: 
```json 
{
    "Samples": [
        {
            "Accession": "AGG 422086 BARL",
            "Sample": "AGG422086BARL2-B00005-8-88"
        },
        {
            "Accession": "AGG 422088 BARL",
            "Sample": "AGG422088BARL2-B00005-9-09"
        },
        {
            "Accession": "AGG 422092 BARL",
            "Sample": "AGG422092BARL2-B00005-9-41"
        },
        {
            "Accession": "AGG 422093 BARL",
            "Sample": "AGG422093BARL2-B00005-9-49"
        },
        {
            "Accession": "AGG 422095 BARL",
            "Sample": "AGG422095BARL2-B00005-9-65"
        }
    ]
}
``` 
**Note:** you can find all possible values for filters by sending the following request 
```bash 
GET https://genolink.plantinformatics.io/api/genesys/passportFilter/possibleValues 
```

### 3.2 Get Sample Information: 
After obtaining the sample names, send a `POST` request to the `/samplesDatasetInfo` endpoint to get the `callSetDbIds` and `variantSetDbIds` for each sample. 
#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/samplesDatasetInfo 
``` 
#### Request Body: 
```json 
{
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "Samples": [
        {
            "Accession": "AGG 422086 BARL",
            "Sample": "AGG422086BARL2-B00005-8-88"
        },
        {
            "Accession": "AGG 422088 BARL",
            "Sample": "AGG422088BARL2-B00005-9-09"
        }
    ]
}
``` 
#### Response: 
```json 
[
    {
        "sampleName": "AGG422086BARL2-B00005-8-88-1-240806-Raw-MorexV3",
        "callSetDbId": "AGG_BARLEY§13006",
        "variantSetDbId": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422088BARL2-B00005-9-09-1-240806-Raw-MorexV3",
        "callSetDbId": "AGG_BARLEY§13007",
        "variantSetDbId": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422086BARL2-B00005-8-88-2-240806-FilledIn-MorexV3",
        "callSetDbId": "AGG_BARLEY§26995",
        "variantSetDbId": [
            "AGG_BARLEY§2§240806-FilledIn-MorexV3"
        ]
    },
    {
        "sampleName": "AGG422088BARL2-B00005-9-09-2-240806-FilledIn-MorexV3",
        "callSetDbId": "AGG_BARLEY§26996",
        "variantSetDbId": [
            "AGG_BARLEY§2§240806-FilledIn-MorexV3"
        ]
    }
]
```

### 3.3 Get Genotype Data: 
Finally, after obtaining the necessary dataset information, send a `POST` request to the `/allelematrix` endpoint to retrieve the genotype data. 
#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/brapi/v2/search/allelematrix 
``` 
#### Request Body: 
```json 
{
    "callSetDbIds": [
        "AGG_BARLEY§13006",
        "AGG_BARLEY§13007"
    ],
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "variantSetDbIds": [
        "AGG_BARLEY§1§240806-Raw-MorexV3"
    ]
}
``` 
#### Response: 
```json 
{
    "metadata": {
        "status": [
            {}
        ]
    },
    "result": {
        "callSetDbIds": [
            "AGG_BARLEY§13006",
            "AGG_BARLEY§13007"
        ],
        "dataMatrices": [
            {
                "dataMatrix": [
                    [
                        "0",
                        "1"
                    ],
                    [
                        "0",
                        "0"
                    ],
                    [
                        "0",
                        "."
                    ]
                ]
            }
        ]
    }
}
```
---

**Note:** If you want to filter genotype data by specific variants you need to do the following steps:

1_ fetch the list of variantDbIds by sending a request to the following URL:

#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/brapi/v2/search/variants
``` 
#### Request Body: 
```json 
{
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "start": 1,
    "end": 70000,
        "variantSetDbIds": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
}
``` 
#### Response: 
```json 
{
    "metadata": {
        "status": [
            {
                "message": "Returned variant positions are based on referenceSetDbId AGG_BARLEY§1§0",
                "messageType": "INFO"
            }
        ],
        "pagination": {
            "pageSize": 10000,
            "totalCount": 1,
            "currentPageToken": "0",
            "nextPageToken": "1"
        }
    },
    "result": {
        "data": [
            {
                "additionalInfo": {
                    "AC": 208,
                    "MAF": 0.00746805,
                    "qual": 100,
                    "AN": 27852
                },
                "alternateBases": [
                    "T"
                ],
                "end": 61162,
                "referenceBases": "C",
                "referenceDbId": "AGG_BARLEY§1§0§chr2H",
                "referenceName": "chr2H",
                "referenceSetDbId": "AGG_BARLEY§1§0",
                "start": 61162,
                "variantDbId": "AGG_BARLEY§AVRIG01436",
                "variantNames": [
                    "AVRIG01436"
                ],
                "variantType": "SNP"
            }
        ]
    }
}
```

2_ after extracting variantDbIds you can add them to the body of the request to /allelematrix endpoint like:

#### Request: 
```bash 
POST https://genolink.plantinformatics.io/api/gigwa/brapi/v2/search/allelematrix
``` 
#### Request Body: 
```json 
{
    "callSetDbIds": [
        "AGG_BARLEY§13006",
        "AGG_BARLEY§13007"
    ],
    "selectedGigwaServer": "https://gigwa.plantinformatics.io",
    "variantSetDbIds": [
        "AGG_BARLEY§1§240806-Raw-MorexV3"
    ],
    "variantDbIds": ["AGG_BARLEY§AVRIG01436"]
}
``` 
#### Response: 
```json 
{
    "metadata": {
        "status": [
            {}
        ]
    },
    "result": {
        "callSetDbIds": [
            "AGG_BARLEY§13006",
            "AGG_BARLEY§13007"
        ],
        "dataMatrices": [
            {
                "dataMatrix": [
                    [
                        "0",
                        "0"
                    ]
                ],
                "dataMatrixAbbreviation": "GT",
                "dataMatrixName": "Genotype",
                "dataType": "string"
            }
        ],
        "pagination": [
            {
                "dimension": "VARIANTS",
                "page": 0,
                "pageSize": 1000,
                "totalCount": 1,
                "totalPages": 1
            },
            {
                "dimension": "CALLSETS",
                "page": 0,
                "pageSize": 10000,
                "totalCount": 2,
                "totalPages": 1
            }
        ],
        "sepPhased": "|",
        "sepUnphased": "/",
        "unknownString": ".",
        "variantDbIds": [
            "AGG_BARLEY§AVRIG01436"
        ],
        "variantSetDbIds": [
            "AGG_BARLEY§1§240806-Raw-MorexV3"
        ]
    }
}
 ``` 

