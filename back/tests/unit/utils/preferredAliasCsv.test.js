const {
  parsePreferredAlias,
} = require("../../../utils/preferredAliasCsv");

describe("parsePreferredAlias", () => {
  test("distinguishes an omitted column from a blank value", () => {
    expect(parsePreferredAlias({ accession: "ACC-1" })).toEqual({
      supplied: false,
      value: null,
    });
    expect(parsePreferredAlias({ preferredAlias: "" })).toEqual({
      supplied: true,
      value: null,
    });
  });

  test("trims and normalizes whitespace", () => {
    expect(parsePreferredAlias({ preferredAlias: "  Alias   One  " })).toEqual(
      {
        supplied: true,
        value: "Alias One",
      },
    );
  });
});
