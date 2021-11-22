const config = require("./config/config.js");
const OpenAPIBackend = require("openapi-backend").default;
const {
  Logger,
  StorageClient,
  CacheClient,
  middlewares,
  setupAuthentication,
} = require("@asseco/node-microservice-chassis");

const sandbox = require("./services/sandbox");
const analytics = require("./services/analytics");
const categories = require("./services/categories");
const transactions = require("./services/transactions");
const cors = require("cors");

const express = require("express");

bootstrap();

async function bootstrap() {
  global.gConfig.mockMode = false;
  global.storageClient = new StorageClient(
    global.gConfig.database.host,
    global.gConfig.database.port,
    null,
    global.gConfig.database.password
  );
  global.cacheClient = new CacheClient(
    global.gConfig.database.host,
    global.gConfig.database.port,
    null,
    global.gConfig.database.password
  );

  // Setup logger
  new Logger(global.gConfig.logger);

  const app = express();
  app.use(express.json());

  app.use(cors());

  const unlessPathConfig = [/\/sandbox\/create/gi, /\/sandbox\/reset/gi];

  // Executes before authorization middleware
  await setupAuthentication(app, global.gConfig.auth, unlessPathConfig);

  if (!global.gConfig.mockMode) {
    // app.use(middlewares.authorization(global.gConfig));
  }
  app.use(middlewares.faultSimulation(global.gConfig));

  const api = new OpenAPIBackend({
    definition: "./api/api2.yaml",
    apiRoot: "/v1/personal-finance-management",
  });

  api.register({
    Spendings_Get: analytics.spendingsGet,
    Category_Improt: categories.categoryImprot,
    Categories_GetList: categories.categoriesGetList,
    Transactions_GetList: transactions.transactionsGetList,
    Transactions_Import: transactions.transactionsImport,
    Transactions_Split: transactions.transactionsSplit,
    Transactions_Categorize: transactions.transactionsCategorize,
    Transactions_AutoCategorize: transactions.transactionsAutoCategorize,
    validationFail: async (c, req, res) =>
      res.status(400).json({ err: c.validation.errors }),
    postResponseHandler: (c, req, res) => {
      const valid = c.api.validateResponse(c.response, c.operation);
      if (valid.errors) {
        Logger.warn(`Response is not valid:`, valid.errors);
      }
    },
    notFound: async (c, req, res) => {
      return res.status(404).json({ err: "not found" });
    },
  });

  api.init();

  app.post("/sandbox/create", async function (req, res, next) {
    await sandbox.create(req, res, next);
  });

  app.post("/sandbox/reset", async function (req, res, next) {
    await sandbox.reset(req, res, next);
  });

  // use as express middleware
  app.use((req, res) => {
    console.log("before");
    api.handleRequest(req, req, res);
    console.log("after");
  });

  // setup error handler
  app.use(middlewares.errorHandler());

  let port = 8080;
  const environment = process.env.NODE_ENV || "development";

  if (environment === "development") {
    port = 6160;
  }

  // start server
  app.listen(port, () =>
    Logger.info(`Api listening at http://localhost:${port}`)
  );
}
