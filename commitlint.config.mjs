export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Short subjects survive squash-merge titles and `git log --oneline`.
    'header-max-length': [2, 'always', 72],
  },
};
