// ESLint 9 flat config. Security rules: ADR-0016 decision 2, ADR-0024 decision 4.
// Flat config replaces a rule's options block by block, so the selector lists
// are constants spread into every block that needs them.
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const SEE = 'See ADR-0024: user text reaches the DOM only as text.';
const R = (selector, message) => ({ selector, message: `${message} ${SEE}` });

const HTML_SINKS = [
  R(
    "AssignmentExpression[left.type='MemberExpression'][left.property.name=/^(innerHTML|outerHTML)$/]",
    'No innerHTML/outerHTML.',
  ),
  R(
    "AssignmentExpression[left.type='MemberExpression'][left.computed=true][left.property.value=/^(innerHTML|outerHTML)$/]",
    'No innerHTML/outerHTML.',
  ),
  R(
    "AssignmentExpression[left.type='MemberExpression'][left.computed=true][left.property.type='TemplateLiteral'][left.property.quasis.0.value.cooked=/^(innerHTML|outerHTML)$/]",
    'No innerHTML/outerHTML.',
  ),
  R(
    'Property[key.name=/^(innerHTML|outerHTML|dangerouslySetInnerHTML)$/]',
    'No HTML-string properties.',
  ),
  R(
    'Property[key.value=/^(innerHTML|outerHTML|dangerouslySetInnerHTML)$/]',
    'No HTML-string properties.',
  ),
  R("JSXAttribute[name.name='dangerouslySetInnerHTML']", 'No dangerouslySetInnerHTML.'),
  R(
    'CallExpression[callee.property.name=/^(insertAdjacentHTML|setHTMLUnsafe|createContextualFragment)$/]',
    'No HTML parsing APIs.',
  ),
  R(
    "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
    'No document.write.',
  ),
];
// Leaflet puts strings given to these into innerHTML; only DOM nodes from map/layers.ts.
const FACTORIES = '/^(textNode|pinNode|clusterNode|meNode)$/';
const LEAFLET_SINKS = [
  R(
    `CallExpression[callee.property.name=/^(bindTooltip|bindPopup|setContent|setTooltipContent|setPopupContent)$/]:not([arguments.0.type='CallExpression'][arguments.0.callee.name=${FACTORIES}])`,
    'Leaflet content must be a node from map/layers.ts.',
  ),
  R(
    `CallExpression[callee.property.name=/^(popup|tooltip)$/] > ObjectExpression > Property[key.name='content']:not([value.type='CallExpression'][value.callee.name=${FACTORIES}])`,
    'Leaflet content must be a node from map/layers.ts.',
  ),
];
const DIVICON_ELSEWHERE = [
  R("CallExpression[callee.property.name='divIcon']", 'Make divIcons in map/icons.ts.'),
  R("CallExpression[callee.name='divIcon']", 'Make divIcons in map/icons.ts.'),
  R("NewExpression[callee.property.name='DivIcon']", 'Make divIcons in map/icons.ts.'),
];
// Deviation from ADR-0024 (string literal only): a node from layers.ts is also
// allowed, because pins, clusters and the home marker carry text.
const ICON_HTML = [
  R(
    `CallExpression[callee.property.name='divIcon'] > ObjectExpression > Property[key.name='html']:not([value.type='Literal']):not([value.type='CallExpression'][value.callee.name=${FACTORIES}])`,
    'divIcon html must be a literal or a node from map/layers.ts.',
  ),
];

// Screens and UI components do not touch the outside world (v1.3 rule, RFC-0003 §5.1).
const VIEW_GLOBALS = ['localStorage', 'sessionStorage', 'indexedDB', 'navigator', 'fetch', 'L'].map(
  (name) => ({
    name,
    message: 'Screens read stores and call actions; platform/, api/ and map/ do the rest.',
  }),
);
const VIEW_IMPORTS = {
  paths: [{ name: 'leaflet', message: 'Only map/ uses Leaflet.' }],
  patterns: [
    { group: ['**/platform/*', '**/api/*', '**/map/runtime'], message: 'Go through actions/.' },
  ],
};

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist-e2e',
      'dist-e2e-backend',
      'node_modules',
      'docs',
      'coverage',
      'test-results',
      'playwright-report',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: { react: { version: '19.3' } },
  },
  react.configs.flat['jsx-runtime'],
  { files: ['src/**/*.{ts,tsx}'], ...reactHooks.configs.flat.recommended },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react/no-danger': 'error',
      'react/prop-types': 'off',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': ['error', ...HTML_SINKS],
    },
  },
  {
    files: ['src/map/**/*.{ts,tsx}'],
    ignores: ['src/map/icons.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...HTML_SINKS, ...LEAFLET_SINKS, ...DIVICON_ELSEWHERE],
    },
  },
  {
    files: ['src/map/icons.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...HTML_SINKS, ...LEAFLET_SINKS, ...ICON_HTML],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../state/*', '../api/*', './runtime'],
              message: 'icons.ts never sees data.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': ['error', ...VIEW_GLOBALS],
      'no-restricted-imports': ['error', VIEW_IMPORTS],
    },
  },
  {
    files: ['*.{js,ts,mjs}', 'scripts/**', 'tests/**'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
