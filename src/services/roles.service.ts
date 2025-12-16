import { RolModel } from "../models/rol.models";
import { RolInput } from "../types/rol.types";

export class RolService {
  static getRoles() {
    return RolModel.getAll();
  }

  static createRol(data: RolInput) {
    return RolModel.create(data);
  }

  static updateRol(id: number, data: RolInput) {
    return RolModel.update(id, data);
  }

  static deleteRol(id: number) {
    return RolModel.delete(id);
  }
}
