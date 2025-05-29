const app = require("../../index");
const request = require("supertest");
const axios = require("axios");
const logger = require("../../middlewares/logger");

jest.mock("axios");
jest.mock("../../middlewares/logger");
jest.mock("../../utils/generateGenesysToken");

const generateGenesysToken = require("../../utils/generateGenesysToken");

module.exports = { app, request, axios, logger, generateGenesysToken };
