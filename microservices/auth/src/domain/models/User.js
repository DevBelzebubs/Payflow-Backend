const Email = require('../../../../shared/domain/value-objects/Email');
const DNI = require('../../../../shared/domain/value-objects/DNI');
const Phone = require('../../../../shared/domain/value-objects/Phone');

class User {
  constructor({ id, email, passwordHash, nombre, telefono, activo, rol, dni, avatar_url, banner_url }) {
    this.id = id;
    this.email = email instanceof Email ? email : new Email(email);
    this.passwordHash = passwordHash;
    this.nombre = nombre;
    this.telefono = telefono ? (telefono instanceof Phone ? telefono : new Phone(telefono)) : null;
    this.activo = activo !== undefined ? activo : true;
    this.rol = rol || 'CLIENTE';
    this.dni = dni ? (dni instanceof DNI ? dni : new DNI(dni)) : null;
    this.avatar_url = avatar_url || null;
    this.banner_url = banner_url || null;
  }

  isActive() {
    return this.activo === true;
  }

  isAdmin() {
    return this.rol === 'ADMIN' || this.rol === 'admin';
  }

  isBcpUser() {
    return this.passwordHash === 'SSO_BCP_USER';
  }

  activate() {
    this.activo = true;
  }

  deactivate() {
    this.activo = false;
  }

  updateProfile({ nombre, telefono, avatar_url, banner_url }) {
    if (nombre !== undefined) this.nombre = nombre;
    if (telefono !== undefined) this.telefono = telefono instanceof Phone ? telefono : new Phone(telefono);
    if (avatar_url !== undefined) this.avatar_url = avatar_url;
    if (banner_url !== undefined) this.banner_url = banner_url;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email.toString(),
      nombre: this.nombre,
      telefono: this.telefono ? this.telefono.toString() : null,
      activo: this.activo,
      rol: this.rol,
      dni: this.dni ? this.dni.toString() : null,
      avatar_url: this.avatar_url,
      banner_url: this.banner_url
    };
  }
}

module.exports = User;
