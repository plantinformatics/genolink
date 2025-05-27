# Genolink Workflow

## 1. Filtering Mechanism for Passport Data

Genolink provides users with three primary filtering options:

- **Passport Data Filter:** Allows users to refine their search based on various passport descriptors, including:  
  - Date of collection  
  - Holding institute  
  - Crop type  
  - Taxonomic classification  
  - Geographical origin  
  - Biological status of the accession  
  - Type of germplasm storage  


<p align="center">
  <img src="./images/g1.png" alt="Passport Data Filter">
  <br>
  <em>Figure 1: Passport Data Filter</em>
</p>


- **Accession-Based Filter:** Users can input specific accession numbers in a text box, enabling direct retrieval of associated passport records.


<p align="center">
  <img src="./images/g2.png" alt="Accession-Based Filter">
  <br>
  <em>Figure 2: Accession-Based Filter</em>
</p>


- **GenotypeId-Based Filter:** Users can input specific genotype IDs in a text box, enabling direct retrieval of associated passport records.
  

<p align="center">
  <img src="./images/g3.png" alt="GenotypeId-Based Filter">
  <br>
  <em>Figure 3: GenotypeId-Based Filter</em>
</p>


By leveraging Genesys APIs, Genolink ensures accurate and up-to-date passport data retrieval while also incorporating an option to filter accessions based on the availability of genotypic data. Each record displays its genotype status, offering an integrated view of the dataset.


<p align="center">
  <img src="./images/g4.png" alt="Filtering Accessions by Genotype Availability">
  <br>
  <em>Figure 4: Filtering Accessions by Genotype Availability</em>
</p>


---

## 2. Linking Accessions to Genotypic Data

The genotype data associated with plant accessions is stored in Variant Call Format (VCF) files, which contain Genotype IDs as unique identifiers. To facilitate accession-genotype mapping, Genolink maintains a dedicated database table linking accessions to their corresponding Genotype IDs.

Users are required to upload a pre-formatted CSV template provided by Genolink to populate this mapping database. This step is crucial, as incomplete or incorrect mapping files will cause errors when querying genotype data. The tool ensures that only accessions with correctly linked Genotype IDs can be searched across different genomic platforms.


<p align="center">
  <img src="./images/g5.png" alt="Accession-Genotype Mapping Ensures Accurate Data Linkage">
  <br>
  <em>Figure 5: Accession-Genotype Mapping Ensures Accurate Data Linkage</em>
</p>


---

## 3. Searching for Genotypic Data

Once users apply the desired filters and obtain relevant passport data, they can proceed to search for associated genotype data within genomic databases such as Germinate and Gigwa.

Upon selecting a preferred genomic platform, Genolink cross-references the Genotype IDs and retrieves the available genotype data. If multiple datasets contain the required information, the tool presents a list of datasets, allowing users to select the most appropriate one for their analysis.


<p align="center">
  <img src="./images/g7.png" alt="Genolink Enables Seamless Genotype Data Retrieval">
  <br>
  <em>Figure 6: Genolink Enables Seamless Genotype Data Retrieval</em>
</p>


To refine their genotype data search, users can further filter results based on:  
- Specific chromosomes  
- Genomic positions  
- Variant IDs corresponding to particular genomic regions  

<p align="center">
  <img src="./images/g8.png" alt="Filtering Genotype Data by Chromosome and Position">
  <br>
  <em>Figure 7: Filtering Genotype Data by Chromosome and Position</em>
</p>


<p align="center">
  <img src="./images/g9.png" alt="Filtering Genotype Data by Variant ID">
  <br>
  <em>Figure 8: Filtering Genotype Data by Variant ID</em>
</p>


---

## 4. Data Export and Integration with External Platforms

Genolink provides users with the ability to export both passport and genotype data. Passport data can be exported in TSV format for further analysis, while genotype data can be downloaded as VCF files, preserving their original structure.


<p align="center">
  <img src="./images/g10.png" alt="Exporting Passport Data in TSV Format">
  <br>
  <em>Figure 9: Exporting Passport Data in TSV Format</em>
</p>


<p align="center">
  <img src="./images/g11.png" alt="Exporting Genotype Data in VCF Format">
  <br>
  <em>Figure 10: Exporting Genotype Data in VCF Format</em>
</p>


Additionally, Genolink features Breeding API (BrAPI)-compliant endpoints to facilitate integration with third-party applications. The most critical endpoints include:  
- Querying genotype data for a specific genomic position on a designated chromosome  

Furthermore, Genolink includes internal (non-BrAPI) endpoints, such as:  
- Retrieval of passport data for a given list of Genotype IDs or accession names  

These functionalities enable interoperability with external genomic databases and bioinformatics pipelines, enhancing the tool’s applicability in large-scale plant breeding and genomic studies.

---

## 5. Multiple Gigwa Servers Support

In some cases, selected accessions from the passport table belong to more than one Gigwa server. In these cases, Genolink identifies these servers and lists them for users. After providing credentials to log into these servers, users can see the search summary plus datasets on each server that include selected accessions or samples.

<p align="center">
  <img src="./images/g12.png" alt="Providing credentials for each server">
  <br>
  <em>Figure 11: Providing credentials for each server</em>
</p>


<p align="center">
  <img src="./images/g13.png" alt="Selecting datasets and Genotype filters">
  <br>
  <em>Figure 12: Selecting datasets and Genotype filters</em>
</p>

After selecting datasets and specifying regions, users can search for genotype data and export genotype data from each server by selecting the target server. In Genolink, genotype data from multiple servers is displayed together in the same table.


<p align="center">
  <img src="./images/g14.png" alt="Exporting Genotype data for the selected Gigwa server">
  <br>
  <em>Figure 13: Exporting Genotype data for the selected Gigwa server</em>
</p>
