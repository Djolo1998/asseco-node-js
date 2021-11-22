"use strict";
const {
  Logger,
  QueryService,
  QueryModelBinder,
  constants,
} = require("@asseco/node-microservice-chassis");
const {
  getStorageKeys,
  transactionExist,
  categoryExist,
  getAllData,
  setData,
  updateTransaction,
  getCatcodes,
} = require("./util");

/* 
Description:
	Gets the list of transactions for authorized user

Parameters:
	- transaction-kind (Filter by transaction kind)
	- start-date (Transactions that starts from date)
	- end-date (Transactions that end until date)
	- page (Page index. For more information see general guidance on [paging](common-getstarted.html#paging))
	- page-size (Number of items on a page. For more information see general guidance on [paging](common-getstarted.html#paging))
	- sort-by (Attribute of the collection item to sort by. For more information see general guidance on [sorting](common-getstarted.html#sorting))
	- sort-order (Sort order (`asc` or `desc`). Default is asc. For more information see general guidance on [sorting](common-getstarted.html#sorting))
*/
module.exports.transactionsGetList = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Transactions_GetList called.", { sandboxId: sandboxId });

  const filters = [
    {
      value: req.query["transaction-kind"],
      operation: (item, value) => item["kind"] === value,
    },
    {
      value: req.query["start-date"],
      operation: (item, value) =>
        new Date(item["date"]).getTime() >= new Date(value).getTime(),
    },
    {
      value: req.query["end-date"],
      operation: (item, value) =>
        new Date(item["date"]).getTime() <= new Date(value).getTime(),
    },
  ];

  const paging = QueryModelBinder.getPagingParams(req);
  const sorting = QueryModelBinder.getSortingParams(req);

  console.log("sorting....", sorting);

  // if (sorting.sortBy == "date") sorting.sortBy = "timestamp";

  const responseConfig = {
    collectionName: "items",
    applyPaging: true,
  };

  const queryService = new QueryService();
  const response = await queryService.getList(
    `${sandboxId}:v1:personal:transactions`,
    filters,
    paging,
    sorting,
    responseConfig
  );
  response.items = response.items.map((x) => {
    x.date = new Date(x.date).toLocaleDateString("en-US");
    x.amount = x.currency + " " + x.amount;
    return x;
  });
  res.send(response);
};

/* 
Description:
	Imports transactions

Parameters:
	- body (Command to import transaction)
*/
module.exports.transactionsImport = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Transactions_Import called.", { sandboxId: sandboxId });
  res.send({ message: "Operation Transactions_Import called!" });
};

/* 
Description:
	Splits transaction by id of the transaction

Parameters:
	- id (Transaction Id path parameter)
	- body (Command to split transaction)
*/
module.exports.transactionsSplit = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Transactions_Split called.", { sandboxId: sandboxId });

  let transactionId = c.request.params.id;
  const { splits } = req.body;

  console.log("ovde 1");
  //check if transaction exist
  let transaction = await transactionExist(transactionId, sandboxId);
  if (!transaction)
    return res.send(404, { message: "Transaction don't exist" });

  //check if amount is equal
  let splitsAmount = splits.reduce((acc, cv) => cv.amount + acc, 0);
  let isEqual = transaction.amount == splitsAmount;
  console.log("ovde 2");
  if (!isEqual)
    return res.send({
      msg: `total amount need to be ${transaction.amount}, but get ${splitsAmount}`,
    });
  console.log("ovde 3");
  //validate catcodes
  let splitsCatcodes = splits.map((x) => x.catcode);
  let catcodes = await getCatcodes(sandboxId);
  splitsCatcodes.forEach((c) => {
    let isValid = catcodes.some((x) => x.code == c);
    if (!isValid) {
      return res.send(404, {
        message: `Category with catcode: ${c} don't exist`,
      });
    }
  });

  //save in storage
  let dataToChange = { splits };

  await updateTransaction(transactionId, dataToChange, sandboxId);

  res.send({ msg: "ok" });
};

/* 
Description:
	Categorizes the transaction by id of the transaction

Parameters:
	- id (Transaction Id path parameter)
	- body (Command to categorize transaction)
*/

module.exports.transactionsCategorize = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Transactions_Categorize called.", { sandboxId: sandboxId });
  let transactionId = c.request.params.id;
  const { catcode } = req.body;

  //check if transaction exist
  let transaction = await transactionExist(transactionId, sandboxId);
  if (!transaction)
    return res.send(404, { message: "Transaction don't exist" });

  //validate catcode
  let existCategory = await categoryExist(catcode, sandboxId);
  if (!existCategory) return res.send(404, { message: "Category don't exist" });

  //save in storage
  let dataToChange = {
    catcode,
  };

  let data = await updateTransaction(transactionId, dataToChange, sandboxId);

  res.send(data);
};

/* 
Description:
	Auto categorizes transactions

Parameters:
*/
module.exports.transactionsAutoCategorize = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Transactions_AutoCategorize called.", { sandboxId: sandboxId });
  res.send({ message: "Operation Transactions_AutoCategorize called!" });
};
