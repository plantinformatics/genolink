const { parseDatasetDois } = require("../../../utils/datasetDoiCsv");

describe("parseDatasetDois", () => {
  test("parses, normalizes, and deduplicates multiple DOIs", () => {
    expect(
      parseDatasetDois({
        datasetDois:
          "10.1234/ONE; https://doi.org/10.1234/TWO | 10.1234/ONE",
      }),
    ).toEqual({
      supplied: true,
      dois: ["10.1234/ONE", "10.1234/TWO"],
    });
  });

  test("distinguishes an omitted column from a blank column", () => {
    expect(parseDatasetDois({})).toEqual({ supplied: false, dois: [] });
    expect(parseDatasetDois({ datasetDois: "" })).toEqual({
      supplied: true,
      dois: [],
    });
  });

  test("accepts the singular datasetDoi header", () => {
    expect(parseDatasetDois({ datasetDoi: "10.1234/ONE" })).toEqual({
      supplied: true,
      dois: ["10.1234/ONE"],
    });
  });
});
