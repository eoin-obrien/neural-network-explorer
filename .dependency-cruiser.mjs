/**
 * Architecture rules are executable constraints, not documentation.
 *
 *   domain <- application <- presentation
 */
export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies hide the real direction of the design.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolved',
      severity: 'error',
      comment: 'An import that does not resolve is a broken module boundary.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'domain-is-independent',
      severity: 'error',
      comment: 'The mathematical model must not depend on state or presentation.',
      from: { path: '^src/domain/' },
      to: { path: '^src/(application|presentation)/' },
    },
    {
      name: 'domain-has-no-ui-libraries',
      severity: 'error',
      comment:
        'The domain must stay independently testable: no React, Mantine, Recharts, or browser libraries.',
      from: { path: '^src/domain/', pathNot: '\\.test\\.ts$' },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-peer'] },
    },
    {
      name: 'application-is-presentation-free',
      severity: 'error',
      comment: 'Application state coordinates the domain; it must not reach into components.',
      from: { path: '^src/application/' },
      to: { path: '^src/presentation/' },
    },
    {
      name: 'charts-stay-in-presentation',
      severity: 'error',
      comment:
        'Chart-library data shaping is a presentation concern: only presentation may import Mantine Charts or Recharts.',
      // `to.path` matches the resolved file, not the specifier, so the package
      // is identified by its node_modules location rather than its import name.
      from: { path: '^src/', pathNot: '^src/presentation/' },
      // The bootstrap imports the packaged stylesheet globally; a stylesheet
      // carries no chart-library types and is not a chart adapter.
      to: { path: 'node_modules/(@mantine/charts|recharts)/', pathNot: '\\.css$' },
    },
    {
      name: 'no-dev-dependencies-in-shipped-code',
      severity: 'error',
      comment: 'Only tests and the test harness may import development dependencies.',
      from: { path: '^src/', pathNot: '\\.test\\.tsx?$|^src/testSetup\\.ts$' },
      to: { dependencyTypes: ['npm-dev'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
  },
};
