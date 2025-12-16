export interface Usuario {
  id: string;
  userName: string;
  password: string;
  roleId: string;
}

export interface UsuarioInput {
  userName: string;
  password: string;
  roleId: string;
}