# Contributing

PR's are welcome. The fastest way to get a change in is to make a PR. If you're not sure how to fix something, feel free to create a [New Issue](https://github.com/valendres/playwright-msw/issues/new). If you just have a question, please start a [New Discussion](https://github.com/valendres/playwright-msw/discussions/new).

## Getting started

### Prerequisites

The following must be installed:

- [Node.js](https://nodejs.org/en/): `>=14`
- [Yarn berry](https://yarnpkg.com/getting-started/install)

### Fork the repo

Fork the repo into your personal account or public github organization following [GitHub's official guidelines](https://docs.github.com/en/get-started/quickstart/fork-a-repo).

### Install dependencies

```shell
yarn install
```

## Guidelines

Given that this tool is likely utilized in CI pipelines for ensuring that a website or app is behaving as expected, is is critical that we minimise breaking changes as much as possible. Where it makes sense to do so, automation tests (Unit & Integration) and documentation should be updated.

### Testing

For a PR to be merged, tests must be written to ensure that your contribution behaves the way you expect it to behave. Your PR will not be merged until this is done and all tests are passing.

There are two kinds of tests within this repo:

1. **Unit tests:** These tests are written using [Jest](https://jestjs.io/) are defined within the [playwright-msw](./packages/../README.md) package. If it makes sense to do so (e.g. logic is updated), unit tests should be included. Changes to existing tests should be avoided if possible as this could potentially constitute a breaking change.
2. **Integration tests:**

### Documentation

If you're modifying any of the consumer-facing code to the library (exposed functions, config options etc.), the [playwright-msw/README.md](./packages/playwright-msw/README.md) must be updated to reflect these changes. Your PR will not be merged until this is done.

### Types

This is a [TypeScript](https://www.typescriptlang.org/)-first repo. Please strongly type everything; `any` will not be approved unless there is no other option.

### Commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), please use this when committing.

### Pull requests

To get your changes merged, you'll need to follow these steps:

1. Once you have committed your change, [push it to a remote branch](https://devconnected.com/how-to-push-git-branch-to-remote/) within your forked `playwright-msw` repository.
2. Next, [create a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) from your forked version of `playwright-msw`. Please select `valendres/playwright-msw` as the base repository, and `main` as the base. When prompted, please fill out as much information within the Pull Request template as applicable.
3. Finally, please be patient as we review your pull request. We may ask for a few things to be changed, but we only do this to ensure the quality of the codebase going forward. We endeavour to get all contributions merged ASAP.

## Commands

The following commands can be executed from the root of the repo:

- `yarn build`: builds the `playwright-msw` library and `example` app
- `yarn deploy`: builds and deploys `playwright-msw` using [Monodeploy](https://github.com/tophat/monodeploy)
- `yarn format`: runs [Prettier](https://prettier.io/) on all files within the repo
- `yarn lint`: runs [ESLint](https://eslint.org/) on all files within the repo
- `yarn test`: runs `playwright-msw` unit tests ([Jest](https://jestjs.io/)) and the `example` apps integration tests ([Playwright](https://playwright.dev/))
