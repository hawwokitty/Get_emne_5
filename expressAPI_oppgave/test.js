//fra løsningsforslag

const request = require("supertest");
const app = require("./index");
const assert = require("assert");

describe("Test GET /api/users", () => {
    it("should return all users", async () => {
        const res = await request(app).get("/api/users");
        assert.strictEqual(res.statusCode, 200);
        assert(Array.isArray(res.body));
    });
});
