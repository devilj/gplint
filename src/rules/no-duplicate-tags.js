import * as _ from 'lodash';

export const name = 'no-duplicate-tags';

export function run({feature}) {
  if (!feature) {
    return [];
  }
  let errors = [];

  verifyTags(feature, errors);
  feature.children.forEach(child => {
    if (child.scenario) {
      verifyTags(child.scenario, errors);
      child.scenario.examples.forEach(example => {
        verifyTags(example, errors);
      });
    }
  });
  return errors;
}

function verifyTags(node, errors) {
  const failedTagNames = [];
  const uniqueTagNames = [];
  node.tags.forEach(tag => {
    if (!_.includes(failedTagNames, tag.name)) {
      if (_.includes(uniqueTagNames, tag.name)) {
        errors.push({message: 'Duplicate tags are not allowed: ' + tag.name,
          rule   : name,
          line   : tag.location.line,
          column : tag.location.column,
        });
        failedTagNames.push(tag.name);
      } else  {
        uniqueTagNames.push(tag.name);
      }
    }
  });
}
