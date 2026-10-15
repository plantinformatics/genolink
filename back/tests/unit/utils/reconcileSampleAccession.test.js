const { Op } = require("sequelize");
const {
  reconcileSampleAccession,
} = require("../../../utils/reconcileSampleAccession");

const transaction = { LOCK: { UPDATE: "UPDATE" } };

const makeRow = (values) => ({
  ...values,
  update: jest.fn(async function update(changes) {
    Object.assign(this, changes);
    return this;
  }),
  getDatasetDois: jest.fn().mockResolvedValue([]),
});

const makeDb = (rows = []) => ({
  SampleAccession: {
    findAll: jest.fn().mockResolvedValue(rows),
    create: jest.fn(async (values) => makeRow({ id: 999, ...values })),
    destroy: jest.fn().mockResolvedValue(0),
  },
});

const incoming = (overrides = {}) => ({
  Accession: "ACC-1",
  Sample: "SAMPLE-1",
  Status: "Completed",
  hasServerUrl: true,
  ServerUrl: "https://example.test",
  hasDatasetDois: false,
  datasetDois: [],
  ...overrides,
});

describe("reconcileSampleAccession", () => {
  it("turns a pending null-sample placeholder into the real sample", async () => {
    const placeholder = makeRow({
      id: 10,
      Accession: "ACC-1",
      Sample: null,
      Status: "Pending",
      ServerUrl: null,
    });
    const db = makeDb([placeholder]);

    const result = await reconcileSampleAccession({
      db,
      incoming: incoming(),
      transaction,
      setDatasetDois: jest.fn(),
    });

    expect(result.action).toBe("resolved-placeholder");
    expect(placeholder.update).toHaveBeenCalledWith(
      {
        Accession: "ACC-1",
        Sample: "SAMPLE-1",
        Status: "Completed",
        ServerUrl: "https://example.test",
      },
      { transaction },
    );
    expect(db.SampleAccession.create).not.toHaveBeenCalled();
    expect(db.SampleAccession.destroy).not.toHaveBeenCalled();
  });

  it("keeps all real samples and removes only leftover placeholders", async () => {
    const exact = makeRow({
      id: 20,
      Accession: "ACC-1",
      Sample: "SAMPLE-1",
      Status: "Completed",
    });
    const anotherCompleted = makeRow({
      id: 21,
      Accession: "ACC-1",
      Sample: "SAMPLE-2",
      Status: "Completed",
    });
    const placeholder = makeRow({
      id: 22,
      Accession: "ACC-1",
      Sample: null,
      Status: "Pending",
    });
    const db = makeDb([exact, anotherCompleted, placeholder]);
    db.SampleAccession.destroy.mockResolvedValue(1);

    const result = await reconcileSampleAccession({
      db,
      incoming: incoming(),
      transaction,
      setDatasetDois: jest.fn(),
    });

    expect(result.removedPlaceholders).toBe(1);
    expect(anotherCompleted.update).not.toHaveBeenCalled();
    expect(db.SampleAccession.destroy).toHaveBeenCalledWith({
      where: {
        id: { [Op.in]: [22] },
        Accession: "ACC-1",
        Sample: { [Op.is]: null },
        Status: { [Op.in]: ["Pending", "TBC"] },
      },
      transaction,
    });
  });

  it("creates an additional sample without replacing existing real samples", async () => {
    const existing = makeRow({
      id: 30,
      Accession: "ACC-1",
      Sample: "SAMPLE-1",
      Status: "Completed",
    });
    const db = makeDb([existing]);

    const result = await reconcileSampleAccession({
      db,
      incoming: incoming({ Sample: "SAMPLE-2" }),
      transaction,
      setDatasetDois: jest.fn(),
    });

    expect(result.action).toBe("created");
    expect(db.SampleAccession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        Accession: "ACC-1",
        Sample: "SAMPLE-2",
        Status: "Completed",
      }),
      { transaction },
    );
    expect(existing.update).not.toHaveBeenCalled();
    expect(db.SampleAccession.destroy).not.toHaveBeenCalled();
  });

  it("preserves placeholder dataset DOIs before removing it", async () => {
    const exact = makeRow({
      id: 40,
      Accession: "ACC-1",
      Sample: "SAMPLE-1",
      Status: "Completed",
    });
    const placeholder = makeRow({
      id: 41,
      Accession: "ACC-1",
      Sample: null,
      Status: "Pending",
    });
    placeholder.getDatasetDois.mockResolvedValue([{ Doi: "10.1234/legacy" }]);
    const db = makeDb([exact, placeholder]);
    db.SampleAccession.destroy.mockResolvedValue(1);
    const setDatasetDois = jest.fn();

    await reconcileSampleAccession({
      db,
      incoming: incoming(),
      transaction,
      setDatasetDois,
    });

    expect(setDatasetDois).toHaveBeenCalledWith(
      db,
      exact,
      ["10.1234/legacy"],
      transaction,
    );
  });

  it("does not delete a pending row that has a real sample", async () => {
    const pendingSample = makeRow({
      id: 50,
      Accession: "ACC-1",
      Sample: "SAMPLE-PENDING",
      Status: "Pending",
    });
    const db = makeDb([pendingSample]);

    await reconcileSampleAccession({
      db,
      incoming: incoming({ Sample: "SAMPLE-NEW" }),
      transaction,
      setDatasetDois: jest.fn(),
    });

    expect(db.SampleAccession.create).toHaveBeenCalled();
    expect(db.SampleAccession.destroy).not.toHaveBeenCalled();
    expect(pendingSample.update).not.toHaveBeenCalled();
  });
});
