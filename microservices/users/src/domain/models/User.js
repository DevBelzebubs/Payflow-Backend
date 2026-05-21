const Email = require('../../../../shared/domain/value-objects/Email');
const DNI = require('../../../../shared/domain/value-objects/DNI');
const Phone = require('../../../../shared/domain/value-objects/Phone');

class User {
  constructor({ id, email, passwordHash, nombre, telefono, activo, rol, dni, avatar_url, banner_url, created_at, admin_id, nivelAcceso }) {
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
    this.created_at = created_at || null;
    this.admin_id = admin_id || null;
    this.nivelAcceso = nivelAcceso || null;
  }

  isActive() { return this.activo === true; }
  isAdmin() { return this.rol === 'ADMIN' || this.rol === 'admin'; }
  isBcpUser() { return this.passwordHash === 'SSO_BCP_USER'; }

  updateProfile(data) {
    if (data.nombre !== undefined) this.nombre = data.nombre;
    if (data.telefono !== undefined) this.telefono = data.telefono instanceof Phone ? data.telefono : new Phone(data.telefono);
    if (data.email !== undefined) this.email = data.email instanceof Email ? data.email : new Email(data.email);
    if (data.avatar_url !== undefined) this.avatar_url = data.avatar_url;
    if (data.banner_url !== undefined) this.banner_url = data.banner_url;
    if (data.password_hash !== undefined) this.passwordHash = data.password_hash;
  }

  activate() { this.activo = true; }
  deactivate() { this.activo = false; }

  toJSON() {
    return {
      id: this.id, email: this.email.toString(), nombre: this.nombre,
      telefono: this.telefono ? this.telefono.toString() : null,
      activo: this.activo, rol: this.rol, dni: this.dni ? this.dni.toString() : null,
      avatar_url: this.avatar_url, banner_url: this.banner_url,
      created_at: this.created_at, admin_id: this.admin_id, nivelAcceso: this.nivelAcceso,
    };
  }
}

module.exports = User;
