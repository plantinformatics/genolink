import React, { useState } from "react";

const GenotypeSearchResultsTable = ({
  data,
  alleles,
  currentPage,
  setCurrentPage,
  samples,
  platform,
}) => {
  const itemsPerPage = 1000;
  let totalPages;
  let genotypeMap = {};
  const [sortedData, setSortedData] = useState(data.variants || []);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  if (platform === "Gigwa" && alleles && alleles.result && alleles.result.dataMatrices) {
    totalPages = Math.ceil(data.count / itemsPerPage);
    // const callSetDbIds = alleles.result.callSetDbIds; // Sample IDs
    const dataMatrix = alleles.result.dataMatrices[0].dataMatrix; // Genotype data for each variant
    // Populate genotypeMap from alleles
    dataMatrix.forEach((genotypes, variantIndex) => {
      genotypes.forEach((genotype, sampleIndex) => {
        const sampleId = samples[sampleIndex]; // Extract sample ID
        if (!genotypeMap[sampleId]) {
          genotypeMap[sampleId] = [];
        }
        genotypeMap[sampleId][variantIndex] = genotype; // Store genotype by variant index
      });
    });
  } else if (platform == "Germinate") {
    totalPages = Math.ceil(data[0].result.data.length / itemsPerPage);
  }

  const maxPageNumbersToShow = 3;

  const CHROMConverter = (CHROM) => {
    const mapping = {
      1: "chr1A",
      2: "chr1B",
      3: "chr1D",
      4: "chr2A",
      5: "chr2B",
      6: "chr2D",
      7: "chr3A",
      8: "chr3B",
      9: "chr3D",
      10: "chr4A",
      11: "chr4B",
      12: "chr4D",
      13: "chr5A",
      14: "chr5B",
      15: "chr5D",
      16: "chr6A",
      17: "chr6B",
      18: "chr6D",
      19: "chr7A",
      20: "chr7B",
      21: "chr7D",
    };
    return mapping[CHROM] || null;
  };

  const getVisiblePages = () => {
    let startPage = Math.max(
      currentPage - Math.floor(maxPageNumbersToShow / 2),
      1
    );
    let endPage = startPage + maxPageNumbersToShow - 1;

    if (endPage > totalPages) {
      endPage = startPage = totalPages;
    }

    return [...Array(endPage - startPage + 1)].map((_, idx) => startPage + idx);
  };

  const handleSort = (columnKey) => {
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedArray = [...sortedData].sort((a, b) => {
      if (a[columnKey] < b[columnKey]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[columnKey] > b[columnKey]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setSortedData(sortedArray);
    setSortConfig({ key: columnKey, direction });
  };

  return (
    <div>
      <div className="scrollable-table">
        {platform === 'Gigwa' ? (
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th className="vertical-header" onClick={() => handleSort('index')}>#</th>
                <th className="vertical-header" onClick={() => handleSort('referenceName')}>CHROM</th>
                <th className="vertical-header" onClick={() => handleSort('start')}>POS</th>
                <th className="vertical-header" onClick={() => handleSort('id')}>ID</th>
                <th className="vertical-header" onClick={() => handleSort('referenceBases')}>REF</th>
                <th className="vertical-header" onClick={() => handleSort('alternateBases')}>ALT</th>
                {samples.map((sample) => (
                  <th className="vertical-header" key={sample}>
                    {sample}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData &&
                sortedData.map((item, variantIndex) => (
                  <tr key={variantIndex}>
                    <td>{variantIndex + 1 + (currentPage - 1) * itemsPerPage}</td>
                    <td>{item.referenceName}</td>
                    <td>{item.start}</td>
                    <td>{item.id.split('§')[2]}</td>
                    <td>{item.referenceBases}</td>
                    <td>{item.alternateBases[0]}</td>
                    {samples.map((sample) => (
                      <td key={sample}>
                        {genotypeMap[sample]?.length > 0 ? (
                          <>
                            {genotypeMap[sample][variantIndex] === "."
                              ? "."
                              : genotypeMap[sample][variantIndex] === "0"
                                ? "0/0"
                                : genotypeMap[sample][variantIndex] === "1"
                                  ? "1/1"
                                  : genotypeMap[sample][variantIndex]}
                          </>
                        ) : (
                          ''
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        ) : platform === 'Germinate' ? (
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th className="vertical-header" onClick={() => handleSort('index')}>#</th>
                <th className="vertical-header" onClick={() => handleSort('variantName.split("§")[2]')}>CHROM</th>
                <th className="vertical-header" onClick={() => handleSort('variantName.split("§")[1]')}>POS</th>
                <th className="vertical-header" onClick={() => handleSort('variantName.split("§")[0]')}>ID</th>
                {samples.map((sample) => (
                  <th className="vertical-header" key={sample}>
                    {sample}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data &&
                sortedData
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((item, index1) => (
                    <tr key={index1}>
                      <td>{index1 + 1 + (currentPage - 1) * itemsPerPage}</td>
                      <td>{CHROMConverter(item.variantName.split('§')[2])}</td>
                      <td>{item.variantName.split('§')[1]}</td>
                      <td>{item.variantName.split('§')[0]}</td>
                      {samples.map((sample, index2) => (
                        <td key={index2}>
                          {data[index2].result.data[index1].genotypeValue}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        ) : null}
      </div>
      <div className="d-flex">
        <button
          className="btn btn-primary mr-1"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          First
        </button>
        <button
          className="btn btn-primary mr-1"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        {getVisiblePages().map((page) => (
          <button
            key={page}
            className={`btn btn-primary mr-1 ${currentPage === page ? 'active' : ''
              }`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="btn btn-primary mr-1"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
        <button
          className="btn btn-primary mr-1"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default GenotypeSearchResultsTable;