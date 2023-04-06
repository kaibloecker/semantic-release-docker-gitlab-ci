import verify from './src/verify.js';
import publish from './src/publish.js';

// eslint-disable-next-line no-unused-vars
let verified;

/**
 * Called by semantic-release during the verification step
 * @param {*} pluginConfig The semantic-release plugin config
 * @param {*} context The context provided by semantic-release
 */
async function verifyConditions(pluginConfig, context) {
  await verify(pluginConfig, context);
  verified = true;
}

export default { verifyConditions, publish };
