"use strict";
const {
  Logger,
  QueryService,
  QueryModelBinder,
  constants,
} = require("@asseco/node-microservice-chassis");
const {
  getStorageKeys,
  getCatcodes,
  getCategoriesFiltered,
} = require("./util");

/* 
Description:
	Retrieves spending analytics by category or by subcategories witin category

Parameters:
	- catcode (Category code for filtering spendings)
	- start-date (Transactions that starts from date)
	- end-date (Transactions that end until date)
	- direction (Filter by transaction kind)
*/
module.exports.spendingsGet = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Spendings_Get called.", { sandboxId: sandboxId });

  const subCatcodes = await getCatcodes(sandboxId);

  const allCatcodes = await getCategoriesFiltered(sandboxId);

  const allCategories = allCatcodes.categories;

  const filters = [
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
    {
      value: req.query["direction"],
      operation: (item, value) => item["direction"] === value,
    },
  ];

  const paging = QueryModelBinder.getPagingParams(req);
  const sorting = QueryModelBinder.getSortingParams(req);

  const responseConfig = {
    collectionName: "items",
    applyPaging: false,
  };

  const queryService = new QueryService();
  const transactions = await queryService.getList(
    getStorageKeys(sandboxId).transactions,
    filters,
    paging,
    sorting,
    responseConfig
  );

  let catcodeGroups = {};
  transactions.forEach((t) => {
    if (t.splits) {
      return t.splits.forEach((x) => {
        groupTransaction(x, catcodeGroups);
      });
    }
    if (t.catcode) {
      return groupTransaction(t, catcodeGroups);
    }
  });

  const filterAgain = req.query["catcode"]
    ? subCatcodes
        .filter((x) => {
          return x["parent-code"] == req.query["catcode"];
        })
        .map((x) => x.code.toString())
    : allCategories;
  const analytics = convertAnalyticToGroups(catcodeGroups).filter((c) =>
    filterAgain.includes(c.catcode)
  );
  res.send({ groups: analytics });
};

const convertAnalyticToGroups = (catcodeGroups) => {
  let res = { groups: [] };
  res = Object.keys(catcodeGroups).reduce((acc, cv) => {
    let data = catcodeGroups[cv];
    data = { ...data, ...{ catcode: cv } };
    acc.push(data);
    return acc;
  }, []);
  return res;
};

const groupTransaction = (transaction, catcodeGroups) => {
  let { catcode, amount } = transaction;
  amount = Number(amount);
  if (!catcodeGroups[catcode]) {
    catcodeGroups[catcode] = { amount: amount, count: 1 };
  } else {
    catcodeGroups[catcode].amount += amount;
    catcodeGroups[catcode].count++;
  }

  return catcodeGroups;
};
