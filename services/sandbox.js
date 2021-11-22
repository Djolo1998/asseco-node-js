"use strict";
const {
  Logger,
  StorageClient,
  CommandService,
} = require("@asseco/node-microservice-chassis");

const fs = require("fs");

module.exports.create = async function (req, res) {
  try {
    initStorage();
    await createSandboxData(req);
  } catch (e) {
    Logger.error(e);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);
  Logger.info(
    `Sandbox data for sandbox ${req.body.sandbox.externalId} was successfully created!`
  );
};

function initStorage() {
  if (!global.gConfig.mockMode) {
    new StorageClient(
      global.gConfig.database.host,
      global.gConfig.database.port,
      null,
      global.gConfig.database.password
    );
  }
}

module.exports.reset = async function (req, res) {
  try {
    await createSandboxData(req);
  } catch (e) {
    Logger.error(e);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);
  Logger.info(
    `Sandbox data for sandbox ${req.body.sandbox.externalId} was successfully reset!`
  );
};

const seedCategories = () => {
  const csvData = fs.readFileSync("seed/categories.csv").toString().split("\n");

  let header = csvData[0].split(",");
  let categoriesDataArr = [];

  categoriesDataArr = csvData.reduce((acc, cv, ind, array) => {
    if (ind == 0 || array.length - 1 == ind) return acc;

    var data = cv.split(",");
    let obj = data.reduce((acc, x, ind) => {
      if (x == "") x = null;
      if (Number.parseInt(x)) x = Number(x);
      acc[header[ind]] = x;
      return acc;
    }, {});

    acc.push(obj);
    return acc;
  }, []);

  return categoriesDataArr;
};

async function createSandboxData(req) {
  Logger.info(
    `CreateSandboxData for sandbox ${req.body.sandbox.externalId} called!`
  );
  const sandboxId = req.body.sandbox.externalId;

  // global.storageClient.setObject("6b5ab0ff-4390-4553-8c7e-aa121a813885", {});
  global.storageClient.setObject(sandboxId, {});

  var csvData = fs.readFileSync("seed/transactions.csv").toString().split("\n");

  let header = csvData[0].split(",");
  let transactionsDataArr = [];

  for (var i = 1; i < csvData.length; i++) {
    var data = csvData[i].split(",");
    let obj = {};

    data.forEach((x, ind) => {
      if (header[ind] == "date") {
        x = new Date(x).getTime();
      }
      obj[header[ind]] = x;
    });

    if (!obj["catcode"]) {
      obj["catcode"] = null;
    }
    if (!obj["splits"]) {
      obj["splits"] = [];
    }

    transactionsDataArr.push(obj);
  }

  let categoriesDataArr = seedCategories();

  const commandService = new CommandService();
  // Save the data using the commandSerivce
  commandService.setObject(
    `${sandboxId}:v1:personal:transactions`,
    transactionsDataArr
  );
  commandService.setObject(
    `${sandboxId}:v1:personal:categories`,
    categoriesDataArr
  );

  // commandService.setObject(`${sandboxId}:v1:personal:transactions`, req.body.apis["personal-finance-management"].transactions);
  // commandService.setObject(`${sandboxId}:v1:personal:categories`, req.body.apis["personal-finance-management"].categories);
  // commandService.setObject(`${sandboxId}:v1:personal:analytics`, req.body.apis["personal-finance-management"].analytics);
}
