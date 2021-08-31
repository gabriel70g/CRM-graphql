const { ApolloServer } = require("apollo-server");
const  typeDefs  = require("./db/schema");
const resolvers = require('./db/resolvers');
const jwt = require('jsonwebtoken');
const { config } = require('./config/config')

// conectar a la base de datos
const { conectedDB } = require('./config/db')

conectedDB();

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs, resolvers,
  context: ({ req }) => {
    
    const token = req.headers["authorization"] || "";
    if (token) {
      try {
        
        const usuario = jwt.verify(token, config.api.key);
        return {
          usuario
        }

      } catch (err) {
        console.log('error de validacion')
        console.warn(err);
      }
    }
  }

});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
