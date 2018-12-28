import {ApolloLink} from 'apollo-link';
import {visit} from 'graphql/language/visitor';

const directiveName = 'simpleClient';

export const testLink = new ApolloLink((operation, forward) => {
  const nodesToRemove = [];
  console.log(operation.getContext());
  const updatedQuery = visit(operation.query, {
    Field: {
      enter(node) {
        const {directives} = node;
        if (
          directives &&
          directives.length &&
          directives.find(d => d.name.value === directiveName)
        ) {
          nodesToRemove.push(node);
          return null;
        }
        return node;
      },
    },
  });

  operation.setContext({nodesToRemove});

  operation.query = updatedQuery;

  return forward(operation).map(data => {
    console.log(data);
    return {data: {products: []}};
  });
});
