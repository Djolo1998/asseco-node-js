const getStorageKeys = (sandboxId) => {
  // let resource = {transactions}
  let template = `${sandboxId}:v1:personal:`;

  return {
    transactions: template + "transactions",
    categories: template + "categories",
    analytics: template + "analytics",
  };
};

const getAllData = async (resource, sandboxId) => {
  let key = getStorageKeys(sandboxId)[resource];
  let data = await global.storageClient.getObject(key);
  return data;
};
const setData = async (data, resource, sandboxId) => {
  let key = getStorageKeys(sandboxId)[resource];
  let res = await global.storageClient.setObject(key, data);
  return res;
};

const updateTransaction = async (id, newData, sandboxId) => {
  let data = await getAllData("transactions", sandboxId);
  let filtered = data.filter((x) => x.id == id)[0];

  Object.keys(newData).forEach((x) => {
    filtered[x] = newData[x];
  });

  let res = await setData(data, "transactions", sandboxId);
  return res;
};

const transactionExist = async (id, sandboxId) => {
  let key = getStorageKeys(sandboxId).transactions;
  let data = await global.storageClient.getObject(key);
  let exist = data.filter((x) => x.id == id)[0];
  console.log("transactionExist 3");
  return exist;
};

const categoryExist = async (code, sandboxId) => {
  let key = getStorageKeys(sandboxId).categories;
  let data = await global.storageClient.getObject(key);
  let exist = data.filter((x) => x.code == code)[0];
  return exist;
};

const getCatcodes = async (sandboxId) => {
  let key = getStorageKeys(sandboxId).categories;
  let data = await global.storageClient.getObject(key);
  return data;
};

const getCategoriesFiltered = async (sandboxId) => {
  let data = await getCatcodes(sandboxId);
  const allSubCategories = data
    .filter((c) => c["parent-code"])
    .map((x) => x.code);
  const allCategories = data
    .filter((c) => c["parent-code"] == null)
    .map((x) => x.code);
  return { subcategories: allSubCategories, categories: allCategories };
};

module.exports = {
  getStorageKeys,
  transactionExist,
  categoryExist,
  getAllData,
  setData,
  updateTransaction,
  getCatcodes,
  getCategoriesFiltered,
};
