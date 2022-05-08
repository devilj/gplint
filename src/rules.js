import * as glob from 'glob';
import * as path from 'path';
import * as _ from 'lodash';

const LEVELS = [
  'off',
  'warn',
  'error',
];

export function getAllRules(additionalRulesDirs) {
  let rules = {};

  const rulesDirs = [
    path.join(__dirname, 'rules')
  ].concat(additionalRulesDirs || []);

  rulesDirs.forEach(rulesDir => {
    rulesDir = path.resolve(rulesDir);
    glob.sync(`${rulesDir}/*.js`).forEach(file => {
      const rule = require(file);
      rules[rule.name] = rule;
    });
  });
  return rules;
}

export function getRule(rule, additionalRulesDirs) {
  return getAllRules(additionalRulesDirs)[rule];
}

export function doesRuleExist(rule, additionalRulesDirs) {
  return getRule(rule, additionalRulesDirs) !== undefined;
}

export function getRuleLevel(ruleConfig, rule) {
  const level = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;

  if (level === 'on') { // 'on' is deprecated, but still supported for backward compatibility, means error level.
    console.warn('Level "on" is deprecated, please replace it with "error" or "warn" on your .gplintrc file.');
    return 2;
  }

  if (level == null) {
    return 0;
  }

  let levelNum = _.isNumber(level) ? level : _.toNumber(level);

  if (isNaN(levelNum)) {
    levelNum = LEVELS.indexOf(level);
  }

  if (levelNum < 0 || levelNum > 2) {
    throw new Error(`Unknown level ${level} for ${rule}.`);
  }

  return levelNum;
}

export function runAllEnabledRules(feature, pickles, file, configuration, additionalRulesDirs) {
  let errors = [];
  const rules = getAllRules(additionalRulesDirs);
  Object.keys(rules).forEach(ruleName => {
    let rule = rules[ruleName];
    const ruleLevel = getRuleLevel(configuration[rule.name], rule.name);

    if (ruleLevel > 0) {
      const ruleConfig = Array.isArray(configuration[rule.name]) ? configuration[rule.name][1] : {};
      const error = rule.run({feature, pickles, file}, ruleConfig);

      if (error?.length > 0) {
        error.forEach(e => e.level = ruleLevel);
        errors = errors.concat(error);
      }
    }
  });
  return errors;
}
