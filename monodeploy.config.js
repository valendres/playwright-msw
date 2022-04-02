module.exports = {
  plugins: ["@monodeploy/plugin-github"],
  conventionalChangelogConfig: "@tophat/conventional-changelog-config",
  changelogFilename: "<packageDir>/CHANGELOG.md",
  access: "infer",
  persistVersions: true,
  autoCommit: true,
  git: {
    push: true,
    tag: true,
  },
};
