import React from 'react';
import {render} from 'react-dom';
import {Query} from 'react-apollo';
import {visit} from 'graphql/language/visitor';
import {assocPath, path} from 'ramda';
import gql from 'graphql-tag';
import createClient from './apollo';

// create test client
const client = createClient();

const query = gql`
  query GetProducts {
    products(ids: ["1", "2"]) {
      id
      testData2 @simpleClient
    }

    testData @simpleClient
  }
`;

// process query
// { nodesToRemove - all nodes that contains "simpleClientDirective", updatedQuery - queryDoc w/o @simpleDirective nodes }
const removeClientDirectiveFromQuery = query => {
  const nodesToResolve = [];
  const originalQuery = query;
  const updatedQuery = visit(query, {
    Field: {
      leave(node, key, parent, path, ancestors) {
        const {directives} = node;
        if (
          directives &&
          directives.length &&
          directives.find(d => d.name.value === 'simpleClient')
        ) {
          const path = ancestors
            .filter(a => a.kind === 'Field')
            .map(e => e.name.value);
          nodesToResolve.push({
            path: path,
            name: node.name.value,
            ancestors: [...ancestors],
          });
          return null;
        }
        return node;
      },
    },
  });

  return {nodesToResolve, originalQuery, updatedQuery};
};

const resolveFields = (result, nodesToResolve, resolvers) =>
  nodesToResolve.reduce((acc, node) => {
    const dataInPath = path(node.path, acc);
    const resolvedValue = resolvers[node.name]();
    if (Array.isArray(dataInPath)) {
      const updatedData = dataInPath.map(data => ({
        ...data,
        [node.name]: resolvedValue,
      }));

      return assocPath(node.path, updatedData, acc);
    }
    return assocPath(node.path.concat(node.name), resolvedValue, acc);
  }, result);

// create mount point
const node = document.createElement('div');

const queryData = removeClientDirectiveFromQuery(query);

render(
  <Query client={client} query={queryData.updatedQuery}>
    {({data, loading}) => {
      if (loading) return 'loading...';
      const newData = resolveFields(data, queryData.nodesToResolve, {
        testData: () => 'hello testData',
        testData2: () => 'test for testData2',
      });
      console.log(newData);
      return (
        <div>
          {newData.products.map(({id, testData2}) => (
            <div key={id}>
              {id} {testData2}
            </div>
          ))}
          <div>{newData.testData}</div>
        </div>
      );
    }}
  </Query>,
  node
);

document.body.appendChild(node);
