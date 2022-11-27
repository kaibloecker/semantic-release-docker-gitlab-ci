const got = require('got');
const login = require('./auth');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = async (pluginConfig, context) => {
  const { logger } = context;
  const errors = [];
  const {
    GITLAB_CI,
    CI_REGISTRY,
    CI_PROJECT_PATH,
    CI_REGISTRY_USER,
    CI_REGISTRY_PASSWORD,
  } = context.env;
  if (GITLAB_CI === undefined) {
    const error = "Oops, looks like we're not in GitLab CI";
    errors.push(error);
    logger.log(error);
    throw new SemanticReleaseError(error);
  }
  const { commit } = context.envCi;

  let Authorization = '';
  try {
    Authorization = await login(
      CI_REGISTRY,
      CI_PROJECT_PATH,
      commit,
      CI_REGISTRY_USER,
      CI_REGISTRY_PASSWORD,
    );
  } catch (error) {
    logger.log(`🚀 ~ file: verify.js ~ line 41 ~ error ${error}`);
    errors.push(error);
    throw new SemanticReleaseError(error);
  }

  const url = `https://${CI_REGISTRY}/v2/${CI_PROJECT_PATH}/manifests/${commit}`;
  const options = {
    method: 'HEAD',
    headers: { Authorization },
  };

  try {
    await got(url, options);
  } catch (error) {
    logger.log(`🚀 ~ file: verify.js ~ line 57 ~ error ${error}`);
    errors.push(error);
    throw new SemanticReleaseError(error);
  }
};
