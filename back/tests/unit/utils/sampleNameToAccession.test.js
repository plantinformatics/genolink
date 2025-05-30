const sampleNameToAccession = require("../../../utils/sampleNameToAccession");

describe("sampleNameToAccession", () => {
  it("parses sample name correctly", () => {
    expect(sampleNameToAccession("abc123xyz")).toBe("ABC 123 XYZ");
    expect(sampleNameToAccession("sample99end")).toBe("SAMPLE 99 END");
    expect(sampleNameToAccession("test1abc")).toBe("TEST 1 ABC");
  });

  it("throws error on unexpected format", () => {
    expect(() => sampleNameToAccession("abc")).toThrow(
      "String format is not as expected."
    );
    expect(() => sampleNameToAccession("123abc")).toThrow(
      "String format is not as expected."
    );
    expect(() => sampleNameToAccession("abc123")).toThrow(
      "String format is not as expected."
    );
    expect(() => sampleNameToAccession("")).toThrow(
      "String format is not as expected."
    );
  });
});
