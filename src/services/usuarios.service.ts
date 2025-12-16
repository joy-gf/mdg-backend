import { UsuarioModel } from "../models/usuario.model";
import { UsuarioInput } from "../types/usuario.types";

export class UsuarioService {
  static getUsuarios() {
    return UsuarioModel.getAll();
  }

  static getUsuarioById(id: string) {
    return UsuarioModel.getUsuarioById(id);
  }

  static createUsuario(data: UsuarioInput) {
    return UsuarioModel.create(data);
  }

  static updateUsuario(id: string, data: UsuarioInput) {
    return UsuarioModel.update(id, data);
  }

  static deleteUsuario(id: string) {
    return UsuarioModel.delete(id);
  }
}
