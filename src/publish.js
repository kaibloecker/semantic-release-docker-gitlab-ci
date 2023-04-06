import got from 'got';
import semver from 'semver';
import login from './auth.js';
import SemanticReleaseError from '@semantic-release/error';

const CONTENT_TYPE = 'application/vnd.docker.distribution.manifest.v2+json';

const getVersionTags = function (version, isSemver) {
  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);
  const prerelease = semver.prerelease(version)
    ? `-${semver.prerelease(version).join('.')}`
    : '';

  if (isSemver) {
    return [`${major}.${minor}.${patch}${prerelease}`];
  }
  return [
    `${major}.${minor}.${patch}${prerelease}`,
    `${major}.${minor}${prerelease}`,
    `${major}${prerelease}`,
  ];
};

const getManifest = async function (url, Authorization) {
  const options = {
    method: 'GET',
    headers: { Authorization, 'content-type': CONTENT_TYPE },
  };
  try {
    const manifest = await got(url, options).json();
    return manifest;
  } catch (error) {
    throw new SemanticReleaseError(error);
  }
};

const pushTag = async function (url, Authorization, manifest) {
  const options = {
    method: 'PUT',
    headers: { Authorization, 'content-type': CONTENT_TYPE },
    json: manifest,
  };
  try {
    await got(url, options);
  } catch (error) {
    throw new SemanticReleaseError(error);
  }
};

export default async (pluginConfig, context) => {
  const errors = [];
  const {
    CI_REGISTRY,
    CI_PROJECT_PATH,
    CI_REGISTRY_USER,
    CI_REGISTRY_PASSWORD,
  } = context.env;
  const { commit } = context.envCi;
  const { version } = context.nextRelease;

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
    errors.push(error);
    throw new SemanticReleaseError(error);
  }

  const url = `https://${CI_REGISTRY}/v2/${CI_PROJECT_PATH}/manifests/`;
  const manifest = await getManifest(`${url}/${commit}`, Authorization);
  const nextVersions = getVersionTags(version, pluginConfig.semver ?? false);
  nextVersions.forEach(async (item) => {
    // eslint-disable-next-line no-unused-vars
    const result = await pushTag(`${url}/${item}`, Authorization, manifest);
  });
};
