class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }
  async syncBcpUser(req, res) {
    try {
      const bcpUserPayload = req.user;
      const { cliente, isNewUser } =
        await this.usersService.findOrCreateClienteFromBcp(bcpUserPayload);

      res.status(200).json({
        cliente: cliente.toJSON(),
        isNewUser: isNewUser,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async createCliente(req, res) {
    try {
      const { usuario_id } = req.body;

      if (!usuario_id) {
        return res.status(400).json({ error: "usuario_id es requerido" });
      }

      const cliente = await this.usersService.createCliente({
        usuario_id,
      });

      res.status(201).json(cliente.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getClienteByUsuario(req, res) {
    try {
      const { usuarioId } = req.params;

      const cliente = await this.usersService.getClienteByUsuarioId(usuarioId);

      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }

      res.status(200).json(cliente.toJSON());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCliente(req, res) {
    try {
      const { clienteId } = req.params;
      const updateData = req.body;

      const cliente = await this.usersService.updateCliente(
        clienteId,
        updateData
      );

      res.status(200).json(cliente.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllClientes(req, res) {
    try {
      const clientes = await this.usersService.getAllClientes();

      res.status(200).json(clientes.map((c) => c.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createAdministrador(req, res) {
    try {
      const { usuario_id, nivel_acceso } = req.body;

      if (!usuario_id || !nivel_acceso) {
        return res
          .status(400)
          .json({ error: "usuario_id y nivel_acceso son requeridos" });
      }

      const admin = await this.usersService.createAdministrador({
        usuario_id,
        nivel_acceso,
      });

      res.status(201).json(admin.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAdministradorByUsuario(req, res) {
    try {
      const { usuarioId } = req.params;

      const admin = await this.usersService.getAdministradorByUsuarioId(
        usuarioId
      );

      if (!admin) {
        return res.status(404).json({ error: "Administrador no encontrado" });
      }

      res.status(200).json(admin.toJSON());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllAdministradores(req, res) {
    try {
      const admins = await this.usersService.getAllAdministradores();

      res.status(200).json(admins.map((a) => a.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  async updateProfile(req, res) {
    try {
      const { userId, userType } = req.user;
      const updateData = req.body;

      if (!userId) {
        return res
          .status(401)
          .json({ error: "Usuario no identificado en el token" });
      }

      const clientData = {
        ...updateData,
        usuarioId: userId,
        userType: userType,
      };

      const updatedUser = await this.usersService.updateUserProfile(clientData);

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("[UsersController] Error updating profile:", error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UsersController;
