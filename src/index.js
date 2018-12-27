import createClient from './apollo';
import gql from 'graphql-tag';
const client = createClient();
console.log(client);
client.query({
  query: gql`
    query GetProducts {
      products(ids: ["1", "2"]) {
        id
      }
    }
  `,
});
