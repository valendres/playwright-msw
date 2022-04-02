module.exports = {
  conventionalChangelogConfig: "@tophat/conventional-changelog-config",
  changelogFilename: "<packageDir>/CHANGELOG.md",
  persistVersions: true,
  autoCommit: true,
  git: {
    push: true,
    tag: true,
  },
};
