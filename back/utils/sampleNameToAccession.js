function sampleNameToAccession(sampleName) {
    const firstPart = sampleName.split('-')[0];
  
    const noTrailingNumbers = firstPart.replace(/\d+$/i, '');
  
    const match = noTrailingNumbers.match(/^([a-z]+)(\d+)([a-z]+)$/i);
  
    if (match) {
      const [_, letters, number, rest] = match;
      return `${letters.toUpperCase()} ${number} ${rest.toUpperCase()}`;
    } else {
      throw new Error("String format is not as expected.");
    }
  }

  module.exports = sampleNameToAccession;