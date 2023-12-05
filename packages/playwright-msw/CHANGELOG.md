# Changelog

<!-- MONODEPLOY:BELOW -->

## [3.0.0](https://github.com/valendres/playwright-msw/compare/playwright-msw@2.2.1...playwright-msw@3.0.0) "playwright-msw" (2023-12-05)<a name="3.0.0"></a>

### Breaking Changes

* Due to the updated dependency msw 2, using
playwright-msw requires node 18 or newer ([cb7d144](https://github.com/valendres/playwright-msw/commits/cb7d144))

### Bug Fixes

* actually log active handlers ([cb7d144](https://github.com/valendres/playwright-msw/commits/cb7d144))

### Features

* upgrade to msw 2.x ([cb7d144](https://github.com/valendres/playwright-msw/commits/cb7d144))
* add support for MSW 2.x (#77) ([cb7d144](https://github.com/valendres/playwright-msw/commits/cb7d144))




## [2.2.1](https://github.com/valendres/playwright-msw/compare/playwright-msw@2.2.0...playwright-msw@2.2.1) "playwright-msw" (2023-03-10)<a name="2.2.1"></a>

### Bug Fixes

* vue compatibility ([3634be1](https://github.com/valendres/playwright-msw/commits/3634be1))
* race condition which breaks compatibility with vue (#61) ([3634be1](https://github.com/valendres/playwright-msw/commits/3634be1))




## [2.2.0](https://github.com/valendres/playwright-msw/compare/playwright-msw@2.1.0...playwright-msw@2.2.0) "playwright-msw" (2023-02-06)<a name="2.2.0"></a>

### Bug Fixes

* handler delay not being respected ([3d08816](https://github.com/valendres/playwright-msw/commits/3d08816))
* handler delay not being respected (#49) ([3d08816](https://github.com/valendres/playwright-msw/commits/3d08816))
* bypass initial page requests (#47) ([d1053b5](https://github.com/valendres/playwright-msw/commits/d1053b5))
* unknown error code: "error" ([ef50166](https://github.com/valendres/playwright-msw/commits/ef50166))
* compatibility issue issue with msw>=0.49.3 ([ef50166](https://github.com/valendres/playwright-msw/commits/ef50166))
* unknown error code "error" when used with msw@0.49.3 (#57) ([ef50166](https://github.com/valendres/playwright-msw/commits/ef50166))

### Features

* allow initial api calls not to be mocked ([d1053b5](https://github.com/valendres/playwright-msw/commits/d1053b5))




## [2.1.0](https://github.com/valendres/playwright-msw/compare/playwright-msw@2.0.2...playwright-msw@2.1.0) "playwright-msw" (2022-12-08)<a name="2.1.0"></a>

### Features

* add support for mocking cross-origin requests (#44) ([6d24ecc](https://github.com/valendres/playwright-msw/commits/6d24ecc))




## [2.0.2](https://github.com/valendres/playwright-msw/compare/playwright-msw@2.0.1...playwright-msw@2.0.2) "playwright-msw" (2022-12-08)<a name="2.0.2"></a>

### Bug Fixes

- **api**: createWorker is not exported (#43) ([8d6c5da](https://github.com/valendres/playwright-msw/commits/8d6c5da))
- paths with trailing slash and route/query params not being matched (#41) ([bc08acb](https://github.com/valendres/playwright-msw/commits/bc08acb))

## [2.0.1](https://github.com/valendres/playwright-msw/compare/playwright-msw@2.0.0...playwright-msw@2.0.1) "playwright-msw" (2022-11-11)<a name="2.0.1"></a>

### Bug Fixes

- handlers not working when endpoint is called with query params (#40) ([87cb4b9](https://github.com/valendres/playwright-msw/commits/87cb4b9))
- handlers being processed in incorrect order (#39) ([9f1d346](https://github.com/valendres/playwright-msw/commits/9f1d346))

## [2.0.0](https://github.com/valendres/playwright-msw/compare/playwright-msw@1.0.4...playwright-msw@2.0.0) "playwright-msw" (2022-11-07)<a name="2.0.0"></a>

### Breaking Changes

- the interface for `createWorkerFixture` has been updated ([06011c7](https://github.com/valendres/playwright-msw/commits/06011c7))

### Bug Fixes

- not being able to mock the same url with different methods ([3895a50](https://github.com/valendres/playwright-msw/commits/3895a50))

### Features

- reduce noise in logs ([3895a50](https://github.com/valendres/playwright-msw/commits/3895a50))
- add support for resetting to a specific set of handlers ([3895a50](https://github.com/valendres/playwright-msw/commits/3895a50))
- add support for msw paths with route params ([a4ad365](https://github.com/valendres/playwright-msw/commits/a4ad365))
- support for regex paths ([3895a50](https://github.com/valendres/playwright-msw/commits/3895a50))
- add support for graphql ([06011c7](https://github.com/valendres/playwright-msw/commits/06011c7))
- make graphqlUrl optional ([7dd3d37](https://github.com/valendres/playwright-msw/commits/7dd3d37))
- simplify interface for better dev experience ([4df2fe1](https://github.com/valendres/playwright-msw/commits/4df2fe1))

## [1.0.4](https://github.com/valendres/playwright-msw/compare/playwright-msw@1.0.3...playwright-msw@1.0.4) "playwright-msw" (2022-11-05)<a name="1.0.4"></a>

### Bug Fixes

- internal cookie storage isn't reset on test teardown (#30) ([8ed4504](https://github.com/valendres/playwright-msw/commits/8ed4504))

## [1.0.3](https://github.com/valendres/playwright-msw/compare/playwright-msw@1.0.2...playwright-msw@1.0.3) "playwright-msw" (2022-10-28)<a name="1.0.3"></a>

### Bug Fixes

- trying to get headers after page is closed (#27) ([d222fbb](https://github.com/valendres/playwright-msw/commits/d222fbb))
- cookies not being sent for webkit ([26d3902](https://github.com/valendres/playwright-msw/commits/26d3902))

## [1.0.2](https://github.com/valendres/playwright-msw/compare/playwright-msw@1.0.1...playwright-msw@1.0.2) "playwright-msw" (2022-10-04)<a name="1.0.2"></a>

### Bug Fixes

- improve compatibility with older versions of msw (#21) ([daa4e96](https://github.com/valendres/playwright-msw/commits/daa4e96))

## [1.0.1](https://github.com/valendres/playwright-msw/compare/playwright-msw@1.0.0...playwright-msw@1.0.1) "playwright-msw" (2022-10-04)<a name="1.0.1"></a>

### Bug Fixes

- fix server method

Co-authored-by: pei.fan <fanpei920@gmail.com> ([a75c3d1](https://github.com/valendres/playwright-msw/commits/a75c3d1))

## [1.0.0](https://github.com/valendres/playwright-msw/compare/playwright-msw@0.2.2...playwright-msw@1.0.0) "playwright-msw" (2022-07-13)<a name="1.0.0"></a>

### Breaking Changes

- due to an upstream breaking change in msw, this library now requires MSW >=0.44.0 ([d520c11](https://github.com/valendres/playwright-msw/commits/d520c11))

## [0.2.2](https://github.com/valendres/playwright-msw/compare/playwright-msw@0.2.1...playwright-msw@0.2.2) "playwright-msw" (2022-04-25)<a name="0.2.2"></a>

### Bug Fixes

- updates server path to catch all (#9) ([5ebc7d8](https://github.com/valendres/playwright-msw/commits/5ebc7d8))

## [0.2.1](https://github.com/valendres/playwright-msw/compare/playwright-msw@0.2.0...playwright-msw@0.2.1) "playwright-msw" (2022-04-03)<a name="0.2.1"></a>

## [0.2.0](https://github.com/valendres/playwright-msw/compare/playwright-msw@0.1.0...playwright-msw@0.2.0) "playwright-msw" (2022-04-02)<a name="0.2.0"></a>

### Features

- add monodeploy ([def459b](https://github.com/valendres/playwright-msw/commit/def459b))

## [0.1.0](https://github.com/valendres/playwright-msw/compare/playwright-msw@0.0.9...playwright-msw@0.1.0) "playwright-msw" (2022-04-02)<a name="0.1.0"></a>

### Bug Fixes

- type checking issue ([f34a9aa](https://github.com/valendres/playwright-msw/commits/f34a9aa))
- test timeout issue ([f34a9aa](https://github.com/valendres/playwright-msw/commits/f34a9aa))
- git hooks ([f34a9aa](https://github.com/valendres/playwright-msw/commits/f34a9aa))

### Features

- remove express as a dependency ([d164383](https://github.com/valendres/playwright-msw/commits/d164383))
- make integration easier ([d164383](https://github.com/valendres/playwright-msw/commits/d164383))
- simplify implementation (#4) ([d164383](https://github.com/valendres/playwright-msw/commits/d164383))
