const { app, request } = require("../../../helpers/setup");

describe("GET /api/gigwa/gigwaServers", () => {
  it("should return the list of gigwa servers from config", async () => {
    const res = await request(app).get("/api/gigwa/gigwaServers");

    expect(res.statusCode).toBe(200);
  });
});
