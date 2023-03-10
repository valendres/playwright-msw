<h1 align="center">Playwright MSW Example (Vue)</h1>

A [Vue](https://vuejs.org/) SPA that utilises [MSW](https://mswjs.io/) to improve development experience. Additionally, it also has a number of [Playwright](https://playwright.dev/) tests to make sure that `playwright-msw`'s integration of the two libraries works as expected.

## Getting started

To start a local dev server, do the following:

```shell
git clone https://github.com/valendres/playwright-msw
cd playwright-msw
yarn
yarn build
cd packages/example-vue
yarn start
```

## Commands

- `build`: Builds the Vue SPA
- `start`: Starts a local dev server so that you can manually view the UI that is tested by Playwright.
- `start:msw`: Starts a local dev server with MSW enabled.
- `test`: Runs the Playwright tests within the [test/specs](https://github.com/valendres/playwright-msw/blob/main/packages/example-vue/test/specs) folder[^requirements]

[^requirements]: to be able to run the Playwright tests, the `playwright-msw` package must have been previously built using `yarn build`.

## Footnotes
