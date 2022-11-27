const got = require('got');

const extractRealm = function (headers) {
  const options = headers
    .split(' ')[1]
    .split(',')
    .reduce(
      (a, v) => ({
        ...a,
        [v.split('=')[0]]: v.split('=')[1].replace(/['"]+/g, ''),
      }),
      {},
    );
  return options.realm;
};

const getRealm = async function (url) {
  try {
    await got.head(url);
    throw 'auth not required';
  } catch (error) {
    const realm = extractRealm(error.response.headers['www-authenticate']);
    return realm;
  }
};

module.exports = async (
  REGISTRY,
  PROJECT_PATH,
  TAG,
  REGISTRY_USER,
  REGISTRY_PASSWORD,
) => {
  const url = `https://${REGISTRY}/v2/${PROJECT_PATH}/manifests/${TAG}`;
  const realm = await getRealm(url);
  const options = {
    method: 'GET',
    searchParams: {
      service: 'container_registry',
      scope: `repository:${PROJECT_PATH}:pull,push`,
    },
    username: REGISTRY_USER,
    password: REGISTRY_PASSWORD,
  };
  const { token } = await got(realm, options).json();
  const Authorization = `Bearer ${token}`;
  return Authorization;
};
