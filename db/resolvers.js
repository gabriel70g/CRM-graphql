const Usuario = require("../models/usuarios");
const Producto = require("../models/producto");
const Cliente = require("../models/cliente");
const Pedido = require("../models/pedidos");

const bcrypjs = require("bcryptjs");
const { config } = require("../config/config");
const jwt = require("jsonwebtoken");

const creaToken = (usuario, key, expiresIn) => {
  const { id, nombre, apellido, email } = usuario;

  return jwt.sign({ id, nombre, apellido, email }, key, { expiresIn });
};

// Resolvers
const resolvers = {
  Query: {
    obtenerUsuario: async (_, { token }) => {
      const usuarioId = await jwt.verify(token, config.api.key);

      return usuarioId;
    },
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({});
        return productos;
      } catch (err) {
        console.log(err);
      }
    },
    obtenerProducto: async (_, { id }) => {
      try {
        // revisar que exista el producto
        const producto = await Producto.findById(id);

        if (!Producto) {
          throw new Error("No existe el producto");
        }
        return producto;
      } catch (err) {
        console.warn(err);
      }
    },
    obtenerClientes: async () => {
      try {
        const clientes = Cliente.find({});
        return clientes;
      } catch (err) {
        console.warn(err);
      }
    },
    obtenerClientesVendedor: async (_, {}, ctx) => {
      try {
        const clientes = Cliente.find({ vendedor: ctx.usuario.id.toString() });
        return clientes;
      } catch (err) {
        console.warn(err);
      }
    },
    obtenerCliente: async (_, { id }, ctx) => {
      // revisar si el cliente existe
      const cliente = await Cliente.findOne({ _id: id });

      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }

      // quien lo creo
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("El cliente no pertenece a su cartera");
      }
      return cliente;
    },
    obtenerPedido: async (_, { id }, ctx) => {
      try {
        const pedido = await Pedido.findOne({ _id: id });

        if (!pedido) {
          throw new Error("No existe el pedido");
        }

        console.log(pedido.vendedor);

        if (pedido.vendedor.toString() !== ctx.usuario.id) {
          throw new Error(`Acción no permitida`);
        }

        return pedido;
      } catch (err) {
        console.log(err);
      }
    },
    obtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({});
        return pedidos;
      } catch (err) {
        console.log(err);
      }
    },
    obtenerPedidosVendedor: async (_, {}, ctx) => {
      try {
        const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
        return pedidos;
      } catch (err) {
        console.log(err);
      }
    },
    obtenerPedidosEstado: async (_, { estado }, ctx) => {
      const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });

      return pedidos;
    },
    mejoresClientes: async () => {
      const clientes = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$cliente",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "cliente",
          },
        },
        {
          $limit: 10,
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return clientes;
    },
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      // revisar si el usuario ya está registrado
      const { email, password } = input;

      const existeUsuario = await Usuario.findOne({ email });

      if (existeUsuario) {
        throw new Error("El usuario ya esta registrado");
      }

      // hasear password
      const salt = await bcrypjs.genSalt(10);
      input.password = await bcrypjs.hash(password, salt);

      try {
        // Guardar en la base de datos
        const usuario = new Usuario(input);
        usuario.save();

        return usuario;
      } catch (err) {
        console.log(err);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      //si el usuario existe
      const existeUsuario = await Usuario.findOne({ email });

      if (!existeUsuario) {
        throw new Error("El usuario o el password es incorrecto");
      }

      // Revisar si el password es correcto
      const passwordCorrecto = await bcrypjs.compare(password, existeUsuario.password);
      if (!passwordCorrecto) {
        throw new Error("El usuario o el password es incorrecto");
      }

      //crear token
      return {
        token: creaToken(existeUsuario, config.api.key, "24h"),
      };
    },
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input);

        //almacenar en la base de datos
        const resultado = await producto.save();
        return resultado;
      } catch (err) {
        console.log(err);
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      try {
        // revisar que exista el producto
        let producto = await Producto.findById(id);

        if (!producto) {
          throw new Error("No existe el producto");
        }

        // guardar en la DB
        producto = await Producto.findByIdAndUpdate({ _id: id }, input, { new: true });

        return producto;
      } catch (err) {
        console.warn(err);
      }
    },
    eliminarProducto: async (_, { id }) => {
      const producto = await Producto.findById(id);

      if (!producto) {
        throw new Error("No existe el producto a eliminar");
      }

      await Producto.findOneAndDelete({ _id: id });

      return `Producto eliminado correctamente: ${producto.nombre}`;
    },
    nuevoCliente: async (_, { input }, ctx) => {
      // verificar si el cliente esta registrado
      const { email } = input;

      const cliente = await Cliente.findOne({ email });
      if (cliente) {
        throw new Error("El cliente ya se encuentra registrado");
      }

      // asignar el vendedor
      const nuevoCliente = new Cliente(input);

      nuevoCliente.vendedor = ctx.usuario.id;
      // guardarlo en la base de datos

      try {
        const resul = await nuevoCliente.save();

        return resul;
      } catch (err) {
        console.log(err);
      }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      // verificar si existe

      let cliente = await Cliente.findOne({ _id: id });

      if (!cliente) {
        throw new Error("No exite el cliente");
      }

      // verificar que sea el vendedor quien edita
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("El cliente no pertenece a su cartera");
      }
      // guardar cliente

      cliente = await Cliente.findByIdAndUpdate({ _id: id }, input, { new: true });

      return cliente;
    },
    eliminarCliente: async (_, id, ctx) => {
      console.log(id);
      console.log(ctx.usuario);
      const cliente = await Cliente.findOne({ _id: id });

      console.log(cliente);
      if (!cliente) {
        throw new Error("No exite el cliente");
      }

      // verificar que sea el vendedor quien edita
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("El cliente no pertenece a su cartera");
      }

      await Cliente.findByIdAndDelete({ _id: id });
      return "Cliente eliminado correctamentes";
    },
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input;

      console.log(cliente);
      // verificar si el cliente existe
      let clienteExiste = await Cliente.findById(cliente);

      if (!clienteExiste) {
        throw new Error("No exite el cliente");
      }
      // si el cliente es del vendedor
      if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("El cliente no pertenece a su cartera");
      }
      // stock disponible
      for await (const articulo of input.pedido) {
        const { id } = articulo;
        const producto = await Producto.findById(id);
        if (articulo.cantidad > producto.existencia) {
          throw new Error(`El articulo ${producto.nombre} exede la cantidad disponible`);
        } else {
          producto.existencia = producto.existencia - articulo.cantidad;
          await producto.save();
        }
      }
      // crear nuevo pedido
      const nuevoPedido = new Pedido(input);
      // asignarle un vendedor
      nuevoPedido.vendedor = ctx.usuario.id;
      // guardarlo en la base de datos
      const resul = await nuevoPedido.save();
      return resul;
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      // verificar si el pedido existe
      const pedido = await Pedido.findOne({ _id: id });

      if (!pedido) {
        throw new Error("No existe el pedido");
      }

      // revisar si el cliente existe
      const cliente = await Cliente.findById(input.cliente);
      if (!cliente) {
        throw new Error("No existe el cliente");
      }
      // si el cliente y el pedido pertenecen al vendedor
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("El vendedor no se puede modificar");
      }
      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("Vendedor incorrecto");
      }
      // revisar el stock
      if (input.pedido) {
        for await (const articulo of input.pedido) {
          const { id } = articulo;
          const producto = await Producto.findById(id);
          if (articulo.cantidad > producto.existencia) {
            throw new Error(`El articulo ${producto.nombre} exede la cantidad disponible`);
          } else {
            producto.existencia = producto.existencia - articulo.cantidad;
            await producto.save();
          }
        }
      }
      // guardar el pedido
      const resp = await Pedido.findByIdAndUpdate({ _id: id }, input, { new: true });
      return resp;
    },
    eliminarPedido: async (_, { id }, ctx) => {
      // verificar si el pedido existe
      const pedido = await Pedido.findOne({ _id: id });

      if (!pedido) {
        throw new Error("No existe el pedido");
      }
      // verificar si es el vendedor
      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tiene la autorizaión necesaria");
      }

      // eliminar de la base de datos
      await pedido.findOneAndDelete({ _id: id });
      return "Pedido eliminado";
    },
  },
};

module.exports = resolvers;
