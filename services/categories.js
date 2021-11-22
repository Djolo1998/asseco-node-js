"use strict";
const {
  Logger,
  QueryService,
  QueryModelBinder,
  constants,
} = require("@asseco/node-microservice-chassis");

/* 
Description:
	Imports categories

Parameters:
	- body (Command to import categories)
*/
module.exports.categoryImprot = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Category_Improt called.", { sandboxId: sandboxId });
  res.send({ message: "Operation Category_Improt called!" });
};

/* 
Description:
	Gets the list of root PEM categories if parent-id not provided

Parameters:
	- parent-id (Filter by parent-id)
*/
module.exports.categoriesGetList = async function (c, req, res) {
  const sandboxId = req.header(constants.xSandboxId);
  Logger.info("Categories_GetList called.", { sandboxId: sandboxId });

  const filters = [
    {
      value: req.query["parent-id"],
      operation: (item, value) => item["parent-id"] === value,
    },
  ];

  const paging = QueryModelBinder.getPagingParams(req);
  const sorting = QueryModelBinder.getSortingParams(req);

  const responseConfig = {
    collectionName: "items",
    applyPaging: false,
  };

  const queryService = new QueryService();
  const response = await queryService.getList(
    `${sandboxId}:v1:personal:categories`,
    filters,
    paging,
    sorting,
    responseConfig
  );
  res.send({ items: response });
};
