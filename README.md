# semantic-release-docker-gitlab-ci

[**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to tag [Docker Images](https://www.docker.com/) built in a [GitLab](https://about.gitlab.com/) [CI/CD Pipeline](https://docs.gitlab.com/ee/ci/) and hosted in the GitLab Container Registry.

![npm](https://img.shields.io/npm/v/semantic-release-docker-gitlab-ci)
![License](https://img.shields.io/github/license/kaibloecker/semantic-release-docker-gitlab-ci)
![npm](https://img.shields.io/npm/dt/semantic-release-docker-gitlab-ci)
![GitHub issues](https://img.shields.io/github/issues-raw/kaibloecker/semantic-release-docker-gitlab-ci)
![GitHub last commit](https://img.shields.io/github/last-commit/kaibloecker/semantic-release-docker-gitlab-ci)

| Step               | Description                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `verifyConditions` | Verify that we're running in a GitLab CI/CD pipeline and that we can obtain a JWT and login to the registry. |
| `publish`          | Tag the built image with version tags                                                                        |

## Why this plugin?

semantic-release is the best place to tag docker images, built in a CI/CD pipeline, with version tags. However, the usual way to tag images is by pulling the built image, tagging it, and pushing it. In a CI/CD job this necessitates a docker-in-docker setup, or a remote docker installation used with docker CLI. In any case, you can't just start up a vanilla `node` image.

This plugin instead uses the registry API directly, as documented in the [GitLab Docs](https://docs.gitlab.com/ee/architecture/blueprints/container_registry_metadata_database/#http-api), without the need for a docker CLI installation.

The one drawback is, that images cannot be moved (since we are only operating on manifests, and not actual layers), so only the tag (the part after the colon) can be added to.

## Requirements

For now, the only requirement is that you initially push your built image with the git commit SHA as a tag, i. e. in a CI/CD Pipeline you would do a

```shell
docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
```

This will likely be configurable in a future version.

## Install

```bash
$ npm install semantic-release-docker-gitlab-ci -D
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "semantic-release-docker-gitlab-ci"
  ]
}
```

With this example, for each release three tags will be pushed to the container registry:

- Major.Minor.Patch (e.g. `5.3.2`)
- Major.Minor (e.g. `5.3`)
- Major (e.g. `5`)

### .gitlab-ci.yml

```yaml
stages:
  - build
  - release

variables:
  DOCKER_TLS_CERTDIR: '/certs'

build:
  image: docker:20.10
  stage: build
  services:
    - docker:20.10-dind
  before_script:
    - echo -n $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  script:
    - docker build --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  tags:
    - docker-dind

release:
  image: node:lts
  stage: release
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  script:
    - npx semantic-release
```

## Configuration

### Environment variables

This section is just to document the environment variables used by the plugin. All of them are automatically set by the CI/CD environment and do not need manual invervention.

| Variable               | Description                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `GITLAB_CI`            | The variable signalling that we're running in a GitLab CI/CD pipeline.                            |
| `CI_REGISTRY`          | The host name of your container registry, as set by your GitLab configuration.                    |
| `CI_PROJECT_PATH`      | The path of your project, usually `user/project` or `group/project`, or `group/subgroup/project`. |
| `CI_REGISTRY_USER`     | The username used to obtain the JWT used to login to the container registry.                      |
| `CI_REGISTRY_PASSWORD` | The password used to obtain the JWT used to login to the container registry.                      |

### Options

As of now, there are no options.

## Contributing

The plugin is dependent on environment variables provided by the GitLab CI/CD environment. The basic concept should be applicable to more CI systems, but I have neither the incentive nor the setups to expand the plugin to those. PRs are open.

## Changelog

See [CHANGELOG](https://github.com/kaibloecker/semantic-release-docker-gitlab-ci/blob/main/CHANGELOG.md).

## Licence

This project is released under the [MIT License](https://github.com/kaibloecker/semantic-release-docker-gitlab-ci/blob/main/LICENSE).

Copyright © 2022 [Kai Blöcker](https://github.com/kaibloecker)
